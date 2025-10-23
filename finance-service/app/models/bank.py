from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum
from bson import ObjectId


class BankAccountType(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT_CARD = "credit_card"
    LINE_OF_CREDIT = "line_of_credit"


class BankAccountBase(BaseModel):
    account_name: str
    bank_name: str
    account_number: str
    routing_number: Optional[str] = None
    account_type: BankAccountType
    currency: str = "USD"
    opening_balance: float = 0.0
    is_active: bool = True
    gl_account_id: str = Field(..., description="Linked GL account")


class BankAccountCreate(BankAccountBase):
    pass


class BankAccount(BankAccountBase):
    id: str = Field(alias="_id")
    current_balance: float
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class BankTransactionBase(BaseModel):
    bank_account_id: str
    transaction_date: date
    description: str
    amount: float
    reference: Optional[str] = None
    is_reconciled: bool = False
    matched_journal_entry_id: Optional[str] = None


class BankTransactionCreate(BankTransactionBase):
    pass


class BankTransaction(BankTransactionBase):
    id: str = Field(alias="_id")
    balance: float
    created_at: datetime
    reconciled_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class BankReconciliationBase(BaseModel):
    bank_account_id: str
    period_start: date
    period_end: date
    statement_balance: float
    book_balance: float
    reconciled_transactions: List[str] = Field(default_factory=list)
    outstanding_deposits: float = 0.0
    outstanding_checks: float = 0.0
    adjustments: float = 0.0


class BankReconciliationCreate(BankReconciliationBase):
    pass


class BankReconciliation(BankReconciliationBase):
    id: str = Field(alias="_id")
    reconciled_balance: float
    is_balanced: bool
    variance: float
    reconciled_by: str
    reconciled_at: datetime
    notes: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }

