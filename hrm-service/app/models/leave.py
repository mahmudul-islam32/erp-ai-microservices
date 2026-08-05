from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


class LeaveType(str, Enum):
    VACATION = "vacation"
    SICK_LEAVE = "sick_leave"
    PERSONAL_LEAVE = "personal_leave"
    MATERNITY_LEAVE = "maternity_leave"
    PATERNITY_LEAVE = "paternity_leave"
    BEREAVEMENT_LEAVE = "bereavement_leave"
    EMERGENCY_LEAVE = "emergency_leave"
    UNPAID_LEAVE = "unpaid_leave"
    COMPENSATORY_LEAVE = "compensatory_leave"
    STUDY_LEAVE = "study_leave"


class LeaveStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    TAKEN = "taken"
    EXPIRED = "expired"


class LeaveCreate(BaseModel):
    employee_id: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    total_days: int = Field(..., gt=0)
    reason: str = Field(..., min_length=10, max_length=500)
    emergency_contact: Optional[str] = None
    work_handover: Optional[str] = None
    attachments: List[str] = []  # File URLs
    notes: Optional[str] = None


class LeaveUpdate(BaseModel):
    leave_type: Optional[LeaveType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_days: Optional[int] = Field(None, gt=0)
    reason: Optional[str] = Field(None, min_length=10, max_length=500)
    emergency_contact: Optional[str] = None
    work_handover: Optional[str] = None
    attachments: Optional[List[str]] = None
    status: Optional[LeaveStatus] = None
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None


class LeaveApproval(BaseModel):
    status: LeaveStatus
    approved_by: str
    comments: Optional[str] = None
    rejection_reason: Optional[str] = None


class Leave(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    employee_id: str
    employee_name: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    total_days: int
    reason: str
    emergency_contact: Optional[str] = None
    work_handover: Optional[str] = None
    attachments: List[str] = []
    status: LeaveStatus
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    
    # Approval workflow
    requested_at: datetime
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejected_by: Optional[str] = None
    rejected_at: Optional[datetime] = None
    
    # Metadata
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: str

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class LeaveResponse(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    total_days: int
    reason: str
    emergency_contact: Optional[str] = None
    work_handover: Optional[str] = None
    attachments: List[str] = []
    status: LeaveStatus
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    requested_at: datetime
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejected_by: Optional[str] = None
    rejected_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class LeaveBalance(BaseModel):
    employee_id: str
    employee_name: str
    leave_type: LeaveType
    total_entitlement: int
    used_days: int
    remaining_days: int
    pending_days: int
    expired_days: int


class LeaveSummary(BaseModel):
    employee_id: str
    employee_name: str
    total_leave_days: int
    used_leave_days: int
    remaining_leave_days: int
    pending_leave_days: int
    leave_balance: List[LeaveBalance]


class LeavePolicy(BaseModel):
    leave_type: LeaveType
    max_days_per_year: int
    max_consecutive_days: int
    advance_notice_days: int
    requires_approval: bool
    requires_medical_certificate: bool
    carry_forward: bool
    max_carry_forward_days: int
    description: str


class LeaveCalendar(BaseModel):
    date: date
    employee_id: str
    employee_name: str
    leave_type: LeaveType
    status: LeaveStatus
    is_holiday: bool = False
    holiday_name: Optional[str] = None
