from typing import List, Optional, Dict, Any
from datetime import datetime, date
from bson import ObjectId
from fastapi import HTTPException
from fastapi import status as http_status
import logging

from app.database.connection import get_database
from app.models.payroll import Payroll, PayrollCreate, PayrollUpdate, PayrollResponse, PayrollStatus, PayrollCalculation, PayrollSummary
from app.services.employee_service import EmployeeService

logger = logging.getLogger(__name__)


class PayrollService:
    def __init__(self):
        self.db = get_database()
        self.employee_service = EmployeeService()
    
    async def create_payroll(self, payroll_data: PayrollCreate, current_user_id: str) -> PayrollResponse:
        """Create a new payroll record"""
        try:
            # Get employee information
            employee = await self.db.employees.find_one({"employee_id": payroll_data.employee_id})
            if not employee:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Employee not found"
                )
            
            # Check if payroll already exists for this period
            # Convert dates to datetime for MongoDB query
            period_start_dt = datetime.combine(payroll_data.pay_period_start, datetime.min.time())
            period_end_dt = datetime.combine(payroll_data.pay_period_end, datetime.min.time())
            
            existing_payroll = await self.db.payrolls.find_one({
                "employee_id": payroll_data.employee_id,
                "pay_period_start": period_start_dt,
                "pay_period_end": period_end_dt
            })
            if existing_payroll:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="Payroll already exists for this period"
                )
            
            # Calculate payroll
            calculation = await self._calculate_payroll(payroll_data)
            
            # Create payroll document
            # Convert date objects to datetime for MongoDB
            pay_period_start_dt = datetime.combine(payroll_data.pay_period_start, datetime.min.time())
            pay_period_end_dt = datetime.combine(payroll_data.pay_period_end, datetime.min.time())
            pay_date_dt = datetime.combine(payroll_data.pay_period_end, datetime.min.time())
            
            payroll_doc = {
                "employee_id": payroll_data.employee_id,
                "employee_name": f"{employee['first_name']} {employee['last_name']}",
                "pay_period_start": pay_period_start_dt,
                "pay_period_end": pay_period_end_dt,
                "pay_date": pay_date_dt,  # Default pay date
                
                # Earnings
                "basic_salary": payroll_data.basic_salary,
                "overtime_hours": payroll_data.overtime_hours,
                "overtime_rate": payroll_data.overtime_rate,
                "overtime_pay": calculation.overtime_pay,
                "bonus": payroll_data.bonus,
                "commission": payroll_data.commission,
                "allowances": [item.dict() for item in payroll_data.allowances],
                "total_allowances": calculation.total_allowances,
                "gross_earnings": calculation.gross_earnings,
                
                # Deductions
                "tax_rate": payroll_data.tax_rate,
                "income_tax": calculation.income_tax,
                "social_security_rate": payroll_data.social_security_rate,
                "social_security": calculation.social_security,
                "medicare_rate": payroll_data.medicare_rate,
                "medicare": calculation.medicare,
                "deductions": [item.dict() for item in payroll_data.deductions],
                "total_deductions": calculation.total_deductions,
                "net_pay": calculation.net_pay,
                
                # Status and metadata
                "status": PayrollStatus.DRAFT,
                "notes": payroll_data.notes,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": current_user_id,
                "updated_by": current_user_id
            }
            
            # Insert payroll
            result = await self.db.payrolls.insert_one(payroll_doc)
            
            # Retrieve the inserted payroll to get the proper format
            inserted_payroll = await self.db.payrolls.find_one({"_id": result.inserted_id})
            inserted_payroll["id"] = str(inserted_payroll["_id"])
            del inserted_payroll["_id"]
            
            # Convert datetime fields back to date for PayrollResponse
            if isinstance(inserted_payroll.get("pay_period_start"), datetime):
                inserted_payroll["pay_period_start"] = inserted_payroll["pay_period_start"].date()
            if isinstance(inserted_payroll.get("pay_period_end"), datetime):
                inserted_payroll["pay_period_end"] = inserted_payroll["pay_period_end"].date()
            if isinstance(inserted_payroll.get("pay_date"), datetime):
                inserted_payroll["pay_date"] = inserted_payroll["pay_date"].date()
            
            return PayrollResponse(**inserted_payroll)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating payroll: {e}", exc_info=True)
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create payroll: {str(e)}"
            )
    
    async def _calculate_payroll(self, payroll_data: PayrollCreate) -> PayrollCalculation:
        """Calculate payroll amounts"""
        # Overtime pay
        overtime_pay = payroll_data.overtime_hours * payroll_data.overtime_rate * (payroll_data.basic_salary / 40)
        
        # Total allowances
        total_allowances = sum(item.amount for item in payroll_data.allowances)
        
        # Gross earnings
        gross_earnings = (
            payroll_data.basic_salary + 
            overtime_pay + 
            payroll_data.bonus + 
            payroll_data.commission + 
            total_allowances
        )
        
        # Tax calculations
        income_tax = gross_earnings * payroll_data.tax_rate
        social_security = gross_earnings * payroll_data.social_security_rate
        medicare = gross_earnings * payroll_data.medicare_rate
        
        # Total deductions
        total_deductions = sum(item.amount for item in payroll_data.deductions)
        total_tax_deductions = income_tax + social_security + medicare
        all_deductions = total_deductions + total_tax_deductions
        
        # Net pay
        net_pay = gross_earnings - all_deductions
        
        return PayrollCalculation(
            basic_salary=payroll_data.basic_salary,
            overtime_pay=overtime_pay,
            bonus=payroll_data.bonus,
            commission=payroll_data.commission,
            total_allowances=total_allowances,
            gross_earnings=gross_earnings,
            income_tax=income_tax,
            social_security=social_security,
            medicare=medicare,
            total_deductions=total_deductions,
            net_pay=net_pay,
            other_deductions=total_deductions,
            final_net_pay=net_pay
        )
    
    async def get_payroll(self, payroll_id: str) -> PayrollResponse:
        """Get payroll by ID"""
        try:
            payroll = await self.db.payrolls.find_one({"_id": ObjectId(payroll_id)})
            if not payroll:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Payroll not found"
                )
            
            payroll["id"] = str(payroll["_id"])
            del payroll["_id"]
            
            # Convert datetime fields back to date for PayrollResponse
            if isinstance(payroll.get("pay_period_start"), datetime):
                payroll["pay_period_start"] = payroll["pay_period_start"].date()
            if isinstance(payroll.get("pay_period_end"), datetime):
                payroll["pay_period_end"] = payroll["pay_period_end"].date()
            if isinstance(payroll.get("pay_date"), datetime):
                payroll["pay_date"] = payroll["pay_date"].date()
            
            return PayrollResponse(**payroll)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting payroll: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get payroll"
            )
    
    async def get_payrolls(
        self, 
        skip: int = 0, 
        limit: int = 100,
        employee_id: Optional[str] = None,
        status: Optional[PayrollStatus] = None,
        pay_period_start: Optional[date] = None,
        pay_period_end: Optional[date] = None
    ) -> List[PayrollResponse]:
        """Get list of payrolls with filters"""
        try:
            # Build filter
            filter_dict = {}
            if employee_id:
                filter_dict["employee_id"] = employee_id
            if status:
                filter_dict["status"] = status
            if pay_period_start:
                filter_dict["pay_period_start"] = {"$gte": pay_period_start}
            if pay_period_end:
                filter_dict["pay_period_end"] = {"$lte": pay_period_end}
            
            # Get payrolls
            cursor = self.db.payrolls.find(filter_dict).skip(skip).limit(limit).sort("pay_period_start", -1)
            payrolls = await cursor.to_list(length=limit)
            
            # Convert to response format
            result = []
            for payroll in payrolls:
                payroll["id"] = str(payroll["_id"])
                del payroll["_id"]
                
                # Convert datetime fields back to date for PayrollResponse
                if isinstance(payroll.get("pay_period_start"), datetime):
                    payroll["pay_period_start"] = payroll["pay_period_start"].date()
                if isinstance(payroll.get("pay_period_end"), datetime):
                    payroll["pay_period_end"] = payroll["pay_period_end"].date()
                if isinstance(payroll.get("pay_date"), datetime):
                    payroll["pay_date"] = payroll["pay_date"].date()
                
                result.append(PayrollResponse(**payroll))
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting payrolls: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get payrolls"
            )
    
    async def update_payroll(self, payroll_id: str, payroll_data: PayrollUpdate, current_user_id: str) -> PayrollResponse:
        """Update payroll"""
        try:
            # Check if payroll exists
            existing_payroll = await self.db.payrolls.find_one({"_id": ObjectId(payroll_id)})
            if not existing_payroll:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Payroll not found"
                )
            
            # Prepare update data
            update_data = payroll_data.dict(exclude_unset=True)
            
            # Recalculate if financial data is updated
            if any(field in update_data for field in ["basic_salary", "overtime_hours", "overtime_rate", "bonus", "commission", "allowances", "deductions", "tax_rate", "social_security_rate", "medicare_rate"]):
                # Create temporary payroll data for calculation
                temp_payroll = PayrollCreate(
                    employee_id=existing_payroll["employee_id"],
                    pay_period_start=existing_payroll["pay_period_start"],
                    pay_period_end=existing_payroll["pay_period_end"],
                    basic_salary=update_data.get("basic_salary", existing_payroll["basic_salary"]),
                    overtime_hours=update_data.get("overtime_hours", existing_payroll["overtime_hours"]),
                    overtime_rate=update_data.get("overtime_rate", existing_payroll["overtime_rate"]),
                    bonus=update_data.get("bonus", existing_payroll["bonus"]),
                    commission=update_data.get("commission", existing_payroll["commission"]),
                    allowances=update_data.get("allowances", existing_payroll["allowances"]),
                    deductions=update_data.get("deductions", existing_payroll["deductions"]),
                    tax_rate=update_data.get("tax_rate", existing_payroll["tax_rate"]),
                    social_security_rate=update_data.get("social_security_rate", existing_payroll["social_security_rate"]),
                    medicare_rate=update_data.get("medicare_rate", existing_payroll["medicare_rate"])
                )
                
                calculation = await self._calculate_payroll(temp_payroll)
                
                # Update calculated fields
                update_data.update({
                    "overtime_pay": calculation.overtime_pay,
                    "total_allowances": calculation.total_allowances,
                    "gross_earnings": calculation.gross_earnings,
                    "income_tax": calculation.income_tax,
                    "social_security": calculation.social_security,
                    "medicare": calculation.medicare,
                    "total_deductions": calculation.total_deductions,
                    "net_pay": calculation.net_pay
                })
            
            # Add update metadata
            update_data["updated_at"] = datetime.utcnow()
            update_data["updated_by"] = current_user_id
            
            # Update payroll
            await self.db.payrolls.update_one(
                {"_id": ObjectId(payroll_id)},
                {"$set": update_data}
            )
            
            # Get updated payroll
            updated_payroll = await self.db.payrolls.find_one({"_id": ObjectId(payroll_id)})
            updated_payroll["id"] = str(updated_payroll["_id"])
            del updated_payroll["_id"]
            
            # Convert datetime fields back to date for PayrollResponse
            if isinstance(updated_payroll.get("pay_period_start"), datetime):
                updated_payroll["pay_period_start"] = updated_payroll["pay_period_start"].date()
            if isinstance(updated_payroll.get("pay_period_end"), datetime):
                updated_payroll["pay_period_end"] = updated_payroll["pay_period_end"].date()
            if isinstance(updated_payroll.get("pay_date"), datetime):
                updated_payroll["pay_date"] = updated_payroll["pay_date"].date()
            
            return PayrollResponse(**updated_payroll)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating payroll: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update payroll"
            )
    
    async def approve_payroll(self, payroll_id: str, current_user_id: str) -> PayrollResponse:
        """Approve payroll"""
        try:
            # Check if payroll exists
            payroll = await self.db.payrolls.find_one({"_id": ObjectId(payroll_id)})
            if not payroll:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Payroll not found"
                )
            
            # Update status
            await self.db.payrolls.update_one(
                {"_id": ObjectId(payroll_id)},
                {
                    "$set": {
                        "status": PayrollStatus.APPROVED,
                        "approved_by": current_user_id,
                        "approved_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow(),
                        "updated_by": current_user_id
                    }
                }
            )
            
            # Get updated payroll
            updated_payroll = await self.db.payrolls.find_one({"_id": ObjectId(payroll_id)})
            updated_payroll["id"] = str(updated_payroll["_id"])
            del updated_payroll["_id"]
            
            # Convert datetime fields back to date for PayrollResponse
            if isinstance(updated_payroll.get("pay_period_start"), datetime):
                updated_payroll["pay_period_start"] = updated_payroll["pay_period_start"].date()
            if isinstance(updated_payroll.get("pay_period_end"), datetime):
                updated_payroll["pay_period_end"] = updated_payroll["pay_period_end"].date()
            if isinstance(updated_payroll.get("pay_date"), datetime):
                updated_payroll["pay_date"] = updated_payroll["pay_date"].date()
            
            return PayrollResponse(**updated_payroll)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error approving payroll: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to approve payroll"
            )
    
    async def get_payroll_summary(self, pay_period_start: date, pay_period_end: date) -> PayrollSummary:
        """Get payroll summary for a period"""
        try:
            # Convert dates to datetime for MongoDB query
            start_datetime = datetime.combine(pay_period_start, datetime.min.time())
            end_datetime = datetime.combine(pay_period_end, datetime.max.time())
            
            # Get payrolls for the period
            payrolls = await self.db.payrolls.find({
                "pay_period_start": {"$gte": start_datetime},
                "pay_period_end": {"$lte": end_datetime},
                "status": {"$in": [PayrollStatus.APPROVED, PayrollStatus.PROCESSED, PayrollStatus.PAID]}
            }).to_list(length=None)
            
            if not payrolls:
                return PayrollSummary(
                    total_employees=0,
                    total_gross_pay=0.0,
                    total_deductions=0.0,
                    total_net_pay=0.0,
                    average_salary=0.0,
                    payroll_period=f"{pay_period_start} to {pay_period_end}"
                )
            
            # Calculate summary
            total_employees = len(payrolls)
            total_gross_pay = sum(payroll["gross_earnings"] for payroll in payrolls)
            total_deductions = sum(payroll["total_deductions"] for payroll in payrolls)
            total_net_pay = sum(payroll["net_pay"] for payroll in payrolls)
            average_salary = total_gross_pay / total_employees if total_employees > 0 else 0.0
            
            return PayrollSummary(
                total_employees=total_employees,
                total_gross_pay=total_gross_pay,
                total_deductions=total_deductions,
                total_net_pay=total_net_pay,
                average_salary=average_salary,
                payroll_period=f"{pay_period_start} to {pay_period_end}"
            )
            
        except Exception as e:
            logger.error(f"Error getting payroll summary: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get payroll summary"
            )
    
    async def delete_payroll(self, payroll_id: str, current_user_id: str) -> bool:
        """Delete payroll"""
        try:
            # Check if payroll exists
            payroll = await self.db.payrolls.find_one({"_id": ObjectId(payroll_id)})
            if not payroll:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Payroll not found"
                )
            
            # Check if payroll can be deleted (only DRAFT or PENDING status)
            if payroll.get("status") not in [PayrollStatus.DRAFT, PayrollStatus.PENDING]:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot delete payroll with status {payroll.get('status')}. Only draft or pending payrolls can be deleted."
                )
            
            # Delete payroll
            result = await self.db.payrolls.delete_one({"_id": ObjectId(payroll_id)})
            
            if result.deleted_count == 0:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Payroll not found"
                )
            
            logger.info(f"Payroll {payroll_id} deleted by user {current_user_id}")
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting payroll: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete payroll"
            )
