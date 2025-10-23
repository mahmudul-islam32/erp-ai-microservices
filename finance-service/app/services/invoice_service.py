from app.database import get_database
from app.models.invoice import (
    VendorInvoice, VendorInvoiceCreate,
    CustomerInvoice, CustomerInvoiceCreate,
    InvoiceStatus
)
from app.services.journal_entry_service import JournalEntryService
from app.models.journal_entry import JournalEntryCreate, JournalLineItem
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class InvoiceService:
    """Service for managing vendor and customer invoices"""

    # Vendor Invoices (AP)
    @staticmethod
    async def create_vendor_invoice(invoice_data: VendorInvoiceCreate, created_by: str) -> VendorInvoice:
        """Create a vendor invoice (Accounts Payable)"""
        db = get_database()
        
        balance_due = invoice_data.total_amount
        
        invoice_doc = {
            **invoice_data.model_dump(),
            "status": InvoiceStatus.PENDING,
            "paid_amount": 0.0,
            "balance_due": balance_due,
            "payment_history": [],
            "created_by": created_by,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.vendor_invoices.insert_one(invoice_doc)
        invoice_doc["_id"] = str(result.inserted_id)
        
        logger.info(f"Created vendor invoice: {invoice_data.invoice_number}")
        return VendorInvoice(**invoice_doc)

    @staticmethod
    async def get_vendor_invoice(invoice_id: str) -> Optional[VendorInvoice]:
        """Get vendor invoice by ID"""
        db = get_database()
        invoice = await db.vendor_invoices.find_one({"_id": ObjectId(invoice_id)})
        
        if invoice:
            invoice["_id"] = str(invoice["_id"])
            return VendorInvoice(**invoice)
        return None

    @staticmethod
    async def list_vendor_invoices(
        vendor_id: Optional[str] = None,
        status: Optional[InvoiceStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[VendorInvoice]:
        """List vendor invoices"""
        db = get_database()
        
        query: Dict[str, Any] = {}
        if vendor_id:
            query["vendor_id"] = vendor_id
        if status:
            query["status"] = status
        
        cursor = db.vendor_invoices.find(query).sort("invoice_date", -1).skip(skip).limit(limit)
        invoices = await cursor.to_list(length=limit)
        
        for invoice in invoices:
            invoice["_id"] = str(invoice["_id"])
        
        return [VendorInvoice(**invoice) for invoice in invoices]

    @staticmethod
    async def pay_vendor_invoice(
        invoice_id: str,
        payment_amount: float,
        payment_date: date,
        payment_method: str,
        paid_by: str,
        bank_account_id: Optional[str] = None
    ) -> VendorInvoice:
        """Record payment for vendor invoice"""
        db = get_database()
        
        invoice = await InvoiceService.get_vendor_invoice(invoice_id)
        if not invoice:
            raise ValueError("Invoice not found")
        
        if payment_amount > invoice.balance_due:
            raise ValueError(f"Payment amount ({payment_amount}) exceeds balance due ({invoice.balance_due})")
        
        # Record payment
        payment_record = {
            "payment_date": payment_date,
            "amount": payment_amount,
            "payment_method": payment_method,
            "bank_account_id": bank_account_id,
            "paid_by": paid_by,
            "recorded_at": datetime.utcnow()
        }
        
        new_paid_amount = invoice.paid_amount + payment_amount
        new_balance = invoice.balance_due - payment_amount
        
        # Determine new status
        if new_balance == 0:
            new_status = InvoiceStatus.PAID
        elif new_paid_amount > 0:
            new_status = InvoiceStatus.PARTIAL
        else:
            new_status = invoice.status
        
        # Create journal entry for payment
        journal_lines = [
            JournalLineItem(
                account_id="2110",  # Accounts Payable
                account_code="2110",
                account_name="Accounts Payable",
                debit_amount=payment_amount,
                credit_amount=0.0,
                description=f"Payment for {invoice.invoice_number}"
            ),
            JournalLineItem(
                account_id="1120",  # Bank/Cash
                account_code="1120",
                account_name="Bank Accounts",
                debit_amount=0.0,
                credit_amount=payment_amount,
                description=f"Payment for {invoice.invoice_number}"
            )
        ]
        
        journal_entry_data = JournalEntryCreate(
            entry_date=payment_date,
            reference=invoice.invoice_number,
            description=f"Payment to {invoice.vendor_name}",
            line_items=journal_lines
        )
        
        # Create and post journal entry
        journal_entry = await JournalEntryService.create_journal_entry(journal_entry_data, paid_by)
        await JournalEntryService.post_journal_entry(str(journal_entry.id), paid_by)
        
        # Update invoice
        await db.vendor_invoices.update_one(
            {"_id": ObjectId(invoice_id)},
            {
                "$set": {
                    "paid_amount": new_paid_amount,
                    "balance_due": new_balance,
                    "status": new_status,
                    "updated_at": datetime.utcnow()
                },
                "$push": {"payment_history": payment_record}
            }
        )
        
        logger.info(f"Recorded payment for vendor invoice: {invoice.invoice_number}")
        return await InvoiceService.get_vendor_invoice(invoice_id)

    # Customer Invoices (AR)
    @staticmethod
    async def create_customer_invoice(invoice_data: CustomerInvoiceCreate, created_by: str) -> CustomerInvoice:
        """Create a customer invoice (Accounts Receivable)"""
        db = get_database()
        
        balance_due = invoice_data.total_amount
        
        invoice_doc = {
            **invoice_data.model_dump(),
            "status": InvoiceStatus.DRAFT,
            "paid_amount": 0.0,
            "balance_due": balance_due,
            "payment_history": [],
            "created_by": created_by,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.customer_invoices.insert_one(invoice_doc)
        invoice_doc["_id"] = str(result.inserted_id)
        
        logger.info(f"Created customer invoice: {invoice_data.invoice_number}")
        return CustomerInvoice(**invoice_doc)

    @staticmethod
    async def get_customer_invoice(invoice_id: str) -> Optional[CustomerInvoice]:
        """Get customer invoice by ID"""
        db = get_database()
        invoice = await db.customer_invoices.find_one({"_id": ObjectId(invoice_id)})
        
        if invoice:
            invoice["_id"] = str(invoice["_id"])
            return CustomerInvoice(**invoice)
        return None

    @staticmethod
    async def list_customer_invoices(
        customer_id: Optional[str] = None,
        status: Optional[InvoiceStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[CustomerInvoice]:
        """List customer invoices"""
        db = get_database()
        
        query: Dict[str, Any] = {}
        if customer_id:
            query["customer_id"] = customer_id
        if status:
            query["status"] = status
        
        cursor = db.customer_invoices.find(query).sort("invoice_date", -1).skip(skip).limit(limit)
        invoices = await cursor.to_list(length=limit)
        
        for invoice in invoices:
            invoice["_id"] = str(invoice["_id"])
        
        return [CustomerInvoice(**invoice) for invoice in invoices]

    @staticmethod
    async def send_customer_invoice(invoice_id: str) -> CustomerInvoice:
        """Mark invoice as sent"""
        db = get_database()
        
        await db.customer_invoices.update_one(
            {"_id": ObjectId(invoice_id)},
            {
                "$set": {
                    "status": InvoiceStatus.SENT,
                    "sent_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return await InvoiceService.get_customer_invoice(invoice_id)

    @staticmethod
    async def record_customer_payment(
        invoice_id: str,
        payment_amount: float,
        payment_date: date,
        payment_method: str,
        recorded_by: str
    ) -> CustomerInvoice:
        """Record payment from customer"""
        db = get_database()
        
        invoice = await InvoiceService.get_customer_invoice(invoice_id)
        if not invoice:
            raise ValueError("Invoice not found")
        
        if payment_amount > invoice.balance_due:
            raise ValueError(f"Payment amount ({payment_amount}) exceeds balance due ({invoice.balance_due})")
        
        # Record payment
        payment_record = {
            "payment_date": payment_date,
            "amount": payment_amount,
            "payment_method": payment_method,
            "recorded_by": recorded_by,
            "recorded_at": datetime.utcnow()
        }
        
        new_paid_amount = invoice.paid_amount + payment_amount
        new_balance = invoice.balance_due - payment_amount
        
        # Determine new status
        if new_balance == 0:
            new_status = InvoiceStatus.PAID
        elif new_paid_amount > 0:
            new_status = InvoiceStatus.PARTIAL
        else:
            new_status = invoice.status
        
        # Create journal entry for payment
        journal_lines = [
            JournalLineItem(
                account_id="1120",  # Bank/Cash
                account_code="1120",
                account_name="Bank Accounts",
                debit_amount=payment_amount,
                credit_amount=0.0,
                description=f"Payment from {invoice.customer_name}"
            ),
            JournalLineItem(
                account_id="1130",  # Accounts Receivable
                account_code="1130",
                account_name="Accounts Receivable",
                debit_amount=0.0,
                credit_amount=payment_amount,
                description=f"Payment for {invoice.invoice_number}"
            )
        ]
        
        journal_entry_data = JournalEntryCreate(
            entry_date=payment_date,
            reference=invoice.invoice_number,
            description=f"Payment from {invoice.customer_name}",
            line_items=journal_lines
        )
        
        # Create and post journal entry
        journal_entry = await JournalEntryService.create_journal_entry(journal_entry_data, recorded_by)
        await JournalEntryService.post_journal_entry(str(journal_entry.id), recorded_by)
        
        # Update invoice
        await db.customer_invoices.update_one(
            {"_id": ObjectId(invoice_id)},
            {
                "$set": {
                    "paid_amount": new_paid_amount,
                    "balance_due": new_balance,
                    "status": new_status,
                    "updated_at": datetime.utcnow()
                },
                "$push": {"payment_history": payment_record}
            }
        )
        
        logger.info(f"Recorded payment for customer invoice: {invoice.invoice_number}")
        return await InvoiceService.get_customer_invoice(invoice_id)

    @staticmethod
    async def get_aging_report(report_type: str = "customer") -> Dict[str, Any]:
        """Generate aging report for AP or AR"""
        db = get_database()
        
        collection = db.customer_invoices if report_type == "customer" else db.vendor_invoices
        
        # Get all unpaid/partial invoices
        cursor = collection.find({
            "status": {"$in": [InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE, InvoiceStatus.PENDING]}
        })
        invoices = await cursor.to_list(length=10000)
        
        today = date.today()
        
        aging_buckets = {
            "current": [],
            "1-30": [],
            "31-60": [],
            "61-90": [],
            "90+": []
        }
        
        totals = {
            "current": 0.0,
            "1-30": 0.0,
            "31-60": 0.0,
            "61-90": 0.0,
            "90+": 0.0,
            "total": 0.0
        }
        
        for invoice in invoices:
            days_overdue = (today - invoice["due_date"]).days
            balance = invoice["balance_due"]
            
            invoice_data = {
                "invoice_number": invoice["invoice_number"],
                "customer_name" if report_type == "customer" else "vendor_name": 
                    invoice.get("customer_name" if report_type == "customer" else "vendor_name"),
                "invoice_date": invoice["invoice_date"],
                "due_date": invoice["due_date"],
                "balance_due": balance,
                "days_overdue": days_overdue
            }
            
            if days_overdue <= 0:
                aging_buckets["current"].append(invoice_data)
                totals["current"] += balance
            elif days_overdue <= 30:
                aging_buckets["1-30"].append(invoice_data)
                totals["1-30"] += balance
            elif days_overdue <= 60:
                aging_buckets["31-60"].append(invoice_data)
                totals["31-60"] += balance
            elif days_overdue <= 90:
                aging_buckets["61-90"].append(invoice_data)
                totals["61-90"] += balance
            else:
                aging_buckets["90+"].append(invoice_data)
                totals["90+"] += balance
            
            totals["total"] += balance
        
        return {
            "report_type": report_type,
            "generated_at": datetime.utcnow(),
            "aging_buckets": aging_buckets,
            "totals": totals
        }

