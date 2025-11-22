from app.database import get_database
from app.models import (
    InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoiceInDB, InvoiceStatus,
    PaymentCreate, PaymentResponse, PaymentInDB, PaymentMethod, PaymentStatus
)
from app.services.customer_service import customer_service
from app.services.sales_order_service import sales_order_service
from app.services.notification_client import NotificationClient
from app.services.notification_helper import (
    get_notification_recipients_for_sales_action,
    get_user_info,
    send_notification_to_supervisors
)
from app.services.external_services import auth_service
from pymongo.errors import DuplicateKeyError
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from bson import ObjectId
from app.config import settings
import logging
import os

logger = logging.getLogger(__name__)


class InvoiceService:
    def __init__(self):
        # Initialize notification client
        notification_url = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8004")
        self.notification_client = NotificationClient(notification_url)

    async def create_invoice(self, invoice_data: InvoiceCreate, user_id: str, token: str) -> InvoiceResponse:
        """Create a new invoice"""
        try:
            db = get_database()
            invoices_collection = db.invoices

            # Determine if creating from order or directly
            order_id = invoice_data.order_id or invoice_data.sales_order_id
            customer_id = invoice_data.customer_id
            line_items = invoice_data.line_items

            # If order_id is provided, get order details
            if order_id:
                order = await sales_order_service.get_order_by_id(order_id)
                if not order:
                    raise ValueError("Sales order not found")
                
                # Safely access order attributes
                customer_id = getattr(order, 'customer_id', None)
                if not customer_id:
                    raise ValueError("Order missing customer_id")
                
                line_items = getattr(order, 'line_items', None)
                if not line_items:
                    raise ValueError("Order missing line_items")
                
                # Convert line_items to InvoiceLineItem format if needed
                # Handle both dict and object formats
                converted_line_items = []
                for item in line_items:
                    if isinstance(item, dict):
                        # Convert dict to InvoiceLineItem
                        from app.models.invoice import InvoiceLineItem
                        converted_line_items.append(InvoiceLineItem(
                            product_id=str(item.get('product_id', '')),
                            product_name=item.get('product_name'),
                            product_sku=item.get('product_sku'),
                            quantity=item.get('quantity', 0),
                            unit_price=item.get('unit_price', 0.0),
                            discount_percent=item.get('discount_percent', 0.0),
                            discount_amount=item.get('discount_amount', 0.0),
                            tax_rate=item.get('tax_rate', 0.0),
                            tax_amount=item.get('tax_amount', 0.0),
                            line_total=item.get('line_total'),
                            notes=item.get('notes')
                        ))
                    else:
                        # Already an object, use as is
                        converted_line_items.append(item)
                
                line_items = converted_line_items
                shipping_cost = invoice_data.shipping_cost or getattr(order, 'shipping_cost', 0)
            else:
                # Direct invoice creation - validate required fields
                if not customer_id:
                    raise ValueError("Customer ID is required when not creating from an order")
                if not line_items or len(line_items) == 0:
                    raise ValueError("Line items are required when not creating from an order")
                shipping_cost = invoice_data.shipping_cost or 0

            # Validate customer
            logger.info(f"Getting customer by ID: {customer_id}")
            customer = await customer_service.get_customer_by_id(customer_id)
            if not customer:
                raise ValueError("Customer not found")
            
            # Safely get customer ID
            customer_id_str = getattr(customer, 'id', None) or getattr(customer, '_id', None) or customer_id
            logger.info(f"Customer found: {customer.first_name} {customer.last_name}, ID: {customer_id_str}")

            # Calculate due date
            due_date = invoice_data.due_date
            if not due_date:
                # Convert PaymentTerms enum to days
                payment_terms_days = 30  # default
                if customer.payment_terms:
                    payment_terms_map = {
                        "net_15": 15,
                        "net_30": 30,
                        "net_45": 45,
                        "net_60": 60,
                        "net_90": 90,
                        "cod": 0,
                        "cash_on_delivery": 0,
                        "prepaid": 0,
                        "immediate": 0
                    }
                    payment_terms_value = customer.payment_terms.value if hasattr(customer.payment_terms, 'value') else str(customer.payment_terms)
                    payment_terms_days = payment_terms_map.get(payment_terms_value, 30)
                due_date = (invoice_data.invoice_date or date.today()) + timedelta(days=payment_terms_days)

            # Calculate totals from line items
            subtotal = sum(item.line_total if item.line_total is not None else (item.quantity * item.unit_price) for item in line_items)
            tax_amount = sum(item.tax_amount for item in line_items)
            total_amount = subtotal + tax_amount + shipping_cost

            # Generate invoice number
            invoice_number = await self._generate_invoice_number()

            # Convert date to datetime for MongoDB storage
            invoice_date_value = invoice_data.invoice_date or date.today()
            due_date_value = due_date
            
            # Convert date objects to datetime for MongoDB
            if isinstance(invoice_date_value, date) and not isinstance(invoice_date_value, datetime):
                invoice_date_value = datetime.combine(invoice_date_value, datetime.min.time())
            if isinstance(due_date_value, date) and not isinstance(due_date_value, datetime):
                due_date_value = datetime.combine(due_date_value, datetime.min.time())
            
            # Create invoice document
            invoice_doc = InvoiceInDB(
                invoice_number=invoice_number,
                customer_id=customer_id,
                customer_name=f"{customer.first_name} {customer.last_name}".strip(),
                customer_email=customer.email,
                invoice_date=invoice_date_value,
                due_date=due_date_value,
                order_id=order_id,
                line_items=line_items,
                subtotal=subtotal,
                tax_amount=tax_amount,
                shipping_cost=shipping_cost,
                total_amount=total_amount,
                paid_amount=0.0,
                balance_due=total_amount,
                payment_status=PaymentStatus.PENDING,
                notes=invoice_data.notes,
                status=InvoiceStatus.DRAFT,
                created_by=user_id
            )

            # Convert to dict and ensure dates are datetime for MongoDB
            invoice_dict = invoice_doc.dict(by_alias=True, exclude={"id"})
            
            # Ensure invoice_date and due_date are datetime objects for MongoDB
            if "invoice_date" in invoice_dict and isinstance(invoice_dict["invoice_date"], date):
                invoice_dict["invoice_date"] = datetime.combine(invoice_dict["invoice_date"], datetime.min.time())
            if "due_date" in invoice_dict and isinstance(invoice_dict["due_date"], date):
                invoice_dict["due_date"] = datetime.combine(invoice_dict["due_date"], datetime.min.time())
            
            # Insert invoice
            result = await invoices_collection.insert_one(invoice_dict)
            
            # Fetch created invoice
            created_invoice = await invoices_collection.find_one({"_id": result.inserted_id})
            if created_invoice:
                # Send notification about invoice creation to supervisors
                try:
                    # Get creator's information
                    creator_info = await auth_service.get_user_by_id(user_id, token)
                    creator_name = "A user"
                    if creator_info:
                        first_name = creator_info.get('first_name', '')
                        last_name = creator_info.get('last_name', '')
                        creator_name = f"{first_name} {last_name}".strip() or creator_info.get('email', 'A user')
                    
                    # Get recipients (notify managers and finance team)
                    recipients = await get_notification_recipients_for_sales_action(
                        performer_id=user_id,
                        token=token,
                        include_managers=True,
                        include_sales_team=False,
                        exclude_performer=True
                    )
                    
                    if recipients:
                        await send_notification_to_supervisors(
                            notification_client=self.notification_client,
                            performer_id=user_id,
                            performer_name=creator_name,
                            title=f"Invoice Created by {creator_name}",
                            message=f"{creator_name} created Invoice {invoice_number} for {created_invoice['customer_name']}. Total: ${total_amount:.2f}",
                            notification_type="invoice_created",
                            priority="medium",
                            metadata={
                                "invoice_id": str(created_invoice["_id"]),
                                "invoice_number": invoice_number,
                                "customer_name": created_invoice['customer_name'],
                                "total_amount": total_amount,
                                "due_date": due_date.isoformat() if isinstance(due_date, date) else due_date,
                                "created_by_name": creator_name
                            },
                            action_url=f"/sales/invoices/{created_invoice['_id']}",
                            action_label="View Invoice",
                            token=token,
                            recipients=recipients
                        )
                except Exception as e:
                    logger.warning(f"Failed to send notification for invoice creation: {e}")
                
                # Convert MongoDB document to dict and ensure id field is set
                invoice_dict = dict(created_invoice)
                
                # Convert _id ObjectId to string and set as id
                if "_id" in invoice_dict:
                    invoice_dict["id"] = str(invoice_dict["_id"])
                    # Also keep _id for backward compatibility if needed
                    invoice_dict["_id"] = str(invoice_dict["_id"])
                
                # Convert datetime to date for invoice_date and due_date if needed
                if "invoice_date" in invoice_dict and isinstance(invoice_dict["invoice_date"], datetime):
                    invoice_dict["invoice_date"] = invoice_dict["invoice_date"].date()
                if "due_date" in invoice_dict and isinstance(invoice_dict["due_date"], datetime):
                    invoice_dict["due_date"] = invoice_dict["due_date"].date()
                
                # Convert ObjectId fields in line_items if present
                if "line_items" in invoice_dict and invoice_dict["line_items"]:
                    for item in invoice_dict["line_items"]:
                        if isinstance(item, dict):
                            if "product_id" in item and isinstance(item["product_id"], ObjectId):
                                item["product_id"] = str(item["product_id"])
                
                return InvoiceResponse(**invoice_dict)
            
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
            if not invoice:
                return None
            
            # Convert MongoDB document to proper format
            invoice_dict = dict(invoice)
            
            # Convert _id ObjectId to string
            if "_id" in invoice_dict and isinstance(invoice_dict["_id"], ObjectId):
                invoice_dict["_id"] = str(invoice_dict["_id"])
            
            # Map old field names to new field names (for backward compatibility)
            if "issue_date" in invoice_dict and "invoice_date" not in invoice_dict:
                invoice_dict["invoice_date"] = invoice_dict.pop("issue_date")
            
            if "items" in invoice_dict and "line_items" not in invoice_dict:
                invoice_dict["line_items"] = invoice_dict.pop("items")
            
            if "tax" in invoice_dict and "tax_amount" not in invoice_dict:
                invoice_dict["tax_amount"] = invoice_dict.pop("tax")
            
            if "amount_paid" in invoice_dict and "paid_amount" not in invoice_dict:
                invoice_dict["paid_amount"] = invoice_dict.pop("amount_paid")
            
            # Convert datetime to date for invoice_date and due_date
            if "invoice_date" in invoice_dict:
                if isinstance(invoice_dict["invoice_date"], datetime):
                    invoice_dict["invoice_date"] = invoice_dict["invoice_date"].date()
                elif isinstance(invoice_dict["invoice_date"], str):
                    # Parse string date
                    try:
                        invoice_dict["invoice_date"] = datetime.fromisoformat(invoice_dict["invoice_date"].replace('Z', '+00:00')).date()
                    except:
                        invoice_dict["invoice_date"] = datetime.strptime(invoice_dict["invoice_date"], "%Y-%m-%d").date()
            
            if "due_date" in invoice_dict:
                if isinstance(invoice_dict["due_date"], datetime):
                    invoice_dict["due_date"] = invoice_dict["due_date"].date()
                elif isinstance(invoice_dict["due_date"], str):
                    # Parse string date
                    try:
                        invoice_dict["due_date"] = datetime.fromisoformat(invoice_dict["due_date"].replace('Z', '+00:00')).date()
                    except:
                        invoice_dict["due_date"] = datetime.strptime(invoice_dict["due_date"], "%Y-%m-%d").date()
            
            # Ensure required fields have defaults
            invoice_dict.setdefault("tax_amount", invoice_dict.get("tax", 0.0))
            invoice_dict.setdefault("total_amount", invoice_dict.get("total", 0.0))
            invoice_dict.setdefault("subtotal", 0.0)
            invoice_dict.setdefault("paid_amount", invoice_dict.get("amount_paid", 0.0))
            invoice_dict.setdefault("balance_due", invoice_dict.get("balance_due", invoice_dict.get("total_amount", 0.0)))
            invoice_dict.setdefault("late_fee_amount", 0.0)
            invoice_dict.setdefault("status", InvoiceStatus.DRAFT)
            invoice_dict.setdefault("created_at", datetime.utcnow())
            invoice_dict.setdefault("updated_at", datetime.utcnow())
            invoice_dict.setdefault("created_by", "system")  # Default for old invoices without created_by
            
            # Convert status string to enum if it's a string
            if "status" in invoice_dict and isinstance(invoice_dict["status"], str):
                try:
                    invoice_dict["status"] = InvoiceStatus(invoice_dict["status"].lower())
                except:
                    invoice_dict["status"] = InvoiceStatus.DRAFT
            
            return InvoiceInDB(**invoice_dict)

        except Exception as e:
            logger.error(f"Error getting invoice by ID: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None

    async def get_invoice_by_number(self, invoice_number: str) -> Optional[InvoiceInDB]:
        """Get invoice by invoice number"""
        try:
            db = get_database()
            invoices_collection = db.invoices
            
            invoice = await invoices_collection.find_one({"invoice_number": invoice_number})
            if not invoice:
                return None
            
            # Use the same conversion logic as get_invoice_by_id
            invoice_dict = dict(invoice)
            
            # Convert _id ObjectId to string
            if "_id" in invoice_dict and isinstance(invoice_dict["_id"], ObjectId):
                invoice_dict["_id"] = str(invoice_dict["_id"])
            
            # Map old field names to new field names (for backward compatibility)
            if "issue_date" in invoice_dict and "invoice_date" not in invoice_dict:
                invoice_dict["invoice_date"] = invoice_dict.pop("issue_date")
            
            if "items" in invoice_dict and "line_items" not in invoice_dict:
                invoice_dict["line_items"] = invoice_dict.pop("items")
            
            if "tax" in invoice_dict and "tax_amount" not in invoice_dict:
                invoice_dict["tax_amount"] = invoice_dict.pop("tax")
            
            if "amount_paid" in invoice_dict and "paid_amount" not in invoice_dict:
                invoice_dict["paid_amount"] = invoice_dict.pop("amount_paid")
            
            # Convert datetime to date for invoice_date and due_date
            if "invoice_date" in invoice_dict:
                if isinstance(invoice_dict["invoice_date"], datetime):
                    invoice_dict["invoice_date"] = invoice_dict["invoice_date"].date()
                elif isinstance(invoice_dict["invoice_date"], str):
                    try:
                        invoice_dict["invoice_date"] = datetime.fromisoformat(invoice_dict["invoice_date"].replace('Z', '+00:00')).date()
                    except:
                        invoice_dict["invoice_date"] = datetime.strptime(invoice_dict["invoice_date"], "%Y-%m-%d").date()
            
            if "due_date" in invoice_dict:
                if isinstance(invoice_dict["due_date"], datetime):
                    invoice_dict["due_date"] = invoice_dict["due_date"].date()
                elif isinstance(invoice_dict["due_date"], str):
                    try:
                        invoice_dict["due_date"] = datetime.fromisoformat(invoice_dict["due_date"].replace('Z', '+00:00')).date()
                    except:
                        invoice_dict["due_date"] = datetime.strptime(invoice_dict["due_date"], "%Y-%m-%d").date()
            
            # Ensure required fields have defaults
            invoice_dict.setdefault("tax_amount", invoice_dict.get("tax", 0.0))
            invoice_dict.setdefault("total_amount", invoice_dict.get("total", 0.0))
            invoice_dict.setdefault("subtotal", 0.0)
            invoice_dict.setdefault("paid_amount", invoice_dict.get("amount_paid", 0.0))
            invoice_dict.setdefault("balance_due", invoice_dict.get("balance_due", invoice_dict.get("total_amount", 0.0)))
            invoice_dict.setdefault("late_fee_amount", 0.0)
            invoice_dict.setdefault("status", InvoiceStatus.DRAFT)
            invoice_dict.setdefault("created_at", datetime.utcnow())
            invoice_dict.setdefault("updated_at", datetime.utcnow())
            invoice_dict.setdefault("created_by", "system")
            
            # Convert status string to enum if it's a string
            if "status" in invoice_dict and isinstance(invoice_dict["status"], str):
                try:
                    invoice_dict["status"] = InvoiceStatus(invoice_dict["status"].lower())
                except:
                    invoice_dict["status"] = InvoiceStatus.DRAFT
            
            return InvoiceInDB(**invoice_dict)

        except Exception as e:
            logger.error(f"Error getting invoice by number: {e}")
            import traceback
            logger.error(traceback.format_exc())
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
            # Sort by invoice_date, issue_date, or created_at (handle old data structure)
            try:
                cursor = invoices_collection.find(filter_query).skip(skip).limit(limit).sort("invoice_date", -1)
            except:
                try:
                    cursor = invoices_collection.find(filter_query).skip(skip).limit(limit).sort("issue_date", -1)
                except:
                    cursor = invoices_collection.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
            invoices = await cursor.to_list(length=limit)

            # Convert invoices to InvoiceResponse, handling both old and new data structures
            converted_invoices = []
            for invoice in invoices:
                try:
                    # Map old structure to new structure
                    invoice_dict = dict(invoice)
                    
                    # Handle _id conversion
                    if '_id' in invoice_dict:
                        invoice_dict['_id'] = str(invoice_dict['_id'])
                    
                    # Map old field names to new ones
                    if 'items' in invoice_dict and 'line_items' not in invoice_dict:
                        invoice_dict['line_items'] = invoice_dict.pop('items')
                    
                    if 'tax' in invoice_dict and 'tax_amount' not in invoice_dict:
                        invoice_dict['tax_amount'] = invoice_dict.pop('tax')
                    
                    if 'total' in invoice_dict and 'total_amount' not in invoice_dict:
                        invoice_dict['total_amount'] = invoice_dict.pop('total')
                    
                    if 'amount_paid' in invoice_dict and 'paid_amount' not in invoice_dict:
                        invoice_dict['paid_amount'] = invoice_dict.pop('amount_paid')
                    
                    if 'issue_date' in invoice_dict and 'invoice_date' not in invoice_dict:
                        invoice_dict['invoice_date'] = invoice_dict.pop('issue_date')
                    
                    # Ensure required fields exist
                    if 'payment_status' not in invoice_dict:
                        # Determine payment status from amount_paid/paid_amount
                        paid = invoice_dict.get('paid_amount', 0) or invoice_dict.get('amount_paid', 0)
                        total = invoice_dict.get('total_amount', 0) or invoice_dict.get('total', 0)
                        if paid >= total:
                            invoice_dict['payment_status'] = PaymentStatus.COMPLETED
                        elif paid > 0:
                            invoice_dict['payment_status'] = PaymentStatus.PROCESSING
                        else:
                            invoice_dict['payment_status'] = PaymentStatus.PENDING
                    elif isinstance(invoice_dict['payment_status'], str):
                        # Convert string payment status to enum
                        try:
                            status_str = invoice_dict['payment_status'].lower()
                            if status_str in ['paid', 'completed']:
                                invoice_dict['payment_status'] = PaymentStatus.COMPLETED
                            elif status_str in ['partial', 'partial_paid', 'processing']:
                                invoice_dict['payment_status'] = PaymentStatus.PROCESSING
                            else:
                                invoice_dict['payment_status'] = PaymentStatus.PENDING
                        except:
                            invoice_dict['payment_status'] = PaymentStatus.PENDING
                    
                    if 'balance_due' not in invoice_dict:
                        total = invoice_dict.get('total_amount', 0) or invoice_dict.get('total', 0)
                        paid = invoice_dict.get('paid_amount', 0) or invoice_dict.get('amount_paid', 0)
                        invoice_dict['balance_due'] = total - paid
                    
                    if 'status' not in invoice_dict:
                        invoice_dict['status'] = InvoiceStatus.DRAFT
                    elif isinstance(invoice_dict['status'], str):
                        # Ensure status is a valid InvoiceStatus enum
                        try:
                            status_str = invoice_dict['status'].lower()
                            # Map old status values to new ones
                            status_map = {
                                'paid': InvoiceStatus.PAID,
                                'sent': InvoiceStatus.SENT,
                                'draft': InvoiceStatus.DRAFT,
                                'overdue': InvoiceStatus.OVERDUE,
                                'cancelled': InvoiceStatus.CANCELLED,
                                'void': InvoiceStatus.VOID,
                            }
                            invoice_dict['status'] = status_map.get(status_str, InvoiceStatus.DRAFT)
                        except Exception as e:
                            logger.warning(f"Could not convert status {invoice_dict['status']}: {e}")
                            invoice_dict['status'] = InvoiceStatus.DRAFT
                    
                    # Convert dates if needed
                    if 'invoice_date' in invoice_dict and isinstance(invoice_dict['invoice_date'], datetime):
                        invoice_dict['invoice_date'] = invoice_dict['invoice_date'].date()
                    if 'due_date' in invoice_dict and isinstance(invoice_dict['due_date'], datetime):
                        invoice_dict['due_date'] = invoice_dict['due_date'].date()
                    
                    # Ensure created_at and updated_at are datetime
                    if 'created_at' not in invoice_dict:
                        invoice_dict['created_at'] = datetime.utcnow()
                    if 'updated_at' not in invoice_dict:
                        invoice_dict['updated_at'] = datetime.utcnow()
                    
                    # Ensure created_by exists
                    if 'created_by' not in invoice_dict:
                        invoice_dict['created_by'] = 'system'
                    
                    # Ensure id field is set (InvoiceResponse expects id, not _id)
                    if '_id' in invoice_dict and 'id' not in invoice_dict:
                        invoice_dict['id'] = invoice_dict['_id']
                    elif 'id' not in invoice_dict:
                        invoice_dict['id'] = str(invoice_dict.get('_id', ''))
                    
                    converted_invoices.append(InvoiceResponse(**invoice_dict))
                except Exception as e:
                    logger.error(f"Error converting invoice {invoice.get('_id')}: {e}")
                    continue
            
            return converted_invoices

        except Exception as e:
            logger.error(f"Error getting invoices: {e}")
            return []

    async def count_invoices(self, status: Optional[InvoiceStatus] = None,
                            payment_status: Optional[PaymentStatus] = None,
                            customer_id: Optional[str] = None,
                            start_date: Optional[date] = None,
                            end_date: Optional[date] = None,
                            overdue_only: bool = False,
                            search: Optional[str] = None) -> int:
        """Get total count of invoices with filters"""
        try:
            db = get_database()
            invoices_collection = db.invoices

            # Build filter (same as get_invoices)
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

            # Get count
            count = await invoices_collection.count_documents(filter_query)
            return count

        except Exception as e:
            logger.error(f"Error counting invoices: {e}")
            return 0

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
            payment_date_value = date.today()
            # Convert date to datetime for MongoDB
            if isinstance(payment_date_value, date) and not isinstance(payment_date_value, datetime):
                payment_date_value = datetime.combine(payment_date_value, datetime.min.time())
            
            payment_doc = PaymentInDB(
                invoice_id=invoice_id,
                amount=amount,
                payment_method=payment_method,
                reference=reference,
                notes=notes,
                payment_date=payment_date_value,
                created_by=user_id
            )

            # Convert to dict and ensure payment_date is datetime for MongoDB
            payment_dict = payment_doc.dict(by_alias=True, exclude={"id"})
            if "payment_date" in payment_dict and isinstance(payment_dict["payment_date"], date):
                payment_dict["payment_date"] = datetime.combine(payment_dict["payment_date"], datetime.min.time())
            
            # Insert payment
            payment_result = await payments_collection.insert_one(payment_dict)

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
            logger.info(f"Creating invoice from order: {order_id}")
            # Get sales order
            order = await sales_order_service.get_order_by_id(order_id)
            if not order:
                logger.error(f"Order not found: {order_id}")
                return None

            logger.info(f"Order found: {order.order_number if hasattr(order, 'order_number') else 'N/A'}")
            # Get order number safely
            order_number = getattr(order, 'order_number', None) or f"Order-{order_id[:8]}"
            
            # Create invoice data from order
            invoice_data = InvoiceCreate(
                sales_order_id=order_id,  # Use sales_order_id instead of order_id
                invoice_date=date.today(),
                notes=f"Invoice for order: {order_number}"
            )

            logger.info(f"Calling create_invoice with order_id: {order_id}")
            # Create invoice
            invoice = await self.create_invoice(invoice_data, user_id, token)
            logger.info(f"Invoice created successfully: {invoice.invoice_number if invoice else 'None'}")
            return invoice

        except KeyError as e:
            logger.error(f"KeyError creating invoice from order - missing key: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None
        except Exception as e:
            logger.error(f"Error creating invoice from order: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None

    async def generate_invoice_pdf(self, invoice_id: str) -> Optional[bytes]:
        """Generate invoice PDF using reportlab"""
        try:
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.lib.units import inch
            from reportlab.lib import colors
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
            from reportlab.pdfgen import canvas
            from io import BytesIO
            from datetime import datetime as dt
            
            # Get invoice
            invoice = await self.get_invoice_by_id(invoice_id)
            if not invoice:
                return None

            # Create PDF buffer
            buffer = BytesIO()
            
            # Create PDF document
            doc = SimpleDocTemplate(buffer, pagesize=letter, 
                                  rightMargin=72, leftMargin=72,
                                  topMargin=72, bottomMargin=18)
            
            # Container for the 'Flowable' objects
            elements = []
            styles = getSampleStyleSheet()
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#1e40af'),
                spaceAfter=30,
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=14,
                textColor=colors.HexColor('#334155'),
                spaceAfter=12,
            )
            
            # Title
            title = Paragraph("INVOICE", title_style)
            elements.append(title)
            elements.append(Spacer(1, 0.3*inch))
            
            # Prepare invoice information (left side)
            invoice_info_rows = []
            if invoice.order_number:
                invoice_info_rows.append(['Order Number:', invoice.order_number])
            invoice_info_rows.append(['Invoice Number:', invoice.invoice_number])
            invoice_info_rows.append(['Invoice Date:', invoice.invoice_date.strftime('%B %d, %Y') if isinstance(invoice.invoice_date, date) else invoice.invoice_date.strftime('%B %d, %Y') if hasattr(invoice.invoice_date, 'strftime') else str(invoice.invoice_date)])
            invoice_info_rows.append(['Due Date:', invoice.due_date.strftime('%B %d, %Y') if isinstance(invoice.due_date, date) else invoice.due_date.strftime('%B %d, %Y') if hasattr(invoice.due_date, 'strftime') else str(invoice.due_date)])
            
            # Prepare customer information (right side)
            # Build customer info rows - "Bill To:" aligned with customer name
            customer_info_rows = []
            # First row: "Bill To:" label and customer name on same row
            customer_info_rows.append(['Bill To:', invoice.customer_name])
            # Email on next row
            if invoice.customer_email:
                customer_info_rows.append(['', invoice.customer_email])
            
            # Add billing address if available
            if invoice.billing_address:
                addr = invoice.billing_address
                if isinstance(addr, dict):
                    address_lines = []
                    if addr.get('street'):
                        address_lines.append(addr['street'])
                    if addr.get('city'):
                        city_state = addr['city']
                        if addr.get('state'):
                            city_state += f", {addr['state']}"
                        if addr.get('zip_code'):
                            city_state += f" {addr['zip_code']}"
                        address_lines.append(city_state)
                    if addr.get('country'):
                        address_lines.append(addr['country'])
                    
                    for line in address_lines:
                        customer_info_rows.append(['', line])
            
            # Calculate max rows for alignment
            max_rows = max(len(invoice_info_rows), len(customer_info_rows))
            
            # Pad shorter list with empty rows
            while len(invoice_info_rows) < max_rows:
                invoice_info_rows.append(['', ''])
            while len(customer_info_rows) < max_rows:
                customer_info_rows.append(['', ''])
            
            # Create combined data for side-by-side table
            combined_data = []
            for i in range(max_rows):
                combined_data.append([
                    invoice_info_rows[i][0],  # Left label
                    invoice_info_rows[i][1],  # Left value
                    customer_info_rows[i][0],  # Right label
                    customer_info_rows[i][1]   # Right value
                ])
            
            # Create side-by-side table
            info_table = Table(combined_data, colWidths=[1.2*inch, 2.3*inch, 1*inch, 2.5*inch])
            info_table.setStyle(TableStyle([
                # Left column (Invoice info)
                ('ALIGN', (0, 0), (1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (1, -1), 6),
                ('TOPPADDING', (0, 0), (1, -1), 6),
                # Right column (Bill To)
                ('ALIGN', (2, 0), (3, -1), 'LEFT'),
                ('FONTNAME', (2, 0), (2, 0), 'Helvetica-Bold'),  # "Bill To:" label
                ('FONTNAME', (2, 1), (3, -1), 'Helvetica'),  # Customer name and details
                ('FONTSIZE', (2, 0), (3, -1), 10),
                ('BOTTOMPADDING', (2, 0), (3, -1), 6),
                ('TOPPADDING', (2, 0), (3, -1), 6),
                # Spacing between columns
                ('LEFTPADDING', (2, 0), (2, -1), 20),
            ]))
            elements.append(info_table)
            elements.append(Spacer(1, 0.4*inch))
            
            # Line items table
            line_items_data = [['Item', 'Description', 'Quantity', 'Unit Price', 'Total']]
            
            # Get line items from invoice or order
            line_items = []
            # Handle both new (line_items) and old (items) field names
            if hasattr(invoice, 'line_items') and invoice.line_items:
                line_items = invoice.line_items
            elif hasattr(invoice, 'items') and invoice.items:
                line_items = invoice.items
            elif invoice.order_id:
                # Try to get line items from order
                try:
                    order = await sales_order_service.get_order_by_id(invoice.order_id)
                    if order and hasattr(order, 'line_items'):
                        line_items = order.line_items
                except:
                    pass
            
            # Helper function to safely get value from dict or object
            def get_item_value(item, key, default=None):
                """Get value from item whether it's a dict or object"""
                if isinstance(item, dict):
                    return item.get(key, default)
                else:
                    return getattr(item, key, default)
            
            # Process line items
            if not line_items:
                # If no line items, add a placeholder
                line_items_data.append(['N/A', 'No items found', '0', '$0.00', '$0.00'])
            else:
                for item in line_items:
                    # Handle both dict and object access
                    product_sku = get_item_value(item, 'product_sku') or get_item_value(item, 'sku') or 'N/A'
                    product_name = get_item_value(item, 'product_name') or get_item_value(item, 'name') or 'N/A'
                    quantity = get_item_value(item, 'quantity', 0)
                    unit_price = get_item_value(item, 'unit_price', 0)
                    
                    # Calculate line total if not provided
                    line_total = get_item_value(item, 'line_total')
                    if line_total is None:
                        # Calculate: (unit_price * quantity) - discount
                        discount_amount = get_item_value(item, 'discount_amount', 0)
                        line_total = (unit_price * quantity) - discount_amount
                    
                    # Ensure numeric values
                    try:
                        quantity = int(quantity) if quantity else 0
                        unit_price = float(unit_price) if unit_price else 0.0
                        line_total = float(line_total) if line_total else 0.0
                    except (ValueError, TypeError):
                        quantity = 0
                        unit_price = 0.0
                        line_total = 0.0
                    
                    line_items_data.append([
                        str(product_sku),
                        str(product_name),
                        str(quantity),
                        f"${unit_price:,.2f}",
                        f"${line_total:,.2f}",
                    ])
            
            line_items_table = Table(line_items_data, colWidths=[1*inch, 2.5*inch, 0.7*inch, 1*inch, 1*inch])
            line_items_table.setStyle(TableStyle([
                # Header row
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (2, 0), (4, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TOPPADDING', (0, 0), (-1, 0), 12),
                # Data rows
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ('TOPPADDING', (0, 1), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ]))
            elements.append(line_items_table)
            elements.append(Spacer(1, 0.3*inch))
            
            # Totals
            totals_data = [
                ['Subtotal:', f"${invoice.subtotal:,.2f}"],
                ['Tax:', f"${invoice.tax_amount:,.2f}"],
            ]
            
            if hasattr(invoice, 'shipping_cost') and invoice.shipping_cost and invoice.shipping_cost > 0:
                totals_data.append(['Shipping:', f"${invoice.shipping_cost:,.2f}"])
            
            if invoice.late_fee_amount and invoice.late_fee_amount > 0:
                totals_data.append(['Late Fee:', f"${invoice.late_fee_amount:,.2f}"])
            
            totals_data.append(['', ''])  # Empty row for spacing
            totals_data.append(['Total Amount:', f"${invoice.total_amount:,.2f}"])
            totals_data.append(['Paid Amount:', f"${invoice.paid_amount:,.2f}"])
            totals_data.append(['Balance Due:', f"${invoice.balance_due:,.2f}"])
            
            totals_table = Table(totals_data, colWidths=[2*inch, 2*inch])
            totals_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (0, -2), 'Helvetica'),
                ('FONTNAME', (0, -3), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('FONTSIZE', (0, -3), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('LINEABOVE', (0, -3), (-1, -3), 1, colors.grey),
                ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#1e40af')),
            ]))
            elements.append(totals_table)
            
            # Notes and payment terms
            if invoice.notes or invoice.payment_terms:
                elements.append(Spacer(1, 0.4*inch))
                notes_heading = Paragraph("Notes:", heading_style)
                elements.append(notes_heading)
                
                notes_text = []
                if invoice.payment_terms:
                    notes_text.append(f"Payment Terms: {invoice.payment_terms}")
                if invoice.notes:
                    notes_text.append(invoice.notes)
                
                notes_paragraph = Paragraph("<br/>".join(notes_text), styles['Normal'])
                elements.append(notes_paragraph)
            
            # Status
            elements.append(Spacer(1, 0.3*inch))
            status_text = f"Status: {invoice.status.value.upper()}" if hasattr(invoice.status, 'value') else f"Status: {invoice.status.upper()}"
            status_paragraph = Paragraph(status_text, styles['Normal'])
            elements.append(status_paragraph)
            
            # Build PDF
            doc.build(elements)
            
            # Get PDF bytes
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            return pdf_bytes

        except Exception as e:
            logger.error(f"Error generating invoice PDF: {e}")
            import traceback
            logger.error(traceback.format_exc())
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
