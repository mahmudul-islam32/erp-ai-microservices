from app.database import get_database
from app.models.account import Account, AccountCreate, AccountUpdate, AccountType
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class AccountService:
    """Service for managing Chart of Accounts"""

    @staticmethod
    async def create_account(account_data: AccountCreate) -> Account:
        """Create a new account"""
        db = get_database()
        
        # Check if account code already exists
        existing = await db.accounts.find_one({"account_code": account_data.account_code})
        if existing:
            raise ValueError(f"Account code {account_data.account_code} already exists")
        
        # If parent account is specified, verify it exists
        if account_data.parent_account:
            parent = await db.accounts.find_one({"account_code": account_data.parent_account})
            if not parent:
                raise ValueError(f"Parent account {account_data.parent_account} not found")
        
        account_doc = {
            **account_data.model_dump(),
            "balance": 0.0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.accounts.insert_one(account_doc)
        account_doc["_id"] = str(result.inserted_id)
        
        logger.info(f"Created account: {account_data.account_code}")
        return Account(**account_doc)

    @staticmethod
    async def get_account(account_id: str) -> Optional[Account]:
        """Get account by ID"""
        db = get_database()
        account = await db.accounts.find_one({"_id": ObjectId(account_id)})
        
        if account:
            account["_id"] = str(account["_id"])
            return Account(**account)
        return None

    @staticmethod
    async def get_account_by_code(account_code: str) -> Optional[Account]:
        """Get account by code"""
        db = get_database()
        account = await db.accounts.find_one({"account_code": account_code})
        
        if account:
            account["_id"] = str(account["_id"])
            return Account(**account)
        return None

    @staticmethod
    async def list_accounts(
        account_type: Optional[AccountType] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Account]:
        """List accounts with filters"""
        db = get_database()
        
        query: Dict[str, Any] = {}
        if account_type:
            query["account_type"] = account_type
        if is_active is not None:
            query["is_active"] = is_active
        
        cursor = db.accounts.find(query).sort("account_code", 1).skip(skip).limit(limit)
        accounts = await cursor.to_list(length=limit)
        
        for account in accounts:
            account["_id"] = str(account["_id"])
        
        return [Account(**account) for account in accounts]

    @staticmethod
    async def get_account_hierarchy() -> List[Dict[str, Any]]:
        """Get account hierarchy tree"""
        db = get_database()
        
        # Get all accounts
        cursor = db.accounts.find({"is_active": True}).sort("account_code", 1)
        accounts = await cursor.to_list(length=1000)
        
        # Build hierarchy
        account_map = {}
        root_accounts = []
        
        for account in accounts:
            account["_id"] = str(account["_id"])
            account["children"] = []
            account_map[account["account_code"]] = account
        
        # Build tree structure
        for account in accounts:
            if account.get("parent_account"):
                parent = account_map.get(account["parent_account"])
                if parent:
                    parent["children"].append(account)
            else:
                root_accounts.append(account)
        
        return root_accounts

    @staticmethod
    async def update_account(account_id: str, account_data: AccountUpdate) -> Optional[Account]:
        """Update account"""
        db = get_database()
        
        update_data = {k: v for k, v in account_data.model_dump(exclude_unset=True).items() if v is not None}
        if not update_data:
            return await AccountService.get_account(account_id)
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.accounts.update_one(
            {"_id": ObjectId(account_id)},
            {"$set": update_data}
        )
        
        if result.modified_count:
            return await AccountService.get_account(account_id)
        return None

    @staticmethod
    async def delete_account(account_id: str) -> bool:
        """Soft delete account (mark as inactive)"""
        db = get_database()
        
        # Check if account has transactions
        transactions_count = await db.journal_line_items.count_documents({"account_id": account_id})
        if transactions_count > 0:
            raise ValueError("Cannot delete account with existing transactions. Mark as inactive instead.")
        
        result = await db.accounts.update_one(
            {"_id": ObjectId(account_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        return result.modified_count > 0

    @staticmethod
    async def update_account_balance(account_id: str, amount: float, is_debit: bool):
        """Update account balance based on normal balance"""
        db = get_database()
        account = await AccountService.get_account(account_id)
        
        if not account:
            raise ValueError(f"Account {account_id} not found")
        
        # Determine if this increases or decreases the balance
        if account.normal_balance == "debit":
            balance_change = amount if is_debit else -amount
        else:
            balance_change = amount if not is_debit else -amount
        
        await db.accounts.update_one(
            {"_id": ObjectId(account_id)},
            {"$inc": {"balance": balance_change}, "$set": {"updated_at": datetime.utcnow()}}
        )

    @staticmethod
    async def seed_default_accounts():
        """Seed default chart of accounts"""
        db = get_database()
        
        # Check if accounts already exist
        count = await db.accounts.count_documents({})
        if count > 0:
            logger.info("Accounts already seeded")
            return
        
        default_accounts = [
            # Assets
            {"account_code": "1000", "account_name": "Assets", "account_type": "asset", "normal_balance": "debit", "parent_account": None},
            {"account_code": "1100", "account_name": "Current Assets", "account_type": "asset", "normal_balance": "debit", "parent_account": "1000"},
            {"account_code": "1110", "account_name": "Cash", "account_type": "asset", "normal_balance": "debit", "parent_account": "1100"},
            {"account_code": "1120", "account_name": "Bank Accounts", "account_type": "asset", "normal_balance": "debit", "parent_account": "1100"},
            {"account_code": "1130", "account_name": "Accounts Receivable", "account_type": "asset", "normal_balance": "debit", "parent_account": "1100"},
            {"account_code": "1140", "account_name": "Inventory", "account_type": "asset", "normal_balance": "debit", "parent_account": "1100"},
            
            # Liabilities
            {"account_code": "2000", "account_name": "Liabilities", "account_type": "liability", "normal_balance": "credit", "parent_account": None},
            {"account_code": "2100", "account_name": "Current Liabilities", "account_type": "liability", "normal_balance": "credit", "parent_account": "2000"},
            {"account_code": "2110", "account_name": "Accounts Payable", "account_type": "liability", "normal_balance": "credit", "parent_account": "2100"},
            {"account_code": "2120", "account_name": "Sales Tax Payable", "account_type": "liability", "normal_balance": "credit", "parent_account": "2100"},
            
            # Equity
            {"account_code": "3000", "account_name": "Equity", "account_type": "equity", "normal_balance": "credit", "parent_account": None},
            {"account_code": "3100", "account_name": "Owner's Equity", "account_type": "equity", "normal_balance": "credit", "parent_account": "3000"},
            {"account_code": "3200", "account_name": "Retained Earnings", "account_type": "equity", "normal_balance": "credit", "parent_account": "3000"},
            
            # Revenue
            {"account_code": "4000", "account_name": "Revenue", "account_type": "revenue", "normal_balance": "credit", "parent_account": None},
            {"account_code": "4100", "account_name": "Sales Revenue", "account_type": "revenue", "normal_balance": "credit", "parent_account": "4000"},
            {"account_code": "4200", "account_name": "Service Revenue", "account_type": "revenue", "normal_balance": "credit", "parent_account": "4000"},
            
            # Expenses
            {"account_code": "5000", "account_name": "Expenses", "account_type": "expense", "normal_balance": "debit", "parent_account": None},
            {"account_code": "5100", "account_name": "Cost of Goods Sold", "account_type": "expense", "normal_balance": "debit", "parent_account": "5000"},
            {"account_code": "5200", "account_name": "Operating Expenses", "account_type": "expense", "normal_balance": "debit", "parent_account": "5000"},
            {"account_code": "5210", "account_name": "Salaries Expense", "account_type": "expense", "normal_balance": "debit", "parent_account": "5200"},
            {"account_code": "5220", "account_name": "Rent Expense", "account_type": "expense", "normal_balance": "debit", "parent_account": "5200"},
            {"account_code": "5230", "account_name": "Utilities Expense", "account_type": "expense", "normal_balance": "debit", "parent_account": "5200"},
        ]
        
        for account_data in default_accounts:
            account_doc = {
                **account_data,
                "is_active": True,
                "balance": 0.0,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.accounts.insert_one(account_doc)
        
        logger.info(f"Seeded {len(default_accounts)} default accounts")

