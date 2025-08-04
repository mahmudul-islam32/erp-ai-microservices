from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum
from decimal import Decimal


class OrderStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"
    REFUNDED = "refunded"


class ShippingMethod(str, Enum):
    STANDARD = "standard"
    EXPRESS = "express"
    OVERNIGHT = "overnight"
    PICKUP = "pickup"


class OrderPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


# Order Line Item
class OrderLineItem(BaseModel):
    product_id: str
    product_name: str
    product_sku: str
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    discount_percent: float = Field(0, ge=0, le=100)
    discount_amount: float = Field(0, ge=0)
    tax_rate: float = Field(0, ge=0, le=1)
    tax_amount: float = Field(0, ge=0)
    line_total: float = Field(..., ge=0)
    notes: Optional[str] = None


class OrderLineItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)
    unit_price: Optional[float] = Field(None, ge=0)  # If None, will use product's default price
    discount_percent: float = Field(0, ge=0, le=100)
    discount_amount: float = Field(0, ge=0)
    notes: Optional[str] = None


# Sales Order Models
class SalesOrderCreate(BaseModel):
    customer_id: str
    order_date: Optional[date] = Field(default_factory=date.today)
    expected_delivery_date: Optional[date] = None
    shipping_method: ShippingMethod = ShippingMethod.STANDARD
    shipping_address: Optional[Dict[str, str]] = None  # If None, use customer's shipping address
    priority: OrderPriority = OrderPriority.NORMAL
    sales_rep_id: Optional[str] = None
    line_items: List[OrderLineItemCreate]
    subtotal_discount_percent: float = Field(0, ge=0, le=100)
    subtotal_discount_amount: float = Field(0, ge=0)
    shipping_cost: float = Field(0, ge=0)
    notes: Optional[str] = None
    internal_notes: Optional[str] = None


class SalesOrderUpdate(BaseModel):
    customer_id: Optional[str] = None
    order_date: Optional[date] = None
    expected_delivery_date: Optional[date] = None
    shipping_method: Optional[ShippingMethod] = None
    shipping_address: Optional[Dict[str, str]] = None
    priority: Optional[OrderPriority] = None
    sales_rep_id: Optional[str] = None
    line_items: Optional[List[OrderLineItemCreate]] = None
    subtotal_discount_percent: Optional[float] = Field(None, ge=0, le=100)
    subtotal_discount_amount: Optional[float] = Field(None, ge=0)
    shipping_cost: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    status: Optional[OrderStatus] = None


class SalesOrderResponse(BaseModel):
    id: str = Field(alias="_id")
    order_number: str
    customer_id: str
    customer_name: str
    customer_email: str
    order_date: date
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    shipping_method: ShippingMethod
    shipping_address: Dict[str, str]
    priority: OrderPriority
    sales_rep_id: Optional[str] = None
    sales_rep_name: Optional[str] = None
    line_items: List[OrderLineItem]
    subtotal: float
    subtotal_discount_percent: float = 0
    subtotal_discount_amount: float = 0
    tax_amount: float
    shipping_cost: float = 0
    total_amount: float
    payment_status: PaymentStatus = PaymentStatus.PENDING
    paid_amount: float = 0
    balance_due: float = 0
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: Optional[str] = None

    class Config:
        populate_by_name = True


class SalesOrderInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    order_number: str
    customer_id: str
    customer_name: str
    customer_email: str
    order_date: date
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    shipping_method: ShippingMethod
    shipping_address: Dict[str, str]
    priority: OrderPriority
    sales_rep_id: Optional[str] = None
    sales_rep_name: Optional[str] = None
    line_items: List[OrderLineItem]
    subtotal: float
    subtotal_discount_percent: float = 0
    subtotal_discount_amount: float = 0
    tax_amount: float
    shipping_cost: float = 0
    total_amount: float
    payment_status: PaymentStatus = PaymentStatus.PENDING
    paid_amount: float = 0
    balance_due: float = 0
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    status: OrderStatus = OrderStatus.DRAFT
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_by: Optional[str] = None

    class Config:
        populate_by_name = True
