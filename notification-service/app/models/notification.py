from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    """Notification types"""
    ORDER_CREATED = "order_created"
    ORDER_UPDATED = "order_updated"
    ORDER_CANCELLED = "order_cancelled"
    INVOICE_CREATED = "invoice_created"
    INVOICE_PAID = "invoice_paid"
    INVOICE_OVERDUE = "invoice_overdue"
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    # Inventory notifications
    PRODUCT_CREATED = "product_created"
    PRODUCT_UPDATED = "product_updated"
    PRODUCT_DELETED = "product_deleted"
    INVENTORY_LOW_STOCK = "inventory_low_stock"
    INVENTORY_OUT_OF_STOCK = "inventory_out_of_stock"
    INVENTORY_RESTOCKED = "inventory_restocked"
    STOCK_ADJUSTED = "stock_adjusted"
    STOCK_MOVEMENT = "stock_movement"
    # Payment notifications
    PAYMENT_RECEIVED = "payment_received"
    PAYMENT_FAILED = "payment_failed"
    # System notifications
    SYSTEM_ALERT = "system_alert"
    SYSTEM_UPDATE = "system_update"
    CUSTOM = "custom"


class NotificationPriority(str, Enum):
    """Notification priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class NotificationBase(BaseModel):
    """Base notification schema"""
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=1000)
    type: NotificationType = NotificationType.CUSTOM
    priority: NotificationPriority = NotificationPriority.MEDIUM
    metadata: Optional[Dict[str, Any]] = None
    action_url: Optional[str] = None
    action_label: Optional[str] = None


class NotificationCreate(NotificationBase):
    """Schema for creating a notification"""
    user_id: str = Field(..., min_length=1)


class NotificationUpdate(BaseModel):
    """Schema for updating a notification"""
    is_read: Optional[bool] = None
    read_at: Optional[datetime] = None


class NotificationInDB(NotificationBase):
    """Schema for notification in database"""
    id: str = Field(alias="_id")
    user_id: str
    is_read: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "60d5ec49f1b2c8b1f8e4e1a1",
                "user_id": "60d5ec49f1b2c8b1f8e4e1a2",
                "title": "New Order Created",
                "message": "Order #12345 has been created successfully",
                "type": "order_created",
                "priority": "medium",
                "metadata": {"order_id": "12345", "amount": 150.00},
                "action_url": "/orders/12345",
                "action_label": "View Order",
                "is_read": False,
                "read_at": None,
                "created_at": "2024-01-15T10:30:00",
                "updated_at": "2024-01-15T10:30:00"
            }
        }

