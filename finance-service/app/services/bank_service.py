from app.database import get_database
from app.models.bank import BankAccount, BankAccountCreate, BankTransaction, BankTransactionCreate
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class BankService:
    """Service for managing bank accounts and transactions"""

    @staticmethod
    async def create_bank_account(account_data: BankAccountCreate) -> BankAccount:
        """Create a new bank account"""
        db = get_database()
        
        account_doc = {
            **account_data.model_dump(),
            "current_balance": account_data.opening_balance,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.bank_accounts.insert_one(account_doc)
        account_doc["_id"] = str(result.inserted_id)
        
        logger.info(f"Created bank account: {account_data.account_name}")
        return BankAccount(**account_doc)

    @staticmethod
    async def get_bank_account(account_id: str) -> Optional[BankAccount]:
        """Get bank account by ID"""
        db = get_database()
        account = await db.bank_accounts.find_one({"_id": ObjectId(account_id)})
        
        if account:
            account["_id"] = str(account["_id"])
            return BankAccount(**account)
        return None

    @staticmethod
    async def list_bank_accounts(is_active: Optional[bool] = None) -> List[BankAccount]:
        """List bank accounts"""
        db = get_database()
        
        query = {}
        if is_active is not None:
            query["is_active"] = is_active
        
        cursor = db.bank_accounts.find(query).sort("account_name", 1)
        accounts = await cursor.to_list(length=100)
        
        for account in accounts:
            account["_id"] = str(account["_id"])
        
        return [BankAccount(**account) for account in accounts]

    @staticmethod
    async def create_bank_transaction(transaction_data: BankTransactionCreate) -> BankTransaction:
        """Create a bank transaction"""
        db = get_database()
        
        # Get current balance
        account = await BankService.get_bank_account(transaction_data.bank_account_id)
        if not account:
            raise ValueError("Bank account not found")
        
        new_balance = account.current_balance + transaction_data.amount
        
        transaction_doc = {
            **transaction_data.model_dump(),
            "balance": new_balance,
            "created_at": datetime.utcnow()
        }
        
        result = await db.bank_transactions.insert_one(transaction_doc)
        transaction_doc["_id"] = str(result.inserted_id)
        
        # Update bank account balance
        await db.bank_accounts.update_one(
            {"_id": ObjectId(transaction_data.bank_account_id)},
            {
                "$set": {
                    "current_balance": new_balance,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"Created bank transaction for account: {account.account_name}")
        return BankTransaction(**transaction_doc)

    @staticmethod
    async def list_bank_transactions(
        bank_account_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[BankTransaction]:
        """List bank transactions"""
        db = get_database()
        
        query = {}
        if bank_account_id:
            query["bank_account_id"] = bank_account_id
        
        cursor = db.bank_transactions.find(query).sort("transaction_date", -1).skip(skip).limit(limit)
        transactions = await cursor.to_list(length=limit)
        
        for transaction in transactions:
            transaction["_id"] = str(transaction["_id"])
        
        return [BankTransaction(**transaction) for transaction in transactions]

