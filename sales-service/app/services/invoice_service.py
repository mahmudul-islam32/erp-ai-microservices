from app.database import get_database
from app.models import (
    InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoiceInDB, InvoiceStatus,
    PaymentCreate, PaymentResponse, PaymentInDB, PaymentMethod, PaymentStatus
)
from app.services.customer_service import customer_service
from app.services.sales_order_service import sales_order_service
from pymongo.errors import DuplicateKeyError
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from bson import ObjectId
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class InvoiceService:
    def __init__(self):
        pass

    async def create_invoice(self, invoice_data: InvoiceCreate, user_id: str, token: str) -> InvoiceResponse:
        """Create a new invoice"""
        try:
            db = get_database()
            invoices_collection = db.invoices

            # Validate customer
            customer = await customer_service.get_customer_by_id(invoice_data.customer_id)
            if not customer:
                raise ValueError("Customer not found")

            # Calculate due date
            due_date = invoice_data.due_date
            if not due_date:
                payment_terms_days = customer.payment_terms.net_days if customer.payment_terms else 30
                due_date = (invoice_data.invoice_date or date.today()) + timedelta(days=payment_terms_days)

            # Calculate totals from line items
            subtotal = sum(item.line_total for item in invoice_data.line_items)
            tax_amount = sum(item.tax_amount for item in invoice_data.line_items)
            total_amount = subtotal + tax_amount + (invoice_data.shipping_cost or 0)

            # Generate invoice number
            invoice_number = await self._generate_invoice_number()

            # Create invoice document
            invoice_doc = InvoiceInDB(
                invoice_number=invoice_number,
                customer_id=invoice_data.customer_id,
                customer_name=f"{customer.first_name} {customer.last_name}".strip(),
                customer_email=customer.email,
                invoice_date=invoice_data.invoice_date or date.today(),
                due_date=due_date,
                sales_order_id=invoice_data.sales_order_id,
                line_items=invoice_data.line_items,
                subtotal=subtotal,
                tax_amount=tax_amount,
                shipping_cost=invoice_data.shipping_cost or 0,
                total_amount=total_amount,
                paid_amount=0.0,
                balance_due=total_amount,
                payment_status=PaymentStatus.PENDING,
                notes=invoice_data.notes,
                status=InvoiceStatus.DRAFT,
                created_by=user_id
            )

            # Insert invoice
            result = await invoices_collection.insert_one(invoice_doc.dict(by_alias=True, exclude={"id"}))
            
            # Fetch created invoice
            created_invoice = await invoices_collection.find_one({"_id": result.inserted_id})
            if created_invoice:
                return InvoiceResponse(**created_invoice)
            
            return None

        except Exception as e:
            logger.error(f"Error creating invoice: {e}")
            raise

    async def get_invoice_by_id(self, invoice_id: str) -> Optional[InvoiceInDB]:
        """Get invoice by ID"""
        try:
            db = get_database()
            invoices_collection = db.invoices
            
            invoice = await invoices_collection.find_one({"_id": ObjectId(invoice_id)})
            if invoice:
                return InvoiceInDB(**invoice)
            return None

        except Exception as e:
            logger.error(f"Error getting invoice by ID: {e}")
            return None

    async def get_invoice_by_number(self, invoice_number: str) -> Optional[InvoiceInDB]:
        """Get invoice by invoice number"""
        try:
            db = get_database()
            invoices_collection = db.invoices
            
            invoice = await invoices_collection.find_one({"invoice_number": invoice_number})
            if invoice:
                return InvoiceInDB(**invoice)
            return None

        except Exception as e:
            logger.error(f"Error getting invoice by number: {e}")
            return None

    async def update_invoice(self, invoice_id: str, invoice_update: InvoiceUpdate, user_id: str) -> Optional[InvoiceResponse]:
        """Update invoice"""
        try:
            db = get_database()
            invoices_collection = db.invoices

            # Get existing invoice
            existing_invoice = await self.get_invoice_by_id(invoice_id)
            if not existing_invoice:
                return None

            # Prepare update data
            update_data = {k: v for k, v in invoice_update.dict(exclude_unset=True).items() if v is not None}
            update_data["updated_at"] = datetime.utcnow()
            update_data["updated_by"] = user_id

            # Update invoice
            result = await invoices_collection.update_one(
                {"_id": ObjectId(invoice_id)},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                # Fetch updated invoice
                updated_invoice = await invoices_collection.find_one({"_id": ObjectId(invoice_id)})
                if updated_invoice:
                    return InvoiceResponse(**updated_invoice)
            
            return None

        except Exception as e:
            logger.error(f"Error updating invoice: {e}")
            return None

    async def get_invoices(self, skip: int = 0, limit: int = 100,
                          status: Optional[InvoiceStatus] = None,
                          payment_status: Optional[PaymentStatus] = None,
                          customer_id: Optional[str] = None,
                          start_date: Optional[date] = None,
                          end_date: Optional[date] = None,
                          overdue_only: bool = False,
                          search: Optional[str] = None) -> List[InvoiceResponse]:
        """Get list of invoices with pagination and filters"""
        try:
            db = get_database()
            invoices_collection = db.invoices

            # Build filter
            filter_query = {}
            if status:
                filter_query["status"] = status
            if payment_status:
                filter_query["payment_status"] = payment_status
            if customer_id:
                filter_query["customer_id"] = customer_id
            if start_date and end_date:
                filter_query["invoice_date"] = {"$gte": start_date, "$lte": end_date}
            elif start_date:
                filter_query["invoice_date"] = {"$gte": start_date}
            elif end_date:
                filter_query["invoice_date"] = {"$lte": end_date}
            if overdue_only:
                filter_query["due_date"] = {"$lt": date.today()}
                filter_query["payment_status"] = {"$ne": PaymentStatus.PAID}
            if search:
                filter_query["$or"] = [
                    {"invoice_number": {"$regex": search, "$options": "i"}},
                    {"customer_name": {"$regex": search, "$options": "i"}},
                    {"customer_email": {"$regex": search, "$options": "i"}}
                ]

            # Get invoices
            cursor = invoices_collection.find(filter_query).skip(skip).limit(limit).sort("invoice_date", -1)
            invoices = await cursor.to_list(length=limit)

            return [InvoiceResponse(**invoice) for invoice in invoices]

        except Exception as e:
            logger.error(f"Error getting invoices: {e}")
            return []

    async def send_invoice(self, invoice_id: str, user_id: str) -> bool:
        """Send invoice to customer via email"""
        try:
            # Get invoice
            invoice = await self.get_invoice_by_id(invoice_id)
            if not invoice:
                return False

            # Update status to sent
            db = get_database()
            invoices_collection = db.invoices
            
            result = await invoices_collection.update_one(
                {"_id": ObjectId(invoice_id)},
                {
                    "$set": {
                        "status": InvoiceStatus.SENT,
                        "sent_at": datetime.utcnow(),
                        "sent_by": user_id,
                        "updated_at": datetime.utcnow(),
                        "updated_by": user_id
                    }
                }
            )

            # Here you would implement email sending logic
            # For now, just return success
            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error sending invoice: {e}")
            return False

    async def record_payment(self, invoice_id: str, amount: float, payment_method: str, 
                            reference: Optional[str] = None, notes: Optional[str] = None, 
                            user_id: str = None) -> bool:
        """Record a payment for an invoice"""
        try:
            # Get invoice
            invoice = await self.get_invoice_by_id(invoice_id)
            if not invoice:
                return False

            db = get_database()
            invoices_collection = db.invoices
            payments_collection = db.payments

            # Create payment record
            payment_doc = PaymentInDB(
                invoice_id=invoice_id,
                amount=amount,
                payment_method=payment_method,
                reference=reference,
                notes=notes,
                payment_date=date.today(),
                created_by=user_id
            )

            # Insert payment
            payment_result = await payments_collection.insert_one(payment_doc.dict(by_alias=True, exclude={"id"}))

            # Update invoice payment status
            new_paid_amount = invoice.paid_amount + amount
            new_balance_due = invoice.total_amount - new_paid_amount

            payment_status = PaymentStatus.PENDING
            if new_balance_due <= 0:
                payment_status = PaymentStatus.PAID
            elif new_paid_amount > 0:
                payment_status = PaymentStatus.PARTIAL

            result = await invoices_collection.update_one(
                {"_id": ObjectId(invoice_id)},
                {
                    "$set": {
                        "paid_amount": new_paid_amount,
                        "balance_due": new_balance_due,
                        "payment_status": payment_status,
                        "updated_at": datetime.utcnow(),
                        "updated_by": user_id
                    }
                }
            )

            return result.modified_count > 0 and payment_result.inserted_id

        except Exception as e:
            logger.error(f"Error recording payment: {e}")
            return False

    async def create_invoice_from_order(self, order_id: str, user_id: str, token: str) -> Optional[InvoiceResponse]:
        """Create invoice from sales order"""
        try:
            # Get sales order
            order = await sales_order_service.get_order_by_id(order_id)
            if not order:
                return None

            # Create invoice data from order
            invoice_data = InvoiceCreate(
                customer_id=order.customer_id,
                sales_order_id=order_id,
                invoice_date=date.today(),
                line_items=order.line_items,
                shipping_cost=order.shipping_cost,
                notes=f"Invoice for order: {order.order_number}"
            )

            # Create invoice
            invoice = await self.create_invoice(invoice_data, user_id, token)
            return invoice

        except Exception as e:
            logger.error(f"Error creating invoice from order: {e}")
            return None

    async def generate_invoice_pdf(self, invoice_id: str) -> Optional[bytes]:
        """Generate invoice PDF"""
        try:
            # Get invoice
            invoice = await self.get_invoice_by_id(invoice_id)
            if not invoice:
                return None

            # Here you would implement PDF generation logic
            # For now, return empty bytes as placeholder
            return b"PDF content would go here"

        except Exception as e:
            logger.error(f"Error generating invoice PDF: {e}")
            return None

    async def void_invoice(self, invoice_id: str, user_id: str, reason: Optional[str] = None) -> bool:
        """Void an invoice"""
        try:
            db = get_database()
            invoices_collection = db.invoices

            # Check if invoice can be voided (no payments)
            invoice = await self.get_invoice_by_id(invoice_id)
            if not invoice or invoice.paid_amount > 0:
                return False

            update_data = {
                "status": InvoiceStatus.VOID,
                "voided_at": datetime.utcnow(),
                "voided_by": user_id,
                "void_reason": reason,
                "updated_at": datetime.utcnow(),
                "updated_by": user_id
            }

            result = await invoices_collection.update_one(
                {"_id": ObjectId(invoice_id)},
                {"$set": update_data}
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error voiding invoice: {e}")
            return False

    async def _generate_invoice_number(self) -> str:
        """Generate unique invoice number"""
        try:
            db = get_database()
            invoices_collection = db.invoices

            # Get last invoice number
            last_invoice = await invoices_collection.find_one(
                {}, 
                sort=[("invoice_number", -1)]
            )

            if last_invoice and last_invoice.get("invoice_number"):
                # Extract number from last code (e.g., "INV-00001" -> 1)
                last_code = last_invoice["invoice_number"]
                if "-" in last_code:
                    last_number = int(last_code.split("-")[-1])
                    new_number = last_number + 1
                else:
                    new_number = 1
            else:
                new_number = 1

            return f"INV-{new_number:05d}"

        except Exception as e:
            logger.error(f"Error generating invoice number: {e}")
            return f"INV-{datetime.now().timestamp():.0f}"


# Global instance
invoice_service = InvoiceService()
