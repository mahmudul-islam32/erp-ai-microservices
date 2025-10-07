"""
Stripe Payment Service
Handles all Stripe payment gateway operations including:
- Payment intent creation and confirmation
- Customer management
- Refund processing
- Webhook event handling
"""

import stripe
from typing import Dict, Any, Optional
from datetime import datetime
import logging
from app.config import settings
from app.models.payment import (
    PaymentMethod, PaymentStatus, TransactionType,
    StripePaymentIntentCreate, PaymentGatewayDetails
)

logger = logging.getLogger(__name__)

# Initialize Stripe with API key
stripe.api_key = settings.stripe_secret_key
stripe.api_version = settings.stripe_api_version


class StripeService:
    """Service for handling Stripe payment operations"""
    
    def __init__(self):
        self.api_key = settings.stripe_secret_key
        self.publishable_key = settings.stripe_publishable_key
        self.webhook_secret = settings.stripe_webhook_secret
        self.default_currency = settings.stripe_currency
        
        # Set Stripe API key
        stripe.api_key = self.api_key
        
        logger.info(f"Stripe service initialized with API version: {stripe.api_version}")
    
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
            
            # Create payment intent
            payment_intent = stripe.PaymentIntent.create(**intent_params)
            
            logger.info(f"✅ Payment intent created: {payment_intent.id}")
            
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
        except stripe.error.StripeError as e:
            logger.error(f"❌ Stripe error: {str(e)}")
            raise Exception(f"Payment gateway error: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Unexpected error creating payment intent: {str(e)}")
            raise Exception(f"Failed to create payment intent: {str(e)}")
    
    async def retrieve_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """
        Retrieve a payment intent from Stripe
        
        Args:
            payment_intent_id: The Stripe payment intent ID
            
        Returns:
            Dict containing payment intent details
        """
        try:
            logger.info(f"Retrieving payment intent: {payment_intent_id}")
            
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
            logger.error(f"❌ Error retrieving payment intent: {str(e)}")
            raise Exception(f"Failed to retrieve payment intent: {str(e)}")
    
    async def confirm_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """
        Confirm a payment intent (used for server-side confirmation)
        
        Args:
            payment_intent_id: The Stripe payment intent ID
            
        Returns:
            Dict containing confirmed payment intent details
        """
        try:
            logger.info(f"Confirming payment intent: {payment_intent_id}")
            
            payment_intent = stripe.PaymentIntent.confirm(
                payment_intent_id,
                expand=['latest_charge']
            )
            
            logger.info(f"✅ Payment intent confirmed: {payment_intent.id} - Status: {payment_intent.status}")
            
            # Extract charges safely
            charges = []
            if hasattr(payment_intent, 'charges') and payment_intent.charges:
                if hasattr(payment_intent.charges, 'data'):
                    charges = [self._format_charge(c) for c in payment_intent.charges.data]
            elif hasattr(payment_intent, 'latest_charge') and payment_intent.latest_charge:
                charges = [self._format_charge(payment_intent.latest_charge)]
            
            return {
                "payment_intent_id": payment_intent.id,
                "status": payment_intent.status,
                "amount": payment_intent.amount / 100,
                "currency": payment_intent.currency,
                "charges": charges
            }
            
        except stripe.error.CardError as e:
            logger.error(f"❌ Card declined: {e.user_message}")
            raise ValueError(f"Card declined: {e.user_message}")
        except stripe.error.StripeError as e:
            logger.error(f"❌ Error confirming payment: {str(e)}")
            raise Exception(f"Failed to confirm payment: {str(e)}")
    
    async def capture_payment_intent(
        self,
        payment_intent_id: str,
        amount_to_capture: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Capture a payment intent (for authorized-only payments)
        
        Args:
            payment_intent_id: The Stripe payment intent ID
            amount_to_capture: Optional amount to capture (for partial capture)
            
        Returns:
            Dict containing captured payment details
        """
        try:
            logger.info(f"Capturing payment intent: {payment_intent_id}")
            
            capture_params: Dict[str, Any] = {}
            if amount_to_capture:
                capture_params["amount_to_capture"] = int(amount_to_capture * 100)
            
            payment_intent = stripe.PaymentIntent.capture(payment_intent_id, **capture_params)
            
            logger.info(f"✅ Payment captured: {payment_intent.id}")
            
            return {
                "payment_intent_id": payment_intent.id,
                "status": payment_intent.status,
                "amount_captured": payment_intent.amount_received / 100,
                "currency": payment_intent.currency
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"❌ Error capturing payment: {str(e)}")
            raise Exception(f"Failed to capture payment: {str(e)}")
    
    async def cancel_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """
        Cancel a payment intent
        
        Args:
            payment_intent_id: The Stripe payment intent ID
            
        Returns:
            Dict containing cancelled payment details
        """
        try:
            logger.info(f"Cancelling payment intent: {payment_intent_id}")
            
            payment_intent = stripe.PaymentIntent.cancel(payment_intent_id)
            
            logger.info(f"✅ Payment intent cancelled: {payment_intent.id}")
            
            return {
                "payment_intent_id": payment_intent.id,
                "status": payment_intent.status,
                "cancellation_reason": payment_intent.cancellation_reason
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"❌ Error cancelling payment: {str(e)}")
            raise Exception(f"Failed to cancel payment: {str(e)}")
    
    async def create_refund(
        self,
        payment_intent_id: str,
        amount: Optional[float] = None,
        reason: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a refund for a payment
        
        Args:
            payment_intent_id: The Stripe payment intent ID
            amount: Amount to refund (None for full refund)
            reason: Reason for refund
            metadata: Additional metadata
            
        Returns:
            Dict containing refund details
        """
        try:
            logger.info(f"Creating refund for payment intent: {payment_intent_id}")
            
            refund_params: Dict[str, Any] = {
                "payment_intent": payment_intent_id
            }
            
            if amount:
                refund_params["amount"] = int(amount * 100)
            if reason:
                refund_params["reason"] = reason
            if metadata:
                refund_params["metadata"] = metadata
            
            refund = stripe.Refund.create(**refund_params)
            
            logger.info(f"✅ Refund created: {refund.id} - Amount: ${refund.amount / 100}")
            
            return {
                "refund_id": refund.id,
                "payment_intent_id": payment_intent_id,
                "amount": refund.amount / 100,
                "currency": refund.currency,
                "status": refund.status,
                "reason": refund.reason,
                "created": refund.created
            }
            
        except stripe.error.InvalidRequestError as e:
            logger.error(f"❌ Invalid refund request: {str(e)}")
            raise ValueError(f"Invalid refund request: {str(e)}")
        except stripe.error.StripeError as e:
            logger.error(f"❌ Error creating refund: {str(e)}")
            raise Exception(f"Failed to create refund: {str(e)}")
    
    async def create_customer(
        self,
        email: str,
        name: Optional[str] = None,
        phone: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a Stripe customer
        
        Args:
            email: Customer email
            name: Customer name
            phone: Customer phone
            metadata: Additional metadata (e.g., ERP customer ID)
            
        Returns:
            Dict containing customer details
        """
        try:
            logger.info(f"Creating Stripe customer: {email}")
            
            customer_params: Dict[str, Any] = {"email": email}
            
            if name:
                customer_params["name"] = name
            if phone:
                customer_params["phone"] = phone
            if metadata:
                customer_params["metadata"] = metadata
            
            customer = stripe.Customer.create(**customer_params)
            
            logger.info(f"✅ Stripe customer created: {customer.id}")
            
            return {
                "customer_id": customer.id,
                "email": customer.email,
                "name": customer.name,
                "created": customer.created
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"❌ Error creating customer: {str(e)}")
            raise Exception(f"Failed to create customer: {str(e)}")
    
    async def retrieve_customer(self, customer_id: str) -> Dict[str, Any]:
        """
        Retrieve a Stripe customer
        
        Args:
            customer_id: The Stripe customer ID
            
        Returns:
            Dict containing customer details
        """
        try:
            customer = stripe.Customer.retrieve(customer_id)
            
            return {
                "customer_id": customer.id,
                "email": customer.email,
                "name": customer.name,
                "phone": customer.phone,
                "metadata": customer.metadata
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"❌ Error retrieving customer: {str(e)}")
            raise Exception(f"Failed to retrieve customer: {str(e)}")
    
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
                result["status"] = "completed"
                
            elif event_type == "payment_intent.payment_failed":
                result["action"] = "payment_failed"
                result["payment_intent_id"] = event_data.id
                result["error"] = event_data.last_payment_error.message if event_data.last_payment_error else "Unknown error"
                result["status"] = "failed"
                
            elif event_type == "charge.refunded":
                result["action"] = "refund_processed"
                result["charge_id"] = event_data.id
                result["amount_refunded"] = event_data.amount_refunded / 100
                result["status"] = "refunded"
                
            elif event_type == "payment_intent.canceled":
                result["action"] = "payment_cancelled"
                result["payment_intent_id"] = event_data.id
                result["status"] = "cancelled"
                
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

