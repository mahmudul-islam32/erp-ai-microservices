from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from bson import ObjectId
import logging

from app.database import get_database
from app.models.pos import (
    POSTransactionCreate, POSTransactionResponse, POSSessionCreate, 
    POSSessionResponse, POSSessionSummary, QuickSaleCreate, 
    QuickSaleResponse, POSReceiptResponse, POSSessionStatus, 
    TransactionType, POSCustomer
)
from app.models.payment import PaymentMethod, PaymentCreate
from app.models.sales_order import SalesOrderCreate, OrderItemCreate
from app.models.customer import CustomerCreate
from app.services import (
    sales_order_service, invoice_service, payment_service, customer_service
)

logger = logging.getLogger(__name__)


class POSService:
    def __init__(self):
        self.db = None
    
    async def get_db(self):
        if not self.db:
            self.db = await get_database()
        return self.db

    async def create_pos_transaction(
        self, 
        transaction_data: POSTransactionCreate, 
        cashier_id: str, 
        token: str
    ) -> POSTransactionResponse:
        """
        Create a complete POS transaction:
        1. Create/get customer
        2. Create sales order
        3. Process payments
        4. Generate invoice
        5. Return transaction details
        """
        try:
            db = await self.get_db()
            
            # Generate transaction number
            transaction_number = await self._generate_transaction_number()
            
            # Step 1: Handle customer
            customer_id = None
            customer = None
            
            if transaction_data.customer.customer_id:
                # Existing customer
                customer_id = transaction_data.customer.customer_id
                customer = await customer_service.get_customer_by_id(customer_id)
            elif not transaction_data.customer.is_walk_in and transaction_data.customer.email:
                # Try to find existing customer by email
                existing_customer = await customer_service.get_customer_by_email(
                    transaction_data.customer.email
                )
                if existing_customer:
                    customer_id = existing_customer.id
                    customer = existing_customer
                else:
                    # Create new customer
                    customer_data = CustomerCreate(
                        first_name=transaction_data.customer.name or "Walk-in",
                        last_name="Customer",
                        email=transaction_data.customer.email,
                        phone=transaction_data.customer.phone,
                        customer_type="individual",
                        payment_terms="immediate"
                    )
                    customer = await customer_service.create_customer(customer_data, cashier_id)
                    customer_id = customer.id
            else:
                # Walk-in customer - create temporary customer record
                customer_data = CustomerCreate(
                    first_name=transaction_data.customer.name or "Walk-in",
                    last_name="Customer",
                    email="walkin@pos.local",
                    phone=transaction_data.customer.phone or "000-000-0000",
                    customer_type="individual",
                    payment_terms="immediate",
                    is_walk_in=True
                )
                customer = await customer_service.create_customer(customer_data, cashier_id)
                customer_id = customer.id

            # Step 2: Create sales order
            order_data = SalesOrderCreate(
                customer_id=customer_id,
                line_items=[
                    OrderItemCreate(
                        product_id=item.product_id,
                        quantity=item.quantity,
                        unit_price=item.unit_price,
                        discount_percent=item.discount_percentage,
                        notes=item.notes or ""
                    )
                    for item in transaction_data.line_items
                ],
                subtotal_discount_amount=transaction_data.total_discount,
                notes=transaction_data.notes or f"POS Transaction #{transaction_number}",
                pos_transaction_number=transaction_number
            )
            
            order = await sales_order_service.create_order(order_data, cashier_id, token)
            
            # Step 3: Process payments
            payment_responses = []
            for payment in transaction_data.payments:
                payment_data = PaymentCreate(
                    order_id=order.id,
                    customer_id=customer_id,
                    payment_method=payment.payment_method,
                    amount=payment.amount,
                    currency=payment.currency,
                    notes=f"POS payment for transaction #{transaction_number}",
                    terminal_id=transaction_data.terminal_id,
                    cashier_id=cashier_id
                )
                
                # Add method-specific details
                if payment.payment_method == PaymentMethod.CASH:
                    payment_data.cash_details = {
                        "amount_tendered": payment.cash_tendered or payment.amount,
                        "change_given": payment.change_given or 0,
                        "currency": payment.currency
                    }
                elif payment.payment_method in [PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD]:
                    payment_data.card_details = {
                        "last_four_digits": payment.card_last_four,
                        "authorization_code": payment.authorization_code,
                        "transaction_id": payment.reference_number
                    }
                
                # Process the payment
                if payment.payment_method == PaymentMethod.CASH:
                    payment_response = await payment_service.process_cash_payment(payment_data)
                else:
                    payment_response = await payment_service.process_card_payment(payment_data)
                
                payment_responses.append(payment_response)

            # Step 4: Generate invoice
            invoice = await invoice_service.create_invoice_from_order(
                order.id, 
                cashier_id, 
                token
            )

            # Step 5: Store POS transaction record
            pos_transaction = {
                "_id": ObjectId(),
                "transaction_number": transaction_number,
                "transaction_type": transaction_data.transaction_type,
                "order_id": order.id,
                "invoice_id": invoice.id,
                "customer_id": customer_id,
                "cashier_id": cashier_id,
                "terminal_id": transaction_data.terminal_id,
                "session_id": transaction_data.session_id,
                "line_items": [item.dict() for item in transaction_data.line_items],
                "payments": [payment.dict() for payment in transaction_data.payments],
                "subtotal": transaction_data.subtotal,
                "total_discount": transaction_data.total_discount,
                "total_tax": transaction_data.total_tax,
                "total_amount": transaction_data.total_amount,
                "status": "completed",
                "created_at": datetime.utcnow(),
                "processed_at": datetime.utcnow(),
                "notes": transaction_data.notes,
                "receipt_number": f"R{transaction_number}",
                "refunded_amount": 0.0
            }
            
            await db.pos_transactions.insert_one(pos_transaction)

            # Build response
            response = POSTransactionResponse(
                id=str(pos_transaction["_id"]),
                transaction_number=transaction_number,
                transaction_type=transaction_data.transaction_type,
                order=order,
                invoice=invoice,
                customer=customer,
                line_items=transaction_data.line_items,
                payments=payment_responses,
                subtotal=transaction_data.subtotal,
                total_discount=transaction_data.total_discount,
                total_tax=transaction_data.total_tax,
                total_amount=transaction_data.total_amount,
                terminal_id=transaction_data.terminal_id,
                session_id=transaction_data.session_id,
                cashier_id=cashier_id,
                created_at=pos_transaction["created_at"],
                processed_at=pos_transaction["processed_at"],
                status=pos_transaction["status"],
                receipt_number=pos_transaction["receipt_number"],
                notes=transaction_data.notes,
                refunded_amount=0.0
            )

            return response

        except Exception as e:
            logger.error(f"Error creating POS transaction: {e}")
            raise

    async def process_quick_sale(
        self, 
        sale_data: QuickSaleCreate, 
        cashier_id: str, 
        token: str
    ) -> QuickSaleResponse:
        """Process a quick sale with minimal customer data"""
        try:
            # Convert quick sale data to full POS transaction
            line_items = []
            for item in sale_data.items:
                # Handle different item input formats
                if "product_id" in item:
                    # Regular product
                    line_item = {
                        "product_id": item["product_id"],
                        "product_name": item.get("name", "Unknown Product"),
                        "product_sku": item.get("sku", ""),
                        "quantity": item.get("quantity", 1),
                        "unit_price": item.get("price", 0),
                        "discount_percentage": 0,
                        "discount_amount": 0,
                        "tax_rate": sale_data.tax_rate,
                        "tax_amount": item.get("price", 0) * sale_data.tax_rate,
                        "total_price": item.get("price", 0) * item.get("quantity", 1),
                        "is_taxable": True
                    }
                else:
                    # Quick item entry
                    price = item.get("price", 0)
                    quantity = item.get("quantity", 1)
                    tax_amount = price * quantity * sale_data.tax_rate
                    total_price = (price * quantity) + tax_amount
                    
                    line_item = {
                        "product_id": "quick_item",
                        "product_name": item.get("name", "Quick Sale Item"),
                        "product_sku": "QUICK",
                        "quantity": quantity,
                        "unit_price": price,
                        "discount_percentage": 0,
                        "discount_amount": 0,
                        "tax_rate": sale_data.tax_rate,
                        "tax_amount": tax_amount,
                        "total_price": total_price,
                        "is_taxable": True
                    }
                
                line_items.append(line_item)

            # Calculate totals
            subtotal = sum(item["unit_price"] * item["quantity"] for item in line_items)
            total_tax = sum(item["tax_amount"] for item in line_items)
            total_amount = subtotal + total_tax - sale_data.discount_amount

            # Create customer info
            customer = POSCustomer(
                name=sale_data.customer_name or "Walk-in Customer",
                email=sale_data.customer_email,
                phone=sale_data.customer_phone,
                is_walk_in=True
            )

            # Create payment info
            change_given = 0
            if sale_data.payment_method == PaymentMethod.CASH:
                cash_tendered = sale_data.cash_tendered or sale_data.payment_amount
                change_given = max(0, cash_tendered - total_amount)
            
            payment = {
                "payment_method": sale_data.payment_method,
                "amount": total_amount,
                "cash_tendered": sale_data.cash_tendered,
                "change_given": change_given,
                "currency": "USD"
            }

            # Create full POS transaction
            from app.models.pos import POSLineItem, POSPayment
            
            transaction_data = POSTransactionCreate(
                customer=customer,
                line_items=[POSLineItem(**item) for item in line_items],
                payments=[POSPayment(**payment)],
                transaction_type=TransactionType.SALE,
                subtotal=subtotal,
                total_discount=sale_data.discount_amount,
                total_tax=total_tax,
                total_amount=total_amount,
                terminal_id=sale_data.terminal_id,
                notes=sale_data.notes
            )

            # Process the transaction
            transaction = await self.create_pos_transaction(
                transaction_data, 
                cashier_id, 
                token
            )

            # Generate receipt
            receipt = await self.generate_receipt(transaction.id)

            return QuickSaleResponse(
                transaction=transaction,
                receipt=receipt,
                change_due=change_given
            )

        except Exception as e:
            logger.error(f"Error processing quick sale: {e}")
            raise

    async def start_session(
        self, 
        session_data: POSSessionCreate, 
        cashier_id: str
    ) -> POSSessionResponse:
        """Start a new POS session"""
        try:
            db = await self.get_db()
            
            # Check for existing active session
            existing_session = await db.pos_sessions.find_one({
                "cashier_id": cashier_id,
                "terminal_id": session_data.terminal_id,
                "status": POSSessionStatus.ACTIVE
            })
            
            if existing_session:
                raise ValueError("Active session already exists for this terminal and cashier")

            # Generate session number
            session_number = await self._generate_session_number()

            session = {
                "_id": ObjectId(),
                "session_number": session_number,
                "terminal_id": session_data.terminal_id,
                "cashier_id": cashier_id,
                "started_at": datetime.utcnow(),
                "opening_cash_amount": session_data.opening_cash_amount,
                "status": POSSessionStatus.ACTIVE,
                "opening_notes": session_data.notes,
                "transaction_count": 0,
                "total_sales": 0.0,
                "total_tax": 0.0,
                "total_discounts": 0.0
            }

            await db.pos_sessions.insert_one(session)

            return POSSessionResponse(
                id=str(session["_id"]),
                session_number=session_number,
                terminal_id=session_data.terminal_id,
                cashier_id=cashier_id,
                started_at=session["started_at"],
                opening_cash_amount=session_data.opening_cash_amount,
                status=POSSessionStatus.ACTIVE,
                opening_notes=session_data.notes
            )

        except Exception as e:
            logger.error(f"Error starting POS session: {e}")
            raise

    async def generate_receipt(self, transaction_id: str) -> POSReceiptResponse:
        """Generate a printable receipt for a transaction"""
        try:
            db = await self.get_db()
            
            # Get transaction details
            transaction = await db.pos_transactions.find_one(
                {"_id": ObjectId(transaction_id)}
            )
            
            if not transaction:
                return None

            # Get cashier info
            cashier_name = "Unknown Cashier"  # Could be enhanced with user service lookup

            # Build receipt
            receipt = POSReceiptResponse(
                store_name="Your Store Name",  # Could be from config
                store_address="123 Main St, City, State 12345",
                store_phone="(555) 123-4567",
                receipt_number=transaction["receipt_number"],
                transaction_id=str(transaction["_id"]),
                transaction_date=transaction["created_at"],
                cashier_name=cashier_name,
                terminal_id=transaction.get("terminal_id"),
                line_items=transaction["line_items"],
                subtotal=transaction["subtotal"],
                total_discount=transaction["total_discount"],
                total_tax=transaction["total_tax"],
                total_amount=transaction["total_amount"],
                payments=[
                    {
                        "method": p["payment_method"],
                        "amount": p["amount"],
                        "tendered": p.get("cash_tendered"),
                        "change": p.get("change_given", 0)
                    }
                    for p in transaction["payments"]
                ],
                change_given=sum(p.get("change_given", 0) for p in transaction["payments"]),
                thank_you_message="Thank you for your business!",
                return_policy="Returns within 30 days with receipt."
            )

            return receipt

        except Exception as e:
            logger.error(f"Error generating receipt: {e}")
            raise

    async def _generate_transaction_number(self) -> str:
        """Generate unique transaction number"""
        db = await self.get_db()
        
        # Get today's date for prefix
        today = datetime.utcnow().strftime("%Y%m%d")
        
        # Get the next sequence number for today
        counter = await db.counters.find_one_and_update(
            {"_id": f"pos_transaction_{today}"},
            {"$inc": {"sequence": 1}},
            upsert=True,
            return_document=True
        )
        
        sequence = counter["sequence"]
        return f"{today}{sequence:06d}"

    async def _generate_session_number(self) -> str:
        """Generate unique session number"""
        db = await self.get_db()
        
        # Get today's date for prefix
        today = datetime.utcnow().strftime("%Y%m%d")
        
        # Get the next sequence number for today
        counter = await db.counters.find_one_and_update(
            {"_id": f"pos_session_{today}"},
            {"$inc": {"sequence": 1}},
            upsert=True,
            return_document=True
        )
        
        sequence = counter["sequence"]
        return f"S{today}{sequence:04d}"

    # Additional methods for session management, daily summaries, etc.
    async def get_active_session(
        self, 
        user_id: str, 
        terminal_id: Optional[str] = None
    ) -> Optional[POSSessionResponse]:
        """Get active session for user/terminal"""
        try:
            db = await self.get_db()
            
            query = {
                "cashier_id": user_id,
                "status": POSSessionStatus.ACTIVE
            }
            
            if terminal_id:
                query["terminal_id"] = terminal_id
            
            session = await db.pos_sessions.find_one(query)
            
            if not session:
                return None
                
            return POSSessionResponse(**session)
            
        except Exception as e:
            logger.error(f"Error getting active session: {e}")
            raise

    async def close_session(
        self, 
        session_id: str, 
        closing_cash_amount: float, 
        cashier_id: str
    ) -> Optional[POSSessionSummary]:
        """Close POS session and generate summary"""
        try:
            db = await self.get_db()
            
            # Get and update session
            session = await db.pos_sessions.find_one_and_update(
                {
                    "_id": ObjectId(session_id),
                    "cashier_id": cashier_id,
                    "status": POSSessionStatus.ACTIVE
                },
                {
                    "$set": {
                        "ended_at": datetime.utcnow(),
                        "closing_cash_amount": closing_cash_amount,
                        "status": POSSessionStatus.CLOSED
                    }
                },
                return_document=True
            )
            
            if not session:
                return None
            
            # Calculate expected cash amount and variance
            # This would include opening cash + cash sales - cash paid out
            expected_cash = session["opening_cash_amount"]  # Simplified calculation
            cash_variance = closing_cash_amount - expected_cash
            
            # Update with variance
            await db.pos_sessions.update_one(
                {"_id": ObjectId(session_id)},
                {
                    "$set": {
                        "expected_cash_amount": expected_cash,
                        "cash_variance": cash_variance
                    }
                }
            )
            
            # Generate summary (simplified version)
            session_response = POSSessionResponse(**session)
            summary = POSSessionSummary(
                session=session_response,
                sales_count=0,  # Would be calculated from transactions
                return_count=0,
                void_count=0,
                no_sale_count=0,
                cash_sales=0.0,
                card_sales=0.0,
                other_sales=0.0,
                top_products=[],
                hourly_sales=[]
            )
            
            return summary
            
        except Exception as e:
            logger.error(f"Error closing session: {e}")
            raise


# Create service instance
pos_service = POSService()
