# Stripe Payment Integration Guide

## Overview

This document describes the Stripe payment gateway integration in the ERP microservices application. The integration allows customers to pay for orders using credit/debit cards through Stripe's secure payment processing platform.

## Architecture

### System Components

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│   Frontend   │────────▶│Sales Service │────────▶│    Stripe    │
│ (React/TS)   │         │  (FastAPI)   │         │     API      │
│              │         │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                        │
       │                        │                        │
       ▼                        ▼                        ▼
  Stripe.js              MongoDB Database          Webhook Events
```

### Tech Stack

**Backend:**
- FastAPI (Python 3.9+)
- Stripe Python SDK (v7.8.0)
- MongoDB for payment records
- Redis for caching

**Frontend:**
- React 18.2
- TypeScript
- @stripe/stripe-js (v2.2.2)
- @stripe/react-stripe-js (v2.4.0)
- Mantine UI components

## Features Implemented

✅ **Payment Intent Creation** - Initialize payments with Stripe  
✅ **Card Payment Processing** - Secure card payments via Stripe Elements  
✅ **3D Secure Authentication** - SCA compliance for European payments  
✅ **Payment Confirmation** - Verify and record successful payments  
✅ **Refund Processing** - Full and partial refunds  
✅ **Webhook Handling** - Automatic status updates from Stripe events  
✅ **PCI Compliance** - No card data stored on our servers  

## Setup Instructions

### 1. Stripe Account Setup

1. Create a Stripe account at [https://stripe.com](https://stripe.com)
2. Navigate to **Developers → API keys**
3. Copy your **Publishable key** and **Secret key**
4. Keep these keys secure and never commit them to version control

### 2. Environment Configuration

Create a `.env` file in the project root (or update existing one):

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxx
STRIPE_API_VERSION=2023-10-16
STRIPE_CURRENCY=usd
```

⚠️ **Security Note:** For production, use `sk_live_` and `pk_live_` keys. Never expose secret keys in client-side code.

### 3. Webhook Configuration

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/v1/payments/stripe/webhook
   ```
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `payment_intent.canceled`
5. Copy the **Signing secret** and add to `.env` as `STRIPE_WEBHOOK_SECRET`

### 4. Install Dependencies

**Backend (Sales Service):**
```bash
cd sales-service
pip install -r requirements.txt
```

**Frontend:**
```bash
cd erp-frontend
npm install
```

### 5. Start Services

Using Docker Compose:
```bash
docker-compose up -d
```

Or manually:
```bash
# Sales Service
cd sales-service
uvicorn main:app --reload --port 8003

# Frontend
cd erp-frontend
npm run dev
```

## API Endpoints

### Get Stripe Configuration
```http
GET /api/v1/payments/stripe/config
```

**Response:**
```json
{
  "publishable_key": "pk_test_51xxx"
}
```

---

### Create Payment Intent
```http
POST /api/v1/payments/stripe/create-intent
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "order_id": "6743f...",
  "customer_id": "6743a...",
  "amount": 99.99,
  "currency": "usd",
  "description": "Payment for Order ORD-2025-001",
  "receipt_email": "customer@example.com"
}
```

**Response:**
```json
{
  "client_secret": "pi_xxx_secret_xxx",
  "payment_intent_id": "pi_xxxxxxxxxxxxxxxxx",
  "publishable_key": "pk_test_51xxx",
  "amount": 99.99,
  "currency": "usd"
}
```

---

### Confirm Payment
```http
POST /api/v1/payments/stripe/confirm
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "payment_intent_id": "pi_xxxxxxxxxxxxxxxxx",
  "order_id": "6743f..."
}
```

**Response:** Payment object with status `completed`

---

### Create Refund
```http
POST /api/v1/payments/stripe/refund/{payment_id}
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 99.99,
  "reason": "Customer requested refund",
  "notes": "Processing refund for order cancellation"
}
```

**Response:** Refund object

---

### Webhook Handler
```http
POST /api/v1/payments/stripe/webhook
Stripe-Signature: <signature_header>
```

**No authentication required** - Signature verification is used instead.

## Frontend Usage

### Basic Payment Flow

```tsx
import { StripePaymentModal } from './components/Payment/StripePaymentModal';

function OrderPage() {
  const [showPayment, setShowPayment] = useState(false);
  
  return (
    <>
      <Button onClick={() => setShowPayment(true)}>
        Pay with Stripe
      </Button>
      
      <StripePaymentModal
        opened={showPayment}
        onClose={() => setShowPayment(false)}
        orderId="6743f..."
        amount={99.99}
        customerId="6743a..."
        onSuccess={() => {
          alert('Payment successful!');
          // Reload order data
        }}
      />
    </>
  );
}
```

### Using Stripe Context

```tsx
import { useStripe } from './context/StripeContext';

function PaymentComponent() {
  const { stripe, publishableKey, loading, error } = useStripe();
  
  if (loading) return <div>Loading Stripe...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>Stripe is ready!</div>;
}
```

## Testing

### Test Cards

Stripe provides test cards for development:

| Card Number | Brand | Scenario |
|------------|-------|----------|
| 4242 4242 4242 4242 | Visa | Successful payment |
| 4000 0000 0000 0002 | Visa | Card declined |
| 4000 0025 0000 3155 | Visa | 3D Secure authentication required |
| 5555 5555 5555 4444 | Mastercard | Successful payment |

**Expiry Date:** Any future date (e.g., 12/25)  
**CVC:** Any 3 digits (e.g., 123)  
**ZIP:** Any 5 digits (e.g., 12345)

### Test Payment Flow

1. Create a sales order
2. Navigate to order details
3. Click "Pay with Stripe"
4. Click "Continue to Payment"
5. Enter test card: `4242 4242 4242 4242`
6. Click "Pay"
7. Verify payment status changes to "Paid"

### Webhook Testing (Local Development)

Use Stripe CLI to forward webhooks to localhost:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:8003/api/v1/payments/stripe/webhook

# Copy the webhook signing secret and add to .env
```

## Security Considerations

### PCI Compliance
- ✅ **Never store raw card data** - All card information is handled by Stripe.js
- ✅ **Tokenization** - Card details are tokenized before transmission
- ✅ **HTTPS required** - All payment pages must use HTTPS in production
- ✅ **Stripe Elements** - Use secure, pre-built UI components

### Best Practices
1. **Environment Variables** - Store all keys in environment variables
2. **Webhook Signatures** - Always verify webhook signatures
3. **HTTPS Only** - Never process payments over HTTP
4. **Rate Limiting** - Implement rate limiting on payment endpoints
5. **Audit Logging** - Log all payment attempts and status changes
6. **Error Handling** - Never expose sensitive error details to users

## Troubleshooting

### Common Issues

#### 1. "Stripe is not initialized"
**Cause:** Publishable key not configured  
**Solution:** Add `STRIPE_PUBLISHABLE_KEY` to environment variables

#### 2. "Invalid API key"
**Cause:** Using wrong key or expired key  
**Solution:** Verify keys in Stripe Dashboard

#### 3. "Webhook signature verification failed"
**Cause:** Incorrect webhook secret or payload tampering  
**Solution:** Update `STRIPE_WEBHOOK_SECRET` with correct value from Stripe Dashboard

#### 4. "Payment requires action"
**Cause:** 3D Secure authentication needed  
**Solution:** This is handled automatically by Stripe Elements

#### 5. "Card declined"
**Cause:** Insufficient funds or card restriction  
**Solution:** User should try different card or contact their bank

### Logs

Check logs for payment issues:

```bash
# Backend logs
docker logs erp-sales-service -f

# Filter for Stripe-related logs
docker logs erp-sales-service 2>&1 | grep -i stripe
```

## Monitoring

### Key Metrics to Track

- Payment success rate
- Average payment processing time
- Failed payment reasons
- Refund rate
- 3D Secure authentication rate

### Stripe Dashboard

Monitor payments in real-time:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Payments** to see all transactions
3. Check **Logs** for API request details
4. Review **Disputes** for chargebacks

## Production Checklist

Before going live:

- [ ] Replace test keys with live keys
- [ ] Configure production webhook endpoint
- [ ] Test with live cards in test mode
- [ ] Enable webhook event logging
- [ ] Set up monitoring and alerts
- [ ] Configure automatic receipt emails
- [ ] Test refund process
- [ ] Review Stripe Dashboard settings
- [ ] Enable fraud detection (Radar)
- [ ] Set up customer support for payment issues

## Support

### Stripe Resources
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Support](https://support.stripe.com)

### Internal Support
- For technical issues: Contact DevOps team
- For payment disputes: Contact Finance team
- For integration questions: Check this documentation or create a ticket

## Additional Resources

- [Stripe Payment Flow Diagram](./STRIPE_PAYMENT_FLOW.md)
- [Backend API Documentation](./sales-service/README.md)
- [Frontend Component Library](./erp-frontend/README.md)

---

**Last Updated:** October 7, 2025  
**Version:** 1.0.0  
**Maintainer:** Development Team

