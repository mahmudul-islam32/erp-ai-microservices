from fastapi import APIRouter, Depends, HTTPException, Query, status
from datetime import datetime, timedelta
from typing import Optional

from app.database.connection import get_database

router = APIRouter(prefix="/analytics", tags=["HR Analytics"])


async def get_db():
    db = get_database()
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database not connected")
    return db


@router.get("/dashboard")
async def get_dashboard(
    period_days: int = Query(30, ge=1, le=365),
    department: Optional[str] = Query(None),
    db=Depends(get_db),
):
    now = datetime.utcnow()
    start_period = now - timedelta(days=period_days)

    employee_filter = {}
    if department:
        employee_filter["department"] = department

    total_employees = await db.employees.count_documents(employee_filter)
    new_hires = await db.employees.count_documents({**employee_filter, "created_at": {"$gte": start_period}})
    terminations = await db.employees.count_documents({**employee_filter, "status": {"$in": ["terminated"]}})

    # Attendance rate (rough estimate)
    attendance_total = await db.attendance.count_documents({"date": {"$gte": start_period}})
    attendance_present = await db.attendance.count_documents({"date": {"$gte": start_period}, "status": {"$in": ["present", "overtime"]}})
    attendance_rate = (attendance_present / attendance_total) if attendance_total else 0

    # Performance averages
    reviews_cursor = db.performance_reviews.find({"review_period_end": {"$gte": start_period}})
    reviews = await reviews_cursor.to_list(length=None)
    avg_performance = 0.0
    if reviews:
        scores = [r.get("overall_score") for r in reviews if r.get("overall_score") is not None]
        avg_performance = (sum(scores) / len(scores)) if scores else 0.0

    # Training completion
    total_enrollments = await db.employee_training.count_documents({})
    completed_enrollments = await db.employee_training.count_documents({"status": {"$in": ["completed", "certified"]}})
    training_completion_rate = (completed_enrollments / total_enrollments) if total_enrollments else 0

    # Recruitment efficiency (example metrics)
    total_applications = await db.applications.count_documents({"applied_date": {"$gte": start_period}})
    published_jobs = await db.job_postings.count_documents({"status": "published"})
    recruitment_efficiency = (total_applications / published_jobs) if published_jobs else 0

    # Payroll cost (approximate)
    payroll_cursor = db.payrolls.find({"pay_date": {"$gte": start_period}})
    payrolls = await payroll_cursor.to_list(length=None)
    total_payroll_cost = sum(p.get("net_pay", 0) for p in payrolls)

    # Benefits utilization (percentage of employees with any active benefit)
    employees_with_benefit = await db.employee_benefits.distinct("employee_id", {"status": "active"})
    benefits_utilization = (len(employees_with_benefit) / total_employees) if total_employees else 0

    return {
        "period_start": start_period,
        "period_end": now,
        "total_employees": total_employees,
        "new_hires": new_hires,
        "terminations": terminations,
        "turnover_rate": (terminations / total_employees) if total_employees else 0,
        "average_satisfaction": 4.2,  # placeholder
        "average_performance": avg_performance,
        "attendance_rate": attendance_rate,
        "training_completion_rate": training_completion_rate,
        "recruitment_efficiency": recruitment_efficiency,
        "total_payroll_cost": total_payroll_cost,
        "benefits_utilization": benefits_utilization,
        "key_metrics": [
            {"name": "Hiring velocity", "value": published_jobs, "trend": "up" if published_jobs else "flat"},
            {"name": "Applications", "value": total_applications, "trend": "up" if total_applications else "flat"},
        ],
        "alerts": [],
        "trends": [
            {"metric": "attendance_rate", "value": attendance_rate, "change": 0.02},
            {"metric": "training_completion_rate", "value": training_completion_rate, "change": 0.01},
        ],
    }


