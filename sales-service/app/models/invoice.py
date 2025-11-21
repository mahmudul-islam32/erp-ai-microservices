from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum
from bson import ObjectId


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    PAID = "paid"
    PARTIAL_PAID = "partial_paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    VOID = "void"


class PaymentMethod(str, Enum):
    CASH = "cash"
    CHECK = "check"
    CREDIT_CARD = "credit_card"
    BANK_TRANSFER = "bank_transfer"
    PAYPAL = "paypal"
    STRIPE = "stripe"
    OTHER = "other"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


# Invoice Line Item (similar to OrderLineItem)
class InvoiceLineItem(BaseModel):
    product_id: str
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    discount_percent: float = Field(0, ge=0, le=100)
    discount_amount: float = Field(0, ge=0)
    tax_rate: float = Field(0, ge=0, le=1)
    tax_amount: float = Field(0, ge=0)
    line_total: Optional[float] = None
    notes: Optional[str] = None


# Invoice Models
class InvoiceCreate(BaseModel):
    # Support both order-based and direct invoice creation
    order_id: Optional[str] = None  # Optional - can create invoice directly without order
    sales_order_id: Optional[str] = None  # Alias for order_id
    customer_id: Optional[str] = None  # Required if order_id is not provided
    line_items: Optional[List[InvoiceLineItem]] = None  # Required if order_id is not provided
    invoice_date: Optional[date] = Field(default_factory=date.today)
    due_date: Optional[date] = None  # Optional - will be calculated if not provided
    shipping_cost: Optional[float] = Field(0, ge=0)
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    late_fee_rate: Optional[float] = Field(None, ge=0, le=1)


class InvoiceUpdate(BaseModel):
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    late_fee_rate: Optional[float] = Field(None, ge=0, le=1)
    status: Optional[InvoiceStatus] = None


class InvoiceResponse(BaseModel):
    id: str = Field(alias="_id")
    invoice_number: str
    order_id: Optional[str] = None  # Optional for standalone invoices
    order_number: Optional[str] = None  # Optional for standalone invoices
    customer_id: str
    customer_name: str
    customer_email: str
    billing_address: Optional[Dict[str, str]] = None  # Optional for standalone invoices
    invoice_date: date
    due_date: date
    payment_terms: Optional[str] = None
    line_items: Optional[List[Any]] = None  # Line items for the invoice
    subtotal: float
    tax_amount: float
    total_amount: float
    paid_amount: float = 0
    balance_due: float
    late_fee_amount: float = 0
    late_fee_rate: Optional[float] = None
    notes: Optional[str] = None
    status: InvoiceStatus
    payment_status: Optional[PaymentStatus] = None  # Payment status
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: Optional[str] = None

    @field_validator('id', mode='before')
    @classmethod
    def convert_objectid_to_str(cls, v):
        """Convert ObjectId to string"""
        if hasattr(v, '__str__'):
            return str(v)
        return v

    class Config:
        populate_by_name = True


class InvoiceInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    invoice_number: str
    order_id: Optional[str] = None  # Optional for standalone invoices
    order_number: Optional[str] = None  # Optional for standalone invoices
    customer_id: str
    customer_name: str
    customer_email: str
    billing_address: Optional[Dict[str, str]] = None  # Optional for standalone invoices
    invoice_date: date
    due_date: date
    payment_terms: Optional[str] = None
    line_items: Optional[List[Any]] = None  # Line items for the invoice
    subtotal: float
    tax_amount: float
    total_amount: float
    paid_amount: float = 0
    balance_due: float
    late_fee_amount: float = 0
    late_fee_rate: Optional[float] = None
    notes: Optional[str] = None
    status: InvoiceStatus = InvoiceStatus.DRAFT
    payment_status: Optional[PaymentStatus] = None  # Payment status
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_by: Optional[str] = None

    class Config:
        populate_by_name = True


# Payment Models
class PaymentCreate(BaseModel):
    invoice_id: str
    payment_date: Optional[date] = Field(default_factory=date.today)
    amount: float = Field(..., gt=0)
    payment_method: PaymentMethod
    payment_reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentUpdate(BaseModel):
    payment_date: Optional[date] = None
    amount: Optional[float] = Field(None, gt=0)
    payment_method: Optional[PaymentMethod] = None
    payment_reference: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[PaymentStatus] = None


class PaymentResponse(BaseModel):
    id: str = Field(alias="_id")
    payment_reference: str
    invoice_id: str
    invoice_number: str
    customer_id: str
    customer_name: str
    payment_date: date
    amount: float
    payment_method: PaymentMethod
    notes: Optional[str] = None
    status: PaymentStatus
    processed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: Optional[str] = None

    class Config:
        populate_by_name = True


class PaymentInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    payment_reference: str
    invoice_id: str
    invoice_number: str
    customer_id: str
    customer_name: str
    payment_date: date
    amount: float
    payment_method: PaymentMethod
    notes: Optional[str] = None
    status: PaymentStatus = PaymentStatus.PENDING
    processed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_by: Optional[str] = None

    class Config:
        populate_by_name = True
