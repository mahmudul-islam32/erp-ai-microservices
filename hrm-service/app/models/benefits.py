from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


class BenefitType(str, Enum):
    HEALTH_INSURANCE = "health_insurance"
    DENTAL_INSURANCE = "dental_insurance"
    VISION_INSURANCE = "vision_insurance"
    LIFE_INSURANCE = "life_insurance"
    DISABILITY_INSURANCE = "disability_insurance"
    RETIREMENT_401K = "retirement_401k"
    RETIREMENT_PENSION = "retirement_pension"
    VACATION_DAYS = "vacation_days"
    SICK_DAYS = "sick_days"
    PERSONAL_DAYS = "personal_days"
    FLEXIBLE_SPENDING = "flexible_spending"
    HEALTH_SAVINGS = "health_savings"
    TRANSPORTATION = "transportation"
    MEAL_ALLOWANCE = "meal_allowance"
    GYM_MEMBERSHIP = "gym_membership"
    EDUCATION_ASSISTANCE = "education_assistance"
    CHILD_CARE = "child_care"
    OTHER = "other"


class BenefitStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class CoverageType(str, Enum):
    INDIVIDUAL = "individual"
    FAMILY = "family"
    EMPLOYEE_PLUS_ONE = "employee_plus_one"
    EMPLOYEE_PLUS_CHILDREN = "employee_plus_children"


class BenefitPlanCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    benefit_type: BenefitType
    description: str = Field(..., min_length=10, max_length=500)
    provider: str
    coverage_type: CoverageType
    employee_contribution: float = Field(..., ge=0)
    employer_contribution: float = Field(..., ge=0)
    total_cost: float = Field(..., gt=0)
    coverage_start_date: date
    coverage_end_date: Optional[date] = None
    eligibility_requirements: List[str] = []
    waiting_period_days: int = Field(default=0, ge=0)
    enrollment_deadline: Optional[date] = None
    is_mandatory: bool = False
    is_active: bool = True
    notes: Optional[str] = None


class BenefitPlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, min_length=10, max_length=500)
    provider: Optional[str] = None
    coverage_type: Optional[CoverageType] = None
    employee_contribution: Optional[float] = Field(None, ge=0)
    employer_contribution: Optional[float] = Field(None, ge=0)
    total_cost: Optional[float] = Field(None, gt=0)
    coverage_start_date: Optional[date] = None
    coverage_end_date: Optional[date] = None
    eligibility_requirements: Optional[List[str]] = None
    waiting_period_days: Optional[int] = Field(None, ge=0)
    enrollment_deadline: Optional[date] = None
    is_mandatory: Optional[bool] = None
    is_active: Optional[bool] = None
    status: Optional[BenefitStatus] = None
    notes: Optional[str] = None


class BenefitPlan(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    plan_id: str  # Unique plan identifier
    name: str
    benefit_type: BenefitType
    description: str
    provider: str
    coverage_type: CoverageType
    employee_contribution: float
    employer_contribution: float
    total_cost: float
    coverage_start_date: date
    coverage_end_date: Optional[date] = None
    eligibility_requirements: List[str] = []
    waiting_period_days: int
    enrollment_deadline: Optional[date] = None
    is_mandatory: bool
    is_active: bool
    status: BenefitStatus
    total_enrollments: int = 0
    notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    # Metadata
    created_by: str
    updated_by: str

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class EmployeeBenefitCreate(BaseModel):
    employee_id: str
    plan_id: str
    enrollment_date: date
    coverage_start_date: date
    coverage_end_date: Optional[date] = None
    employee_contribution: float = Field(..., ge=0)
    employer_contribution: float = Field(..., ge=0)
    total_cost: float = Field(..., gt=0)
    dependents: List[str] = []  # Dependent IDs
    notes: Optional[str] = None


class EmployeeBenefitUpdate(BaseModel):
    coverage_end_date: Optional[date] = None
    employee_contribution: Optional[float] = Field(None, ge=0)
    employer_contribution: Optional[float] = Field(None, ge=0)
    total_cost: Optional[float] = Field(None, gt=0)
    dependents: Optional[List[str]] = None
    status: Optional[BenefitStatus] = None
    notes: Optional[str] = None


class EmployeeBenefit(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    employee_id: str
    employee_name: str
    plan_id: str
    plan_name: str
    benefit_type: BenefitType
    enrollment_date: date
    coverage_start_date: date
    coverage_end_date: Optional[date] = None
    employee_contribution: float
    employer_contribution: float
    total_cost: float
    dependents: List[str] = []
    status: BenefitStatus
    notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    # Metadata
    created_by: str
    updated_by: str

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class Dependent(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    employee_id: str
    first_name: str
    last_name: str
    relationship: str  # "spouse", "child", "parent", "other"
    date_of_birth: date
    ssn: Optional[str] = None
    is_eligible: bool = True
    coverage_start_date: Optional[date] = None
    coverage_end_date: Optional[date] = None
    notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class BenefitsSummary(BaseModel):
    employee_id: str
    employee_name: str
    total_benefits_cost: float
    employee_contribution: float
    employer_contribution: float
    active_benefits: int
    total_dependents: int
    benefits_breakdown: List[Dict[str, Any]]


class BenefitsAnalytics(BaseModel):
    total_plans: int
    active_plans: int
    total_enrollments: int
    average_cost_per_employee: float
    most_popular_benefits: List[Dict[str, Any]]
    department_breakdown: Dict[str, int]
    cost_trends: List[Dict[str, Any]]
    enrollment_rate: float


class OpenEnrollment(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    description: str
    start_date: date
    end_date: date
    is_active: bool
    eligible_employees: List[str] = []
    available_plans: List[str] = []
    enrollment_deadline: date
    effective_date: date
    notes: Optional[str] = None
    
    # Timestamps
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
