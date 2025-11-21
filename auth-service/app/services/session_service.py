from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import HTTPException, status as http_status
import logging

from app.database.connection import get_database
from app.models.session import SessionInDB, SessionResponse

logger = logging.getLogger(__name__)


class SessionService:
    def __init__(self):
        self.db = get_database()
    
    async def create_session(
        self,
        user_id: str,
        user_email: str,
        ip_address: str,
        user_agent: str,
        expires_in_minutes: int = 60 * 24 * 7  # 7 days default
    ) -> SessionInDB:
        """Create a new user session"""
        try:
            expires_at = datetime.utcnow() + timedelta(minutes=expires_in_minutes)
            
            session_doc = {
                "user_id": user_id,
                "user_email": user_email,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "created_at": datetime.utcnow(),
                "last_activity": datetime.utcnow(),
                "expires_at": expires_at,
                "is_active": True
            }
            
            result = await self.db.sessions.insert_one(session_doc)
            session_doc["_id"] = str(result.inserted_id)
            
            return SessionInDB(**session_doc)
            
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create session"
            )
    
    async def get_session(self, session_id: str) -> Optional[SessionInDB]:
        """Get session by ID"""
        try:
            if not ObjectId.is_valid(session_id):
                return None
                
            session = await self.db.sessions.find_one({"_id": ObjectId(session_id)})
            if not session:
                return None
            
            session["_id"] = str(session["_id"])
            return SessionInDB(**session)
            
        except Exception as e:
            logger.error(f"Error getting session: {e}")
            return None
    
    async def get_user_sessions(self, user_id: str, active_only: bool = False) -> List[SessionResponse]:
        """Get all sessions for a user"""
        try:
            filter_dict = {"user_id": user_id}
            if active_only:
                filter_dict["is_active"] = True
                filter_dict["expires_at"] = {"$gt": datetime.utcnow()}
            
            cursor = self.db.sessions.find(filter_dict).sort("created_at", -1)
            sessions = await cursor.to_list(length=None)
            
            result = []
            for session in sessions:
                session["_id"] = str(session["_id"])
                result.append(SessionResponse(**session))
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting user sessions: {e}")
            return []
    
    async def get_all_sessions(self, active_only: bool = False) -> List[SessionResponse]:
        """Get all sessions"""
        try:
            filter_dict = {}
            if active_only:
                filter_dict["is_active"] = True
                filter_dict["expires_at"] = {"$gt": datetime.utcnow()}
            
            cursor = self.db.sessions.find(filter_dict).sort("created_at", -1)
            sessions = await cursor.to_list(length=None)
            
            result = []
            for session in sessions:
                session["_id"] = str(session["_id"])
                result.append(SessionResponse(**session))
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting all sessions: {e}")
            return []
    
    async def update_last_activity(self, session_id: str) -> bool:
        """Update session last activity timestamp"""
        try:
            if not ObjectId.is_valid(session_id):
                return False
                
            await self.db.sessions.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {"last_activity": datetime.utcnow()}}
            )
            return True
            
        except Exception as e:
            logger.error(f"Error updating session activity: {e}")
            return False
    
    async def terminate_session(self, session_id: str, user_id: str = None) -> bool:
        """Terminate a session"""
        try:
            if not ObjectId.is_valid(session_id):
                return False
            
            session = await self.get_session(session_id)
            if not session:
                return False
            
            # Check if user has permission to terminate this session
            if user_id and session.user_id != user_id:
                # Check if user is admin (you can add more sophisticated checks)
                user = await self.db.users.find_one({"_id": ObjectId(user_id)})
                if not user or user.get("role") not in ["super_admin", "admin"]:
                    raise HTTPException(
                        status_code=http_status.HTTP_403_FORBIDDEN,
                        detail="You don't have permission to terminate this session"
                    )
            
            await self.db.sessions.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": {"is_active": False}}
            )
            
            # Log session termination (import here to avoid circular dependency)
            if session:
                from app.services.audit_log_service import AuditLogService
                audit_log_service = AuditLogService()
                await audit_log_service.create_audit_log(
                    user_id=user_id or session.user_id,
                    user_email=session.user_email,
                    action="session:terminate",
                    resource="session",
                    resource_id=session_id,
                    ip_address=session.ip_address,
                    user_agent=session.user_agent,
                    status="success"
                )
            
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error terminating session: {e}")
            return False
    
    async def terminate_all_user_sessions(self, user_id: str, current_session_id: str = None) -> int:
        """Terminate all sessions for a user"""
        try:
            filter_dict = {"user_id": user_id, "is_active": True}
            
            # Optionally exclude current session
            if current_session_id and ObjectId.is_valid(current_session_id):
                filter_dict["_id"] = {"$ne": ObjectId(current_session_id)}
            
            result = await self.db.sessions.update_many(
                filter_dict,
                {"$set": {"is_active": False}}
            )
            
            # Log termination (import here to avoid circular dependency)
            user = await self.db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                from app.services.audit_log_service import AuditLogService
                audit_log_service = AuditLogService()
                await audit_log_service.create_audit_log(
                    user_id=user_id,
                    user_email=user.get("email"),
                    action="session:terminate",
                    resource="session",
                    resource_id="all",
                    ip_address="system",
                    user_agent="system",
                    status="success",
                    details={"count": result.modified_count}
                )
            
            return result.modified_count
            
        except Exception as e:
            logger.error(f"Error terminating user sessions: {e}")
            return 0
    
    async def cleanup_expired_sessions(self) -> int:
        """Mark expired sessions as inactive"""
        try:
            result = await self.db.sessions.update_many(
                {
                    "expires_at": {"$lt": datetime.utcnow()},
                    "is_active": True
                },
                {"$set": {"is_active": False}}
            )
            return result.modified_count
            
        except Exception as e:
            logger.error(f"Error cleaning up expired sessions: {e}")
            return 0

