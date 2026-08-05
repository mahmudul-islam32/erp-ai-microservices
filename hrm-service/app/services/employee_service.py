from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import HTTPException
from fastapi import status as http_status
import logging

from app.database.connection import get_database
from app.models.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeStatus
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)


class EmployeeService:
    def __init__(self):
        self.db = get_database()
        self.auth_service = AuthService()
    
    async def create_employee(self, employee_data: EmployeeCreate, current_user_id: str) -> EmployeeResponse:
        """Create a new employee"""
        try:
            # Check if employee ID already exists
            existing_employee = await self.db.employees.find_one({"employee_id": employee_data.employee_id})
            if existing_employee:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="Employee ID already exists"
                )
            
            # Check if email already exists
            existing_email = await self.db.employees.find_one({"email": employee_data.email})
            if existing_email:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="Email already exists"
                )
            
            # Create full name
            full_name = f"{employee_data.first_name} {employee_data.last_name}"
            
            # Get manager name if manager_id is provided
            manager_name = None
            if employee_data.manager_id:
                manager = await self.db.employees.find_one({"employee_id": employee_data.manager_id})
                if manager:
                    manager_name = f"{manager['first_name']} {manager['last_name']}"
            
            # Convert date objects to datetime for MongoDB compatibility
            # MongoDB stores dates as datetime objects, so we need to convert date to datetime
            date_of_birth_dt = datetime.combine(employee_data.date_of_birth, datetime.min.time())
            start_date_dt = datetime.combine(employee_data.start_date, datetime.min.time())
            
            # Create employee document
            employee_doc = {
                "employee_id": employee_data.employee_id,
                "first_name": employee_data.first_name,
                "last_name": employee_data.last_name,
                "full_name": full_name,
                "email": employee_data.email,
                "phone": employee_data.phone,
                "date_of_birth": date_of_birth_dt,
                "gender": employee_data.gender,
                "address": employee_data.address.dict(),
                "emergency_contact": employee_data.emergency_contact.dict(),
                "position": employee_data.position,
                "department": employee_data.department,
                "manager_id": employee_data.manager_id,
                "manager_name": manager_name,
                "employment_type": employee_data.employment_type,
                "start_date": start_date_dt,
                "salary": employee_data.salary,
                "bank_details": employee_data.bank_details.dict() if employee_data.bank_details else None,
                "skills": employee_data.skills,
                "certifications": employee_data.certifications,
                "status": EmployeeStatus.ACTIVE,
                "notes": employee_data.notes,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": current_user_id,
                "updated_by": current_user_id
            }
            
            # Insert employee
            logger.info(f"Inserting employee document with date_of_birth type: {type(date_of_birth_dt)}, start_date type: {type(start_date_dt)}")
            result = await self.db.employees.insert_one(employee_doc)
            
            # Fetch the inserted document to ensure we have the correct format
            inserted_employee = await self.db.employees.find_one({"_id": result.inserted_id})
            if not inserted_employee:
                raise HTTPException(
                    status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Employee was created but could not be retrieved"
                )
            
            # Convert ObjectId to string and datetime back to date for response
            inserted_employee["id"] = str(inserted_employee["_id"])
            del inserted_employee["_id"]
            
            # Convert datetime back to date for response model
            if isinstance(inserted_employee.get("date_of_birth"), datetime):
                inserted_employee["date_of_birth"] = inserted_employee["date_of_birth"].date()
            if isinstance(inserted_employee.get("start_date"), datetime):
                inserted_employee["start_date"] = inserted_employee["start_date"].date()
            if isinstance(inserted_employee.get("created_at"), datetime):
                # Keep as datetime for response
                pass
            if isinstance(inserted_employee.get("updated_at"), datetime):
                # Keep as datetime for response
                pass
            
            return EmployeeResponse(**inserted_employee)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating employee: {e}", exc_info=True)
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create employee: {str(e)}"
            )
    
    async def get_employee(self, employee_id: str) -> EmployeeResponse:
        """Get employee by ID (supports both employee_id and MongoDB _id)"""
        try:
            # Try to find by MongoDB _id first (ObjectId format)
            try:
                from bson import ObjectId
                if ObjectId.is_valid(employee_id):
                    employee = await self.db.employees.find_one({"_id": ObjectId(employee_id)})
                    if employee:
                        employee["id"] = str(employee["_id"])
                        del employee["_id"]
                        # Convert datetime back to date for response
                        if isinstance(employee.get("date_of_birth"), datetime):
                            employee["date_of_birth"] = employee["date_of_birth"].date()
                        if isinstance(employee.get("start_date"), datetime):
                            employee["start_date"] = employee["start_date"].date()
                        return EmployeeResponse(**employee)
            except (ValueError, TypeError):
                pass
            
            # If not found by _id, try employee_id (custom ID)
            employee = await self.db.employees.find_one({"employee_id": employee_id})
            if not employee:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Employee not found"
                )
            
            # Convert ObjectId to string and datetime back to date
            employee["id"] = str(employee["_id"])
            del employee["_id"]
            if isinstance(employee.get("date_of_birth"), datetime):
                employee["date_of_birth"] = employee["date_of_birth"].date()
            if isinstance(employee.get("start_date"), datetime):
                employee["start_date"] = employee["start_date"].date()
            
            return EmployeeResponse(**employee)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting employee: {e}", exc_info=True)
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get employee: {str(e)}"
            )
    
    async def get_employees(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        department: Optional[str] = None,
        status: Optional[EmployeeStatus] = None,
        search: Optional[str] = None
    ) -> List[EmployeeResponse]:
        """Get list of employees with filters"""
        try:
            # Build filter
            filter_dict = {}
            if department:
                filter_dict["department"] = department
            if status:
                filter_dict["status"] = status
            if search:
                filter_dict["$or"] = [
                    {"first_name": {"$regex": search, "$options": "i"}},
                    {"last_name": {"$regex": search, "$options": "i"}},
                    {"email": {"$regex": search, "$options": "i"}},
                    {"employee_id": {"$regex": search, "$options": "i"}}
                ]
            
            # Get employees
            cursor = self.db.employees.find(filter_dict).skip(skip).limit(limit)
            employees = await cursor.to_list(length=limit)
            
            # Convert to response format
            result = []
            for employee in employees:
                employee["id"] = str(employee["_id"])
                del employee["_id"]
                result.append(EmployeeResponse(**employee))
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting employees: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get employees"
            )
    
    async def update_employee(self, employee_id: str, employee_data: EmployeeUpdate, current_user_id: str) -> EmployeeResponse:
        """Update employee (supports both employee_id and MongoDB _id)"""
        try:
            # Try to find by MongoDB _id first (ObjectId format)
            existing_employee = None
            lookup_field = None
            actual_employee_id = None
            try:
                from bson import ObjectId
                if ObjectId.is_valid(employee_id):
                    existing_employee = await self.db.employees.find_one({"_id": ObjectId(employee_id)})
                    if existing_employee:
                        lookup_field = {"_id": ObjectId(employee_id)}
                        actual_employee_id = existing_employee.get("employee_id")
            except (ValueError, TypeError):
                pass
            
            # If not found by _id, try employee_id (custom ID)
            if not existing_employee:
                existing_employee = await self.db.employees.find_one({"employee_id": employee_id})
                if existing_employee:
                    lookup_field = {"employee_id": employee_id}
                    actual_employee_id = employee_id
            
            if not existing_employee:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Employee not found"
                )
            
            # Check email uniqueness if email is being updated
            if employee_data.email:
                email_check = await self.db.employees.find_one({
                    "email": employee_data.email,
                    "employee_id": {"$ne": actual_employee_id}
                })
                if email_check:
                    raise HTTPException(
                        status_code=http_status.HTTP_400_BAD_REQUEST,
                        detail="Email already exists"
                    )
            
            # Prepare update data
            update_data = employee_data.dict(exclude_unset=True)
            
            # Update full name if first or last name is updated
            if employee_data.first_name or employee_data.last_name:
                first_name = employee_data.first_name or existing_employee["first_name"]
                last_name = employee_data.last_name or existing_employee["last_name"]
                update_data["full_name"] = f"{first_name} {last_name}"
            
            # Get manager name if manager_id is updated
            if employee_data.manager_id:
                manager = await self.db.employees.find_one({"employee_id": employee_data.manager_id})
                if manager:
                    update_data["manager_name"] = f"{manager['first_name']} {manager['last_name']}"
            
            # Add update metadata
            update_data["updated_at"] = datetime.utcnow()
            update_data["updated_by"] = current_user_id
            
            # Update employee using the lookup field
            await self.db.employees.update_one(
                lookup_field,
                {"$set": update_data}
            )
            
            # Get updated employee
            updated_employee = await self.db.employees.find_one(lookup_field)
            if not updated_employee:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Employee not found after update"
                )
            
            # Convert ObjectId to string and datetime back to date
            updated_employee["id"] = str(updated_employee["_id"])
            del updated_employee["_id"]
            if isinstance(updated_employee.get("date_of_birth"), datetime):
                updated_employee["date_of_birth"] = updated_employee["date_of_birth"].date()
            if isinstance(updated_employee.get("start_date"), datetime):
                updated_employee["start_date"] = updated_employee["start_date"].date()
            
            return EmployeeResponse(**updated_employee)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating employee: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update employee"
            )
    
    async def delete_employee(self, employee_id: str, current_user_id: str) -> Dict[str, str]:
        """Delete employee (soft delete) - supports both employee_id and MongoDB _id"""
        try:
            # Try to find by MongoDB _id first (ObjectId format)
            employee = None
            lookup_field = None
            try:
                from bson import ObjectId
                if ObjectId.is_valid(employee_id):
                    employee = await self.db.employees.find_one({"_id": ObjectId(employee_id)})
                    if employee:
                        lookup_field = {"_id": ObjectId(employee_id)}
            except (ValueError, TypeError):
                pass
            
            # If not found by _id, try employee_id (custom ID)
            if not employee:
                employee = await self.db.employees.find_one({"employee_id": employee_id})
                if employee:
                    lookup_field = {"employee_id": employee_id}
            
            if not employee:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Employee not found"
                )
            
            # Soft delete - update status to inactive using the lookup field
            await self.db.employees.update_one(
                lookup_field,
                {
                    "$set": {
                        "status": EmployeeStatus.INACTIVE,
                        "updated_at": datetime.utcnow(),
                        "updated_by": current_user_id
                    }
                }
            )
            
            return {"message": "Employee deleted successfully"}
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting employee: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete employee"
            )
    
    async def get_employee_by_department(self, department: str) -> List[EmployeeResponse]:
        """Get employees by department"""
        try:
            cursor = self.db.employees.find({"department": department, "status": EmployeeStatus.ACTIVE})
            employees = await cursor.to_list(length=None)
            
            result = []
            for employee in employees:
                employee["_id"] = str(employee["_id"])
                result.append(EmployeeResponse(**employee))
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting employees by department: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get employees by department"
            )
    
    async def get_employee_statistics(self) -> Dict[str, Any]:
        """Get employee statistics"""
        try:
            # Total employees
            total_employees = await self.db.employees.count_documents({"status": EmployeeStatus.ACTIVE})
            
            # Department breakdown
            department_pipeline = [
                {"$match": {"status": EmployeeStatus.ACTIVE}},
                {"$group": {"_id": "$department", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            department_stats = await self.db.employees.aggregate(department_pipeline).to_list(length=None)
            
            # Employment type breakdown
            employment_pipeline = [
                {"$match": {"status": EmployeeStatus.ACTIVE}},
                {"$group": {"_id": "$employment_type", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            employment_stats = await self.db.employees.aggregate(employment_pipeline).to_list(length=None)
            
            return {
                "total_employees": total_employees,
                "department_breakdown": department_stats,
                "employment_type_breakdown": employment_stats
            }
            
        except Exception as e:
            logger.error(f"Error getting employee statistics: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get employee statistics"
            )
