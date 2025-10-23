from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List, Optional, Dict, Any
import logging

from app.models.notification import (
    NotificationCreate,
    NotificationUpdate,
    NotificationInDB,
    NotificationType,
    NotificationPriority
)

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for managing notifications"""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.collection = database.notifications
    
    async def create_notification(
        self,
        notification_data: NotificationCreate
    ) -> NotificationInDB:
        """Create a new notification"""
        try:
            now = datetime.utcnow()
            
            notification_dict = notification_data.model_dump()
            notification_dict.update({
                "is_read": False,
                "read_at": None,
                "created_at": now,
                "updated_at": now
            })
            
            result = await self.collection.insert_one(notification_dict)
            
            notification_dict["_id"] = str(result.inserted_id)
            
            logger.info(f"Created notification: {result.inserted_id} for user: {notification_data.user_id}")
            
            return NotificationInDB(**notification_dict)
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            raise
    
    async def get_notification(self, notification_id: str) -> Optional[NotificationInDB]:
        """Get a notification by ID"""
        try:
            notification = await self.collection.find_one({"_id": ObjectId(notification_id)})
            
            if notification:
                notification["_id"] = str(notification["_id"])
                return NotificationInDB(**notification)
            
            return None
        except Exception as e:
            logger.error(f"Error getting notification {notification_id}: {e}")
            return None
    
    async def get_user_notifications(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 50,
        unread_only: bool = False
    ) -> List[NotificationInDB]:
        """Get all notifications for a user"""
        try:
            query = {"user_id": user_id}
            
            if unread_only:
                query["is_read"] = False
            
            cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
            
            notifications = []
            async for notification in cursor:
                notification["_id"] = str(notification["_id"])
                notifications.append(NotificationInDB(**notification))
            
            return notifications
        except Exception as e:
            logger.error(f"Error getting user notifications for {user_id}: {e}")
            return []
    
    async def mark_as_read(self, notification_id: str) -> bool:
        """Mark a notification as read"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(notification_id)},
                {
                    "$set": {
                        "is_read": True,
                        "read_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error marking notification {notification_id} as read: {e}")
            return False
    
    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications for a user as read"""
        try:
            result = await self.collection.update_many(
                {"user_id": user_id, "is_read": False},
                {
                    "$set": {
                        "is_read": True,
                        "read_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return result.modified_count
        except Exception as e:
            logger.error(f"Error marking all notifications as read for user {user_id}: {e}")
            return 0
    
    async def delete_notification(self, notification_id: str) -> bool:
        """Delete a notification"""
        try:
            result = await self.collection.delete_one({"_id": ObjectId(notification_id)})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting notification {notification_id}: {e}")
            return False
    
    async def delete_user_notifications(self, user_id: str) -> int:
        """Delete all notifications for a user"""
        try:
            result = await self.collection.delete_many({"user_id": user_id})
            return result.deleted_count
        except Exception as e:
            logger.error(f"Error deleting notifications for user {user_id}: {e}")
            return 0
    
    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for a user"""
        try:
            count = await self.collection.count_documents({
                "user_id": user_id,
                "is_read": False
            })
            return count
        except Exception as e:
            logger.error(f"Error getting unread count for user {user_id}: {e}")
            return 0
    
    async def create_bulk_notifications(
        self,
        user_ids: List[str],
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.SYSTEM_ALERT,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        metadata: Optional[Dict[str, Any]] = None
    ) -> int:
        """Create notifications for multiple users"""
        try:
            now = datetime.utcnow()
            
            notifications = []
            for user_id in user_ids:
                notification = {
                    "user_id": user_id,
                    "title": title,
                    "message": message,
                    "type": notification_type,
                    "priority": priority,
                    "metadata": metadata,
                    "is_read": False,
                    "read_at": None,
                    "created_at": now,
                    "updated_at": now
                }
                notifications.append(notification)
            
            if notifications:
                result = await self.collection.insert_many(notifications)
                return len(result.inserted_ids)
            
            return 0
        except Exception as e:
            logger.error(f"Error creating bulk notifications: {e}")
            return 0

