from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import date

from app.models.payroll import PayrollCreate, PayrollUpdate, PayrollResponse, PayrollStatus, PayrollSummary
from app.services.payroll_service import PayrollService

router = APIRouter(prefix="/payroll", tags=["Payroll"])

# Dependency to get current user
async def get_current_user(token: str = Depends(lambda: None)):
    return {"user_id": "current_user", "email": "user@example.com"}

@router.post("/", response_model=PayrollResponse, status_code=status.HTTP_201_CREATED)
async def create_payroll(
    payroll_data: PayrollCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new payroll record"""
    service = PayrollService()
    return await service.create_payroll(payroll_data, current_user["user_id"])

@router.get("/{payroll_id}", response_model=PayrollResponse)
async def get_payroll(payroll_id: str):
    """Get payroll by ID"""
    service = PayrollService()
    return await service.get_payroll(payroll_id)

@router.get("/", response_model=List[PayrollResponse])
async def get_payrolls(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    employee_id: Optional[str] = Query(None),
    status: Optional[PayrollStatus] = Query(None),
    pay_period_start: Optional[date] = Query(None),
    pay_period_end: Optional[date] = Query(None)
):
    """Get list of payrolls with filters"""
    service = PayrollService()
    return await service.get_payrolls(skip, limit, employee_id, status, pay_period_start, pay_period_end)

@router.put("/{payroll_id}", response_model=PayrollResponse)
async def update_payroll(
    payroll_id: str,
    payroll_data: PayrollUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update payroll"""
    service = PayrollService()
    return await service.update_payroll(payroll_id, payroll_data, current_user["user_id"])

@router.post("/{payroll_id}/approve", response_model=PayrollResponse)
async def approve_payroll(
    payroll_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Approve payroll"""
    service = PayrollService()
    return await service.approve_payroll(payroll_id, current_user["user_id"])

@router.get("/summary/period", response_model=PayrollSummary)
async def get_payroll_summary(
    pay_period_start: date = Query(...),
    pay_period_end: date = Query(...)
):
    """Get payroll summary for a period"""
    service = PayrollService()
    return await service.get_payroll_summary(pay_period_start, pay_period_end)
