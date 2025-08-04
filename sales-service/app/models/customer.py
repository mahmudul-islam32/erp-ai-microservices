from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum
from decimal import Decimal


class CustomerStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PROSPECT = "prospect"


class CustomerType(str, Enum):
    INDIVIDUAL = "individual"
    BUSINESS = "business"
    GOVERNMENT = "government"


class PaymentTerms(str, Enum):
    NET_15 = "net_15"
    NET_30 = "net_30"
    NET_60 = "net_60"
    NET_90 = "net_90"
    COD = "cod"  # Cash on Delivery
    PREPAID = "prepaid"


# Address Model
class Address(BaseModel):
    street: str
    city: str
    state: str
    postal_code: str
    country: str = "USA"


# Customer Models
class CustomerCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    company_name: Optional[str] = Field(None, max_length=100)
    customer_type: CustomerType = CustomerType.INDIVIDUAL
    email: EmailStr
    phone: str
    billing_address: Address
    shipping_address: Optional[Address] = None
    payment_terms: PaymentTerms = PaymentTerms.NET_30
    credit_limit: Optional[float] = Field(None, ge=0)
    tax_id: Optional[str] = None
    notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    company_name: Optional[str] = Field(None, max_length=100)
    customer_type: Optional[CustomerType] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    billing_address: Optional[Address] = None
    shipping_address: Optional[Address] = None
    payment_terms: Optional[PaymentTerms] = None
    credit_limit: Optional[float] = Field(None, ge=0)
    tax_id: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[CustomerStatus] = None


class CustomerResponse(BaseModel):
    id: str = Field(alias="_id")
    customer_code: str
    first_name: str
    last_name: str
    company_name: Optional[str] = None
    customer_type: CustomerType
    email: EmailStr
    phone: str
    billing_address: Address
    shipping_address: Optional[Address] = None
    payment_terms: PaymentTerms
    credit_limit: Optional[float] = None
    credit_used: float = 0.0
    tax_id: Optional[str] = None
    notes: Optional[str] = None
    status: CustomerStatus
    total_orders: int = 0
    total_spent: float = 0.0
    last_order_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class CustomerInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    customer_code: str
    first_name: str
    last_name: str
    company_name: Optional[str] = None
    customer_type: CustomerType
    email: EmailStr
    phone: str
    billing_address: Address
    shipping_address: Optional[Address] = None
    payment_terms: PaymentTerms
    credit_limit: Optional[float] = None
    credit_used: float = 0.0
    tax_id: Optional[str] = None
    notes: Optional[str] = None
    status: CustomerStatus = CustomerStatus.ACTIVE
    total_orders: int = 0
    total_spent: float = 0.0
    last_order_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
