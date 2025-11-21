from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import date

from app.models.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeStatus
from app.services.employee_service import EmployeeService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/employees", tags=["Employees"])

# Dependency to get current user
async def get_current_user(token: str = Depends(lambda: None)):
    # In a real implementation, this would extract the token from the Authorization header
    # For now, we'll use a placeholder
    return {"user_id": "current_user", "email": "user@example.com"}

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    employee_data: EmployeeCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new employee"""
    service = EmployeeService()
    return await service.create_employee(employee_data, current_user["user_id"])

@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: str):
    """Get employee by ID"""
    service = EmployeeService()
    return await service.get_employee(employee_id)

@router.get("/", response_model=List[EmployeeResponse])
async def get_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    department: Optional[str] = Query(None),
    status: Optional[EmployeeStatus] = Query(None),
    search: Optional[str] = Query(None)
):
    """Get list of employees with filters"""
    service = EmployeeService()
    return await service.get_employees(skip, limit, department, status, search)

@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: str,
    employee_data: EmployeeUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update employee"""
    service = EmployeeService()
    return await service.update_employee(employee_id, employee_data, current_user["user_id"])

@router.delete("/{employee_id}")
async def delete_employee(
    employee_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete employee (soft delete)"""
    service = EmployeeService()
    return await service.delete_employee(employee_id, current_user["user_id"])

@router.get("/department/{department}", response_model=List[EmployeeResponse])
async def get_employees_by_department(department: str):
    """Get employees by department"""
    service = EmployeeService()
    return await service.get_employee_by_department(department)

@router.get("/statistics/summary")
async def get_employee_statistics():
    """Get employee statistics"""
    service = EmployeeService()
    return await service.get_employee_statistics()
