from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date
from enum import Enum
from bson import ObjectId


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    SENT = "sent"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class InvoiceLineItem(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float
    total_amount: float
    account_id: str = Field(..., description="GL account for this line item")
    account_code: str
    cost_center: Optional[str] = None
    tax_amount: float = 0.0


class VendorInvoiceBase(BaseModel):
    vendor_id: str
    vendor_name: str
    invoice_number: str
    invoice_date: date
    due_date: date
    line_items: List[InvoiceLineItem]
    subtotal: float
    tax_amount: float
    total_amount: float
    notes: Optional[str] = None
    attachments: List[str] = Field(default_factory=list)


class VendorInvoiceCreate(VendorInvoiceBase):
    pass


class VendorInvoice(VendorInvoiceBase):
    id: str = Field(alias="_id")
    status: InvoiceStatus = InvoiceStatus.PENDING
    paid_amount: float = 0.0
    balance_due: float
    payment_history: List[dict] = Field(default_factory=list)
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class CustomerInvoiceBase(BaseModel):
    customer_id: str
    customer_name: str
    invoice_number: str
    invoice_date: date
    due_date: date
    sales_order_id: Optional[str] = None
    line_items: List[InvoiceLineItem]
    subtotal: float
    tax_amount: float
    total_amount: float
    notes: Optional[str] = None


class CustomerInvoiceCreate(CustomerInvoiceBase):
    pass


class CustomerInvoice(CustomerInvoiceBase):
    id: str = Field(alias="_id")
    status: InvoiceStatus = InvoiceStatus.DRAFT
    paid_amount: float = 0.0
    balance_due: float
    payment_history: List[dict] = Field(default_factory=list)
    created_by: str
    created_at: datetime
    updated_at: datetime
    sent_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

