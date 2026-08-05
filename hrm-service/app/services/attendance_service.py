from typing import List, Optional
from datetime import datetime, date, time, timedelta
from fastapi import HTTPException, status
import logging

from app.database.connection import get_database
from app.models.attendance import AttendanceResponse, AttendanceStatus, Timesheet, AttendanceSummary
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
                # Convert date to datetime for MongoDB query
                date_from_datetime = datetime.combine(date_from, time.min)
                filter_dict["date"] = {"$gte": date_from_datetime}
            if date_to:
                # Convert date to datetime for MongoDB query
                date_to_datetime = datetime.combine(date_to, time.max)
                if "date" in filter_dict:
                    filter_dict["date"]["$lte"] = date_to_datetime
                else:
                    filter_dict["date"] = {"$lte": date_to_datetime}
            
            # Get attendance records
            cursor = self.db.attendance.find(filter_dict).skip(skip).limit(limit).sort("date", -1)
            attendance_records = await cursor.to_list(length=limit)
            
            # Convert to response format
            result = []
            for record in attendance_records:
                record["id"] = str(record["_id"])
                del record["_id"]
                
                # Convert datetime fields to time if they exist
                # MongoDB stores time as ISO format strings, convert back to time objects
                if "clock_in_time" in record and record["clock_in_time"]:
                    if isinstance(record["clock_in_time"], str):
                        record["clock_in_time"] = time.fromisoformat(record["clock_in_time"])
                    elif isinstance(record["clock_in_time"], datetime):
                        record["clock_in_time"] = record["clock_in_time"].time()
                if "clock_out_time" in record and record["clock_out_time"]:
                    if isinstance(record["clock_out_time"], str):
                        record["clock_out_time"] = time.fromisoformat(record["clock_out_time"])
                    elif isinstance(record["clock_out_time"], datetime):
                        record["clock_out_time"] = record["clock_out_time"].time()
                if "date" in record and isinstance(record["date"], datetime):
                    record["date"] = record["date"].date()
                # Convert status string to enum if needed
                if "status" in record and isinstance(record["status"], str):
                    try:
                        record["status"] = AttendanceStatus(record["status"])
                    except ValueError:
                        record["status"] = AttendanceStatus.PRESENT
                
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
            # Convert date to datetime for MongoDB query (MongoDB stores dates as datetime)
            today_datetime = datetime.combine(today, time.min)
            existing_attendance = await self.db.attendance.find_one({
                "employee_id": employee_id,
                "date": today_datetime
            })
            
            # Check if clock_in_time exists (could be string from MongoDB)
            clock_in_exists = existing_attendance and existing_attendance.get("clock_in_time")
            if clock_in_exists:
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
            # Use today_datetime already defined above for MongoDB storage (MongoDB can't encode date objects directly)
            # Convert time to string for MongoDB storage (MongoDB can't encode time objects directly)
            attendance_doc = {
                "employee_id": employee_id,
                "employee_name": f"{employee['first_name']} {employee['last_name']}",
                "date": today_datetime,  # Store as datetime for MongoDB compatibility
                "clock_in_time": current_time.isoformat() if isinstance(current_time, time) else str(current_time),  # Store as string for MongoDB compatibility
                "status": AttendanceStatus.PRESENT.value,  # Store enum value as string for MongoDB compatibility
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
                    {"employee_id": employee_id, "date": today_datetime},
                    {
                        "$set": {
                            "clock_in_time": current_time.isoformat() if isinstance(current_time, time) else str(current_time),  # Store as string for MongoDB compatibility
                            "status": AttendanceStatus.PRESENT.value,  # Store enum value as string for MongoDB compatibility
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
                "date": today_datetime
            })
            
            if not attendance:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Attendance record not found after creation"
                )
            
            # Convert to response format
            attendance["id"] = str(attendance["_id"])
            del attendance["_id"]
            
            # Convert datetime fields to time/date if needed
            # MongoDB stores time as ISO format strings, convert back to time objects
            if "clock_in_time" in attendance and attendance["clock_in_time"]:
                if isinstance(attendance["clock_in_time"], str):
                    # Convert from ISO format string to time object
                    attendance["clock_in_time"] = time.fromisoformat(attendance["clock_in_time"])
                elif isinstance(attendance["clock_in_time"], datetime):
                    attendance["clock_in_time"] = attendance["clock_in_time"].time()
            if "clock_out_time" in attendance and attendance["clock_out_time"]:
                if isinstance(attendance["clock_out_time"], str):
                    # Convert from ISO format string to time object
                    attendance["clock_out_time"] = time.fromisoformat(attendance["clock_out_time"])
                elif isinstance(attendance["clock_out_time"], datetime):
                    attendance["clock_out_time"] = attendance["clock_out_time"].time()
            if "date" in attendance and isinstance(attendance["date"], datetime):
                attendance["date"] = attendance["date"].date()
            # Convert status string to enum if needed (MongoDB stores as string)
            if "status" in attendance and isinstance(attendance["status"], str):
                try:
                    attendance["status"] = AttendanceStatus(attendance["status"])
                except ValueError:
                    attendance["status"] = AttendanceStatus.PRESENT
            
            return AttendanceResponse(**attendance)
            
        except HTTPException:
            raise
        except Exception as e:
            import traceback
            logger.error(f"Error clocking in: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to clock in: {str(e)}"
            )
    
    async def clock_out(self, employee_id: str, clock_out_time: Optional[time] = None, location: Optional[str] = None, notes: Optional[str] = None) -> AttendanceResponse:
        """Clock out for the day"""
        try:
            today = date.today()
            current_time = clock_out_time or datetime.now().time()
            
            # Convert date to datetime for MongoDB query
            today_datetime = datetime.combine(today, time.min)
            
            # Get today's attendance
            attendance = await self.db.attendance.find_one({
                "employee_id": employee_id,
                "date": today_datetime
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
            # Convert clock_in_time from string to time object if needed (MongoDB stores as string)
            clock_in_time = attendance["clock_in_time"]
            if isinstance(clock_in_time, str):
                clock_in_time = time.fromisoformat(clock_in_time)
            
            total_hours = self._calculate_hours(clock_in_time, current_time)
            
            # Calculate overtime (assuming 8 hours is standard)
            overtime_hours = max(0, total_hours - 8.0)
            
            # Update attendance record
            await self.db.attendance.update_one(
                {"employee_id": employee_id, "date": today_datetime},
                {
                    "$set": {
                        "clock_out_time": current_time.isoformat() if isinstance(current_time, time) else str(current_time),  # Store as string for MongoDB compatibility
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
                "date": today_datetime
            })
            
            if not updated_attendance:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Attendance record not found after update"
                )
            
            # Convert to response format
            updated_attendance["id"] = str(updated_attendance["_id"])
            del updated_attendance["_id"]
            
            # Convert datetime fields to time/date if needed
            if "clock_in_time" in updated_attendance and updated_attendance["clock_in_time"]:
                if isinstance(updated_attendance["clock_in_time"], datetime):
                    updated_attendance["clock_in_time"] = updated_attendance["clock_in_time"].time()
            if "clock_out_time" in updated_attendance and updated_attendance["clock_out_time"]:
                if isinstance(updated_attendance["clock_out_time"], datetime):
                    updated_attendance["clock_out_time"] = updated_attendance["clock_out_time"].time()
            if "date" in updated_attendance and isinstance(updated_attendance["date"], datetime):
                updated_attendance["date"] = updated_attendance["date"].date()
            # Convert status string to enum if needed
            if "status" in updated_attendance and isinstance(updated_attendance["status"], str):
                try:
                    updated_attendance["status"] = AttendanceStatus(updated_attendance["status"])
                except ValueError:
                    updated_attendance["status"] = AttendanceStatus.PRESENT
            
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
            # Convert date to datetime for MongoDB query
            date_datetime = datetime.combine(date, time.min)
            attendance = await self.db.attendance.find_one({
                "employee_id": employee_id,
                "date": date_datetime
            })
            
            if not attendance:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Attendance record not found"
                )
            
            # Convert to response format
            attendance["id"] = str(attendance["_id"])
            del attendance["_id"]
            
            # Convert datetime fields to time/date if needed
            if "clock_in_time" in attendance and attendance["clock_in_time"]:
                if isinstance(attendance["clock_in_time"], datetime):
                    attendance["clock_in_time"] = attendance["clock_in_time"].time()
            if "clock_out_time" in attendance and attendance["clock_out_time"]:
                if isinstance(attendance["clock_out_time"], datetime):
                    attendance["clock_out_time"] = attendance["clock_out_time"].time()
            if "date" in attendance and isinstance(attendance["date"], datetime):
                attendance["date"] = attendance["date"].date()
            # Convert status string to enum if needed
            if "status" in attendance and isinstance(attendance["status"], str):
                try:
                    attendance["status"] = AttendanceStatus(attendance["status"])
                except ValueError:
                    attendance["status"] = AttendanceStatus.PRESENT
            
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
            # Convert dates to datetime for MongoDB query
            start_datetime = datetime.combine(start_date, time.min)
            end_datetime = datetime.combine(end_date, time.max)
            cursor = self.db.attendance.find({
                "employee_id": employee_id,
                "date": {"$gte": start_datetime, "$lte": end_datetime}
            }).skip(skip).limit(limit).sort("date", -1)
            
            attendances = await cursor.to_list(length=limit)
            
            result = []
            for attendance in attendances:
                # Convert to response format
                attendance["id"] = str(attendance["_id"])
                del attendance["_id"]
                
                # Convert datetime fields to time/date if needed
                if "clock_in_time" in attendance and attendance["clock_in_time"]:
                    if isinstance(attendance["clock_in_time"], datetime):
                        attendance["clock_in_time"] = attendance["clock_in_time"].time()
                if "clock_out_time" in attendance and attendance["clock_out_time"]:
                    if isinstance(attendance["clock_out_time"], datetime):
                        attendance["clock_out_time"] = attendance["clock_out_time"].time()
                if "date" in attendance and isinstance(attendance["date"], datetime):
                    attendance["date"] = attendance["date"].date()
                # Convert status string to enum if needed
                if "status" in attendance and isinstance(attendance["status"], str):
                    try:
                        attendance["status"] = AttendanceStatus(attendance["status"])
                    except ValueError:
                        attendance["status"] = AttendanceStatus.PRESENT
                
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
