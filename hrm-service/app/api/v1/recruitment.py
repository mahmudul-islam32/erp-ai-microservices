from fastapi import APIRouter, HTTPException, status as http_status, Depends, Query
from typing import List, Optional
from datetime import datetime, date

from app.services.recruitment_service import RecruitmentService
from app.models.recruitment import (
    JobPosting, JobPostingCreate, JobPostingUpdate,
    Application, ApplicationCreate, ApplicationUpdate,
    Interview, InterviewCreate, InterviewUpdate,
    RecruitmentAnalytics
)

router = APIRouter(prefix="/recruitment", tags=["Recruitment"])

# Dependency to get current user
async def get_current_user(token: str = Depends(lambda: None)):
    # In a real implementation, this would extract the token from the Authorization header
    # For now, we'll use a placeholder
    return {"id": "current_user", "email": "user@example.com"}

# Job Postings endpoints
@router.get("/jobs", response_model=List[JobPosting])
async def get_job_postings(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    department: Optional[str] = None,
    status: Optional[str] = None,
    employment_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all job postings with optional filters"""
    try:
        service = RecruitmentService()
        jobs = await service.get_job_postings(
            skip=skip,
            limit=limit,
            department=department,
            status=status,
            employment_type=employment_type
        )
        return jobs
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch job postings: {str(e)}"
        )

@router.get("/jobs/{job_id}", response_model=JobPosting)
async def get_job_posting(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific job posting by ID"""
    try:
        service = RecruitmentService()
        job = await service.get_job_posting(job_id)
        return job
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch job posting: {str(e)}"
        )

@router.post("/jobs", response_model=JobPosting)
async def create_job_posting(
    job_data: JobPostingCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new job posting"""
    try:
        service = RecruitmentService()
        job = await service.create_job_posting(job_data, current_user["id"])
        return job
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create job posting: {str(e)}"
        )

@router.put("/jobs/{job_id}", response_model=JobPosting)
async def update_job_posting(
    job_id: str,
    job_data: JobPostingUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a job posting"""
    try:
        service = RecruitmentService()
        job = await service.update_job_posting(job_id, job_data, current_user["id"])
        return job
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update job posting: {str(e)}"
        )

@router.delete("/jobs/{job_id}")
async def delete_job_posting(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a job posting"""
    try:
        service = RecruitmentService()
        await service.delete_job_posting(job_id, current_user["id"])
        return {"message": "Job posting deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete job posting: {str(e)}"
        )

# Applications endpoints
@router.get("/applications", response_model=List[Application])
async def get_applications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    job_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all applications with optional filters"""
    try:
        service = RecruitmentService()
        # Map query param job_id to service's job_posting_id
        applications = await service.get_applications(
            skip=skip,
            limit=limit,
            job_posting_id=job_id,
            status=status
        )
        return applications
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch applications: {str(e)}"
        )

@router.get("/applications/{application_id}", response_model=Application)
async def get_application(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific application by ID"""
    try:
        service = RecruitmentService()
        application = await service.get_application(application_id)
        return application
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch application: {str(e)}"
        )

@router.post("/applications", response_model=Application)
async def create_application(
    application_data: ApplicationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new application"""
    try:
        service = RecruitmentService()
        application = await service.create_application(application_data, current_user["id"])
        return application
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create application: {str(e)}"
        )

@router.put("/applications/{application_id}", response_model=Application)
async def update_application(
    application_id: str,
    application_data: ApplicationUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an application"""
    try:
        service = RecruitmentService()
        application = await service.update_application(application_id, application_data, current_user["id"])
        return application
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update application: {str(e)}"
        )

@router.post("/applications/{application_id}/shortlist")
async def shortlist_application(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Shortlist an application"""
    try:
        service = RecruitmentService()
        await service.shortlist_application(application_id, current_user["id"])
        return {"message": "Application shortlisted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to shortlist application: {str(e)}"
        )

@router.post("/applications/{application_id}/reject")
async def reject_application(
    application_id: str,
    rejection_reason: str,
    current_user: dict = Depends(get_current_user)
):
    """Reject an application"""
    try:
        service = RecruitmentService()
        await service.reject_application(application_id, rejection_reason, current_user["id"])
        return {"message": "Application rejected successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject application: {str(e)}"
        )

# Interviews endpoints
@router.get("/interviews", response_model=List[Interview])
async def get_interviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    application_id: Optional[str] = None,
    interviewer_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all interviews with optional filters"""
    try:
        service = RecruitmentService()
        interviews = await service.get_interviews(
            skip=skip,
            limit=limit,
            application_id=application_id,
            interviewer_id=interviewer_id,
            status=status
        )
        return interviews
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch interviews: {str(e)}"
        )

@router.get("/interviews/{interview_id}", response_model=Interview)
async def get_interview(
    interview_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific interview by ID"""
    try:
        service = RecruitmentService()
        interview = await service.get_interview(interview_id)
        return interview
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch interview: {str(e)}"
        )

@router.post("/interviews", response_model=Interview)
async def create_interview(
    interview_data: InterviewCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new interview"""
    try:
        service = RecruitmentService()
        interview = await service.create_interview(interview_data, current_user["id"])
        return interview
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create interview: {str(e)}"
        )

@router.put("/interviews/{interview_id}", response_model=Interview)
async def update_interview(
    interview_id: str,
    interview_data: InterviewUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an interview"""
    try:
        service = RecruitmentService()
        interview = await service.update_interview(interview_id, interview_data, current_user["id"])
        return interview
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update interview: {str(e)}"
        )

# Analytics endpoint
@router.get("/analytics", response_model=RecruitmentAnalytics)
async def get_recruitment_analytics(
    department: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get recruitment analytics"""
    try:
        service = RecruitmentService()
        analytics = await service.get_recruitment_analytics(department)
        return analytics
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch recruitment analytics: {str(e)}"
        )
