from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


class MetricType(str, Enum):
    EMPLOYEE_TURNOVER = "employee_turnover"
    EMPLOYEE_SATISFACTION = "employee_satisfaction"
    PERFORMANCE_RATING = "performance_rating"
    ATTENDANCE_RATE = "attendance_rate"
    LEAVE_UTILIZATION = "leave_utilization"
    TRAINING_COMPLETION = "training_completion"
    RECRUITMENT_EFFICIENCY = "recruitment_efficiency"
    BENEFITS_UTILIZATION = "benefits_utilization"
    PAYROLL_COST = "payroll_cost"
    DEPARTMENT_METRICS = "department_metrics"


class TimePeriod(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class HRAnalyticsCreate(BaseModel):
    metric_type: MetricType
    period_start: date
    period_end: date
    time_period: TimePeriod
    department: Optional[str] = None
    value: float
    target_value: Optional[float] = None
    metadata: Dict[str, Any] = {}
    notes: Optional[str] = None


class HRAnalyticsUpdate(BaseModel):
    value: Optional[float] = None
    target_value: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class HRAnalytics(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    metric_type: MetricType
    period_start: date
    period_end: date
    time_period: TimePeriod
    department: Optional[str] = None
    value: float
    target_value: Optional[float] = None
    variance: Optional[float] = None  # Difference from target
    percentage_change: Optional[float] = None  # Change from previous period
    metadata: Dict[str, Any] = {}
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


class EmployeeTurnoverMetrics(BaseModel):
    period_start: date
    period_end: date
    total_employees_start: int
    total_employees_end: int
    new_hires: int
    terminations: int
    turnover_rate: float
    voluntary_turnover: int
    involuntary_turnover: int
    department_breakdown: Dict[str, Dict[str, Any]]
    reasons_for_leaving: Dict[str, int]


class EmployeeSatisfactionMetrics(BaseModel):
    period_start: date
    period_end: date
    total_surveys: int
    response_rate: float
    average_satisfaction_score: float
    satisfaction_distribution: Dict[str, int]
    department_scores: Dict[str, float]
    improvement_areas: List[str]
    strengths: List[str]


class PerformanceMetrics(BaseModel):
    period_start: date
    period_end: date
    total_reviews: int
    average_rating: float
    rating_distribution: Dict[str, int]
    top_performers: List[str]
    improvement_needed: List[str]
    department_averages: Dict[str, float]
    goal_completion_rate: float


class AttendanceMetrics(BaseModel):
    period_start: date
    period_end: date
    average_attendance_rate: float
    total_working_days: int
    total_present_days: int
    total_absent_days: int
    late_arrivals: int
    early_departures: int
    overtime_hours: float
    department_breakdown: Dict[str, Dict[str, Any]]


class LeaveMetrics(BaseModel):
    period_start: date
    period_end: date
    total_leave_days: int
    leave_utilization_rate: float
    leave_types_breakdown: Dict[str, int]
    average_leave_duration: float
    leave_approval_rate: float
    department_breakdown: Dict[str, Dict[str, Any]]


class TrainingMetrics(BaseModel):
    period_start: date
    period_end: date
    total_trainings: int
    total_enrollments: int
    completion_rate: float
    average_score: float
    certification_rate: float
    mandatory_completion_rate: float
    popular_categories: List[Dict[str, Any]]
    department_breakdown: Dict[str, Dict[str, Any]]


class RecruitmentMetrics(BaseModel):
    period_start: date
    period_end: date
    total_job_postings: int
    total_applications: int
    applications_per_job: float
    average_time_to_hire: float
    offer_acceptance_rate: float
    source_effectiveness: Dict[str, int]
    department_breakdown: Dict[str, Dict[str, Any]]
    cost_per_hire: float


class BenefitsMetrics(BaseModel):
    period_start: date
    period_end: date
    total_benefits_cost: float
    average_cost_per_employee: float
    enrollment_rate: float
    utilization_rate: float
    popular_benefits: List[Dict[str, Any]]
    department_breakdown: Dict[str, Dict[str, Any]]
    cost_trends: List[Dict[str, Any]]


class PayrollMetrics(BaseModel):
    period_start: date
    period_end: date
    total_payroll_cost: float
    average_salary: float
    salary_distribution: Dict[str, int]
    overtime_cost: float
    benefits_cost: float
    tax_contributions: float
    department_breakdown: Dict[str, Dict[str, Any]]
    cost_per_employee: float


class DepartmentMetrics(BaseModel):
    department: str
    period_start: date
    period_end: date
    total_employees: int
    new_hires: int
    terminations: int
    turnover_rate: float
    average_salary: float
    average_rating: float
    attendance_rate: float
    training_completion_rate: float
    leave_utilization_rate: float


class HRDashboard(BaseModel):
    period_start: date
    period_end: date
    total_employees: int
    new_hires: int
    terminations: int
    turnover_rate: float
    average_satisfaction: float
    average_performance: float
    attendance_rate: float
    training_completion_rate: float
    recruitment_efficiency: float
    total_payroll_cost: float
    benefits_utilization: float
    key_metrics: List[Dict[str, Any]]
    alerts: List[str]
    trends: List[Dict[str, Any]]


class TrendAnalysis(BaseModel):
    metric_type: MetricType
    period_start: date
    period_end: date
    current_value: float
    previous_value: float
    change_percentage: float
    trend_direction: str  # "increasing", "decreasing", "stable"
    forecast_value: Optional[float] = None
    confidence_level: Optional[float] = None
    recommendations: List[str] = []


class BenchmarkComparison(BaseModel):
    metric_type: MetricType
    our_value: float
    industry_average: float
    top_performers_average: float
    percentile_rank: float
    gap_analysis: str
    improvement_potential: float
    recommendations: List[str] = []
