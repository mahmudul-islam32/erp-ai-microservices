from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal
import logging
import uuid
import asyncio
from bson import ObjectId

from app.database.connection import get_database
from app.models.payment import (
    PaymentCreate, PaymentUpdate, PaymentResponse, PaymentInDB,
    RefundCreate, RefundResponse, PaymentStatus, PaymentMethod,
    TransactionType,
    CardPaymentDetails, CashPaymentDetails, CashPaymentCreate
)
from app.models.sales_order import SalesOrderCreate, OrderLineItemCreate
from app.services.sales_order_service import SalesOrderService
from app.services.customer_service import CustomerService

logger = logging.getLogger(__name__)


class PaymentService:
    def __init__(self):
        self.db = None
        self.payments_collection = None
        self.refunds_collection = None
        self.sales_order_service = SalesOrderService()
        self.customer_service = CustomerService()

    def _get_db(self):
        if self.db is None:
            self.db = get_database()
            self.payments_collection = self.db.payments
            self.refunds_collection = self.db.refunds
        return self.db

    def _generate_payment_number(self) -> str:
        """Generate unique payment number"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_suffix = str(uuid.uuid4())[:8].upper()
        return f"PAY-{timestamp}-{random_suffix}"

    def _generate_refund_number(self) -> str:
        """Generate unique refund number"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_suffix = str(uuid.uuid4())[:8].upper()
        return f"REF-{timestamp}-{random_suffix}"

    # POS transaction numbering removed

    async def process_simple_cash_payment(self, payment_data: CashPaymentCreate, user_id: str) -> PaymentResponse:
        """Process a simplified cash payment and update order status"""
        try:
            logger.info(f"🔄 Starting simple cash payment processing for order {payment_data.order_id}")
            self._get_db()
            
            # Calculate change
            change_given = payment_data.amount_tendered - payment_data.amount
            
            # Create cash details
            cash_details = CashPaymentDetails(
                amount_tendered=payment_data.amount_tendered,
                change_given=change_given,
                currency=payment_data.currency,
                cash_drawer_id=payment_data.cash_drawer_id,
                cashier_id=payment_data.cashier_id
            )
            
            # Create payment record
            payment_number = self._generate_payment_number()
            
            payment_db = PaymentInDB(
                payment_number=payment_number,
                order_id=payment_data.order_id,
                customer_id=payment_data.customer_id,
                payment_method=PaymentMethod.CASH,
                amount=payment_data.amount,
                currency=payment_data.currency,
                status=PaymentStatus.COMPLETED,  # Cash payments are immediately completed
                transaction_type=TransactionType.PAYMENT,
                cash_details=cash_details,
                payment_date=datetime.utcnow(),
                processed_at=datetime.utcnow(),
                notes=payment_data.notes,
                created_by=user_id
            )
            
            # Insert payment
            result = await self.payments_collection.insert_one(payment_db.dict(by_alias=True, exclude={"id"}))
            payment_db.id = str(result.inserted_id)
            
            # Get additional customer info if customer_id provided
            customer_name = None
            customer_email = None
            if payment_data.customer_id:
                try:
                    customer = await self.customer_service.get_customer_by_id(payment_data.customer_id)
                    if customer:
                        customer_name = f"{customer.first_name} {customer.last_name}".strip()
                        customer_email = customer.email
                except Exception as e:
                    logger.warning(f"Could not fetch customer details: {e}")
            
            # Update payment with customer info
            if customer_name or customer_email:
                await self.payments_collection.update_one(
                    {"_id": ObjectId(payment_db.id)},
                    {"$set": {
                        "customer_name": customer_name,
                        "customer_email": customer_email
                    }}
                )
            
            # Update order status and payment status
            try:
                logger.info(f"Attempting to update order {payment_data.order_id} payment status to 'paid' with amount {payment_data.amount}")
                success = await self.sales_order_service.update_payment_status(
                    payment_data.order_id, 
                    "paid", 
                    payment_data.amount
                )
                if success:
                    logger.info(f"✅ Order {payment_data.order_id} payment status updated to 'paid' with amount {payment_data.amount}")
                    
                    # Now fulfill the stock for the order (reduce inventory)
                    try:
                        from app.services.external_services import inventory_service
                        
                        # Get the order details to fulfill stock
                        order = await self.sales_order_service.get_order_by_id(payment_data.order_id)
                        if order and order.line_items:
                            logger.info(f"🔄 Fulfilling stock for order {payment_data.order_id} with {len(order.line_items)} items")
                            for item in order.line_items:
                                try:
                                    # Note: We don't have token here, so we'll call a version that doesn't need it
                                    # Or we need to modify inventory service to allow internal calls
                                    logger.info(f"Fulfilling stock for product {item.product_id}, quantity {item.quantity}")
                                    # For now, just log - actual fulfillment should happen in confirm order
                                    # fulfilled = await inventory_service.fulfill_stock(
                                    #     item.product_id,
                                    #     item.quantity,
                                    #     payment_data.order_id,
                                    #     user_id,
                                    #     ""  # No token available here
                                    # )
                                except Exception as item_error:
                                    logger.error(f"Failed to fulfill stock for item {item.product_id}: {item_error}")
                    except Exception as fulfill_error:
                        logger.error(f"Stock fulfillment error: {fulfill_error}")
                        # Continue anyway - payment is successful
                else:
                    logger.error(f"❌ Failed to update order {payment_data.order_id} payment status - method returned False")
            except Exception as e:
                logger.error(f"❌ Exception occurred while updating order payment status: {e}")
                import traceback
                logger.error(f"Full traceback: {traceback.format_exc()}")
                # Don't fail the payment if order update fails, but log it
            
            # Convert to response model
            payment_response = PaymentResponse(
                **payment_db.dict(),
                customer_name=customer_name,
                customer_email=customer_email
            )
            
            logger.info(f"Simple cash payment processed successfully: {payment_number}")
            return payment_response
            
        except Exception as e:
            logger.error(f"Error processing simple cash payment: {e}")
            raise

    async def process_cash_payment(self, payment_data: PaymentCreate, user_id: str) -> PaymentResponse:
        """Process a cash payment"""
        try:
            self._get_db()
            
            # Validate cash payment details
            if not payment_data.cash_details:
                raise ValueError("Cash details are required for cash payments")
            
            if payment_data.cash_details.amount_tendered < payment_data.amount:
                raise ValueError("Amount tendered cannot be less than payment amount")
            
            # Calculate change
            payment_data.cash_details.change_given = payment_data.cash_details.amount_tendered - payment_data.amount
            
            # Create payment record
            payment_number = self._generate_payment_number()
            
            payment_db = PaymentInDB(
                payment_number=payment_number,
                order_id=payment_data.order_id,
                invoice_id=payment_data.invoice_id,
                customer_id=payment_data.customer_id,
                payment_method=payment_data.payment_method,
                amount=payment_data.amount,
                currency=payment_data.currency,
                status=PaymentStatus.COMPLETED,  # Cash payments are immediately completed
                transaction_type=TransactionType.PAYMENT,
                cash_details=payment_data.cash_details,
                payment_date=payment_data.payment_date,
                processed_at=datetime.utcnow(),
                reference_number=payment_data.reference_number,
                notes=payment_data.notes,
                receipt_email=payment_data.receipt_email,
                created_by=user_id
            )
            
            # Insert payment
            result = await self.payments_collection.insert_one(payment_db.dict(by_alias=True, exclude={"id"}))
            payment_db.id = str(result.inserted_id)
            
            # Get additional customer info if customer_id provided
            customer_name = None
            customer_email = None
            if payment_data.customer_id:
                try:
                    customer = await self.customer_service.get_customer_by_id(payment_data.customer_id)
                    if customer:
                        customer_name = f"{customer.first_name} {customer.last_name}".strip()
                        customer_email = customer.email
                except Exception as e:
                    logger.warning(f"Could not fetch customer details: {e}")
            
            # Update payment with customer info
            if customer_name or customer_email:
                await self.payments_collection.update_one(
                    {"_id": ObjectId(payment_db.id)},
                    {"$set": {
                        "customer_name": customer_name,
                        "customer_email": customer_email
                    }}
                )
            
            # Convert to response model
            payment_response = PaymentResponse(
                **payment_db.dict(),
                customer_name=customer_name,
                customer_email=customer_email
            )
            
            logger.info(f"Cash payment processed successfully: {payment_number}")
            return payment_response
            
        except Exception as e:
            logger.error(f"Error processing cash payment: {e}")
            raise

    async def process_card_payment(self, payment_data: PaymentCreate, user_id: str) -> PaymentResponse:
        """Process a card payment (credit/debit)"""
        try:
            self._get_db()
            
            # Validate card payment details
            if not payment_data.card_details:
                raise ValueError("Card details are required for card payments")
            
            # Create payment record
            payment_number = self._generate_payment_number()
            
            # For demo purposes, we'll simulate card processing
            # In a real implementation, you would integrate with a payment gateway
            is_successful = await self._simulate_card_processing(payment_data.card_details, payment_data.amount)
            
            status = PaymentStatus.COMPLETED if is_successful else PaymentStatus.FAILED
            
            payment_db = PaymentInDB(
                payment_number=payment_number,
                order_id=payment_data.order_id,
                invoice_id=payment_data.invoice_id,
                customer_id=payment_data.customer_id,
                payment_method=payment_data.payment_method,
                amount=payment_data.amount,
                currency=payment_data.currency,
                status=status,
                transaction_type=TransactionType.PAYMENT,
                card_details=payment_data.card_details,
                payment_date=payment_data.payment_date,
                processed_at=datetime.utcnow() if is_successful else None,
                reference_number=payment_data.reference_number,
                notes=payment_data.notes,
                receipt_email=payment_data.receipt_email,
                created_by=user_id
            )
            
            if not is_successful:
                raise ValueError("Card payment failed. Please try again or use a different payment method.")
            
            # Insert payment
            result = await self.payments_collection.insert_one(payment_db.dict(by_alias=True, exclude={"id"}))
            payment_db.id = str(result.inserted_id)
            
            # Get additional customer info if customer_id provided
            customer_name = None
            customer_email = None
            if payment_data.customer_id:
                try:
                    customer = await self.customer_service.get_customer_by_id(payment_data.customer_id)
                    if customer:
                        customer_name = f"{customer.first_name} {customer.last_name}".strip()
                        customer_email = customer.email
                except Exception as e:
                    logger.warning(f"Could not fetch customer details: {e}")
            
            # Update payment with customer info
            if customer_name or customer_email:
                await self.payments_collection.update_one(
                    {"_id": ObjectId(payment_db.id)},
                    {"$set": {
                        "customer_name": customer_name,
                        "customer_email": customer_email
                    }}
                )
            
            # Convert to response model
            payment_response = PaymentResponse(
                **payment_db.dict(),
                customer_name=customer_name,
                customer_email=customer_email
            )
            
            logger.info(f"Card payment processed successfully: {payment_number}")
            return payment_response
            
        except Exception as e:
            logger.error(f"Error processing card payment: {e}")
            raise

    async def _simulate_card_processing(self, card_details: CardPaymentDetails, amount: float) -> bool:
        """Simulate card payment processing (for demo purposes)"""
        # In a real implementation, this would integrate with Stripe, Square, etc.
        # For demo, we'll simulate a 95% success rate
        import random
        
        # Add some realistic processing delay
        await asyncio.sleep(1)
        
        # Generate a mock transaction ID
        if card_details:
            card_details.transaction_id = f"TXN_{uuid.uuid4().hex[:12].upper()}"
            card_details.authorization_code = f"AUTH_{random.randint(100000, 999999)}"
        
        # 95% success rate for demo
        return random.random() < 0.95

    async def create_payment(self, payment_data: PaymentCreate, user_id: str) -> PaymentResponse:
        """Create a new payment based on payment method"""
        try:
            if payment_data.payment_method == PaymentMethod.CASH:
                return await self.process_cash_payment(payment_data, user_id)
            elif payment_data.payment_method in [PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD]:
                return await self.process_card_payment(payment_data, user_id)
            else:
                # For other payment methods, create a basic payment record
                return await self._create_basic_payment(payment_data, user_id)
        except Exception as e:
            logger.error(f"Error creating payment: {e}")
            raise

    async def _create_basic_payment(self, payment_data: PaymentCreate, user_id: str) -> PaymentResponse:
        """Create a basic payment record for other payment methods"""
        try:
            self._get_db()
            
            payment_number = self._generate_payment_number()
            
            payment_db = PaymentInDB(
                payment_number=payment_number,
                order_id=payment_data.order_id,
                invoice_id=payment_data.invoice_id,
                customer_id=payment_data.customer_id,
                payment_method=payment_data.payment_method,
                amount=payment_data.amount,
                currency=payment_data.currency,
                status=PaymentStatus.PENDING,
                transaction_type=TransactionType.PAYMENT,
                payment_date=payment_data.payment_date,
                reference_number=payment_data.reference_number,
                notes=payment_data.notes,
                receipt_email=payment_data.receipt_email,
                created_by=user_id
            )
            
            # Insert payment
            result = await self.payments_collection.insert_one(payment_db.dict(by_alias=True, exclude={"id"}))
            payment_db.id = str(result.inserted_id)
            
            # Convert to response model
            payment_response = PaymentResponse(**payment_db.dict())
            
            logger.info(f"Basic payment created: {payment_number}")
            return payment_response
            
        except Exception as e:
            logger.error(f"Error creating basic payment: {e}")
            raise

    async def get_payment_by_id(self, payment_id: str) -> Optional[PaymentResponse]:
        """Get payment by ID"""
        try:
            self._get_db()
            
            payment_doc = await self.payments_collection.find_one({"_id": ObjectId(payment_id)})
            if not payment_doc:
                return None
            
            return PaymentResponse(**payment_doc)
            
        except Exception as e:
            logger.error(f"Error getting payment: {e}")
            return None

    async def get_payments(
        self,
        skip: int = 0,
        limit: int = 100,
        payment_method: Optional[PaymentMethod] = None,
        status: Optional[PaymentStatus] = None,
        customer_id: Optional[str] = None,
        order_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        search: Optional[str] = None
    ) -> List[PaymentResponse]:
        """Get list of payments with filters"""
        try:
            self._get_db()
            
            # Build filter query
            filter_query = {}
            
            if payment_method:
                filter_query["payment_method"] = payment_method
            if status:
                filter_query["status"] = status
            if customer_id:
                filter_query["customer_id"] = customer_id
            if order_id:
                filter_query["order_id"] = order_id
            
            # Date range filter
            if start_date or end_date:
                date_filter = {}
                if start_date:
                    date_filter["$gte"] = datetime.combine(start_date, datetime.min.time())
                if end_date:
                    date_filter["$lte"] = datetime.combine(end_date, datetime.max.time())
                filter_query["payment_date"] = date_filter
            
            # Search filter
            if search:
                filter_query["$or"] = [
                    {"payment_number": {"$regex": search, "$options": "i"}},
                    {"customer_name": {"$regex": search, "$options": "i"}},
                    {"reference_number": {"$regex": search, "$options": "i"}},
                    {"notes": {"$regex": search, "$options": "i"}}
                ]
            
            # Execute query
            cursor = self.payments_collection.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
            payments = await cursor.to_list(length=limit)
            
            return [PaymentResponse(**payment) for payment in payments]
            
        except Exception as e:
            logger.error(f"Error getting payments: {e}")
            return []

    # POS transaction processing removed

    async def create_refund(self, refund_data: RefundCreate, user_id: str) -> RefundResponse:
        """Create a refund for a payment"""
        try:
            self._get_db()
            
            # Get original payment
            payment = await self.get_payment_by_id(refund_data.payment_id)
            if not payment:
                raise ValueError("Payment not found")
            
            # Validate refund amount
            available_refund = payment.amount - payment.refunded_amount
            if refund_data.amount > available_refund:
                raise ValueError(f"Refund amount cannot exceed available amount: {available_refund}")
            
            # Generate refund number
            refund_number = self._generate_refund_number()
            
            # Create refund record
            refund_doc = {
                "refund_number": refund_number,
                "payment_id": refund_data.payment_id,
                "payment_number": payment.payment_number,
                "order_id": payment.order_id,
                "customer_id": payment.customer_id,
                "amount": refund_data.amount,
                "reason": refund_data.reason,
                "refund_method": refund_data.refund_method or payment.payment_method,
                "status": PaymentStatus.COMPLETED,
                "processed_at": datetime.utcnow(),
                "notes": refund_data.notes,
                "created_at": datetime.utcnow(),
                "created_by": user_id
            }
            
            # Insert refund
            result = await self.refunds_collection.insert_one(refund_doc)
            refund_doc["_id"] = result.inserted_id
            
            # Update original payment
            new_refunded_amount = payment.refunded_amount + refund_data.amount
            refund_transactions = payment.refund_transactions + [str(result.inserted_id)]
            
            await self.payments_collection.update_one(
                {"_id": ObjectId(refund_data.payment_id)},
                {
                    "$set": {
                        "refunded_amount": new_refunded_amount,
                        "refund_transactions": refund_transactions,
                        "updated_at": datetime.utcnow(),
                        "updated_by": user_id
                    }
                }
            )
            
            # If fully refunded, update status
            if new_refunded_amount >= payment.amount:
                await self.payments_collection.update_one(
                    {"_id": ObjectId(refund_data.payment_id)},
                    {"$set": {"status": PaymentStatus.REFUNDED}}
                )
            elif new_refunded_amount > 0:
                await self.payments_collection.update_one(
                    {"_id": ObjectId(refund_data.payment_id)},
                    {"$set": {"status": PaymentStatus.PARTIALLY_REFUNDED}}
                )
            
            refund_response = RefundResponse(**refund_doc)
            logger.info(f"Refund created successfully: {refund_number}")
            return refund_response
            
        except Exception as e:
            logger.error(f"Error creating refund: {e}")
            raise

    async def count_payments(
        self,
        payment_method: Optional[PaymentMethod] = None,
        status: Optional[PaymentStatus] = None,
        customer_id: Optional[str] = None,
        order_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        search: Optional[str] = None
    ) -> int:
        """Count payments with filters"""
        try:
            self._get_db()
            
            # Build the same filter query as get_payments
            filter_query = {}
            
            if payment_method:
                filter_query["payment_method"] = payment_method
            if status:
                filter_query["status"] = status
            if customer_id:
                filter_query["customer_id"] = customer_id
            if order_id:
                filter_query["order_id"] = order_id
            
            # Date range filter
            if start_date or end_date:
                date_filter = {}
                if start_date:
                    date_filter["$gte"] = datetime.combine(start_date, datetime.min.time())
                if end_date:
                    date_filter["$lte"] = datetime.combine(end_date, datetime.max.time())
                filter_query["payment_date"] = date_filter
            
            # Search filter
            if search:
                filter_query["$or"] = [
                    {"payment_number": {"$regex": search, "$options": "i"}},
                    {"customer_name": {"$regex": search, "$options": "i"}},
                    {"reference_number": {"$regex": search, "$options": "i"}},
                    {"notes": {"$regex": search, "$options": "i"}}
                ]
            
            return await self.payments_collection.count_documents(filter_query)
            
        except Exception as e:
            logger.error(f"Error counting payments: {e}")
            return 0


# Create service instance
payment_service = PaymentService()
