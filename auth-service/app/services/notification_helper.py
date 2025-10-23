"""
Notification Helper for Auth Service
Sends notifications to admins about user management actions
"""
import httpx
import logging
from typing import List, Set
import os

logger = logging.getLogger(__name__)


async def get_admin_users(auth_service_url: str = None) -> Set[str]:
    """Get all super_admin and admin user IDs"""
    if not auth_service_url:
        auth_service_url = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")
    
    recipients = set()
    
    try:
        # Get super admins
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Note: This is a self-referential call within auth service
            # We'll query the database directly instead
            from app.database import get_database
            db = get_database()
            
            # Get all super_admins and admins
            admin_users = await db.users.find({
                "role": {"$in": ["super_admin", "admin"]},
                "status": "active"
            }).to_list(length=1000)
            
            for user in admin_users:
                user_id = str(user.get("_id"))
                if user_id:
                    recipients.add(user_id)
            
            logger.info(f"Found {len(recipients)} admin users")
            
    except Exception as e:
        logger.error(f"Error fetching admin users: {e}")
    
    return recipients


async def send_user_management_notification(
    notification_client,
    performer_id: str,
    performer_name: str,
    action: str,  # "created", "updated", "deleted"
    subject_user_name: str,
    subject_user_email: str,
    details: str,
    priority: str = "medium",
    auth_token: str = None  # ✅ ADDED: Auth token parameter
):
    """Send user management notification to all admins (excluding the performer)"""
    try:
        # Get all admin users
        recipients = await get_admin_users()
        
        # Remove the performer from recipients
        if performer_id in recipients:
            recipients.remove(performer_id)
        
        if not recipients:
            logger.warning("No admin recipients found for user management notification")
            return 0
        
        logger.info(f"📤 Sending user management notifications to {len(recipients)} admins")
        
        # Send to all admin recipients
        success_count = 0
        for recipient_id in recipients:
            try:
                logger.info(f"   → Sending to admin {recipient_id}")
                await notification_client.send_notification(
                    user_id=recipient_id,
                    title=f"User {action.capitalize()} by {performer_name}",
                    message=f"{performer_name} {action} user account for {subject_user_name} ({subject_user_email}). {details}",
                    notification_type=f"user_{action}",
                    priority=priority,
                    metadata={
                        "action": action,
                        "performed_by_id": performer_id,
                        "performed_by_name": performer_name,
                        "subject_user_name": subject_user_name,
                        "subject_user_email": subject_user_email,
                        "details": details
                    },
                    action_url=f"/dashboard/users",
                    action_label="View Users",
                    auth_token=auth_token  # ✅ FIXED: Pass the authentication token!
                )
                success_count += 1
                logger.info(f"   ✅ Sent successfully to {recipient_id}")
            except Exception as e:
                logger.warning(f"   ❌ Failed to send notification to admin {recipient_id}: {e}")
        
        logger.info(f"✅ Sent user management notification to {success_count}/{len(recipients)} admins")
        return success_count
        
    except Exception as e:
        logger.error(f"❌ Error sending user management notifications: {e}")
        return 0

