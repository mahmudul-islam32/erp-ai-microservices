from typing import List, Optional, Dict, Any
from datetime import datetime, date
from bson import ObjectId
from fastapi import HTTPException, status as http_status
import logging

from app.database.connection import get_database
from app.models.recruitment import JobPosting, JobPostingCreate, Application, ApplicationCreate, RecruitmentAnalytics
from app.services.employee_service import EmployeeService

logger = logging.getLogger(__name__)


class RecruitmentService:
    def __init__(self):
        self.db = get_database()
        self.employee_service = EmployeeService()
    
    async def create_job_posting(self, job_data: JobPostingCreate, current_user_id: str) -> JobPosting:
        """Create a new job posting"""
        try:
            # Get hiring manager info
            hiring_manager = await self.db.employees.find_one({"employee_id": job_data.hiring_manager_id})
            if not hiring_manager:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Hiring manager not found"
                )
            
            # Get recruiter info if provided
            recruiter_name = None
            if job_data.recruiter_id:
                recruiter = await self.db.employees.find_one({"employee_id": job_data.recruiter_id})
                if recruiter:
                    recruiter_name = f"{recruiter['first_name']} {recruiter['last_name']}"
            
            # Generate unique job ID
            job_id = f"JOB-{datetime.now().strftime('%Y%m%d')}-{ObjectId().hex[:6].upper()}"
            
            # Create job posting document
            job_doc = {
                "job_id": job_id,
                "title": job_data.title,
                "department": job_data.department,
                "location": job_data.location,
                "employment_type": job_data.employment_type,
                "experience_level": job_data.experience_level,
                "salary_range_min": job_data.salary_range_min,
                "salary_range_max": job_data.salary_range_max,
                "currency": job_data.currency,
                "description": job_data.description,
                "requirements": job_data.requirements,
                "responsibilities": job_data.responsibilities,
                "benefits": job_data.benefits,
                "skills_required": job_data.skills_required,
                "qualifications": job_data.qualifications,
                "application_deadline": job_data.application_deadline,
                "start_date": job_data.start_date,
                "hiring_manager_id": job_data.hiring_manager_id,
                "hiring_manager_name": f"{hiring_manager['first_name']} {hiring_manager['last_name']}",
                "recruiter_id": job_data.recruiter_id,
                "recruiter_name": recruiter_name,
                "is_remote": job_data.is_remote,
                "is_urgent": job_data.is_urgent,
                "status": "draft",
                "total_applications": 0,
                "notes": job_data.notes,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": current_user_id,
                "updated_by": current_user_id
            }
            
            # Insert job posting
            result = await self.db.job_postings.insert_one(job_doc)
            job_doc["_id"] = str(result.inserted_id)
            
            return JobPosting(**job_doc)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating job posting: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create job posting"
            )
    
    async def get_job_posting(self, job_id: str) -> JobPosting:
        """Get job posting by ID"""
        try:
            job = await self.db.job_postings.find_one({"job_id": job_id})
            if not job:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Job posting not found"
                )
            
            job["_id"] = str(job["_id"])
            return JobPosting(**job)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting job posting: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get job posting"
            )
    
    async def get_job_postings(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        department: Optional[str] = None,
        employment_type: Optional[str] = None,
        is_remote: Optional[bool] = None
    ) -> List[JobPosting]:
        """Get list of job postings with filters"""
        try:
            # Build filter
            filter_dict = {}
            if status:
                filter_dict["status"] = status
            if department:
                filter_dict["department"] = department
            if employment_type:
                filter_dict["employment_type"] = employment_type
            if is_remote is not None:
                filter_dict["is_remote"] = is_remote
            
            # Get job postings
            cursor = self.db.job_postings.find(filter_dict).skip(skip).limit(limit).sort("created_at", -1)
            jobs = await cursor.to_list(length=limit)
            
            # Convert to response format
            result = []
            for job in jobs:
                job["id"] = str(job["_id"])
                del job["_id"]  # Remove the _id field
                
                # Convert datetime objects to date objects for date fields
                if "application_deadline" in job and isinstance(job["application_deadline"], datetime):
                    job["application_deadline"] = job["application_deadline"].date()
                if "start_date" in job and isinstance(job["start_date"], datetime):
                    job["start_date"] = job["start_date"].date()
                
                result.append(JobPosting(**job))
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting job postings: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get job postings"
            )
    
    async def create_application(self, application_data: ApplicationCreate, current_user_id: str) -> Application:
        """Create a new job application"""
        try:
            # Check if job posting exists
            job_posting = await self.db.job_postings.find_one({"job_id": application_data.job_posting_id})
            if not job_posting:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Job posting not found"
                )
            
            # Check if job posting is still open
            if job_posting["status"] != "published":
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="Job posting is not open for applications"
                )
            
            # Check application deadline
            if job_posting.get("application_deadline") and job_posting["application_deadline"] < date.today():
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="Application deadline has passed"
                )
            
            # Check if already applied
            existing_application = await self.db.applications.find_one({
                "job_posting_id": application_data.job_posting_id,
                "applicant_email": application_data.applicant_email
            })
            if existing_application:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail="Already applied for this position"
                )
            
            # Generate unique application ID
            application_id = f"APP-{datetime.now().strftime('%Y%m%d')}-{ObjectId().hex[:6].upper()}"
            
            # Create application document
            application_doc = {
                "application_id": application_id,
                "job_posting_id": application_data.job_posting_id,
                "job_title": job_posting["title"],
                "applicant_first_name": application_data.applicant_first_name,
                "applicant_last_name": application_data.applicant_last_name,
                "applicant_full_name": f"{application_data.applicant_first_name} {application_data.applicant_last_name}",
                "applicant_email": application_data.applicant_email,
                "applicant_phone": application_data.applicant_phone,
                "resume_url": application_data.resume_url,
                "cover_letter": application_data.cover_letter,
                "expected_salary": application_data.expected_salary,
                "availability_date": application_data.availability_date,
                "referral_source": application_data.referral_source,
                "additional_documents": application_data.additional_documents,
                "status": "applied",
                "notes": application_data.notes,
                "applied_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": current_user_id,
                "updated_by": current_user_id
            }
            
            # Insert application
            result = await self.db.applications.insert_one(application_doc)
            application_doc["_id"] = str(result.inserted_id)
            
            # Update job posting application count
            await self.db.job_postings.update_one(
                {"job_id": application_data.job_posting_id},
                {"$inc": {"total_applications": 1}}
            )
            
            return Application(**application_doc)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating application: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create application"
            )
    
    async def get_application(self, application_id: str) -> Application:
        """Get application by ID"""
        try:
            application = await self.db.applications.find_one({"application_id": application_id})
            if not application:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Application not found"
                )
            
            application["_id"] = str(application["_id"])
            return Application(**application)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting application: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get application"
            )
    
    async def get_applications(
        self,
        skip: int = 0,
        limit: int = 100,
        job_posting_id: Optional[str] = None,
        status: Optional[str] = None,
        applicant_email: Optional[str] = None
    ) -> List[Application]:
        """Get list of applications with filters"""
        try:
            # Build filter
            filter_dict = {}
            if job_posting_id:
                filter_dict["job_posting_id"] = job_posting_id
            if status:
                filter_dict["status"] = status
            if applicant_email:
                filter_dict["applicant_email"] = applicant_email
            
            # Get applications
            cursor = self.db.applications.find(filter_dict).skip(skip).limit(limit).sort("applied_at", -1)
            applications = await cursor.to_list(length=limit)
            
            # Convert to response format
            result = []
            for application in applications:
                # Normalize id for JSON encoding
                app_doc: Dict[str, Any] = {}
                app_doc["id"] = str(application.get("_id"))
                
                # Map possible legacy seed fields to model fields
                app_doc["application_id"] = application.get("application_id") or application.get("applicationId") or f"APP-{str(application.get('_id'))[-6:].upper()}"
                app_doc["job_posting_id"] = application.get("job_posting_id") or application.get("jobPostingId") or application.get("job_id") or ""
                app_doc["job_title"] = application.get("job_title") or application.get("jobTitle") or application.get("title") or ""
                
                # Applicant fields
                app_doc["applicant_first_name"] = application.get("applicant_first_name") or application.get("first_name") or application.get("firstname") or ""
                app_doc["applicant_last_name"] = application.get("applicant_last_name") or application.get("last_name") or application.get("lastname") or ""
                full_name = application.get("applicant_full_name") or application.get("full_name")
                if not full_name:
                    full_name = f"{app_doc['applicant_first_name']} {app_doc['applicant_last_name']}".strip()
                app_doc["applicant_full_name"] = full_name
                app_doc["applicant_email"] = application.get("applicant_email") or application.get("email") or ""
                app_doc["applicant_phone"] = application.get("applicant_phone") or application.get("phone") or ""
                
                app_doc["resume_url"] = application.get("resume_url") or application.get("resume") or ""
                app_doc["cover_letter"] = application.get("cover_letter")
                app_doc["expected_salary"] = application.get("expected_salary")
                app_doc["availability_date"] = application.get("availability_date")
                app_doc["referral_source"] = application.get("referral_source")
                app_doc["additional_documents"] = application.get("additional_documents") or []
                
                status_val = application.get("status") or "applied"
                # coerce enum-like to string value
                try:
                    status_val = status_val.value  # type: ignore[attr-defined]
                except Exception:
                    pass
                app_doc["status"] = status_val
                app_doc["rejection_reason"] = application.get("rejection_reason")
                app_doc["notes"] = application.get("notes")
                
                # Timestamps
                app_doc["applied_at"] = application.get("applied_at") or application.get("applied_date") or application.get("appliedAt") or application.get("appliedDate") or datetime.utcnow()
                app_doc["updated_at"] = application.get("updated_at") or application.get("updatedAt") or application.get("applied_at") or datetime.utcnow()
                app_doc["status_updated_at"] = application.get("status_updated_at") or application.get("statusUpdatedAt")
                
                # Metadata
                app_doc["created_by"] = application.get("created_by") or "system"
                app_doc["updated_by"] = application.get("updated_by") or "system"
                
                result.append(Application(**app_doc))
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting applications: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get applications"
            )
    
    async def update_application_status(self, application_id: str, status: str, current_user_id: str, notes: Optional[str] = None) -> Application:
        """Update application status"""
        try:
            # Check if application exists
            application = await self.db.applications.find_one({"application_id": application_id})
            if not application:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Application not found"
                )
            
            # Update application
            await self.db.applications.update_one(
                {"application_id": application_id},
                {
                    "$set": {
                        "status": status,
                        "notes": notes or application.get("notes"),
                        "status_updated_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow(),
                        "updated_by": current_user_id
                    }
                }
            )
            
            # Get updated application
            updated_application = await self.db.applications.find_one({"application_id": application_id})
            updated_application["_id"] = str(updated_application["_id"])
            
            return Application(**updated_application)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating application status: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update application status"
            )
    
    async def get_recruitment_analytics(self, department: Optional[str] = None) -> RecruitmentAnalytics:
        """Get recruitment analytics"""
        try:
            # Get total job postings
            total_job_postings = await self.db.job_postings.count_documents({})
            active_job_postings = await self.db.job_postings.count_documents({"status": "published"})
            
            # Get total applications
            total_applications = await self.db.applications.count_documents({})
            applications_per_job = total_applications / total_job_postings if total_job_postings > 0 else 0
            
            # Calculate average time to hire (simplified)
            # In a real implementation, this would be calculated from application to hire date
            average_time_to_hire = 30.0  # days
            
            # Calculate offer acceptance rate (simplified)
            offer_acceptance_rate = 0.75  # 75%
            
            # Source effectiveness (simplified)
            source_effectiveness = {
                "LinkedIn": 40,
                "Company Website": 25,
                "Referral": 20,
                "Job Board": 15
            }
            
            # Department breakdown
            department_pipeline = [
                {"$group": {"_id": "$department", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            department_results = await self.db.job_postings.aggregate(department_pipeline).to_list(length=None)
            department_breakdown = {item["_id"]: item["count"] for item in department_results}
            
            # Status distribution
            status_pipeline = [
                {"$group": {"_id": "$status", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            status_results = await self.db.applications.aggregate(status_pipeline).to_list(length=None)
            status_distribution = {item["_id"]: item["count"] for item in status_results}
            
            
            return RecruitmentAnalytics(
                total_job_postings=total_job_postings,
                active_job_postings=active_job_postings,
                total_applications=total_applications,
                applications_per_job=applications_per_job,
                average_time_to_hire=average_time_to_hire,
                offer_acceptance_rate=offer_acceptance_rate,
                source_effectiveness=source_effectiveness,
                department_breakdown=department_breakdown,
                status_distribution=status_distribution
            )
            
        except Exception as e:
            logger.error(f"Error getting recruitment analytics: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get recruitment analytics"
            )
