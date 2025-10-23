from app.database import get_database
from app.models.journal_entry import JournalEntry, JournalEntryCreate, JournalEntryStatus
from app.services.account_service import AccountService
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class JournalEntryService:
    """Service for managing journal entries and general ledger"""

    @staticmethod
    async def generate_entry_number() -> str:
        """Generate unique journal entry number"""
        db = get_database()
        
        # Get the latest entry number for current year
        current_year = datetime.utcnow().year
        prefix = f"JE-{current_year}-"
        
        last_entry = await db.journal_entries.find_one(
            {"entry_number": {"$regex": f"^{prefix}"}},
            sort=[("entry_number", -1)]
        )
        
        if last_entry:
            last_num = int(last_entry["entry_number"].split("-")[-1])
            new_num = last_num + 1
        else:
            new_num = 1
        
        return f"{prefix}{new_num:06d}"

    @staticmethod
    async def create_journal_entry(entry_data: JournalEntryCreate, created_by: str) -> JournalEntry:
        """Create a new journal entry"""
        db = get_database()
        
        # Validate that all accounts exist
        for line_item in entry_data.line_items:
            account = await AccountService.get_account(line_item.account_id)
            if not account:
                raise ValueError(f"Account {line_item.account_id} not found")
            # Populate account details
            line_item.account_code = account.account_code
            line_item.account_name = account.account_name
        
        # Calculate totals
        total_debit = sum(item.debit_amount for item in entry_data.line_items)
        total_credit = sum(item.credit_amount for item in entry_data.line_items)
        
        entry_number = await JournalEntryService.generate_entry_number()
        
        entry_doc = {
            **entry_data.model_dump(),
            "entry_number": entry_number,
            "total_debit": total_debit,
            "total_credit": total_credit,
            "status": JournalEntryStatus.DRAFT,
            "created_by": created_by,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.journal_entries.insert_one(entry_doc)
        entry_doc["_id"] = str(result.inserted_id)
        
        logger.info(f"Created journal entry: {entry_number}")
        return JournalEntry(**entry_doc)

    @staticmethod
    async def get_journal_entry(entry_id: str) -> Optional[JournalEntry]:
        """Get journal entry by ID"""
        db = get_database()
        entry = await db.journal_entries.find_one({"_id": ObjectId(entry_id)})
        
        if entry:
            entry["_id"] = str(entry["_id"])
            return JournalEntry(**entry)
        return None

    @staticmethod
    async def list_journal_entries(
        status: Optional[JournalEntryStatus] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[JournalEntry]:
        """List journal entries with filters"""
        db = get_database()
        
        query: Dict[str, Any] = {}
        if status:
            query["status"] = status
        if start_date or end_date:
            query["entry_date"] = {}
            if start_date:
                query["entry_date"]["$gte"] = datetime.combine(start_date, datetime.min.time())
            if end_date:
                query["entry_date"]["$lte"] = datetime.combine(end_date, datetime.max.time())
        
        cursor = db.journal_entries.find(query).sort("entry_date", -1).skip(skip).limit(limit)
        entries = await cursor.to_list(length=limit)
        
        for entry in entries:
            entry["_id"] = str(entry["_id"])
        
        return [JournalEntry(**entry) for entry in entries]

    @staticmethod
    async def post_journal_entry(entry_id: str, posted_by: str) -> JournalEntry:
        """Post a journal entry (make it final and update account balances)"""
        db = get_database()
        
        entry = await JournalEntryService.get_journal_entry(entry_id)
        if not entry:
            raise ValueError("Journal entry not found")
        
        if entry.status != JournalEntryStatus.DRAFT:
            raise ValueError(f"Can only post draft entries. Current status: {entry.status}")
        
        # Update account balances
        for line_item in entry.line_items:
            if line_item.debit_amount > 0:
                await AccountService.update_account_balance(
                    line_item.account_id,
                    line_item.debit_amount,
                    is_debit=True
                )
            if line_item.credit_amount > 0:
                await AccountService.update_account_balance(
                    line_item.account_id,
                    line_item.credit_amount,
                    is_debit=False
                )
        
        # Update entry status
        await db.journal_entries.update_one(
            {"_id": ObjectId(entry_id)},
            {
                "$set": {
                    "status": JournalEntryStatus.POSTED,
                    "posted_by": posted_by,
                    "posted_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"Posted journal entry: {entry.entry_number}")
        return await JournalEntryService.get_journal_entry(entry_id)

    @staticmethod
    async def reverse_journal_entry(entry_id: str, created_by: str, reason: str) -> JournalEntry:
        """Reverse a posted journal entry"""
        db = get_database()
        
        original_entry = await JournalEntryService.get_journal_entry(entry_id)
        if not original_entry:
            raise ValueError("Journal entry not found")
        
        if original_entry.status != JournalEntryStatus.POSTED:
            raise ValueError("Can only reverse posted entries")
        
        # Create reversed line items
        reversed_line_items = []
        for line_item in original_entry.line_items:
            reversed_line_items.append({
                "account_id": line_item.account_id,
                "account_code": line_item.account_code,
                "account_name": line_item.account_name,
                "debit_amount": line_item.credit_amount,  # Swap debit and credit
                "credit_amount": line_item.debit_amount,
                "description": f"Reversal: {line_item.description}",
                "cost_center": line_item.cost_center
            })
        
        # Create reversal entry
        reversal_data = JournalEntryCreate(
            entry_date=date.today(),
            reference=f"REV-{original_entry.entry_number}",
            description=f"Reversal of {original_entry.entry_number}: {reason}",
            line_items=reversed_line_items
        )
        
        reversal_entry = await JournalEntryService.create_journal_entry(reversal_data, created_by)
        
        # Auto-post the reversal
        reversal_entry = await JournalEntryService.post_journal_entry(str(reversal_entry.id), created_by)
        
        # Mark original as reversed
        await db.journal_entries.update_one(
            {"_id": ObjectId(entry_id)},
            {
                "$set": {
                    "status": JournalEntryStatus.REVERSED,
                    "reversed_entry_id": str(reversal_entry.id),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"Reversed journal entry: {original_entry.entry_number}")
        return reversal_entry

    @staticmethod
    async def get_general_ledger(
        account_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """Get general ledger report"""
        db = get_database()
        
        # Build aggregation pipeline
        match_stage: Dict[str, Any] = {"status": JournalEntryStatus.POSTED}
        
        if start_date or end_date:
            match_stage["entry_date"] = {}
            if start_date:
                match_stage["entry_date"]["$gte"] = datetime.combine(start_date, datetime.min.time())
            if end_date:
                match_stage["entry_date"]["$lte"] = datetime.combine(end_date, datetime.max.time())
        
        pipeline = [
            {"$match": match_stage},
            {"$unwind": "$line_items"},
            {"$sort": {"entry_date": 1, "entry_number": 1}}
        ]
        
        if account_id:
            pipeline.insert(1, {"$match": {"line_items.account_id": account_id}})
        
        cursor = db.journal_entries.aggregate(pipeline)
        ledger_entries = await cursor.to_list(length=10000)
        
        # Format the results
        formatted_entries = []
        for entry in ledger_entries:
            entry["_id"] = str(entry["_id"])
            line_item = entry["line_items"]
            formatted_entries.append({
                "entry_id": entry["_id"],
                "entry_number": entry["entry_number"],
                "entry_date": entry["entry_date"],
                "account_code": line_item["account_code"],
                "account_name": line_item["account_name"],
                "description": entry["description"],
                "reference": entry.get("reference"),
                "debit": line_item["debit_amount"],
                "credit": line_item["credit_amount"],
                "cost_center": line_item.get("cost_center")
            })
        
        return formatted_entries

    @staticmethod
    async def get_account_balance(account_id: str, as_of_date: Optional[date] = None) -> float:
        """Get account balance as of a specific date"""
        account = await AccountService.get_account(account_id)
        if not account:
            raise ValueError("Account not found")
        
        if not as_of_date:
            return account.balance
        
        # Calculate balance up to specific date
        db = get_database()
        
        pipeline = [
                {
                    "$match": {
                        "status": JournalEntryStatus.POSTED,
                        "entry_date": {"$lte": datetime.combine(as_of_date, datetime.max.time())}
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
        
        if not result:
            return 0.0
        
        total_debit = result[0].get("total_debit", 0)
        total_credit = result[0].get("total_credit", 0)
        
        # Calculate balance based on normal balance
        if account.normal_balance == "debit":
            return total_debit - total_credit
        else:
            return total_credit - total_debit

