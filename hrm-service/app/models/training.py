from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


class TrainingStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ARCHIVED = "archived"


class TrainingType(str, Enum):
    MANDATORY = "mandatory"
    OPTIONAL = "optional"
    CERTIFICATION = "certification"
    SKILL_DEVELOPMENT = "skill_development"
    COMPLIANCE = "compliance"
    LEADERSHIP = "leadership"
    TECHNICAL = "technical"


class TrainingFormat(str, Enum):
    IN_PERSON = "in_person"
    ONLINE = "online"
    HYBRID = "hybrid"
    SELF_PACED = "self_paced"
    WORKSHOP = "workshop"
    SEMINAR = "seminar"


class EnrollmentStatus(str, Enum):
    ENROLLED = "enrolled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DROPPED = "dropped"
    FAILED = "failed"
    CERTIFIED = "certified"


class TrainingCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=100)
    description: str = Field(..., min_length=20, max_length=1000)
    category: str
    training_type: TrainingType
    format: TrainingFormat
    duration_hours: int = Field(..., gt=0)
    max_participants: Optional[int] = Field(None, gt=0)
    prerequisites: List[str] = []
    learning_objectives: List[str] = []
    skills_covered: List[str] = []
    instructor_id: Optional[str] = None
    instructor_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    location: Optional[str] = None
    online_link: Optional[str] = None
    materials: List[str] = []  # File URLs
    cost: Optional[float] = Field(None, ge=0)
    is_mandatory: bool = False
    target_departments: List[str] = []
    target_roles: List[str] = []
    certification_validity_years: Optional[int] = None
    passing_score: Optional[int] = Field(None, ge=0, le=100)
    notes: Optional[str] = None


class TrainingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=100)
    description: Optional[str] = Field(None, min_length=20, max_length=1000)
    category: Optional[str] = None
    training_type: Optional[TrainingType] = None
    format: Optional[TrainingFormat] = None
    duration_hours: Optional[int] = Field(None, gt=0)
    max_participants: Optional[int] = Field(None, gt=0)
    prerequisites: Optional[List[str]] = None
    learning_objectives: Optional[List[str]] = None
    skills_covered: Optional[List[str]] = None
    instructor_id: Optional[str] = None
    instructor_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    location: Optional[str] = None
    online_link: Optional[str] = None
    materials: Optional[List[str]] = None
    cost: Optional[float] = Field(None, ge=0)
    is_mandatory: Optional[bool] = None
    target_departments: Optional[List[str]] = None
    target_roles: Optional[List[str]] = None
    certification_validity_years: Optional[int] = None
    passing_score: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[TrainingStatus] = None
    notes: Optional[str] = None


class Training(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    training_id: str  # Unique training identifier
    title: str
    description: str
    category: str
    training_type: TrainingType
    format: TrainingFormat
    duration_hours: int
    max_participants: Optional[int] = None
    prerequisites: List[str] = []
    learning_objectives: List[str] = []
    skills_covered: List[str] = []
    instructor_id: Optional[str] = None
    instructor_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    location: Optional[str] = None
    online_link: Optional[str] = None
    materials: List[str] = []
    cost: Optional[float] = None
    is_mandatory: bool
    target_departments: List[str] = []
    target_roles: List[str] = []
    certification_validity_years: Optional[int] = None
    passing_score: Optional[int] = None
    status: TrainingStatus
    total_enrollments: int = 0
    completed_enrollments: int = 0
    notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    
    # Metadata
    created_by: str
    updated_by: str

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class EmployeeTrainingCreate(BaseModel):
    employee_id: str
    training_id: str
    enrollment_date: Optional[date] = None
    target_completion_date: Optional[date] = None
    notes: Optional[str] = None


class EmployeeTrainingUpdate(BaseModel):
    status: Optional[EnrollmentStatus] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)
    completion_date: Optional[date] = None
    score: Optional[int] = Field(None, ge=0, le=100)
    certificate_url: Optional[str] = None
    feedback: Optional[str] = None
    notes: Optional[str] = None


class EmployeeTraining(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    employee_id: str
    employee_name: str
    training_id: str
    training_title: str
    enrollment_date: date
    target_completion_date: Optional[date] = None
    status: EnrollmentStatus
    progress_percentage: int = Field(default=0, ge=0, le=100)
    completion_date: Optional[date] = None
    score: Optional[int] = Field(None, ge=0, le=100)
    certificate_url: Optional[str] = None
    certificate_expiry_date: Optional[date] = None
    feedback: Optional[str] = None
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


class TrainingProgress(BaseModel):
    employee_id: str
    employee_name: str
    training_id: str
    training_title: str
    status: EnrollmentStatus
    progress_percentage: int
    time_spent_hours: float
    last_accessed: Optional[datetime] = None
    completion_date: Optional[date] = None
    score: Optional[int] = None
    certificate_status: str  # "not_eligible", "eligible", "issued", "expired"


class TrainingAnalytics(BaseModel):
    total_trainings: int
    active_trainings: int
    total_enrollments: int
    completion_rate: float
    average_score: float
    popular_categories: List[Dict[str, Any]]
    department_breakdown: Dict[str, int]
    certification_rate: float
    mandatory_completion_rate: float


class TrainingCalendar(BaseModel):
    date: date
    training_id: str
    training_title: str
    instructor_name: str
    location: str
    start_time: str
    end_time: str
    enrolled_count: int
    max_participants: int
    status: str
