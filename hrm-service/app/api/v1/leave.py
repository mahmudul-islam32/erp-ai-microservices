from fastapi import APIRouter, Depends, status, Query
from typing import List, Optional
from datetime import date

from app.models.leave import LeaveCreate, LeaveUpdate, LeaveResponse, LeaveStatus, LeaveType, LeaveSummary
from app.services.leave_service import LeaveService

router = APIRouter(prefix="/leave", tags=["Leave Management"])

# Dependency to get current user
async def get_current_user(token: str = Depends(lambda: None)):
    return {"user_id": "current_user", "email": "user@example.com"}

@router.post("/", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED)
async def create_leave_request(
    leave_data: LeaveCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new leave request"""
    service = LeaveService()
    return await service.create_leave_request(leave_data, current_user["user_id"])

@router.get("/{leave_id}", response_model=LeaveResponse)
async def get_leave_request(leave_id: str):
    """Get leave request by ID"""
    service = LeaveService()
    return await service.get_leave_request(leave_id)

@router.get("/", response_model=List[LeaveResponse])
async def get_leave_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    employee_id: Optional[str] = Query(None),
    status: Optional[LeaveStatus] = Query(None),
    leave_type: Optional[LeaveType] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None)
):
    """Get list of leave requests with filters"""
    service = LeaveService()
    return await service.get_leave_requests(skip, limit, employee_id, status, leave_type, start_date, end_date)

@router.put("/{leave_id}", response_model=LeaveResponse)
async def update_leave_request(
    leave_id: str,
    leave_data: LeaveUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update leave request"""
    service = LeaveService()
    return await service.update_leave_request(leave_id, leave_data, current_user["user_id"])

@router.post("/{leave_id}/approve", response_model=LeaveResponse)
async def approve_leave_request(
    leave_id: str,
    current_user: dict = Depends(get_current_user),
    comments: Optional[str] = None
):
    """Approve leave request"""
    service = LeaveService()
    return await service.approve_leave_request(leave_id, current_user["user_id"], comments)

@router.post("/{leave_id}/reject", response_model=LeaveResponse)
async def reject_leave_request(
    leave_id: str,
    current_user: dict = Depends(get_current_user),
    rejection_reason: str = Query(...)
):
    """Reject leave request"""
    service = LeaveService()
    return await service.reject_leave_request(leave_id, current_user["user_id"], rejection_reason)

@router.get("/{employee_id}/balance", response_model=LeaveSummary)
async def get_leave_balance(employee_id: str):
    """Get leave balance for employee"""
    service = LeaveService()
    return await service.get_leave_balance(employee_id)
