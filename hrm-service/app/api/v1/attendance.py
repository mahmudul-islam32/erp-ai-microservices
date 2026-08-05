from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import date, time

from app.models.attendance import AttendanceResponse, Timesheet, AttendanceSummary
from app.services.attendance_service import AttendanceService

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.get("/", response_model=List[AttendanceResponse])
async def get_attendance_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    employee_id: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None)
):
    """Get attendance records with optional filters"""
    service = AttendanceService()
    return await service.get_attendance_records(skip, limit, employee_id, date_from, date_to)

# Dependency to get current user
async def get_current_user(token: str = Depends(lambda: None)):
    return {"user_id": "current_user", "email": "user@example.com"}

@router.post("/clock-in", response_model=AttendanceResponse)
async def clock_in(
    employee_id: str,
    clock_in_time: Optional[time] = None,
    location: Optional[str] = None,
    notes: Optional[str] = None
):
    """Clock in for the day"""
    service = AttendanceService()
    return await service.clock_in(employee_id, clock_in_time, location, notes)

@router.post("/clock-out", response_model=AttendanceResponse)
async def clock_out(
    employee_id: str,
    clock_out_time: Optional[time] = None,
    location: Optional[str] = None,
    notes: Optional[str] = None
):
    """Clock out for the day"""
    service = AttendanceService()
    return await service.clock_out(employee_id, clock_out_time, location, notes)

@router.get("/{employee_id}/{date}", response_model=AttendanceResponse)
async def get_attendance(employee_id: str, date: date):
    """Get attendance for specific date"""
    service = AttendanceService()
    return await service.get_attendance(employee_id, date)

@router.get("/{employee_id}/history", response_model=List[AttendanceResponse])
async def get_attendance_history(
    employee_id: str,
    start_date: date = Query(...),
    end_date: date = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get attendance history for date range"""
    service = AttendanceService()
    return await service.get_attendance_history(employee_id, start_date, end_date, skip, limit)

@router.get("/{employee_id}/timesheet", response_model=Timesheet)
async def get_timesheet(
    employee_id: str,
    week_start: date = Query(...)
):
    """Get weekly timesheet"""
    service = AttendanceService()
    return await service.get_timesheet(employee_id, week_start)

@router.get("/{employee_id}/summary", response_model=AttendanceSummary)
async def get_attendance_summary(
    employee_id: str,
    start_date: date = Query(...),
    end_date: date = Query(...)
):
    """Get attendance summary for date range"""
    service = AttendanceService()
    return await service.get_attendance_summary(employee_id, start_date, end_date)
