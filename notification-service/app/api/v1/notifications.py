from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
import logging

from app.models.notification import (
    NotificationCreate,
    NotificationInDB
)
from app.services.notification_service import NotificationService
from app.services.websocket_manager import ws_manager
from app.api.dependencies import (
    get_current_user,
    get_notification_service
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("/", response_model=NotificationInDB, status_code=status.HTTP_201_CREATED)
async def create_notification(
    notification_data: NotificationCreate,
    service: NotificationService = Depends(get_notification_service),
    current_user: dict = Depends(get_current_user)
):
    """Create a new notification"""
    try:
        # Create notification in database
        notification = await service.create_notification(notification_data)
        
        # Send real-time notification via WebSocket
        await ws_manager.send_personal_message(
            notification_data.user_id,
            {
                "type": "notification",
                "action": "created",
                "data": notification.model_dump(mode='json')
            }
        )
        
        return notification
    except Exception as e:
        logger.error(f"Error creating notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create notification"
        )


@router.get("/", response_model=List[NotificationInDB])
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    service: NotificationService = Depends(get_notification_service),
    current_user: dict = Depends(get_current_user)
):
    """Get all notifications for current user"""
    try:
        notifications = await service.get_user_notifications(
            user_id=current_user["user_id"],
            skip=skip,
            limit=limit,
            unread_only=unread_only
        )
        return notifications
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch notifications"
        )


@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    service: NotificationService = Depends(get_notification_service),
    current_user: dict = Depends(get_current_user)
):
    """Get count of unread notifications"""
    try:
        count = await service.get_unread_count(current_user["user_id"])
        return {"unread_count": count}
    except Exception as e:
        logger.error(f"Error getting unread count: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get unread count"
        )


@router.get("/{notification_id}", response_model=NotificationInDB)
async def get_notification(
    notification_id: str,
    service: NotificationService = Depends(get_notification_service),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific notification"""
    try:
        notification = await service.get_notification(notification_id)
        
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        # Verify user owns this notification
        if notification.user_id != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this notification"
            )
        
        return notification
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch notification"
        )


@router.patch("/{notification_id}/read", response_model=dict)
async def mark_notification_read(
    notification_id: str,
    service: NotificationService = Depends(get_notification_service),
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read"""
    try:
        # Verify notification exists and belongs to user
        notification = await service.get_notification(notification_id)
        
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        if notification.user_id != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this notification"
            )
        
        success = await service.mark_as_read(notification_id)
        
        if success:
            # Send WebSocket update
            await ws_manager.send_personal_message(
                current_user["user_id"],
                {
                    "type": "notification",
                    "action": "read",
                    "notification_id": notification_id
                }
            )
            return {"message": "Notification marked as read"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to mark notification as read"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notification as read"
        )


@router.post("/mark-all-read", response_model=dict)
async def mark_all_notifications_read(
    service: NotificationService = Depends(get_notification_service),
    current_user: dict = Depends(get_current_user)
):
    """Mark all notifications as read for current user"""
    try:
        count = await service.mark_all_as_read(current_user["user_id"])
        
        # Send WebSocket update
        await ws_manager.send_personal_message(
            current_user["user_id"],
            {
                "type": "notification",
                "action": "mark_all_read",
                "count": count
            }
        )
        
        return {"message": f"Marked {count} notifications as read"}
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notifications as read"
        )


@router.delete("/{notification_id}", response_model=dict)
async def delete_notification(
    notification_id: str,
    service: NotificationService = Depends(get_notification_service),
    current_user: dict = Depends(get_current_user)
):
    """Delete a notification"""
    try:
        # Verify notification exists and belongs to user
        notification = await service.get_notification(notification_id)
        
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        if notification.user_id != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this notification"
            )
        
        success = await service.delete_notification(notification_id)
        
        if success:
            # Send WebSocket update
            await ws_manager.send_personal_message(
                current_user["user_id"],
                {
                    "type": "notification",
                    "action": "deleted",
                    "notification_id": notification_id
                }
            )
            return {"message": "Notification deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete notification"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete notification"
        )

