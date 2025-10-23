from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from bson import ObjectId


class CurrencyBase(BaseModel):
    code: str = Field(..., description="Currency code (USD, EUR, GBP, etc.)")
    name: str
    symbol: str
    is_active: bool = True


class CurrencyCreate(CurrencyBase):
    pass


class Currency(CurrencyBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class CurrencyRateBase(BaseModel):
    base_currency: str = "USD"
    target_currency: str
    exchange_rate: float
    rate_date: date
    is_active: bool = True


class CurrencyRateCreate(CurrencyRateBase):
    pass


class CurrencyRate(CurrencyRateBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


class CurrencyConversion(BaseModel):
    from_currency: str
    to_currency: str
    amount: float
    converted_amount: float
    exchange_rate: float
    conversion_date: date

