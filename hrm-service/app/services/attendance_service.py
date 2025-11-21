from typing import List, Optional, Dict, Any
from datetime import datetime, date, time, timedelta
from bson import ObjectId
from fastapi import HTTPException, status
import logging

from app.database.connection import get_database
from app.models.attendance import Attendance, AttendanceCreate, AttendanceUpdate, AttendanceResponse, AttendanceStatus, Timesheet, AttendanceSummary
from app.services.employee_service import EmployeeService

logger = logging.getLogger(__name__)


class AttendanceService:
    def __init__(self):
        self.db = get_database()
        self.employee_service = EmployeeService()
    
    async def get_attendance_records(
        self, 
        skip: int = 0, 
        limit: int = 100,
        employee_id: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None
    ) -> List[AttendanceResponse]:
        """Get attendance records with optional filters"""
        try:
            # Build filter
            filter_dict = {}
            if employee_id:
                filter_dict["employee_id"] = employee_id
            if date_from:
                filter_dict["date"] = {"$gte": date_from}
            if date_to:
                if "date" in filter_dict:
                    filter_dict["date"]["$lte"] = date_to
                else:
                    filter_dict["date"] = {"$lte": date_to}
            
            # Get attendance records
            cursor = self.db.attendance.find(filter_dict).skip(skip).limit(limit).sort("date", -1)
            attendance_records = await cursor.to_list(length=limit)
            
            # Convert to response format
            result = []
            for record in attendance_records:
                record["id"] = str(record["_id"])
                del record["_id"]
                
                # Convert datetime fields to time if they exist
                if "clock_in_time" in record and record["clock_in_time"]:
                    if isinstance(record["clock_in_time"], datetime):
                        record["clock_in_time"] = record["clock_in_time"].time()
                if "clock_out_time" in record and record["clock_out_time"]:
                    if isinstance(record["clock_out_time"], datetime):
                        record["clock_out_time"] = record["clock_out_time"].time()
                if "date" in record and isinstance(record["date"], datetime):
                    record["date"] = record["date"].date()
                
                result.append(AttendanceResponse(**record))
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting attendance records: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get attendance records"
            )
    
    async def clock_in(self, employee_id: str, clock_in_time: Optional[time] = None, location: Optional[str] = None, notes: Optional[str] = None) -> AttendanceResponse:
        """Clock in for the day"""
        try:
            today = date.today()
            current_time = clock_in_time or datetime.now().time()
            
            # Check if already clocked in today
            existing_attendance = await self.db.attendance.find_one({
                "employee_id": employee_id,
                "date": today
            })
            
            if existing_attendance and existing_attendance.get("clock_in_time"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Already clocked in today"
                )
            
            # Get employee info
            employee = await self.db.employees.find_one({"employee_id": employee_id})
            if not employee:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Employee not found"
                )
            
            # Create or update attendance record
            attendance_doc = {
                "employee_id": employee_id,
                "employee_name": f"{employee['first_name']} {employee['last_name']}",
                "date": today,
                "clock_in_time": current_time,
                "status": AttendanceStatus.PRESENT,
                "records": [{
                    "type": "clock_in",
                    "timestamp": datetime.combine(today, current_time),
                    "location": location,
                    "notes": notes
                }],
                "notes": notes,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": employee_id,
                "updated_by": employee_id
            }
            
            if existing_attendance:
                # Update existing record
                await self.db.attendance.update_one(
                    {"employee_id": employee_id, "date": today},
                    {
                        "$set": {
                            "clock_in_time": current_time,
                            "status": AttendanceStatus.PRESENT,
                            "records": attendance_doc["records"],
                            "updated_at": datetime.utcnow(),
                            "updated_by": employee_id
                        }
                    }
                )
            else:
                # Create new record
                await self.db.attendance.insert_one(attendance_doc)
            
            # Get the record
            attendance = await self.db.attendance.find_one({
                "employee_id": employee_id,
                "date": today
            })
            attendance["_id"] = str(attendance["_id"])
            
            return AttendanceResponse(**attendance)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error clocking in: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to clock in"
            )
    
    async def clock_out(self, employee_id: str, clock_out_time: Optional[time] = None, location: Optional[str] = None, notes: Optional[str] = None) -> AttendanceResponse:
        """Clock out for the day"""
        try:
            today = date.today()
            current_time = clock_out_time or datetime.now().time()
            
            # Get today's attendance
            attendance = await self.db.attendance.find_one({
                "employee_id": employee_id,
                "date": today
            })
            
            if not attendance:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Must clock in before clocking out"
                )
            
            if attendance.get("clock_out_time"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Already clocked out today"
                )
            
            # Calculate total hours
            clock_in_time = attendance["clock_in_time"]
            total_hours = self._calculate_hours(clock_in_time, current_time)
            
            # Calculate overtime (assuming 8 hours is standard)
            overtime_hours = max(0, total_hours - 8.0)
            
            # Update attendance record
            await self.db.attendance.update_one(
                {"employee_id": employee_id, "date": today},
                {
                    "$set": {
                        "clock_out_time": current_time,
                        "total_hours": total_hours,
                        "overtime_hours": overtime_hours,
                        "records": attendance["records"] + [{
                            "type": "clock_out",
                            "timestamp": datetime.combine(today, current_time),
                            "location": location,
                            "notes": notes
                        }],
                        "updated_at": datetime.utcnow(),
                        "updated_by": employee_id
                    }
                }
            )
            
            # Get updated record
            updated_attendance = await self.db.attendance.find_one({
                "employee_id": employee_id,
                "date": today
            })
            updated_attendance["_id"] = str(updated_attendance["_id"])
            
            return AttendanceResponse(**updated_attendance)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error clocking out: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to clock out"
            )
    
    def _calculate_hours(self, start_time: time, end_time: time) -> float:
        """Calculate hours between two times"""
        start_datetime = datetime.combine(date.today(), start_time)
        end_datetime = datetime.combine(date.today(), end_time)
        
        # Handle case where end time is next day
        if end_time < start_time:
            end_datetime += timedelta(days=1)
        
        duration = end_datetime - start_datetime
        return duration.total_seconds() / 3600
    
    async def get_attendance(self, employee_id: str, date: date) -> AttendanceResponse:
        """Get attendance for specific date"""
        try:
            attendance = await self.db.attendance.find_one({
                "employee_id": employee_id,
                "date": date
            })
            
            if not attendance:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Attendance record not found"
                )
            
            attendance["_id"] = str(attendance["_id"])
            return AttendanceResponse(**attendance)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting attendance: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get attendance"
            )
    
    async def get_attendance_history(
        self, 
        employee_id: str, 
        start_date: date, 
        end_date: date,
        skip: int = 0,
        limit: int = 100
    ) -> List[AttendanceResponse]:
        """Get attendance history for date range"""
        try:
            cursor = self.db.attendance.find({
                "employee_id": employee_id,
                "date": {"$gte": start_date, "$lte": end_date}
            }).skip(skip).limit(limit).sort("date", -1)
            
            attendances = await cursor.to_list(length=limit)
            
            result = []
            for attendance in attendances:
                attendance["_id"] = str(attendance["_id"])
                result.append(AttendanceResponse(**attendance))
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting attendance history: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get attendance history"
            )
    
    async def get_timesheet(self, employee_id: str, week_start: date) -> Timesheet:
        """Get weekly timesheet"""
        try:
            week_end = week_start + timedelta(days=6)
            
            # Get attendance records for the week
            cursor = self.db.attendance.find({
                "employee_id": employee_id,
                "date": {"$gte": week_start, "$lte": week_end}
            }).sort("date", 1)
            
            attendances = await cursor.to_list(length=7)
            
            # Calculate totals
            total_hours = sum(attendance.get("total_hours", 0) for attendance in attendances)
            overtime_hours = sum(attendance.get("overtime_hours", 0) for attendance in attendances)
            
            # Create timesheet entries
            entries = []
            for attendance in attendances:
                entries.append({
                    "date": attendance["date"],
                    "clock_in": attendance.get("clock_in_time"),
                    "clock_out": attendance.get("clock_out_time"),
                    "total_hours": attendance.get("total_hours", 0),
                    "overtime_hours": attendance.get("overtime_hours", 0),
                    "status": attendance.get("status", AttendanceStatus.ABSENT),
                    "notes": attendance.get("notes")
                })
            
            # Get employee info
            employee = await self.db.employees.find_one({"employee_id": employee_id})
            employee_name = f"{employee['first_name']} {employee['last_name']}" if employee else "Unknown"
            
            return Timesheet(
                employee_id=employee_id,
                employee_name=employee_name,
                week_start=week_start,
                week_end=week_end,
                total_hours=total_hours,
                overtime_hours=overtime_hours,
                entries=entries,
                status="draft"
            )
            
        except Exception as e:
            logger.error(f"Error getting timesheet: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get timesheet"
            )
    
    async def get_attendance_summary(self, employee_id: str, start_date: date, end_date: date) -> AttendanceSummary:
        """Get attendance summary for date range"""
        try:
            # Get all attendance records for the period
            cursor = self.db.attendance.find({
                "employee_id": employee_id,
                "date": {"$gte": start_date, "$lte": end_date}
            })
            
            attendances = await cursor.to_list(length=None)
            
            # Calculate statistics
            total_days = (end_date - start_date).days + 1
            present_days = len([a for a in attendances if a.get("status") == AttendanceStatus.PRESENT])
            absent_days = total_days - present_days
            late_days = len([a for a in attendances if a.get("status") == AttendanceStatus.LATE])
            total_hours = sum(a.get("total_hours", 0) for a in attendances)
            overtime_hours = sum(a.get("overtime_hours", 0) for a in attendances)
            attendance_rate = (present_days / total_days * 100) if total_days > 0 else 0
            
            # Get employee info
            employee = await self.db.employees.find_one({"employee_id": employee_id})
            employee_name = f"{employee['first_name']} {employee['last_name']}" if employee else "Unknown"
            
            return AttendanceSummary(
                employee_id=employee_id,
                employee_name=employee_name,
                period_start=start_date,
                period_end=end_date,
                total_days=total_days,
                present_days=present_days,
                absent_days=absent_days,
                late_days=late_days,
                total_hours=total_hours,
                overtime_hours=overtime_hours,
                attendance_rate=attendance_rate
            )
            
        except Exception as e:
            logger.error(f"Error getting attendance summary: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get attendance summary"
            )
