from typing import List, Optional, Dict, Any
from datetime import datetime, date
from bson import ObjectId
from fastapi import HTTPException, status
import logging

from app.database.connection import get_database
from app.models.performance import PerformanceReview, PerformanceReviewCreate, PerformanceReviewUpdate, PerformanceReviewResponse, ReviewStatus, RatingScale, PerformanceSummary, PerformanceAnalytics
from app.services.employee_service import EmployeeService

logger = logging.getLogger(__name__)


class PerformanceService:
    def __init__(self):
        self.db = get_database()
        self.employee_service = EmployeeService()
    
    async def create_performance_review(self, review_data: PerformanceReviewCreate, current_user_id: str) -> PerformanceReviewResponse:
        """Create a new performance review"""
        try:
            # Get employee information
            employee = await self.db.employees.find_one({"employee_id": review_data.employee_id})
            if not employee:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Employee not found"
                )
            
            # Get reviewer information
            reviewer = await self.db.employees.find_one({"employee_id": review_data.reviewer_id})
            if not reviewer:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Reviewer not found"
                )
            
            # Check for existing review in the same period
            existing_review = await self.db.performance_reviews.find_one({
                "employee_id": review_data.employee_id,
                "review_period_start": review_data.review_period_start,
                "review_period_end": review_data.review_period_end,
                "review_type": review_data.review_type
            })
            
            if existing_review:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Performance review already exists for this period"
                )
            
            # Calculate overall score
            overall_score = self._calculate_overall_score(review_data.categories, review_data.overall_rating)
            
            # Create performance review document
            review_doc = {
                "employee_id": review_data.employee_id,
                "employee_name": f"{employee['first_name']} {employee['last_name']}",
                "reviewer_id": review_data.reviewer_id,
                "reviewer_name": f"{reviewer['first_name']} {reviewer['last_name']}",
                "review_period_start": review_data.review_period_start,
                "review_period_end": review_data.review_period_end,
                "review_type": review_data.review_type,
                "categories": [category.dict() for category in review_data.categories],
                "goals": [goal.dict() for goal in review_data.goals],
                "employee_comments": review_data.employee_comments,
                "manager_comments": review_data.manager_comments,
                "hr_comments": review_data.hr_comments,
                "overall_rating": review_data.overall_rating,
                "overall_score": overall_score,
                "development_plan": review_data.development_plan,
                "next_review_date": review_data.next_review_date,
                "status": ReviewStatus.DRAFT,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": current_user_id,
                "updated_by": current_user_id
            }
            
            # Insert performance review
            result = await self.db.performance_reviews.insert_one(review_doc)
            review_doc["id"] = str(result.inserted_id)
            del review_doc["_id"]  # Remove the _id field
            
            return PerformanceReviewResponse(**review_doc)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating performance review: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create performance review"
            )
    
    def _calculate_overall_score(self, categories: List, overall_rating: Optional[RatingScale]) -> Optional[float]:
        """Calculate overall score from categories and rating"""
        if not categories:
            return None
        
        # Calculate weighted average from categories
        total_weight = sum(category.weight for category in categories)
        if total_weight == 0:
            return None
        
        weighted_sum = 0
        for category in categories:
            if category.rating:
                rating_value = self._get_rating_value(category.rating)
                weighted_sum += rating_value * category.weight
        
        category_score = weighted_sum / total_weight if total_weight > 0 else 0
        
        # If overall rating is provided, use it; otherwise use category average
        if overall_rating:
            return self._get_rating_value(overall_rating)
        else:
            return category_score
    
    def _get_rating_value(self, rating: RatingScale) -> float:
        """Convert rating scale to numeric value"""
        rating_values = {
            RatingScale.EXCELLENT: 5.0,
            RatingScale.ABOVE_EXPECTATIONS: 4.0,
            RatingScale.MEETS_EXPECTATIONS: 3.0,
            RatingScale.BELOW_EXPECTATIONS: 2.0,
            RatingScale.UNSATISFACTORY: 1.0
        }
        return rating_values.get(rating, 0.0)
    
    async def get_performance_review(self, review_id: str) -> PerformanceReviewResponse:
        """Get performance review by ID"""
        try:
            review = await self.db.performance_reviews.find_one({"_id": ObjectId(review_id)})
            if not review:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Performance review not found"
                )
            
            review["id"] = str(review["_id"])
            del review["_id"]  # Remove the _id field
            
            # Convert datetime objects to date objects for date fields
            if "review_period_start" in review and isinstance(review["review_period_start"], datetime):
                review["review_period_start"] = review["review_period_start"].date()
            if "review_period_end" in review and isinstance(review["review_period_end"], datetime):
                review["review_period_end"] = review["review_period_end"].date()
            if "next_review_date" in review and isinstance(review["next_review_date"], datetime):
                review["next_review_date"] = review["next_review_date"].date()
            
            # Convert goal target dates
            if "goals" in review:
                for goal in review["goals"]:
                    if "target_date" in goal and isinstance(goal["target_date"], datetime):
                        goal["target_date"] = goal["target_date"].date()
            
            return PerformanceReviewResponse(**review)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting performance review: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get performance review"
            )
    
    async def get_performance_reviews(
        self,
        skip: int = 0,
        limit: int = 100,
        employee_id: Optional[str] = None,
        reviewer_id: Optional[str] = None,
        review_status: Optional[ReviewStatus] = None,
        review_type: Optional[str] = None
    ) -> List[PerformanceReviewResponse]:
        """Get list of performance reviews with filters"""
        try:
            # Build filter
            filter_dict = {}
            if employee_id:
                filter_dict["employee_id"] = employee_id
            if reviewer_id:
                filter_dict["reviewer_id"] = reviewer_id
            if review_status:
                filter_dict["status"] = review_status
            if review_type:
                filter_dict["review_type"] = review_type
            
            # Get performance reviews
            cursor = self.db.performance_reviews.find(filter_dict).skip(skip).limit(limit).sort("created_at", -1)
            reviews = await cursor.to_list(length=limit)
            
            # Convert to response format
            result = []
            for review in reviews:
                review["id"] = str(review["_id"])
                del review["_id"]  # Remove the _id field
                
                # Convert datetime objects to date objects for date fields
                if "review_period_start" in review and isinstance(review["review_period_start"], datetime):
                    review["review_period_start"] = review["review_period_start"].date()
                if "review_period_end" in review and isinstance(review["review_period_end"], datetime):
                    review["review_period_end"] = review["review_period_end"].date()
                if "next_review_date" in review and isinstance(review["next_review_date"], datetime):
                    review["next_review_date"] = review["next_review_date"].date()
                
                # Convert goal target dates
                if "goals" in review:
                    for goal in review["goals"]:
                        if "target_date" in goal and isinstance(goal["target_date"], datetime):
                            goal["target_date"] = goal["target_date"].date()
                
                result.append(PerformanceReviewResponse(**review))
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting performance reviews: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get performance reviews"
            )
    
    async def update_performance_review(self, review_id: str, review_data: PerformanceReviewUpdate, current_user_id: str) -> PerformanceReviewResponse:
        """Update performance review"""
        try:
            # Check if review exists
            existing_review = await self.db.performance_reviews.find_one({"_id": ObjectId(review_id)})
            if not existing_review:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Performance review not found"
                )
            
            # Prepare update data
            update_data = review_data.dict(exclude_unset=True)
            
            # Recalculate overall score if categories or rating are updated
            if "categories" in update_data or "overall_rating" in update_data:
                categories = update_data.get("categories", existing_review["categories"])
                overall_rating = update_data.get("overall_rating", existing_review.get("overall_rating"))
                update_data["overall_score"] = self._calculate_overall_score(categories, overall_rating)
            
            # Add update metadata
            update_data["updated_at"] = datetime.utcnow()
            update_data["updated_by"] = current_user_id
            
            # Update performance review
            await self.db.performance_reviews.update_one(
                {"_id": ObjectId(review_id)},
                {"$set": update_data}
            )
            
            # Get updated review
            updated_review = await self.db.performance_reviews.find_one({"_id": ObjectId(review_id)})
            updated_review["id"] = str(updated_review["_id"])
            del updated_review["_id"]  # Remove the _id field
            
            return PerformanceReviewResponse(**updated_review)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating performance review: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update performance review"
            )
    
    async def submit_performance_review(self, review_id: str, current_user_id: str) -> PerformanceReviewResponse:
        """Submit performance review for approval"""
        try:
            # Check if review exists
            review = await self.db.performance_reviews.find_one({"_id": ObjectId(review_id)})
            if not review:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Performance review not found"
                )
            
            # Check if review can be submitted
            if review["status"] not in [ReviewStatus.DRAFT, ReviewStatus.IN_PROGRESS]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Review cannot be submitted in current status"
                )
            
            # Update status
            await self.db.performance_reviews.update_one(
                {"_id": ObjectId(review_id)},
                {
                    "$set": {
                        "status": ReviewStatus.PENDING_MANAGER,
                        "submitted_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow(),
                        "updated_by": current_user_id
                    }
                }
            )
            
            # Get updated review
            updated_review = await self.db.performance_reviews.find_one({"_id": ObjectId(review_id)})
            updated_review["id"] = str(updated_review["_id"])
            del updated_review["_id"]  # Remove the _id field
            
            return PerformanceReviewResponse(**updated_review)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error submitting performance review: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to submit performance review"
            )
    
    async def get_performance_summary(self, employee_id: str) -> PerformanceSummary:
        """Get performance summary for employee"""
        try:
            # Get employee info
            employee = await self.db.employees.find_one({"employee_id": employee_id})
            if not employee:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Employee not found"
                )
            
            # Get all reviews for employee
            cursor = self.db.performance_reviews.find({"employee_id": employee_id})
            reviews = await cursor.to_list(length=None)
            
            if not reviews:
                return PerformanceSummary(
                    employee_id=employee_id,
                    employee_name=f"{employee['first_name']} {employee['last_name']}",
                    current_rating=None,
                    average_rating=0.0,
                    total_reviews=0,
                    last_review_date=None,
                    next_review_date=None,
                    goals_completed=0,
                    goals_in_progress=0,
                    goals_overdue=0,
                    improvement_areas=[],
                    strengths=[]
                )
            
            # Calculate statistics
            completed_reviews = [r for r in reviews if r["status"] == ReviewStatus.COMPLETED]
            current_rating = completed_reviews[-1].get("overall_rating") if completed_reviews else None
            average_rating = sum(r.get("overall_score", 0) for r in completed_reviews) / len(completed_reviews) if completed_reviews else 0.0
            total_reviews = len(completed_reviews)
            last_review_date = max(r["created_at"] for r in completed_reviews) if completed_reviews else None
            next_review_date = completed_reviews[-1].get("next_review_date") if completed_reviews else None
            
            # Count goals (this would need a separate goals collection in a real implementation)
            goals_completed = 0
            goals_in_progress = 0
            goals_overdue = 0
            
            # Analyze improvement areas and strengths
            improvement_areas = []
            strengths = []
            
            return PerformanceSummary(
                employee_id=employee_id,
                employee_name=f"{employee['first_name']} {employee['last_name']}",
                current_rating=current_rating,
                average_rating=average_rating,
                total_reviews=total_reviews,
                last_review_date=last_review_date,
                next_review_date=next_review_date,
                goals_completed=goals_completed,
                goals_in_progress=goals_in_progress,
                goals_overdue=goals_overdue,
                improvement_areas=improvement_areas,
                strengths=strengths
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting performance summary: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get performance summary"
            )
    
    async def get_performance_analytics(self, department: Optional[str] = None) -> PerformanceAnalytics:
        """Get performance analytics"""
        try:
            # Build filter
            filter_dict = {"status": ReviewStatus.COMPLETED}
            if department:
                filter_dict["department"] = department
            
            # Get completed reviews
            cursor = self.db.performance_reviews.find(filter_dict)
            reviews = await cursor.to_list(length=None)
            
            if not reviews:
                return PerformanceAnalytics(
                    department=department or "All",
                    average_rating=0.0,
                    total_employees=0,
                    rating_distribution={},
                    top_performers=[],
                    improvement_needed=[],
                    review_completion_rate=0.0,
                    completed_reviews=0,
                    pending_reviews=0,
                    high_performers=0
                )
            
            # Calculate analytics
            total_employees = len(set(r["employee_id"] for r in reviews))
            average_rating = sum(r.get("overall_score", 0) for r in reviews) / len(reviews)
            
            # Rating distribution
            rating_distribution = {}
            for review in reviews:
                rating = review.get("overall_rating", "unknown")
                rating_distribution[rating] = rating_distribution.get(rating, 0) + 1
            
            # Top performers (employees with highest ratings)
            employee_ratings = {}
            for review in reviews:
                emp_id = review["employee_id"]
                if emp_id not in employee_ratings:
                    employee_ratings[emp_id] = []
                employee_ratings[emp_id].append(review.get("overall_score", 0))
            
            # Calculate average rating per employee
            employee_averages = {
                emp_id: sum(ratings) / len(ratings) 
                for emp_id, ratings in employee_ratings.items()
            }
            
            # Sort by average rating
            sorted_employees = sorted(employee_averages.items(), key=lambda x: x[1], reverse=True)
            top_performers = [emp_id for emp_id, _ in sorted_employees[:5]]
            
            # Employees needing improvement (rating below 3.0)
            improvement_needed = [
                emp_id for emp_id, avg_rating in employee_averages.items() 
                if avg_rating < 3.0
            ]
            
            # Count completed and pending reviews
            completed_reviews = len([r for r in reviews if r.get("status") == ReviewStatus.COMPLETED])
            pending_reviews = len(reviews) - completed_reviews
            high_performers = len([emp_id for emp_id, avg_rating in employee_averages.items() if avg_rating >= 4.0])
            
            return PerformanceAnalytics(
                department=department or "All",
                average_rating=average_rating,
                total_employees=total_employees,
                rating_distribution=rating_distribution,
                top_performers=top_performers,
                improvement_needed=improvement_needed,
                review_completion_rate=1.0,  # All reviews are completed
                completed_reviews=completed_reviews,
                pending_reviews=pending_reviews,
                high_performers=high_performers
            )
            
        except Exception as e:
            logger.error(f"Error getting performance analytics: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get performance analytics"
            )
