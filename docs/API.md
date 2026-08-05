# Payment Service API Documentation

Complete API documentation for the Payment Service with Stripe integration.

## Overview

The Payment Service is a dedicated microservice for handling payment processing with Stripe. It provides secure endpoints for creating payment intents, checking payment status, and handling webhook events.

**Base URL**: `http://localhost:8009` (development) or `https://your-domain.com` (production)

## Authentication

Currently, authentication is optional but can be enabled by uncommenting the authentication checks in the API endpoints. When enabled, include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Payment Intent

Create a new Stripe payment intent for processing a payment.

**Endpoint**: `POST /api/v1/payments/create-intent`

**Request Body**:
```json
{
  "amount": 100.00,
  "currency": "usd",
  "order_id": "order_123",
  "customer_id": "customer_456",
  "description": "Payment for Order #123",
  "receipt_email": "customer@example.com",
  "metadata": {
    "custom_field": "value"
  }
}
```

**Request Fields**:
- `amount` (float, required): Payment amount in dollars (must be > 0)
- `currency` (string, optional): Currency code (ISO 4217), default: "usd"
- `order_id` (string, optional): Order ID from sales service
- `customer_id` (string, optional): Customer ID
- `description` (string, optional): Payment description
- `receipt_email` (string, optional): Email address for receipt
- `metadata` (object, optional): Additional metadata key-value pairs

**Response** (200 OK):
```json
{
  "payment_intent_id": "pi_1234567890",
  "client_secret": "pi_1234567890_secret_...",
  "amount": 100.00,
  "amount_cents": 10000,
  "currency": "usd",
  "status": "requires_payment_method",
  "publishable_key": "pk_test_...",
  "requires_action": false,
  "next_action": null
}
```

**Response Fields**:
- `payment_intent_id` (string): Stripe payment intent ID
- `client_secret` (string): Client secret for frontend payment confirmation
- `amount` (float): Payment amount in dollars
- `amount_cents` (int): Payment amount in cents
- `currency` (string): Currency code
- `status` (string): Payment intent status
- `publishable_key` (string): Stripe publishable key for frontend
- `requires_action` (boolean): Whether additional action is required
- `next_action` (object, nullable): Next action details if required

**Error Responses**:
- `400 Bad Request`: Invalid request data or validation error
- `500 Internal Server Error`: Server error or Stripe API error

**Example cURL**:
```bash
curl -X POST http://localhost:8009/api/v1/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "usd",
    "order_id": "order_123",
    "description": "Payment for Order #123"
  }'
```

---

### 2. Get Payment Status

Retrieve the current status of a payment intent.

**Endpoint**: `GET /api/v1/payments/status/{payment_intent_id}`

**Path Parameters**:
- `payment_intent_id` (string, required): The Stripe payment intent ID

**Response** (200 OK):
```json
{
  "payment_intent_id": "pi_1234567890",
  "status": "succeeded",
  "amount": 100.00,
  "amount_cents": 10000,
  "currency": "usd",
  "customer_id": "cus_1234567890",
  "charges": [
    {
      "charge_id": "ch_1234567890",
      "amount": 100.00,
      "currency": "usd",
      "status": "succeeded",
      "paid": true,
      "payment_method": "pm_1234567890",
      "receipt_url": "https://pay.stripe.com/receipts/...",
      "created": 1234567890
    }
  ],
  "metadata": {
    "order_id": "order_123"
  },
  "created": 1234567890,
  "requires_action": false
}
```

**Response Fields**:
- `payment_intent_id` (string): Stripe payment intent ID
- `status` (string): Current payment status
- `amount` (float): Payment amount in dollars
- `amount_cents` (int): Payment amount in cents
- `currency` (string): Currency code
- `customer_id` (string, nullable): Stripe customer ID if available
- `charges` (array): Array of charge objects
- `metadata` (object): Payment metadata
- `created` (int, nullable): Unix timestamp of creation
- `requires_action` (boolean): Whether additional action is required

**Error Responses**:
- `400 Bad Request`: Payment intent not found or invalid ID
- `500 Internal Server Error`: Server error or Stripe API error

**Example cURL**:
```bash
curl http://localhost:8009/api/v1/payments/status/pi_1234567890
```

---

### 3. Stripe Webhook

Handle webhook events from Stripe. This endpoint verifies the webhook signature and processes the event.

**Endpoint**: `POST /api/v1/payments/webhook`

**Headers**:
- `stripe-signature` (required): Stripe webhook signature header

**Request Body**: Raw webhook payload from Stripe (automatically parsed)

**Response** (200 OK):
```json
{
  "received": true,
  "event_id": "evt_1234567890",
  "event_type": "payment_intent.succeeded",
  "processed": true
}
```

**Response Fields**:
- `received` (boolean): Whether the webhook was received
- `event_id` (string): Stripe event ID
- `event_type` (string): Type of webhook event
- `processed` (boolean): Whether the event was processed successfully

**Error Responses**:
- `400 Bad Request`: Missing or invalid webhook signature
- `500 Internal Server Error`: Server error processing webhook

**Supported Webhook Events**:
- `payment_intent.succeeded`: Payment completed successfully
- `payment_intent.payment_failed`: Payment failed
- `payment_intent.canceled`: Payment intent canceled
- `charge.succeeded`: Charge completed successfully
- `charge.refunded`: Refund processed

**Note**: Configure this endpoint URL in your Stripe Dashboard under Developers → Webhooks. The webhook secret must match the `STRIPE_WEBHOOK_SECRET` environment variable.

**Example using Stripe CLI**:
```bash
stripe listen --forward-to http://localhost:8009/api/v1/payments/webhook
stripe trigger payment_intent.succeeded
```

---

### 4. Get Stripe Configuration

Get Stripe publishable key and currency configuration for frontend initialization.

**Endpoint**: `GET /api/v1/payments/config`

**Response** (200 OK):
```json
{
  "publishable_key": "pk_test_...",
  "currency": "usd"
}
```

**Response Fields**:
- `publishable_key` (string): Stripe publishable key for frontend
- `currency` (string): Default currency code

**Error Responses**:
- `500 Internal Server Error`: Server error

**Example cURL**:
```bash
curl http://localhost:8009/api/v1/payments/config
```

---

## Payment Status Values

The payment status can be one of the following:

- `requires_payment_method`: Payment intent created, waiting for payment method
- `requires_confirmation`: Payment method attached, requires confirmation
- `requires_action`: Additional action required (e.g., 3D Secure authentication)
- `processing`: Payment is being processed
- `succeeded`: Payment completed successfully
- `requires_capture`: Payment authorized, waiting for capture
- `canceled`: Payment intent canceled
- `payment_failed`: Payment failed

## Frontend Integration Example

### React/TypeScript Example

```typescript
// 1. Get Stripe configuration
const getStripeConfig = async () => {
  const response = await fetch('http://localhost:8009/api/v1/payments/config');
  return await response.json();
};

// 2. Initialize Stripe
const stripeConfig = await getStripeConfig();
const stripe = Stripe(stripeConfig.publishable_key);

// 3. Create payment intent
const createPaymentIntent = async (amount: number, orderId: string) => {
  const response = await fetch('http://localhost:8009/api/v1/payments/create-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      currency: 'usd',
      order_id: orderId,
      description: `Payment for Order #${orderId}`
    })
  });
  return await response.json();
};

// 4. Confirm payment with Stripe.js
const confirmPayment = async (clientSecret: string, cardElement: any) => {
  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: 'Customer Name'
      }
    }
  });
  
  if (error) {
    console.error('Payment failed:', error);
    return { success: false, error };
  }
  
  return { success: true, paymentIntent };
};

// 5. Check payment status
const checkPaymentStatus = async (paymentIntentId: string) => {
  const response = await fetch(
    `http://localhost:8009/api/v1/payments/status/${paymentIntentId}`
  );
  return await response.json();
};
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request data or validation error
- `401 Unauthorized`: Authentication required (if enabled)
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

Error response format:
```json
{
  "detail": "Error message description"
}
```

## Rate Limiting

Currently, there is no rate limiting implemented. Consider adding rate limiting for production use.

## Security

1. **Webhook Signature Verification**: All webhook requests are verified using Stripe's signature verification
2. **HTTPS**: Always use HTTPS in production
3. **Environment Variables**: Never expose API keys in client-side code
4. **Authentication**: Consider enabling authentication for production use

## Testing

### Using Stripe Test Mode

1. Use test API keys from Stripe Dashboard
2. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`

### Test Webhook Events

Use Stripe CLI to test webhooks locally:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Forward webhooks to local server
stripe listen --forward-to http://localhost:8009/api/v1/payments/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

## Support

For more information:
- [Payment Service README](../payment-service/README.md)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

