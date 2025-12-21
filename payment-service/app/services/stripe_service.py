"""
Stripe Payment Service
Handles all Stripe payment gateway operations including:
- Payment intent creation
- Payment status retrieval
- Webhook event handling
"""

import stripe
from typing import Dict, Any, Optional
from datetime import datetime
import logging
import asyncio
from app.config import settings
from app.database.connection import get_database

logger = logging.getLogger(__name__)

# Initialize Stripe with API key
stripe.api_key = settings.stripe_secret_key
stripe.api_version = settings.stripe_api_version

# Configure Stripe HTTP client with timeout and retry settings
# Stripe uses requests library under the hood, configure it for better reliability
try:
    import requests
    # Set default timeout for requests
    requests.adapters.DEFAULT_TIMEOUT = 30
except ImportError:
    pass


class StripeService:
    """Service for handling Stripe payment operations"""
    
    def __init__(self):
        self.api_key = settings.stripe_secret_key.strip() if settings.stripe_secret_key else None
        self.publishable_key = settings.stripe_publishable_key.strip() if settings.stripe_publishable_key else None
        self.webhook_secret = settings.stripe_webhook_secret.strip() if settings.stripe_webhook_secret else None
        self.default_currency = settings.stripe_currency
        
        # Validate API key before setting
        if not self.api_key:
            raise ValueError("Stripe secret key is not configured")
        
        if not (self.api_key.startswith('sk_test_') or self.api_key.startswith('sk_live_')):
            raise ValueError(f"Invalid Stripe secret key format. Key must start with 'sk_test_' or 'sk_live_'")
        
        if len(self.api_key) < 50:
            logger.warning(f"⚠️ Stripe secret key appears to be too short ({len(self.api_key)} chars). Valid keys are typically 100+ characters.")
        
        # Set Stripe API key
        stripe.api_key = self.api_key
        
        logger.info(f"Stripe service initialized with API version: {stripe.api_version}")
        logger.info(f"Stripe key prefix: {self.api_key[:12]}... (length: {len(self.api_key)})")
    
    async def create_payment_intent(
        self,
        amount: float,
        currency: str = "usd",
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        description: Optional[str] = None,
        receipt_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a Stripe payment intent
        
        Args:
            amount: Amount in dollars (will be converted to cents)
            currency: Currency code (default: usd)
            customer_id: Stripe customer ID (optional)
            metadata: Additional metadata to attach to payment intent
            description: Description of the payment
            receipt_email: Email to send receipt to
            
        Returns:
            Dict containing payment intent details including client_secret
        """
        try:
            # Convert amount to cents (Stripe uses smallest currency unit)
            amount_cents = int(amount * 100)
            
            logger.info(f"Creating Stripe payment intent: amount=${amount} ({amount_cents} cents)")
            
            # Prepare payment intent parameters
            intent_params: Dict[str, Any] = {
                "amount": amount_cents,
                "currency": currency.lower(),
                "automatic_payment_methods": {
                    "enabled": True,
                },
            }
            
            # Add optional parameters
            if customer_id:
                intent_params["customer"] = customer_id
            if metadata:
                intent_params["metadata"] = metadata
            if description:
                intent_params["description"] = description
            if receipt_email:
                intent_params["receipt_email"] = receipt_email
            
            # Create payment intent with retry logic for connection errors
            max_retries = 3
            retry_delay = 1  # seconds
            
            payment_intent = None
            last_error = None
            
            for attempt in range(max_retries):
                try:
                    payment_intent = stripe.PaymentIntent.create(**intent_params)
                    logger.info(f"✅ Payment intent created: {payment_intent.id}")
                    break
                except stripe.error.APIConnectionError as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (attempt + 1)
                        logger.warning(f"⚠️ Stripe connection error (attempt {attempt + 1}/{max_retries}): {str(e)}. Retrying in {wait_time}s...")
                        await asyncio.sleep(wait_time)
                    else:
                        logger.error(f"❌ Stripe connection failed after {max_retries} attempts: {str(e)}")
                        raise
                except Exception as e:
                    # For non-connection errors, don't retry
                    last_error = e
                    raise
            
            if payment_intent is None:
                raise last_error or Exception("Failed to create payment intent")
            
            # Store payment intent in database
            await self._store_payment_intent(payment_intent, metadata)
            
            return {
                "payment_intent_id": payment_intent.id,
                "client_secret": payment_intent.client_secret,
                "amount": amount,
                "amount_cents": amount_cents,
                "currency": currency,
                "status": payment_intent.status,
                "requires_action": payment_intent.status == "requires_action",
                "next_action": payment_intent.next_action if hasattr(payment_intent, 'next_action') else None
            }
            
        except stripe.error.CardError as e:
            logger.error(f"❌ Stripe card error: {e.user_message}")
            raise ValueError(f"Card error: {e.user_message}")
        except stripe.error.InvalidRequestError as e:
            logger.error(f"❌ Stripe invalid request: {str(e)}")
            raise ValueError(f"Invalid request: {str(e)}")
        except stripe.error.APIConnectionError as e:
            logger.error(f"❌ Stripe connection error: {str(e)}")
            raise Exception(f"Unable to connect to payment gateway. Please check your internet connection and try again.")
        except stripe.error.APIError as e:
            logger.error(f"❌ Stripe API error: {str(e)}")
            raise Exception(f"Payment gateway error: {str(e)}")
        except stripe.error.StripeError as e:
            logger.error(f"❌ Stripe error: {str(e)}")
            raise Exception(f"Payment gateway error: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Unexpected error creating payment intent: {str(e)}")
            raise Exception(f"Failed to create payment intent: {str(e)}")
    
    async def get_payment_status(self, payment_intent_id: str) -> Dict[str, Any]:
        """
        Retrieve payment status from Stripe
        
        Args:
            payment_intent_id: The Stripe payment intent ID
            
        Returns:
            Dict containing payment intent details and status
        """
        try:
            logger.info(f"Retrieving payment status: {payment_intent_id}")
            
            # Retrieve payment intent with expanded charges
            payment_intent = stripe.PaymentIntent.retrieve(
                payment_intent_id,
                expand=['latest_charge']
            )
            
            # Extract charges safely
            charges = []
            if hasattr(payment_intent, 'charges') and payment_intent.charges:
                if hasattr(payment_intent.charges, 'data'):
                    charges = [self._format_charge(c) for c in payment_intent.charges.data]
            elif hasattr(payment_intent, 'latest_charge') and payment_intent.latest_charge:
                charges = [self._format_charge(payment_intent.latest_charge)]
            
            # Update database record
            await self._update_payment_intent_status(payment_intent)
            
            return {
                "payment_intent_id": payment_intent.id,
                "amount": payment_intent.amount / 100,  # Convert cents to dollars
                "amount_cents": payment_intent.amount,
                "currency": payment_intent.currency,
                "status": payment_intent.status,
                "customer": payment_intent.customer if hasattr(payment_intent, 'customer') else None,
                "charges": charges,
                "metadata": payment_intent.metadata if hasattr(payment_intent, 'metadata') else {},
                "created": payment_intent.created if hasattr(payment_intent, 'created') else None,
                "requires_action": payment_intent.status == "requires_action"
            }
            
        except stripe.error.InvalidRequestError as e:
            logger.error(f"❌ Payment intent not found: {payment_intent_id}")
            raise ValueError(f"Payment intent not found: {str(e)}")
        except stripe.error.StripeError as e:
            logger.error(f"❌ Error retrieving payment status: {str(e)}")
            raise Exception(f"Failed to retrieve payment status: {str(e)}")
    
    def verify_webhook_signature(
        self,
        payload: bytes,
        signature: str
    ) -> stripe.Event:
        """
        Verify Stripe webhook signature
        
        Args:
            payload: Raw request body
            signature: Stripe signature header
            
        Returns:
            Verified Stripe event
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, self.webhook_secret
            )
            
            logger.info(f"✅ Webhook signature verified: {event.type}")
            return event
            
        except ValueError as e:
            logger.error(f"❌ Invalid webhook payload: {str(e)}")
            raise ValueError("Invalid webhook payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"❌ Invalid webhook signature: {str(e)}")
            raise ValueError("Invalid webhook signature")
    
    async def handle_webhook_event(self, event: stripe.Event) -> Dict[str, Any]:
        """
        Handle incoming webhook events from Stripe
        
        Args:
            event: Verified Stripe event
            
        Returns:
            Dict containing event handling result
        """
        try:
            event_type = event.type
            event_data = event.data.object
            
            logger.info(f"Processing webhook event: {event_type} - {event.id}")
            
            # Store webhook event in database
            await self._store_webhook_event(event)
            
            result = {
                "event_id": event.id,
                "event_type": event_type,
                "processed": True,
                "timestamp": datetime.utcnow()
            }
            
            # Handle different event types
            if event_type == "payment_intent.succeeded":
                result["action"] = "payment_completed"
                result["payment_intent_id"] = event_data.id
                result["amount"] = event_data.amount / 100
                result["status"] = "succeeded"
                await self._update_payment_intent_status(event_data)
                
            elif event_type == "payment_intent.payment_failed":
                result["action"] = "payment_failed"
                result["payment_intent_id"] = event_data.id
                result["error"] = event_data.last_payment_error.message if event_data.last_payment_error else "Unknown error"
                result["status"] = "failed"
                await self._update_payment_intent_status(event_data)
                
            elif event_type == "charge.refunded":
                result["action"] = "refund_processed"
                result["charge_id"] = event_data.id
                result["amount_refunded"] = event_data.amount_refunded / 100
                result["status"] = "refunded"
                
            elif event_type == "payment_intent.canceled":
                result["action"] = "payment_cancelled"
                result["payment_intent_id"] = event_data.id
                result["status"] = "canceled"
                await self._update_payment_intent_status(event_data)
                
            elif event_type == "charge.succeeded":
                result["action"] = "charge_succeeded"
                result["charge_id"] = event_data.id
                result["amount"] = event_data.amount / 100
                
            else:
                result["action"] = "unknown_event"
                logger.warning(f"⚠️ Unhandled webhook event type: {event_type}")
            
            logger.info(f"✅ Webhook event processed: {event_type}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error handling webhook event: {str(e)}")
            raise Exception(f"Failed to handle webhook event: {str(e)}")
    
    async def _store_payment_intent(self, payment_intent: Any, metadata: Optional[Dict[str, Any]] = None):
        """Store payment intent in database"""
        try:
            db = get_database()
            order_id = None
            customer_id = None
            
            if metadata:
                order_id = metadata.get("order_id")
                customer_id = metadata.get("customer_id") or metadata.get("erp_customer_id")
            
            document = {
                "payment_intent_id": payment_intent.id,
                "status": payment_intent.status,
                "amount": payment_intent.amount / 100,
                "amount_cents": payment_intent.amount,
                "currency": payment_intent.currency,
                "order_id": order_id,
                "customer_id": customer_id,
                "metadata": payment_intent.metadata if hasattr(payment_intent, 'metadata') else (metadata or {}),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await db.payment_intents.insert_one(document)
            logger.info(f"✅ Payment intent stored in database: {payment_intent.id}")
            
        except Exception as e:
            logger.error(f"❌ Error storing payment intent: {str(e)}")
            # Don't raise - this is not critical for payment processing
    
    async def _update_payment_intent_status(self, payment_intent: Any):
        """Update payment intent status in database"""
        try:
            db = get_database()
            
            update_data = {
                "status": payment_intent.status,
                "updated_at": datetime.utcnow()
            }
            
            # Add charge information if available
            if hasattr(payment_intent, 'charges') and payment_intent.charges:
                if hasattr(payment_intent.charges, 'data') and payment_intent.charges.data:
                    charge = payment_intent.charges.data[0]
                    update_data["charge_id"] = charge.id if hasattr(charge, 'id') else None
                    update_data["charge_status"] = charge.status if hasattr(charge, 'status') else None
            
            await db.payment_intents.update_one(
                {"payment_intent_id": payment_intent.id},
                {"$set": update_data}
            )
            
            logger.info(f"✅ Payment intent status updated: {payment_intent.id} - {payment_intent.status}")
            
        except Exception as e:
            logger.error(f"❌ Error updating payment intent status: {str(e)}")
            # Don't raise - this is not critical for payment processing
    
    async def _store_webhook_event(self, event: stripe.Event):
        """Store webhook event in database"""
        try:
            db = get_database()
            
            event_data = event.data.object
            payment_intent_id = None
            amount = None
            
            if hasattr(event_data, 'id'):
                if 'payment_intent' in event.type:
                    payment_intent_id = event_data.id
                if hasattr(event_data, 'amount'):
                    amount = event_data.amount / 100
            
            document = {
                "event_id": event.id,
                "event_type": event.type,
                "payment_intent_id": payment_intent_id,
                "amount": amount,
                "data": event.data.object,
                "created_at": datetime.utcnow()
            }
            
            await db.webhook_events.insert_one(document)
            logger.info(f"✅ Webhook event stored: {event.id}")
            
        except Exception as e:
            logger.error(f"❌ Error storing webhook event: {str(e)}")
            # Don't raise - this is not critical for webhook processing
    
    def _format_charge(self, charge: Any) -> Dict[str, Any]:
        """Format charge data for response"""
        if not charge:
            return {}
        
        return {
            "charge_id": charge.id if hasattr(charge, 'id') else None,
            "amount": charge.amount / 100 if hasattr(charge, 'amount') else 0,
            "currency": charge.currency if hasattr(charge, 'currency') else "usd",
            "status": charge.status if hasattr(charge, 'status') else "unknown",
            "paid": charge.paid if hasattr(charge, 'paid') else False,
            "payment_method": charge.payment_method if hasattr(charge, 'payment_method') else None,
            "receipt_url": charge.receipt_url if hasattr(charge, 'receipt_url') else None,
            "created": charge.created if hasattr(charge, 'created') else None
        }
    
    def get_publishable_key(self) -> str:
        """Get Stripe publishable key for frontend"""
        return self.publishable_key


# Singleton instance
stripe_service = StripeService()

