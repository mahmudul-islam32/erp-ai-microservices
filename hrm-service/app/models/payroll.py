from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


class PayrollStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    PROCESSED = "processed"
    PAID = "paid"
    CANCELLED = "cancelled"


class PayrollItem(BaseModel):
    description: str
    amount: float
    type: str  # "earnings", "deductions", "taxes"
    category: str  # "basic_salary", "overtime", "bonus", "tax", "insurance", etc.


class PayrollCreate(BaseModel):
    employee_id: str
    pay_period_start: date
    pay_period_end: date
    basic_salary: float = Field(..., gt=0)
    overtime_hours: float = Field(default=0, ge=0)
    overtime_rate: float = Field(default=1.5, gt=0)
    bonus: float = Field(default=0, ge=0)
    commission: float = Field(default=0, ge=0)
    allowances: List[PayrollItem] = []
    deductions: List[PayrollItem] = []
    tax_rate: float = Field(default=0.20, ge=0, le=1)
    social_security_rate: float = Field(default=0.062, ge=0, le=1)
    medicare_rate: float = Field(default=0.0145, ge=0, le=1)
    notes: Optional[str] = None


class PayrollUpdate(BaseModel):
    basic_salary: Optional[float] = Field(None, gt=0)
    overtime_hours: Optional[float] = Field(None, ge=0)
    overtime_rate: Optional[float] = Field(None, gt=0)
    bonus: Optional[float] = Field(None, ge=0)
    commission: Optional[float] = Field(None, ge=0)
    allowances: Optional[List[PayrollItem]] = None
    deductions: Optional[List[PayrollItem]] = None
    tax_rate: Optional[float] = Field(None, ge=0, le=1)
    social_security_rate: Optional[float] = Field(None, ge=0, le=1)
    medicare_rate: Optional[float] = Field(None, ge=0, le=1)
    status: Optional[PayrollStatus] = None
    notes: Optional[str] = None


class PayrollCalculation(BaseModel):
    # Earnings
    basic_salary: float
    overtime_pay: float
    bonus: float
    commission: float
    total_allowances: float
    gross_earnings: float
    
    # Deductions
    income_tax: float
    social_security: float
    medicare: float
    total_deductions: float
    net_pay: float
    
    # Additional deductions
    other_deductions: float
    final_net_pay: float


class Payroll(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    employee_id: str
    employee_name: str
    pay_period_start: date
    pay_period_end: date
    pay_date: date
    
    # Earnings
    basic_salary: float
    overtime_hours: float
    overtime_rate: float
    overtime_pay: float
    bonus: float
    commission: float
    allowances: List[PayrollItem] = []
    total_allowances: float
    gross_earnings: float
    
    # Deductions
    tax_rate: float
    income_tax: float
    social_security_rate: float
    social_security: float
    medicare_rate: float
    medicare: float
    deductions: List[PayrollItem] = []
    total_deductions: float
    net_pay: float
    
    # Status and metadata
    status: PayrollStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class PayrollResponse(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    pay_period_start: date
    pay_period_end: date
    pay_date: date
    basic_salary: float
    overtime_hours: float
    overtime_pay: float
    bonus: float
    commission: float
    total_allowances: float
    gross_earnings: float
    income_tax: float
    social_security: float
    medicare: float
    total_deductions: float
    net_pay: float
    status: PayrollStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class PayrollSummary(BaseModel):
    total_employees: int
    total_gross_pay: float
    total_deductions: float
    total_net_pay: float
    average_salary: float
    payroll_period: str

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }
