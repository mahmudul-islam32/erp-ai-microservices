from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum
from decimal import Decimal


class PaymentMethod(str, Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PAYPAL = "paypal"
    BANK_TRANSFER = "bank_transfer"
    CHECK = "check"
    DIGITAL_WALLET = "digital_wallet"
    STORE_CREDIT = "store_credit"
    GIFT_CARD = "gift_card"
    OTHER = "other"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"
    AUTHORIZED = "authorized"  # For card payments
    CAPTURED = "captured"      # For card payments


class CardType(str, Enum):
    VISA = "visa"
    MASTERCARD = "mastercard"
    AMERICAN_EXPRESS = "american_express"
    DISCOVER = "discover"
    OTHER = "other"


class TransactionType(str, Enum):
    PAYMENT = "payment"
    REFUND = "refund"
    PARTIAL_REFUND = "partial_refund"
    AUTHORIZATION = "authorization"
    CAPTURE = "capture"
    VOID = "void"


# Card Payment Details
class CardPaymentDetails(BaseModel):
    card_type: Optional[CardType] = None
    last_four_digits: Optional[str] = Field(None, max_length=4)
    expiry_month: Optional[int] = Field(None, ge=1, le=12)
    expiry_year: Optional[int] = Field(None, ge=2023)
    cardholder_name: Optional[str] = None
    authorization_code: Optional[str] = None
    transaction_id: Optional[str] = None
    gateway_response: Optional[Dict[str, Any]] = None


# Cash Payment Details
class CashPaymentDetails(BaseModel):
    amount_tendered: float = Field(..., gt=0)
    change_given: float = Field(0, ge=0)
    currency: str = Field("USD", max_length=3)
    cash_drawer_id: Optional[str] = None
    cashier_id: Optional[str] = None


# PayPal Payment Details
class PayPalPaymentDetails(BaseModel):
    paypal_transaction_id: Optional[str] = None
    payer_email: Optional[str] = None
    payer_id: Optional[str] = None
    gateway_response: Optional[Dict[str, Any]] = None


# Generic Payment Gateway Details
class PaymentGatewayDetails(BaseModel):
    gateway_name: str
    transaction_id: Optional[str] = None
    reference_number: Optional[str] = None
    gateway_response: Optional[Dict[str, Any]] = None
    processing_fee: Optional[float] = Field(None, ge=0)


# Main Payment Models
class PaymentCreate(BaseModel):
    order_id: Optional[str] = None  # For POS, payment can be made directly
    invoice_id: Optional[str] = None  # Payment can be linked to invoice
    customer_id: Optional[str] = None  # For walk-in customers, can be None
    payment_method: PaymentMethod
    amount: float = Field(..., gt=0)
    payment_date: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    # Payment method specific details
    card_details: Optional[CardPaymentDetails] = None
    cash_details: Optional[CashPaymentDetails] = None
    paypal_details: Optional[PayPalPaymentDetails] = None
    gateway_details: Optional[PaymentGatewayDetails] = None
    
    # Additional fields
    currency: str = Field("USD", max_length=3)
    exchange_rate: Optional[float] = Field(None, gt=0)
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    receipt_email: Optional[str] = None
    
    # POS specific fields
    terminal_id: Optional[str] = None
    cashier_id: Optional[str] = None
    shift_id: Optional[str] = None

    @field_validator('card_details')
    @classmethod
    def validate_card_details(cls, v, values):
        if 'payment_method' in values.data and values.data['payment_method'] in [PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD]:
            if not v:
                raise ValueError("Card details are required for card payments")
        return v

    @field_validator('cash_details')
    @classmethod
    def validate_cash_details(cls, v, values):
        if 'payment_method' in values.data and values.data['payment_method'] == PaymentMethod.CASH:
            if not v:
                raise ValueError("Cash details are required for cash payments")
        return v


class PaymentUpdate(BaseModel):
    payment_method: Optional[PaymentMethod] = None
    amount: Optional[float] = Field(None, gt=0)
    status: Optional[PaymentStatus] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    
    # Update card details
    card_details: Optional[CardPaymentDetails] = None
    cash_details: Optional[CashPaymentDetails] = None
    paypal_details: Optional[PayPalPaymentDetails] = None
    gateway_details: Optional[PaymentGatewayDetails] = None


class PaymentResponse(BaseModel):
    id: str = Field(alias="_id")
    payment_number: str
    order_id: Optional[str] = None
    order_number: Optional[str] = None
    invoice_id: Optional[str] = None
    invoice_number: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    
    payment_method: PaymentMethod
    amount: float
    currency: str = "USD"
    exchange_rate: Optional[float] = None
    status: PaymentStatus
    transaction_type: TransactionType = TransactionType.PAYMENT
    
    # Payment method specific details
    card_details: Optional[CardPaymentDetails] = None
    cash_details: Optional[CashPaymentDetails] = None
    paypal_details: Optional[PayPalPaymentDetails] = None
    gateway_details: Optional[PaymentGatewayDetails] = None
    
    # Timestamps
    payment_date: datetime
    processed_at: Optional[datetime] = None
    authorized_at: Optional[datetime] = None
    captured_at: Optional[datetime] = None
    
    # Additional info
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    receipt_email: Optional[str] = None
    receipt_url: Optional[str] = None
    
    # POS specific fields
    terminal_id: Optional[str] = None
    cashier_id: Optional[str] = None
    cashier_name: Optional[str] = None
    shift_id: Optional[str] = None
    
    # Refund information
    refunded_amount: float = 0
    refund_transactions: List[str] = []
    
    # Audit fields
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


class PaymentInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    payment_number: str
    order_id: Optional[str] = None
    order_number: Optional[str] = None
    invoice_id: Optional[str] = None
    invoice_number: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    
    payment_method: PaymentMethod
    amount: float
    currency: str = "USD"
    exchange_rate: Optional[float] = None
    status: PaymentStatus = PaymentStatus.PENDING
    transaction_type: TransactionType = TransactionType.PAYMENT
    
    # Payment method specific details
    card_details: Optional[CardPaymentDetails] = None
    cash_details: Optional[CashPaymentDetails] = None
    paypal_details: Optional[PayPalPaymentDetails] = None
    gateway_details: Optional[PaymentGatewayDetails] = None
    
    # Timestamps
    payment_date: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None
    authorized_at: Optional[datetime] = None
    captured_at: Optional[datetime] = None
    
    # Additional info
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    receipt_email: Optional[str] = None
    receipt_url: Optional[str] = None
    
    # POS specific fields
    terminal_id: Optional[str] = None
    cashier_id: Optional[str] = None
    cashier_name: Optional[str] = None
    shift_id: Optional[str] = None
    
    # Refund information
    refunded_amount: float = 0
    refund_transactions: List[str] = []
    
    # Audit fields
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_by: Optional[str] = None

    class Config:
        populate_by_name = True


# Refund Models
class RefundCreate(BaseModel):
    payment_id: str
    amount: float = Field(..., gt=0)
    reason: str
    refund_method: Optional[PaymentMethod] = None  # If different from original payment
    notes: Optional[str] = None


class RefundResponse(BaseModel):
    id: str = Field(alias="_id")
    refund_number: str
    payment_id: str
    payment_number: str
    order_id: Optional[str] = None
    customer_id: Optional[str] = None
    amount: float
    reason: str
    refund_method: PaymentMethod
    status: PaymentStatus
    processed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    created_by: str

    @field_validator('id', mode='before')
    @classmethod
    def convert_objectid_to_str(cls, v):
        """Convert ObjectId to string"""
        if hasattr(v, '__str__'):
            return str(v)
        return v

    class Config:
        populate_by_name = True


# POS Transaction Models for complete transactions
class POSTransactionCreate(BaseModel):
    customer_id: Optional[str] = None  # Walk-in customers
    line_items: List[Dict[str, Any]]  # Product items
    payments: List[PaymentCreate]  # Multiple payment methods allowed
    subtotal: float = Field(..., ge=0)
    tax_amount: float = Field(0, ge=0)
    discount_amount: float = Field(0, ge=0)
    total_amount: float = Field(..., gt=0)
    terminal_id: Optional[str] = None
    cashier_id: Optional[str] = None
    shift_id: Optional[str] = None
    notes: Optional[str] = None


class POSTransactionResponse(BaseModel):
    id: str = Field(alias="_id")
    transaction_number: str
    order_id: str
    customer_id: Optional[str] = None
    payments: List[PaymentResponse]
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    change_due: float = 0
    terminal_id: Optional[str] = None
    cashier_id: Optional[str] = None
    cashier_name: Optional[str] = None
    shift_id: Optional[str] = None
    transaction_date: datetime
    receipt_url: Optional[str] = None
    created_at: datetime

    @field_validator('id', mode='before')
    @classmethod
    def convert_objectid_to_str(cls, v):
        """Convert ObjectId to string"""
        if hasattr(v, '__str__'):
            return str(v)
        return v

    class Config:
        populate_by_name = True
