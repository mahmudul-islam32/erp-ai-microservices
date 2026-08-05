from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


class EmployeeStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TERMINATED = "terminated"
    ON_LEAVE = "on_leave"


class EmploymentType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERN = "intern"
    FREELANCE = "freelance"


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class Address(BaseModel):
    street: str
    city: str
    state: str
    postal_code: str
    country: str


class EmergencyContact(BaseModel):
    name: str
    relationship: str
    phone: str
    email: Optional[EmailStr] = None


class BankDetails(BaseModel):
    bank_name: str
    account_number: str
    routing_number: str
    account_type: str  # checking, savings


class EmployeeCreate(BaseModel):
    employee_id: str = Field(..., description="Unique employee identifier")
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    phone: str
    date_of_birth: date
    gender: Gender
    address: Address
    emergency_contact: EmergencyContact
    position: str
    department: str
    manager_id: Optional[str] = None
    employment_type: EmploymentType
    start_date: date
    salary: float = Field(..., gt=0)
    bank_details: Optional[BankDetails] = None
    skills: List[str] = []
    certifications: List[str] = []
    notes: Optional[str] = None


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[Address] = None
    emergency_contact: Optional[EmergencyContact] = None
    position: Optional[str] = None
    department: Optional[str] = None
    manager_id: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    salary: Optional[float] = Field(None, gt=0)
    bank_details: Optional[BankDetails] = None
    skills: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    status: Optional[EmployeeStatus] = None
    notes: Optional[str] = None


class Employee(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    employee_id: str
    first_name: str
    last_name: str
    full_name: str
    email: EmailStr
    phone: str
    date_of_birth: date
    gender: Gender
    address: Address
    emergency_contact: EmergencyContact
    position: str
    department: str
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    employment_type: EmploymentType
    start_date: date
    end_date: Optional[date] = None
    salary: float
    bank_details: Optional[BankDetails] = None
    skills: List[str] = []
    certifications: List[str] = []
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    notes: Optional[str] = None
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


class EmployeeResponse(BaseModel):
    id: str
    employee_id: str
    first_name: str
    last_name: str
    full_name: str
    email: str
    phone: str
    date_of_birth: date
    gender: Gender
    address: Address
    emergency_contact: EmergencyContact
    position: str
    department: str
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    employment_type: EmploymentType
    start_date: date
    end_date: Optional[date] = None
    salary: float
    bank_details: Optional[BankDetails] = None
    skills: List[str] = []
    certifications: List[str] = []
    status: EmployeeStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }
