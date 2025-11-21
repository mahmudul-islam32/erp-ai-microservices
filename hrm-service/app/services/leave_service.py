from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from bson import ObjectId
from fastapi import HTTPException, status
import logging

from app.database.connection import get_database
from app.models.leave import Leave, LeaveCreate, LeaveUpdate, LeaveResponse, LeaveStatus, LeaveType, LeaveBalance, LeaveSummary, LeavePolicy
from app.services.employee_service import EmployeeService

logger = logging.getLogger(__name__)


class LeaveService:
    def __init__(self):
        self.db = get_database()
        self.employee_service = EmployeeService()
    
    async def create_leave_request(self, leave_data: LeaveCreate, current_user_id: str) -> LeaveResponse:
        """Create a new leave request"""
        try:
            # Get employee information
            employee = await self.db.employees.find_one({"employee_id": leave_data.employee_id})
            if not employee:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Employee not found"
                )
            
            # Check for overlapping leave requests
            overlapping_leave = await self.db.leaves.find_one({
                "employee_id": leave_data.employee_id,
                "status": {"$in": [LeaveStatus.PENDING, LeaveStatus.APPROVED]},
                "$or": [
                    {
                        "start_date": {"$lte": leave_data.end_date},
                        "end_date": {"$gte": leave_data.start_date}
                    }
                ]
            })
            
            if overlapping_leave:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Overlapping leave request exists"
                )
            
            # Check leave balance
            leave_balance = await self._get_leave_balance(leave_data.employee_id, leave_data.leave_type)
            if leave_balance.remaining_days < leave_data.total_days:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insufficient leave balance"
                )
            
            # Create leave request
            leave_doc = {
                "employee_id": leave_data.employee_id,
                "employee_name": f"{employee['first_name']} {employee['last_name']}",
                "leave_type": leave_data.leave_type,
                "start_date": leave_data.start_date,
                "end_date": leave_data.end_date,
                "total_days": leave_data.total_days,
                "reason": leave_data.reason,
                "emergency_contact": leave_data.emergency_contact,
                "work_handover": leave_data.work_handover,
                "attachments": leave_data.attachments,
                "status": LeaveStatus.PENDING,
                "notes": leave_data.notes,
                "requested_at": datetime.utcnow(),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": current_user_id,
                "updated_by": current_user_id
            }
            
            # Insert leave request
            result = await self.db.leaves.insert_one(leave_doc)
            leave_doc["_id"] = str(result.inserted_id)
            
            return LeaveResponse(**leave_doc)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating leave request: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create leave request"
            )
    
    async def get_leave_request(self, leave_id: str) -> LeaveResponse:
        """Get leave request by ID"""
        try:
            leave = await self.db.leaves.find_one({"_id": ObjectId(leave_id)})
            if not leave:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Leave request not found"
                )
            
            leave["id"] = str(leave["_id"])
            del leave["_id"]  # Remove the _id field
            return LeaveResponse(**leave)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting leave request: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get leave request"
            )
    
    async def get_leave_requests(
        self,
        skip: int = 0,
        limit: int = 100,
        employee_id: Optional[str] = None,
        leave_status: Optional[LeaveStatus] = None,
        leave_type: Optional[LeaveType] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[LeaveResponse]:
        """Get list of leave requests with filters"""
        try:
            # Build filter
            filter_dict = {}
            if employee_id:
                filter_dict["employee_id"] = employee_id
            if leave_status:
                filter_dict["status"] = leave_status
            if leave_type:
                filter_dict["leave_type"] = leave_type
            if start_date:
                filter_dict["start_date"] = {"$gte": start_date}
            if end_date:
                filter_dict["end_date"] = {"$lte": end_date}
            
            # Get leave requests
            cursor = self.db.leaves.find(filter_dict).skip(skip).limit(limit).sort("requested_at", -1)
            leaves = await cursor.to_list(length=limit)
            
            # Convert to response format
            result = []
            for leave in leaves:
                leave["id"] = str(leave["_id"])
                del leave["_id"]  # Remove the _id field
                result.append(LeaveResponse(**leave))
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting leave requests: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get leave requests"
            )
    
    async def update_leave_request(self, leave_id: str, leave_data: LeaveUpdate, current_user_id: str) -> LeaveResponse:
        """Update leave request"""
        try:
            # Check if leave request exists
            existing_leave = await self.db.leaves.find_one({"_id": ObjectId(leave_id)})
            if not existing_leave:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Leave request not found"
                )
            
            # Check if leave can be updated
            if existing_leave["status"] in [LeaveStatus.APPROVED, LeaveStatus.TAKEN]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot update approved or taken leave"
                )
            
            # Prepare update data
            update_data = leave_data.dict(exclude_unset=True)
            update_data["updated_at"] = datetime.utcnow()
            update_data["updated_by"] = current_user_id
            
            # Update leave request
            await self.db.leaves.update_one(
                {"_id": ObjectId(leave_id)},
                {"$set": update_data}
            )
            
            # Get updated leave request
            updated_leave = await self.db.leaves.find_one({"_id": ObjectId(leave_id)})
            updated_leave["_id"] = str(updated_leave["_id"])
            
            return LeaveResponse(**updated_leave)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating leave request: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update leave request"
            )
    
    async def approve_leave_request(self, leave_id: str, current_user_id: str, comments: Optional[str] = None) -> LeaveResponse:
        """Approve leave request"""
        try:
            # Check if leave request exists
            leave = await self.db.leaves.find_one({"_id": ObjectId(leave_id)})
            if not leave:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Leave request not found"
                )
            
            # Check if leave can be approved
            if leave["status"] != LeaveStatus.PENDING:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Leave request is not pending"
                )
            
            # Update leave request
            await self.db.leaves.update_one(
                {"_id": ObjectId(leave_id)},
                {
                    "$set": {
                        "status": LeaveStatus.APPROVED,
                        "approved_by": current_user_id,
                        "approved_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow(),
                        "updated_by": current_user_id,
                        "notes": comments or leave.get("notes")
                    }
                }
            )
            
            # Get updated leave request
            updated_leave = await self.db.leaves.find_one({"_id": ObjectId(leave_id)})
            updated_leave["_id"] = str(updated_leave["_id"])
            
            return LeaveResponse(**updated_leave)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error approving leave request: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to approve leave request"
            )
    
    async def reject_leave_request(self, leave_id: str, current_user_id: str, rejection_reason: str) -> LeaveResponse:
        """Reject leave request"""
        try:
            # Check if leave request exists
            leave = await self.db.leaves.find_one({"_id": ObjectId(leave_id)})
            if not leave:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Leave request not found"
                )
            
            # Check if leave can be rejected
            if leave["status"] != LeaveStatus.PENDING:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Leave request is not pending"
                )
            
            # Update leave request
            await self.db.leaves.update_one(
                {"_id": ObjectId(leave_id)},
                {
                    "$set": {
                        "status": LeaveStatus.REJECTED,
                        "rejected_by": current_user_id,
                        "rejected_at": datetime.utcnow(),
                        "rejection_reason": rejection_reason,
                        "updated_at": datetime.utcnow(),
                        "updated_by": current_user_id
                    }
                }
            )
            
            # Get updated leave request
            updated_leave = await self.db.leaves.find_one({"_id": ObjectId(leave_id)})
            updated_leave["_id"] = str(updated_leave["_id"])
            
            return LeaveResponse(**updated_leave)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error rejecting leave request: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to reject leave request"
            )
    
    async def _get_leave_balance(self, employee_id: str, leave_type: LeaveType) -> LeaveBalance:
        """Get leave balance for employee"""
        try:
            # Get employee's leave history
            cursor = self.db.leaves.find({
                "employee_id": employee_id,
                "leave_type": leave_type,
                "status": {"$in": [LeaveStatus.APPROVED, LeaveStatus.TAKEN]}
            })
            
            leaves = await cursor.to_list(length=None)
            
            # Calculate used days
            used_days = sum(leave["total_days"] for leave in leaves)
            
            # Default entitlements (this should come from leave policies)
            entitlements = {
                LeaveType.VACATION: 20,
                LeaveType.SICK_LEAVE: 10,
                LeaveType.PERSONAL_LEAVE: 5,
                LeaveType.MATERNITY_LEAVE: 90,
                LeaveType.PATERNITY_LEAVE: 14,
                LeaveType.BEREAVEMENT_LEAVE: 3,
                LeaveType.EMERGENCY_LEAVE: 3,
                LeaveType.UNPAID_LEAVE: 0,
                LeaveType.COMPENSATORY_LEAVE: 5,
                LeaveType.STUDY_LEAVE: 10
            }
            
            total_entitlement = entitlements.get(leave_type, 0)
            remaining_days = max(0, total_entitlement - used_days)
            
            # Get pending days
            pending_cursor = self.db.leaves.find({
                "employee_id": employee_id,
                "leave_type": leave_type,
                "status": LeaveStatus.PENDING
            })
            pending_leaves = await pending_cursor.to_list(length=None)
            pending_days = sum(leave["total_days"] for leave in pending_leaves)
            
            return LeaveBalance(
                employee_id=employee_id,
                employee_name="",  # Will be filled by caller
                leave_type=leave_type,
                total_entitlement=total_entitlement,
                used_days=used_days,
                remaining_days=remaining_days,
                pending_days=pending_days,
                expired_days=0
            )
            
        except Exception as e:
            logger.error(f"Error getting leave balance: {e}")
            return LeaveBalance(
                employee_id=employee_id,
                employee_name="",
                leave_type=leave_type,
                total_entitlement=0,
                used_days=0,
                remaining_days=0,
                pending_days=0,
                expired_days=0
            )
    
    async def get_leave_balance(self, employee_id: str) -> LeaveSummary:
        """Get complete leave balance for employee"""
        try:
            # Get employee info
            employee = await self.db.employees.find_one({"employee_id": employee_id})
            if not employee:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Employee not found"
                )
            
            employee_name = f"{employee['first_name']} {employee['last_name']}"
            
            # Get balances for all leave types
            leave_balances = []
            total_leave_days = 0
            used_leave_days = 0
            remaining_leave_days = 0
            pending_leave_days = 0
            
            for leave_type in LeaveType:
                balance = await self._get_leave_balance(employee_id, leave_type)
                balance.employee_name = employee_name
                leave_balances.append(balance)
                
                total_leave_days += balance.total_entitlement
                used_leave_days += balance.used_days
                remaining_leave_days += balance.remaining_days
                pending_leave_days += balance.pending_days
            
            return LeaveSummary(
                employee_id=employee_id,
                employee_name=employee_name,
                total_leave_days=total_leave_days,
                used_leave_days=used_leave_days,
                remaining_leave_days=remaining_leave_days,
                pending_leave_days=pending_leave_days,
                leave_balance=leave_balances
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting leave balance: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get leave balance"
            )
