from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class PaymentStatus(str, Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"
    REQUIRES_ACTION = "requires_action"


class PaymentIntentCreate(BaseModel):
    """Request model for creating a payment intent"""
    amount: float = Field(..., gt=0, description="Amount in dollars")
    currency: str = Field(default="usd", description="Currency code (ISO 4217)")
    order_id: Optional[str] = Field(None, description="Order ID from sales service")
    customer_id: Optional[str] = Field(None, description="Customer ID")
    description: Optional[str] = Field(None, description="Payment description")
    receipt_email: Optional[str] = Field(None, description="Email for receipt")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class PaymentIntentResponse(BaseModel):
    """Response model for payment intent"""
    payment_intent_id: str
    client_secret: str
    amount: float
    amount_cents: int
    currency: str
    status: str
    publishable_key: str
    requires_action: bool = False
    next_action: Optional[Dict[str, Any]] = None


class PaymentStatusResponse(BaseModel):
    """Response model for payment status"""
    payment_intent_id: str
    status: str
    amount: float
    amount_cents: int
    currency: str
    customer_id: Optional[str] = None
    charges: list = []
    metadata: Dict[str, Any] = {}
    created: Optional[int] = None
    requires_action: bool = False


class WebhookEvent(BaseModel):
    """Webhook event model"""
    event_id: str
    event_type: str
    payment_intent_id: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[str] = None
    processed: bool = False
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

