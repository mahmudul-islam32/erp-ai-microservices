from fastapi import APIRouter, Depends, status, Query
from typing import List, Optional

from app.models.performance import PerformanceReviewCreate, PerformanceReviewUpdate, PerformanceReviewResponse, ReviewStatus, PerformanceSummary, PerformanceAnalytics
from app.services.performance_service import PerformanceService

router = APIRouter(prefix="/performance", tags=["Performance Reviews"])

# Dependency to get current user
async def get_current_user(token: str = Depends(lambda: None)):
    return {"user_id": "current_user", "email": "user@example.com"}

@router.post("/reviews", response_model=PerformanceReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_performance_review(
    review_data: PerformanceReviewCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new performance review"""
    service = PerformanceService()
    return await service.create_performance_review(review_data, current_user["user_id"])

@router.get("/reviews/{review_id}", response_model=PerformanceReviewResponse)
async def get_performance_review(review_id: str):
    """Get performance review by ID"""
    service = PerformanceService()
    return await service.get_performance_review(review_id)

@router.get("/reviews", response_model=List[PerformanceReviewResponse])
async def get_performance_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    employee_id: Optional[str] = Query(None),
    reviewer_id: Optional[str] = Query(None),
    status: Optional[ReviewStatus] = Query(None),
    review_type: Optional[str] = Query(None)
):
    """Get list of performance reviews with filters"""
    service = PerformanceService()
    return await service.get_performance_reviews(skip, limit, employee_id, reviewer_id, status, review_type)

@router.put("/reviews/{review_id}", response_model=PerformanceReviewResponse)
async def update_performance_review(
    review_id: str,
    review_data: PerformanceReviewUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update performance review"""
    service = PerformanceService()
    return await service.update_performance_review(review_id, review_data, current_user["user_id"])

@router.post("/reviews/{review_id}/submit", response_model=PerformanceReviewResponse)
async def submit_performance_review(
    review_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Submit performance review for approval"""
    service = PerformanceService()
    return await service.submit_performance_review(review_id, current_user["user_id"])

@router.get("/{employee_id}/summary", response_model=PerformanceSummary)
async def get_performance_summary(employee_id: str):
    """Get performance summary for employee"""
    service = PerformanceService()
    return await service.get_performance_summary(employee_id)

@router.get("/analytics", response_model=PerformanceAnalytics)
async def get_performance_analytics(
    department: Optional[str] = Query(None)
):
    """Get performance analytics"""
    service = PerformanceService()
    return await service.get_performance_analytics(department)
