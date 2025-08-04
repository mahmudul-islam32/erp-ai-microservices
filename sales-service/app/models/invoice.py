from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    PAID = "paid"
    PARTIAL_PAID = "partial_paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


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


# Invoice Models
class InvoiceCreate(BaseModel):
    order_id: str
    invoice_date: Optional[date] = Field(default_factory=date.today)
    due_date: date
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
    order_id: str
    order_number: str
    customer_id: str
    customer_name: str
    customer_email: str
    billing_address: Dict[str, str]
    invoice_date: date
    due_date: date
    payment_terms: Optional[str] = None
    subtotal: float
    tax_amount: float
    total_amount: float
    paid_amount: float = 0
    balance_due: float
    late_fee_amount: float = 0
    late_fee_rate: Optional[float] = None
    notes: Optional[str] = None
    status: InvoiceStatus
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: Optional[str] = None

    class Config:
        populate_by_name = True


class InvoiceInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    invoice_number: str
    order_id: str
    order_number: str
    customer_id: str
    customer_name: str
    customer_email: str
    billing_address: Dict[str, str]
    invoice_date: date
    due_date: date
    payment_terms: Optional[str] = None
    subtotal: float
    tax_amount: float
    total_amount: float
    paid_amount: float = 0
    balance_due: float
    late_fee_amount: float = 0
    late_fee_rate: Optional[float] = None
    notes: Optional[str] = None
    status: InvoiceStatus = InvoiceStatus.DRAFT
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
