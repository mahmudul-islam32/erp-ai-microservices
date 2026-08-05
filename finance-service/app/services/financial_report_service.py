from app.database import get_database
from app.models.financial_report import ReportType
from app.models.account import AccountType
from app.models.journal_entry import JournalEntryStatus
from typing import Dict, Any
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)


class FinancialReportService:
    """Service for generating financial reports"""

    @staticmethod
    async def generate_profit_loss(
        period_start: date,
        period_end: date,
        generated_by: str
    ) -> Dict[str, Any]:
        """Generate Profit & Loss statement"""
        db = get_database()
        
        # Convert dates to datetime for MongoDB queries
        start_datetime = datetime.combine(period_start, datetime.min.time())
        end_datetime = datetime.combine(period_end, datetime.max.time())
        
        # Get all revenue accounts
        revenue_accounts = await db.accounts.find({
            "account_type": AccountType.REVENUE,
            "is_active": True
        }).to_list(length=100)
        
        # Get all expense accounts
        expense_accounts = await db.accounts.find({
            "account_type": AccountType.EXPENSE,
            "is_active": True
        }).to_list(length=100)
        
        # Calculate totals for each account
        async def get_account_total(account_id):
            pipeline = [
                {
                    "$match": {
                        "status": JournalEntryStatus.POSTED,
                        "entry_date": {"$gte": start_datetime, "$lte": end_datetime}
                    }
                },
                {"$unwind": "$line_items"},
                {
                    "$match": {
                        "line_items.account_id": account_id
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "total_debit": {"$sum": "$line_items.debit_amount"},
                        "total_credit": {"$sum": "$line_items.credit_amount"}
                    }
                }
            ]
            
            result = await db.journal_entries.aggregate(pipeline).to_list(length=1)
            if result:
                return result[0]["total_credit"] - result[0]["total_debit"]  # Net for revenue/expense
            return 0.0
        
        # Calculate revenue
        revenue_items = []
        total_revenue = 0.0
        for account in revenue_accounts:
            account_id = str(account["_id"])
            amount = await get_account_total(account_id)
            if amount != 0:
                revenue_items.append({
                    "account_code": account["account_code"],
                    "account_name": account["account_name"],
                    "amount": amount
                })
                total_revenue += amount
        
        # Calculate expenses
        expense_items = []
        total_expenses = 0.0
        for account in expense_accounts:
            account_id = str(account["_id"])
            amount = await get_account_total(account_id)
            if amount != 0:
                expense_items.append({
                    "account_code": account["account_code"],
                    "account_name": account["account_name"],
                    "amount": abs(amount)
                })
                total_expenses += abs(amount)
        
        net_income = total_revenue - total_expenses
        
        report_data = {
            "revenue": {
                "items": revenue_items,
                "total": total_revenue
            },
            "expenses": {
                "items": expense_items,
                "total": total_expenses
            },
            "net_income": net_income
        }
        
        # Save report (convert dates to datetime for MongoDB)
        report_doc = {
            "report_type": ReportType.PROFIT_LOSS,
            "period_start": datetime.combine(period_start, datetime.min.time()),
            "period_end": datetime.combine(period_end, datetime.min.time()),
            "report_data": report_data,
            "format": "json",
            "generated_by": generated_by,
            "generated_at": datetime.utcnow()
        }
        
        await db.financial_reports.insert_one(report_doc)
        
        return report_data

    @staticmethod
    async def generate_balance_sheet(
        as_of_date: date,
        generated_by: str
    ) -> Dict[str, Any]:
        """Generate Balance Sheet"""
        db = get_database()
        
        async def get_accounts_by_type(account_type: AccountType):
            accounts = await db.accounts.find({
                "account_type": account_type,
                "is_active": True
            }).to_list(length=200)
            
            items = []
            total = 0.0
            
            for account in accounts:
                # Use current balance from account
                balance = account.get("balance", 0.0)
                if balance != 0:
                    items.append({
                        "account_code": account["account_code"],
                        "account_name": account["account_name"],
                        "amount": abs(balance)
                    })
                    total += abs(balance)
            
            return items, total
        
        # Get Assets
        asset_items, total_assets = await get_accounts_by_type(AccountType.ASSET)
        
        # Get Liabilities
        liability_items, total_liabilities = await get_accounts_by_type(AccountType.LIABILITY)
        
        # Get Equity
        equity_items, total_equity = await get_accounts_by_type(AccountType.EQUITY)
        
        report_data = {
            "assets": {
                "items": asset_items,
                "total": total_assets
            },
            "liabilities": {
                "items": liability_items,
                "total": total_liabilities
            },
            "equity": {
                "items": equity_items,
                "total": total_equity
            },
            "total_liabilities_and_equity": total_liabilities + total_equity,
            "balanced": abs(total_assets - (total_liabilities + total_equity)) < 0.01
        }
        
        # Save report (convert dates to datetime for MongoDB)
        report_doc = {
            "report_type": ReportType.BALANCE_SHEET,
            "period_start": datetime.combine(as_of_date, datetime.min.time()),
            "period_end": datetime.combine(as_of_date, datetime.min.time()),
            "report_data": report_data,
            "format": "json",
            "generated_by": generated_by,
            "generated_at": datetime.utcnow()
        }
        
        await db.financial_reports.insert_one(report_doc)
        
        return report_data

    @staticmethod
    async def generate_trial_balance(
        as_of_date: date,
        generated_by: str
    ) -> Dict[str, Any]:
        """Generate Trial Balance"""
        db = get_database()
        
        accounts = await db.accounts.find({"is_active": True}).to_list(length=1000)
        
        trial_balance_items = []
        total_debits = 0.0
        total_credits = 0.0
        
        for account in accounts:
            balance = account.get("balance", 0.0)
            if balance != 0:
                if account["normal_balance"] == "debit":
                    debit = balance if balance > 0 else 0
                    credit = abs(balance) if balance < 0 else 0
                else:
                    credit = balance if balance > 0 else 0
                    debit = abs(balance) if balance < 0 else 0
                
                trial_balance_items.append({
                    "account_code": account["account_code"],
                    "account_name": account["account_name"],
                    "account_type": account["account_type"],
                    "debit": debit,
                    "credit": credit
                })
                
                total_debits += debit
                total_credits += credit
        
        report_data = {
            "items": trial_balance_items,
            "total_debits": total_debits,
            "total_credits": total_credits,
            "difference": total_debits - total_credits,
            "balanced": abs(total_debits - total_credits) < 0.01
        }
        
        return report_data

