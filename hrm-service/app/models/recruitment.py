from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


class JobStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_COMPLETED = "interview_completed"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"
    OFFER_MADE = "offer_made"
    ACCEPTED = "accepted"
    WITHDRAWN = "withdrawn"


class InterviewStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


class JobPostingCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=100)
    department: str
    location: str
    employment_type: str  # "full_time", "part_time", "contract", "intern"
    experience_level: str  # "entry", "mid", "senior", "executive"
    salary_range_min: Optional[float] = Field(None, ge=0)
    salary_range_max: Optional[float] = Field(None, ge=0)
    currency: str = "USD"
    description: str = Field(..., min_length=50, max_length=2000)
    requirements: List[str] = []
    responsibilities: List[str] = []
    benefits: List[str] = []
    skills_required: List[str] = []
    qualifications: List[str] = []
    application_deadline: Optional[date] = None
    start_date: Optional[date] = None
    hiring_manager_id: str
    recruiter_id: Optional[str] = None
    is_remote: bool = False
    is_urgent: bool = False
    notes: Optional[str] = None


class JobPostingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=100)
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    salary_range_min: Optional[float] = Field(None, ge=0)
    salary_range_max: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = None
    description: Optional[str] = Field(None, min_length=50, max_length=2000)
    requirements: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    skills_required: Optional[List[str]] = None
    qualifications: Optional[List[str]] = None
    application_deadline: Optional[date] = None
    start_date: Optional[date] = None
    hiring_manager_id: Optional[str] = None
    recruiter_id: Optional[str] = None
    is_remote: Optional[bool] = None
    is_urgent: Optional[bool] = None
    status: Optional[JobStatus] = None
    notes: Optional[str] = None


class JobPosting(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    job_id: str  # Unique job identifier
    title: str
    department: str
    location: str
    employment_type: str
    experience_level: str
    salary_range_min: Optional[float] = None
    salary_range_max: Optional[float] = None
    currency: str
    description: str
    requirements: List[str] = []
    responsibilities: List[str] = []
    benefits: List[str] = []
    skills_required: List[str] = []
    qualifications: List[str] = []
    application_deadline: Optional[date] = None
    start_date: Optional[date] = None
    hiring_manager_id: str
    hiring_manager_name: str
    recruiter_id: Optional[str] = None
    recruiter_name: Optional[str] = None
    is_remote: bool
    is_urgent: bool
    status: JobStatus
    total_applications: int = 0
    notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    
    # Metadata
    created_by: str
    updated_by: str

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class ApplicationCreate(BaseModel):
    job_posting_id: str
    applicant_first_name: str = Field(..., min_length=1, max_length=50)
    applicant_last_name: str = Field(..., min_length=1, max_length=50)
    applicant_email: EmailStr
    applicant_phone: str
    resume_url: str
    cover_letter: Optional[str] = None
    expected_salary: Optional[float] = Field(None, ge=0)
    availability_date: Optional[date] = None
    referral_source: Optional[str] = None
    additional_documents: List[str] = []
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    cover_letter: Optional[str] = None
    expected_salary: Optional[float] = Field(None, ge=0)
    availability_date: Optional[date] = None
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None


class Application(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    application_id: str  # Unique application identifier
    job_posting_id: str
    job_title: str
    applicant_first_name: str
    applicant_last_name: str
    applicant_full_name: str
    applicant_email: EmailStr
    applicant_phone: str
    resume_url: str
    cover_letter: Optional[str] = None
    expected_salary: Optional[float] = None
    availability_date: Optional[date] = None
    referral_source: Optional[str] = None
    additional_documents: List[str] = []
    status: ApplicationStatus
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None
    
    # Timestamps
    applied_at: datetime
    updated_at: datetime
    status_updated_at: Optional[datetime] = None
    
    # Metadata
    created_by: str
    updated_by: str

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class InterviewCreate(BaseModel):
    application_id: str
    interviewer_id: str
    interview_type: str  # "phone", "video", "in_person", "panel"
    scheduled_date: datetime
    duration_minutes: int = Field(..., ge=30, le=480)
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None
    requirements: Optional[str] = None


class InterviewUpdate(BaseModel):
    interviewer_id: Optional[str] = None
    interview_type: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=30, le=480)
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    status: Optional[InterviewStatus] = None
    notes: Optional[str] = None
    requirements: Optional[str] = None
    feedback: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)


class Interview(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    application_id: str
    applicant_name: str
    job_title: str
    interviewer_id: str
    interviewer_name: str
    interview_type: str
    scheduled_date: datetime
    duration_minutes: int
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    status: InterviewStatus
    notes: Optional[str] = None
    requirements: Optional[str] = None
    feedback: Optional[str] = None
    rating: Optional[int] = None
    completed_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    # Metadata
    created_by: str
    updated_by: str

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class RecruitmentAnalytics(BaseModel):
    total_job_postings: int
    active_job_postings: int
    total_applications: int
    applications_per_job: float
    average_time_to_hire: float  # in days
    offer_acceptance_rate: float
    source_effectiveness: Dict[str, int]
    department_breakdown: Dict[str, int]
    status_distribution: Dict[str, int]
