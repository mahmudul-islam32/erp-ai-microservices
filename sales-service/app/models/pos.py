from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from enum import Enum

from .payment import PaymentMethod, PaymentCreate, PaymentResponse
from .sales_order import OrderItemCreate, SalesOrderResponse
from .invoice import InvoiceResponse
from .customer import CustomerResponse


class POSSessionStatus(str, Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    SUSPENDED = "suspended"


class TransactionType(str, Enum):
    SALE = "sale"
    RETURN = "return"
    VOID = "void"
    NO_SALE = "no_sale"


class POSLineItem(BaseModel):
    """POS specific line item with additional fields"""
    product_id: str
    product_name: str
    product_sku: str
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)
    discount_percentage: float = Field(default=0, ge=0, le=100)
    discount_amount: float = Field(default=0, ge=0)
    tax_rate: float = Field(default=0, ge=0)
    tax_amount: float = Field(default=0, ge=0)
    total_price: float = Field(ge=0)
    notes: Optional[str] = None
    
    # POS specific fields
    is_taxable: bool = True
    category: Optional[str] = None
    barcode: Optional[str] = None


class POSPayment(BaseModel):
    """Payment information for POS transaction"""
    payment_method: PaymentMethod
    amount: float = Field(gt=0)
    
    # Method-specific details
    cash_tendered: Optional[float] = None
    change_given: Optional[float] = None
    card_last_four: Optional[str] = None
    authorization_code: Optional[str] = None
    reference_number: Optional[str] = None
    
    # Additional fields
    currency: str = "USD"
    exchange_rate: float = 1.0
    tip_amount: float = 0.0
    fee_amount: float = 0.0


class POSCustomer(BaseModel):
    """Customer information for POS (can be minimal for walk-ins)"""
    customer_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_walk_in: bool = True


class POSTransactionCreate(BaseModel):
    """Create a complete POS transaction"""
    # Customer information
    customer: POSCustomer
    
    # Line items
    line_items: List[POSLineItem] = Field(min_items=1)
    
    # Payments (can be split payment)
    payments: List[POSPayment] = Field(min_items=1)
    
    # Transaction details
    transaction_type: TransactionType = TransactionType.SALE
    subtotal: float = Field(ge=0)
    total_discount: float = Field(default=0, ge=0)
    total_tax: float = Field(default=0, ge=0)
    total_amount: float = Field(gt=0)
    
    # POS specific fields
    terminal_id: Optional[str] = None
    session_id: Optional[str] = None
    receipt_number: Optional[str] = None
    
    # Additional fields
    notes: Optional[str] = None
    reference_order_id: Optional[str] = None  # If converting from existing order
    
    @validator('total_amount')
    def validate_total_amount(cls, v, values):
        """Ensure total amount matches line items calculation"""
        if 'line_items' in values:
            calculated_total = sum(item.total_price for item in values['line_items'])
            if abs(calculated_total - v) > 0.01:  # Allow small rounding differences
                raise ValueError("Total amount must match sum of line items")
        return v
    
    @validator('payments')
    def validate_payment_total(cls, v, values):
        """Ensure payment total matches transaction total"""
        if 'total_amount' in values:
            payment_total = sum(payment.amount for payment in v)
            if abs(payment_total - values['total_amount']) > 0.01:
                raise ValueError("Payment total must match transaction total")
        return v


class POSTransactionResponse(BaseModel):
    """POS Transaction response"""
    id: str
    transaction_number: str
    transaction_type: TransactionType
    
    # Related entities
    order: Optional[SalesOrderResponse] = None
    invoice: Optional[InvoiceResponse] = None
    customer: Optional[CustomerResponse] = None
    
    # Transaction details
    line_items: List[POSLineItem]
    payments: List[PaymentResponse]
    
    # Amounts
    subtotal: float
    total_discount: float
    total_tax: float
    total_amount: float
    
    # POS fields
    terminal_id: Optional[str] = None
    session_id: Optional[str] = None
    cashier_id: str
    cashier_name: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    processed_at: Optional[datetime] = None
    
    # Status
    status: str
    receipt_number: Optional[str] = None
    
    # Additional info
    notes: Optional[str] = None
    void_reason: Optional[str] = None
    refunded_amount: float = 0.0
    
    class Config:
        from_attributes = True


class QuickSaleCreate(BaseModel):
    """Quick sale for walk-in customers with minimal data"""
    # Items (can use product ID or quick item entry)
    items: List[Dict[str, Any]]  # Flexible structure for different item types
    
    # Payment
    payment_method: PaymentMethod
    payment_amount: float = Field(gt=0)
    cash_tendered: Optional[float] = None
    
    # Customer (optional for walk-ins)
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    
    # Transaction details
    subtotal: float = Field(ge=0)
    tax_rate: float = Field(default=0.0875, ge=0, le=1)
    discount_amount: float = Field(default=0, ge=0)
    
    # POS fields
    terminal_id: Optional[str] = None
    notes: Optional[str] = None


class QuickSaleResponse(BaseModel):
    """Quick sale response"""
    transaction: POSTransactionResponse
    receipt: 'POSReceiptResponse'
    change_due: float = 0.0
    
    class Config:
        from_attributes = True


class POSSessionCreate(BaseModel):
    """Create a new POS session"""
    terminal_id: str
    opening_cash_amount: float = Field(ge=0)
    notes: Optional[str] = None


class POSSessionResponse(BaseModel):
    """POS Session response"""
    id: str
    session_number: str
    terminal_id: str
    cashier_id: str
    cashier_name: Optional[str] = None
    
    # Session timing
    started_at: datetime
    ended_at: Optional[datetime] = None
    
    # Cash amounts
    opening_cash_amount: float
    closing_cash_amount: Optional[float] = None
    expected_cash_amount: Optional[float] = None
    cash_variance: Optional[float] = None
    
    # Status
    status: POSSessionStatus
    
    # Summary data (filled when session is active)
    transaction_count: int = 0
    total_sales: float = 0.0
    total_tax: float = 0.0
    total_discounts: float = 0.0
    
    # Notes
    opening_notes: Optional[str] = None
    closing_notes: Optional[str] = None
    
    class Config:
        from_attributes = True


class POSSessionSummary(BaseModel):
    """Detailed POS session summary"""
    session: POSSessionResponse
    
    # Transaction breakdown
    sales_count: int
    return_count: int
    void_count: int
    no_sale_count: int
    
    # Payment method breakdown
    cash_sales: float
    card_sales: float
    other_sales: float
    
    # Time analysis
    first_transaction: Optional[datetime] = None
    last_transaction: Optional[datetime] = None
    active_duration: Optional[str] = None  # Human readable duration
    
    # Top products
    top_products: List[Dict[str, Any]] = []
    
    # Hourly breakdown
    hourly_sales: List[Dict[str, Any]] = []
    
    class Config:
        from_attributes = True


class POSReceiptResponse(BaseModel):
    """Receipt data for printing"""
    # Receipt header
    store_name: str
    store_address: Optional[str] = None
    store_phone: Optional[str] = None
    receipt_number: str
    
    # Transaction info
    transaction_id: str
    transaction_date: datetime
    cashier_name: Optional[str] = None
    terminal_id: Optional[str] = None
    
    # Customer info (if available)
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    
    # Items
    line_items: List[POSLineItem]
    
    # Totals
    subtotal: float
    total_discount: float
    total_tax: float
    total_amount: float
    
    # Payments
    payments: List[Dict[str, Any]]
    change_given: float = 0.0
    
    # Footer
    thank_you_message: Optional[str] = None
    return_policy: Optional[str] = None
    
    # Receipt formatting options
    print_width: int = 40  # Characters
    logo_url: Optional[str] = None
    
    class Config:
        from_attributes = True


# Update forward references
QuickSaleResponse.model_rebuild()
