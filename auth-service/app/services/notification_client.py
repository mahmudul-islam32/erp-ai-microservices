import httpx
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class NotificationClient:
    """Client for sending notifications to the notification service"""
    
    def __init__(self, base_url: str = "http://notification-service:8004"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api/v1/notifications/"  # Added trailing slash to avoid 307 redirect
    
    async def send_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "custom",
        priority: str = "medium",
        metadata: Optional[Dict[str, Any]] = None,
        action_url: Optional[str] = None,
        action_label: Optional[str] = None,
        auth_token: Optional[str] = None
    ) -> bool:
        """Send a notification to a user"""
        try:
            logger.info(f"📤 ATTEMPTING to send notification to user {user_id}")
            logger.info(f"   Title: {title}")
            logger.info(f"   Type: {notification_type}, Priority: {priority}")
            logger.info(f"   API URL: {self.api_url}")
            logger.info(f"   Has auth token: {bool(auth_token)}")
            
            headers = {}
            if auth_token:
                headers["Authorization"] = f"Bearer {auth_token}"
            
            payload = {
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": notification_type,
                "priority": priority,
                "metadata": metadata,
                "action_url": action_url,
                "action_label": action_label
            }
            
            logger.info("   Payload ready, making POST request...")
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    self.api_url,
                    json=payload,
                    headers=headers
                )
                
                logger.info(f"   Response status: {response.status_code}")
                logger.info(f"   Response body: {response.text[:200]}")
                
                if response.status_code == 201:
                    logger.info(f"✅ Notification sent successfully to user {user_id}")
                    return True
                else:
                    logger.error(f"❌ Failed to send notification to {user_id}: {response.status_code} - {response.text}")
                    return False
        except Exception as e:
            logger.error(f"💥 Exception sending notification to {user_id}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    async def send_bulk_notification(
        self,
        user_ids: list,
        title: str,
        message: str,
        notification_type: str = "system_alert",
        priority: str = "medium",
        metadata: Optional[Dict[str, Any]] = None,
        auth_token: Optional[str] = None
    ) -> int:
        """Send notifications to multiple users"""
        success_count = 0
        
        for user_id in user_ids:
            result = await self.send_notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                metadata=metadata,
                auth_token=auth_token
            )
            if result:
                success_count += 1
        
        return success_count

