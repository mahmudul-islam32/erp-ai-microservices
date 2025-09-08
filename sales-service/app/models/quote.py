from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum
from .sales_order import OrderLineItem, OrderLineItemCreate


class QuoteStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"
    CONVERTED = "converted"  # Converted to sales order


# Quote Models
class QuoteCreate(BaseModel):
    customer_id: str
    quote_date: Optional[date] = Field(default_factory=date.today)
    valid_until: date
    expected_delivery_date: Optional[date] = None
    sales_rep_id: Optional[str] = None
    line_items: List[OrderLineItemCreate]
    subtotal_discount_percent: float = Field(0, ge=0, le=100)
    subtotal_discount_amount: float = Field(0, ge=0)
    shipping_cost: float = Field(0, ge=0)
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None


class QuoteUpdate(BaseModel):
    customer_id: Optional[str] = None
    quote_date: Optional[date] = None
    valid_until: Optional[date] = None
    expected_delivery_date: Optional[date] = None
    sales_rep_id: Optional[str] = None
    line_items: Optional[List[OrderLineItemCreate]] = None
    subtotal_discount_percent: Optional[float] = Field(None, ge=0, le=100)
    subtotal_discount_amount: Optional[float] = Field(None, ge=0)
    shipping_cost: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    status: Optional[QuoteStatus] = None


class QuoteResponse(BaseModel):
    id: str = Field(alias="_id")
    quote_number: str
    customer_id: str
    customer_name: str
    customer_email: str
    quote_date: date
    valid_until: date
    expected_delivery_date: Optional[date] = None
    sales_rep_id: Optional[str] = None
    sales_rep_name: Optional[str] = None
    line_items: List[OrderLineItem]
    subtotal: float
    subtotal_discount_percent: float = 0
    subtotal_discount_amount: float = 0
    tax_amount: float
    shipping_cost: float = 0
    total_amount: float
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    status: QuoteStatus
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    converted_order_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: Optional[str] = None

    class Config:
        populate_by_name = True


class QuoteInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    quote_number: str
    customer_id: str
    customer_name: str
    customer_email: str
    quote_date: date
    valid_until: date
    expected_delivery_date: Optional[date] = None
    sales_rep_id: Optional[str] = None
    sales_rep_name: Optional[str] = None
    line_items: List[OrderLineItem]
    subtotal: float
    subtotal_discount_percent: float = 0
    subtotal_discount_amount: float = 0
    tax_amount: float
    shipping_cost: float = 0
    total_amount: float
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    status: QuoteStatus = QuoteStatus.DRAFT
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    converted_order_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_by: Optional[str] = None

    class Config:
        populate_by_name = True
