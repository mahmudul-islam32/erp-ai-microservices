from app.database import get_database
from app.models.currency import Currency, CurrencyCreate, CurrencyRate, CurrencyRateCreate, CurrencyConversion
from typing import List, Optional
from datetime import datetime, date
from bson import ObjectId
import httpx
import logging

logger = logging.getLogger(__name__)


class CurrencyService:
    """Service for managing currencies and exchange rates"""

    @staticmethod
    async def create_currency(currency_data: CurrencyCreate) -> Currency:
        """Create a new currency"""
        db = get_database()
        
        # Check if currency already exists
        existing = await db.currencies.find_one({"code": currency_data.code})
        if existing:
            raise ValueError(f"Currency {currency_data.code} already exists")
        
        currency_doc = {
            **currency_data.model_dump(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.currencies.insert_one(currency_doc)
        currency_doc["_id"] = str(result.inserted_id)
        
        return Currency(**currency_doc)

    @staticmethod
    async def list_currencies(is_active: Optional[bool] = None) -> List[Currency]:
        """List currencies"""
        db = get_database()
        
        query = {}
        if is_active is not None:
            query["is_active"] = is_active
        
        cursor = db.currencies.find(query).sort("code", 1)
        currencies = await cursor.to_list(length=200)
        
        for currency in currencies:
            currency["_id"] = str(currency["_id"])
        
        return [Currency(**currency) for currency in currencies]

    @staticmethod
    async def create_currency_rate(rate_data: CurrencyRateCreate) -> CurrencyRate:
        """Create or update currency exchange rate"""
        db = get_database()
        
        # Deactivate previous rates for this currency pair
        await db.currency_rates.update_many(
            {
                "base_currency": rate_data.base_currency,
                "target_currency": rate_data.target_currency,
                "is_active": True
            },
            {"$set": {"is_active": False}}
        )
        
        rate_doc = {
            **rate_data.model_dump(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.currency_rates.insert_one(rate_doc)
        rate_doc["_id"] = str(result.inserted_id)
        
        return CurrencyRate(**rate_doc)

    @staticmethod
    async def get_exchange_rate(
        from_currency: str,
        to_currency: str,
        rate_date: Optional[date] = None
    ) -> Optional[float]:
        """Get exchange rate between two currencies"""
        db = get_database()
        
        if from_currency == to_currency:
            return 1.0
        
        query = {
            "base_currency": from_currency,
            "target_currency": to_currency,
            "is_active": True
        }
        
        if rate_date:
            query["rate_date"] = {"$lte": rate_date}
        
        rate = await db.currency_rates.find_one(
            query,
            sort=[("rate_date", -1)]
        )
        
        if rate:
            return rate["exchange_rate"]
        
        return None

    @staticmethod
    async def convert_currency(
        amount: float,
        from_currency: str,
        to_currency: str,
        conversion_date: Optional[date] = None
    ) -> CurrencyConversion:
        """Convert amount from one currency to another"""
        if conversion_date is None:
            conversion_date = date.today()
        
        exchange_rate = await CurrencyService.get_exchange_rate(from_currency, to_currency, conversion_date)
        
        if exchange_rate is None:
            raise ValueError(f"Exchange rate not found for {from_currency} to {to_currency}")
        
        converted_amount = amount * exchange_rate
        
        return CurrencyConversion(
            from_currency=from_currency,
            to_currency=to_currency,
            amount=amount,
            converted_amount=converted_amount,
            exchange_rate=exchange_rate,
            conversion_date=conversion_date
        )

    @staticmethod
    async def seed_default_currencies():
        """Seed default currencies"""
        db = get_database()
        
        count = await db.currencies.count_documents({})
        if count > 0:
            return
        
        default_currencies = [
            {"code": "USD", "name": "US Dollar", "symbol": "$"},
            {"code": "EUR", "name": "Euro", "symbol": "€"},
            {"code": "GBP", "name": "British Pound", "symbol": "£"},
            {"code": "JPY", "name": "Japanese Yen", "symbol": "¥"},
            {"code": "CAD", "name": "Canadian Dollar", "symbol": "C$"},
            {"code": "AUD", "name": "Australian Dollar", "symbol": "A$"},
            {"code": "CHF", "name": "Swiss Franc", "symbol": "CHF"},
            {"code": "CNY", "name": "Chinese Yuan", "symbol": "¥"},
            {"code": "INR", "name": "Indian Rupee", "symbol": "₹"},
        ]
        
        for currency_data in default_currencies:
            currency_doc = {
                **currency_data,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.currencies.insert_one(currency_doc)
        
        logger.info(f"Seeded {len(default_currencies)} default currencies")

