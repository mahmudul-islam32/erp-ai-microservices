from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, date
from enum import Enum


class ReviewStatus(str, Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    PENDING_EMPLOYEE = "pending_employee"
    PENDING_MANAGER = "pending_manager"
    PENDING_HR = "pending_hr"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RatingScale(str, Enum):
    EXCELLENT = "excellent"  # 5
    ABOVE_EXPECTATIONS = "above_expectations"  # 4
    MEETS_EXPECTATIONS = "meets_expectations"  # 3
    BELOW_EXPECTATIONS = "below_expectations"  # 2
    UNSATISFACTORY = "unsatisfactory"  # 1


class ReviewCategory(BaseModel):
    name: str
    description: str
    weight: float = Field(..., ge=0, le=1)  # Weight of this category in overall score
    rating: Optional[RatingScale] = None
    comments: Optional[str] = None


class Goal(BaseModel):
    title: str
    description: str
    target_date: date
    status: str  # "not_started", "in_progress", "completed", "cancelled"
    progress_percentage: int = Field(..., ge=0, le=100)
    comments: Optional[str] = None


class PerformanceReviewCreate(BaseModel):
    employee_id: str
    reviewer_id: str
    review_period_start: date
    review_period_end: date
    review_type: str = "annual"  # "annual", "quarterly", "probation", "project"
    categories: List[ReviewCategory]
    goals: List[Goal] = []
    employee_comments: Optional[str] = None
    manager_comments: Optional[str] = None
    hr_comments: Optional[str] = None
    overall_rating: Optional[RatingScale] = None
    development_plan: Optional[str] = None
    next_review_date: Optional[date] = None


class PerformanceReviewUpdate(BaseModel):
    categories: Optional[List[ReviewCategory]] = None
    goals: Optional[List[Goal]] = None
    employee_comments: Optional[str] = None
    manager_comments: Optional[str] = None
    hr_comments: Optional[str] = None
    overall_rating: Optional[RatingScale] = None
    development_plan: Optional[str] = None
    next_review_date: Optional[date] = None
    status: Optional[ReviewStatus] = None


class PerformanceReview(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    employee_id: str
    employee_name: str
    reviewer_id: str
    reviewer_name: str
    review_period_start: date
    review_period_end: date
    review_type: str
    categories: List[ReviewCategory]
    goals: List[Goal] = []
    employee_comments: Optional[str] = None
    manager_comments: Optional[str] = None
    hr_comments: Optional[str] = None
    overall_rating: Optional[RatingScale] = None
    overall_score: Optional[float] = None
    development_plan: Optional[str] = None
    next_review_date: Optional[date] = None
    status: ReviewStatus
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Workflow
    created_by: str
    updated_by: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class PerformanceReviewResponse(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    reviewer_id: str
    reviewer_name: str
    review_period_start: date
    review_period_end: date
    review_type: str
    categories: List[ReviewCategory]
    goals: List[Goal] = []
    employee_comments: Optional[str] = None
    manager_comments: Optional[str] = None
    hr_comments: Optional[str] = None
    overall_rating: Optional[RatingScale] = None
    overall_score: Optional[float] = None
    development_plan: Optional[str] = None
    next_review_date: Optional[date] = None
    status: ReviewStatus
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class PerformanceGoal(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    employee_id: str
    employee_name: str
    title: str
    description: str
    category: str
    target_date: date
    status: str
    progress_percentage: int = Field(..., ge=0, le=100)
    priority: str  # "high", "medium", "low"
    comments: Optional[str] = None
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


class PerformanceSummary(BaseModel):
    employee_id: str
    employee_name: str
    current_rating: Optional[RatingScale]
    average_rating: float
    total_reviews: int
    last_review_date: Optional[date]
    next_review_date: Optional[date]
    goals_completed: int
    goals_in_progress: int
    goals_overdue: int
    improvement_areas: List[str]
    strengths: List[str]


class PerformanceAnalytics(BaseModel):
    department: str
    average_rating: float
    total_employees: int
    rating_distribution: Dict[str, int]
    top_performers: List[str]
    improvement_needed: List[str]
    review_completion_rate: float
    completed_reviews: Optional[int] = 0
    pending_reviews: Optional[int] = 0
    high_performers: Optional[int] = 0
