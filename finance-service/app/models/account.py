from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
from bson import ObjectId


class AccountType(str, Enum):
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"


class NormalBalance(str, Enum):
    DEBIT = "debit"
    CREDIT = "credit"


class AccountBase(BaseModel):
    account_code: str = Field(..., description="Unique account code (e.g., 1000, 1100)")
    account_name: str = Field(..., description="Account name")
    account_type: AccountType
    parent_account: Optional[str] = Field(None, description="Parent account code for hierarchy")
    normal_balance: NormalBalance
    description: Optional[str] = None
    is_active: bool = True
    cost_center: Optional[str] = None


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    account_name: Optional[str] = None
    parent_account: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    cost_center: Optional[str] = None


class Account(AccountBase):
    id: str = Field(alias="_id")
    balance: float = 0.0
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

