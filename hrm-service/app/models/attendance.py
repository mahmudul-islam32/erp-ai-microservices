from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date, time
from enum import Enum


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EARLY_LEAVE = "early_leave"
    HALF_DAY = "half_day"
    OVERTIME = "overtime"


class AttendanceType(str, Enum):
    CLOCK_IN = "clock_in"
    CLOCK_OUT = "clock_out"
    BREAK_START = "break_start"
    BREAK_END = "break_end"
    LUNCH_START = "lunch_start"
    LUNCH_END = "lunch_end"


class AttendanceRecord(BaseModel):
    type: AttendanceType
    timestamp: datetime
    location: Optional[str] = None
    notes: Optional[str] = None


class AttendanceCreate(BaseModel):
    employee_id: str
    date: date
    clock_in_time: Optional[time] = None
    clock_out_time: Optional[time] = None
    break_start_time: Optional[time] = None
    break_end_time: Optional[time] = None
    lunch_start_time: Optional[time] = None
    lunch_end_time: Optional[time] = None
    total_hours: Optional[float] = None
    overtime_hours: Optional[float] = None
    status: AttendanceStatus = AttendanceStatus.PRESENT
    notes: Optional[str] = None


class AttendanceUpdate(BaseModel):
    clock_in_time: Optional[time] = None
    clock_out_time: Optional[time] = None
    break_start_time: Optional[time] = None
    break_end_time: Optional[time] = None
    lunch_start_time: Optional[time] = None
    lunch_end_time: Optional[time] = None
    total_hours: Optional[float] = None
    overtime_hours: Optional[float] = None
    status: Optional[AttendanceStatus] = None
    notes: Optional[str] = None


class Attendance(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    employee_id: str
    employee_name: str
    date: date
    clock_in_time: Optional[time] = None
    clock_out_time: Optional[time] = None
    break_start_time: Optional[time] = None
    break_end_time: Optional[time] = None
    lunch_start_time: Optional[time] = None
    lunch_end_time: Optional[time] = None
    total_hours: Optional[float] = None
    overtime_hours: Optional[float] = None
    status: AttendanceStatus
    records: List[AttendanceRecord] = []
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: str

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
            time: lambda v: v.isoformat()
        }


class AttendanceResponse(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    date: date
    clock_in_time: Optional[time] = None
    clock_out_time: Optional[time] = None
    break_start_time: Optional[time] = None
    break_end_time: Optional[time] = None
    lunch_start_time: Optional[time] = None
    lunch_end_time: Optional[time] = None
    total_hours: Optional[float] = None
    overtime_hours: Optional[float] = None
    status: AttendanceStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
            time: lambda v: v.isoformat()
        }


class TimesheetEntry(BaseModel):
    date: date
    clock_in: Optional[time] = None
    clock_out: Optional[time] = None
    total_hours: float
    overtime_hours: float
    status: AttendanceStatus
    notes: Optional[str] = None


class Timesheet(BaseModel):
    employee_id: str
    employee_name: str
    week_start: date
    week_end: date
    total_hours: float
    overtime_hours: float
    entries: List[TimesheetEntry]
    status: str  # "draft", "submitted", "approved", "rejected"
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
            time: lambda v: v.isoformat()
        }


class AttendanceSummary(BaseModel):
    employee_id: str
    employee_name: str
    period_start: date
    period_end: date
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    total_hours: float
    overtime_hours: float
    attendance_rate: float
