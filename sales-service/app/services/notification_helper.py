"""
Notification Helper for Role-Based & Permission-Based Notifications
Sends notifications to supervisors/admins/colleagues, NOT the action performer
"""
import httpx
import logging
from typing import List, Set, Optional
from app.config import settings

logger = logging.getLogger(__name__)


async def get_users_by_role(role: str, token: str) -> List[str]:
    """Get all active user IDs with a specific role"""
    try:
        url = f"{settings.auth_service_url}/api/v1/users/"
        params = {"role": role, "status": "active", "limit": 1000}
        logger.info(f"Fetching users with role '{role}' from {url} with params: {params}")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {token}"},
                params=params
            )
            
            logger.info(f"Auth service response status: {response.status_code}")
            
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list) and len(users) < 5:
                    logger.info(f"Raw response type: list, content: {users}")
                else:
                    content_desc = f"{len(users)} items" if isinstance(users, list) else "dict"
                    logger.info(f"Raw response type: {type(users)}, content: {content_desc}")
                
                # Handle both pagination response and direct array
                if isinstance(users, dict) and 'items' in users:
                    users = users['items']
                
                user_ids = []
                for user in users:
                    user_id = user.get("id") or user.get("_id")
                    if user_id:
                        user_ids.append(str(user_id))
                    else:
                        logger.warning(f"User record missing id: {user}")
                
                user_ids_preview = user_ids[:5]
                if len(user_ids) > 5:
                    user_ids_preview_str = f"{user_ids_preview}..."
                else:
                    user_ids_preview_str = str(user_ids)
                logger.info(f"Found {len(user_ids)} users with role '{role}': {user_ids_preview_str}")
                return user_ids
            else:
                logger.error(f"Failed to fetch users with role '{role}': status {response.status_code}, body: {response.text}")
    except Exception as e:
        logger.error(f"Error fetching users by role '{role}': {e}")
        import traceback
        logger.error(traceback.format_exc())
    
    return []


async def get_user_info(user_id: str, token: str) -> Optional[dict]:
    """Get user information by ID"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.auth_service_url}/api/v1/users/{user_id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        logger.error(f"Error fetching user info for {user_id}: {e}")
    
    return None


async def get_notification_recipients_for_sales_action(
    performer_id: str,
    token: str,
    include_managers: bool = True,
    include_sales_team: bool = True,
    exclude_performer: bool = True
) -> Set[str]:
    """
    Get users who should be notified about sales actions
    
    Args:
        performer_id: User who performed the action (will be EXCLUDED)
        token: Auth token
        include_managers: Include managers
        include_sales_team: Include other sales staff (employees who work in sales)
        exclude_performer: Exclude the person who performed action (default: True)
    
    Returns:
        Set of user IDs who should receive notification
    """
    recipients = set()
    
    # Get super admins (always notified)
    super_admins = await get_users_by_role("super_admin", token)
    logger.info(f"Found {len(super_admins)} super_admin users")
    recipients.update(super_admins)
    
    # Get admins (always notified for sales actions)
    admins = await get_users_by_role("admin", token)
    logger.info(f"Found {len(admins)} admin users")
    recipients.update(admins)
    
    # Get managers if requested
    if include_managers:
        managers = await get_users_by_role("manager", token)
        logger.info(f"Found {len(managers)} manager users")
        recipients.update(managers)
    
    # Get sales team if requested (employees in sales department)
    if include_sales_team:
        employees = await get_users_by_role("employee", token)
        logger.info(f"Found {len(employees)} employee users")
        recipients.update(employees)
    
    # Remove the performer from recipients (they don't need to be notified of their own action)
    if exclude_performer and performer_id in recipients:
        recipients.remove(performer_id)
        logger.info(f"Removed performer {performer_id} from recipients")
    
    logger.info(f"Notification recipients for sales action: {len(recipients)} users (performer {performer_id} {'excluded' if exclude_performer else 'included'})")
    
    return recipients


async def get_notification_recipients_for_user_management(
    performer_id: str,
    token: str,
    exclude_performer: bool = True
) -> Set[str]:
    """Get users who should be notified about user management actions"""
    recipients = set()
    
    # Get super admins (always notified about user changes)
    super_admins = await get_users_by_role("super_admin", token)
    recipients.update(super_admins)
    
    # Get admins
    admins = await get_users_by_role("admin", token)
    recipients.update(admins)
    
    # Remove performer
    if exclude_performer and performer_id in recipients:
        recipients.remove(performer_id)
    
    logger.info(f"Notification recipients for user management: {len(recipients)} users")
    
    return recipients


async def get_notification_recipients_for_inventory_action(
    performer_id: str,
    token: str,
    exclude_performer: bool = True
) -> Set[str]:
    """Get users who should be notified about inventory actions"""
    recipients = set()
    
    # Get super admins
    super_admins = await get_users_by_role("super_admin", token)
    recipients.update(super_admins)
    
    # Get managers (they oversee inventory)
    managers = await get_users_by_role("manager", token)
    recipients.update(managers)
    
    # Get warehouse staff
    warehouse_staff = await get_users_by_role("staff", token)  # Adjust role name as needed
    recipients.update(warehouse_staff)
    
    # Remove performer
    if exclude_performer and performer_id in recipients:
        recipients.remove(performer_id)
    
    logger.info(f"Notification recipients for inventory action: {len(recipients)} users")
    
    return recipients


async def send_notification_to_supervisors(
    notification_client,
    performer_id: str,
    performer_name: str,
    title: str,
    message: str,
    notification_type: str,
    priority: str,
    metadata: dict,
    action_url: str,
    action_label: str,
    token: str,
    recipients: Set[str]
):
    """
    Send notification to multiple supervisors/colleagues
    
    Args:
        notification_client: NotificationClient instance
        performer_id: User who performed the action
        performer_name: Name of the user who performed action
        title: Notification title
        message: Notification message (should include performer_name)
        recipients: Set of user IDs to notify
        ... (other standard notification params)
    """
    success_count = 0
    
    for recipient_id in recipients:
        try:
            await notification_client.send_notification(
                user_id=recipient_id,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                metadata={
                    **metadata,
                    "performed_by_id": performer_id,
                    "performed_by_name": performer_name
                },
                action_url=action_url,
                action_label=action_label,
                auth_token=token  # ✅ FIXED: Pass the authentication token!
            )
            success_count += 1
        except Exception as e:
            logger.warning(f"Failed to send notification to user {recipient_id}: {e}")
    
    logger.info(f"Sent notifications to {success_count}/{len(recipients)} recipients")
    return success_count

