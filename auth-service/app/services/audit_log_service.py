from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
import logging

from app.database.connection import get_database
from app.models.audit_log import (
    AuditLogInDB,
    AuditLogResponse,
    AuditLogFilters,
    AuditAction,
    AuditStatus
)

logger = logging.getLogger(__name__)


class AuditLogService:
    def __init__(self):
        self.db = get_database()
    
    async def create_audit_log(
        self,
        user_id: str,
        user_email: str,
        action: str,
        resource: str,
        ip_address: str,
        user_agent: str,
        status: str = "success",
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> AuditLogInDB:
        """Create a new audit log entry"""
        try:
            # Convert string action/status to enum if needed
            audit_action = AuditAction(action) if isinstance(action, str) else action
            audit_status = AuditStatus(status) if isinstance(status, str) else status
            
            log_doc = {
                "user_id": user_id,
                "user_email": user_email,
                "action": audit_action.value if isinstance(audit_action, AuditAction) else str(audit_action),
                "resource": resource,
                "resource_id": resource_id,
                "details": details or {},
                "ip_address": ip_address,
                "user_agent": user_agent,
                "timestamp": datetime.utcnow(),
                "status": audit_status.value if isinstance(audit_status, AuditStatus) else str(audit_status)
            }
            
            result = await self.db.audit_logs.insert_one(log_doc)
            log_doc["_id"] = str(result.inserted_id)
            
            return AuditLogInDB(**log_doc)
            
        except Exception as e:
            logger.error(f"Error creating audit log: {e}")
            # Don't raise exception - audit logging should not break the application
            # But log the error
            return None
    
    async def get_audit_log(self, log_id: str) -> Optional[AuditLogResponse]:
        """Get audit log by ID"""
        try:
            if not ObjectId.is_valid(log_id):
                return None
                
            log = await self.db.audit_logs.find_one({"_id": ObjectId(log_id)})
            if not log:
                return None
            
            log["_id"] = str(log["_id"])
            return AuditLogResponse(**log)
            
        except Exception as e:
            logger.error(f"Error getting audit log: {e}")
            return None
    
    async def get_audit_logs(self, filters: AuditLogFilters) -> List[AuditLogResponse]:
        """Get audit logs with filters"""
        try:
            filter_dict = {}
            
            if filters.user_id:
                filter_dict["user_id"] = filters.user_id
            
            if filters.action:
                filter_dict["action"] = filters.action
            
            if filters.resource:
                filter_dict["resource"] = filters.resource
            
            if filters.status:
                filter_dict["status"] = filters.status
            
            if filters.start_date or filters.end_date:
                filter_dict["timestamp"] = {}
                if filters.start_date:
                    filter_dict["timestamp"]["$gte"] = filters.start_date
                if filters.end_date:
                    filter_dict["timestamp"]["$lte"] = filters.end_date
            
            cursor = self.db.audit_logs.find(filter_dict).sort("timestamp", -1)
            
            if filters.skip:
                cursor = cursor.skip(filters.skip)
            
            if filters.limit:
                cursor = cursor.limit(filters.limit)
            
            logs = await cursor.to_list(length=filters.limit or 100)
            
            result = []
            for log in logs:
                log["_id"] = str(log["_id"])
                result.append(AuditLogResponse(**log))
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting audit logs: {e}")
            return []
    
    async def get_user_audit_logs(self, user_id: str, limit: int = 100) -> List[AuditLogResponse]:
        """Get audit logs for a specific user"""
        try:
            cursor = self.db.audit_logs.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
            logs = await cursor.to_list(length=limit)
            
            result = []
            for log in logs:
                log["_id"] = str(log["_id"])
                result.append(AuditLogResponse(**log))
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting user audit logs: {e}")
            return []
    
    async def count_audit_logs(self, filters: AuditLogFilters) -> int:
        """Count audit logs matching filters"""
        try:
            filter_dict = {}
            
            if filters.user_id:
                filter_dict["user_id"] = filters.user_id
            
            if filters.action:
                filter_dict["action"] = filters.action
            
            if filters.resource:
                filter_dict["resource"] = filters.resource
            
            if filters.status:
                filter_dict["status"] = filters.status
            
            if filters.start_date or filters.end_date:
                filter_dict["timestamp"] = {}
                if filters.start_date:
                    filter_dict["timestamp"]["$gte"] = filters.start_date
                if filters.end_date:
                    filter_dict["timestamp"]["$lte"] = filters.end_date
            
            count = await self.db.audit_logs.count_documents(filter_dict)
            return count
            
        except Exception as e:
            logger.error(f"Error counting audit logs: {e}")
            return 0

