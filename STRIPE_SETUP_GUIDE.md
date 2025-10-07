# 🚀 Stripe Payment Integration - Quick Setup Guide

This guide will help you quickly set up and test the Stripe payment integration.

## ✅ Prerequisites

- Stripe account ([Sign up here](https://stripe.com))
- Docker and Docker Compose installed
- Node.js 18+ and Python 3.9+ (for local development)

## 📝 Quick Setup (5 minutes)

### Step 1: Get Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Test Mode** keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### Step 2: Configure Environment

Create or update `.env` file in project root:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=REDACTED
STRIPE_PUBLISHABLE_KEY=REDACTED
STRIPE_WEBHOOK_SECRET=REDACTED  # Optional for now
STRIPE_API_VERSION=2023-10-16
STRIPE_CURRENCY=usd
```

### Step 3: Install Dependencies

```bash
# Backend dependencies
cd sales-service
pip install stripe==7.8.0

# Frontend dependencies
cd ../erp-frontend
npm install @stripe/stripe-js@^2.2.2 @stripe/react-stripe-js@^2.4.0
```

### Step 4: Start Services

```bash
# Return to project root
cd ..

# Start all services
docker-compose up -d

# Or start individually
docker-compose up sales-service frontend-dev -d
```

### Step 5: Test Payment

1. **Open the application**: http://localhost:5173
2. **Login** with your credentials
3. **Create a sales order** or navigate to an existing one
4. **Click "Pay with Stripe"**
5. **Use test card**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., 12/25)
   - **CVC**: Any 3 digits (e.g., 123)
   - **ZIP**: Any 5 digits (e.g., 12345)
6. **Click "Pay"** and verify success! ✨

## 🧪 Test Cards

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Decline |
| `4000 0025 0000 3155` | 🔐 3D Secure Required |

## 🔍 Verify Installation

### Backend Health Check

```bash
# Check if Stripe service is initialized
curl http://localhost:8003/api/v1/payments/stripe/config

# Expected response:
# {"publishable_key":"pk_test_..."}
```

### Frontend Check

1. Open browser console (F12)
2. Navigate to a sales order
3. Look for: `Stripe service initialized`

## 📁 What Was Installed?

### Backend Files (Sales Service)
```
sales-service/
├── requirements.txt                     # ✅ Added stripe==7.8.0
├── app/
│   ├── config.py                        # ✅ Added Stripe config
│   ├── models/
│   │   └── payment.py                   # ✅ Added STRIPE payment method
│   ├── services/
│   │   └── stripe_service.py            # ✅ NEW - Core Stripe logic
│   └── api/v1/
│       └── payments.py                  # ✅ Added Stripe endpoints
```

### Frontend Files
```
erp-frontend/
├── package.json                         # ✅ Added Stripe packages
├── src/
│   ├── App.tsx                          # ✅ Wrapped with StripeProvider
│   ├── context/
│   │   └── StripeContext.tsx            # ✅ NEW - Stripe context
│   ├── components/Payment/
│   │   ├── StripePaymentForm.tsx        # ✅ NEW - Payment form
│   │   └── StripePaymentModal.tsx       # ✅ NEW - Payment modal
│   ├── services/
│   │   └── paymentApi.ts                # ✅ Added Stripe API calls
│   ├── types/
│   │   └── payment.ts                   # ✅ Added STRIPE enum
│   └── pages/
│       └── SalesOrderDetailPage.tsx     # ✅ Added "Pay with Stripe" button
```

### Configuration
```
docker-compose.yml                       # ✅ Added Stripe env vars
```

### Documentation
```
docs/
├── STRIPE_INTEGRATION.md                # ✅ Complete integration guide
└── STRIPE_PAYMENT_FLOW.md               # ✅ Flow diagrams & sequences
```

## 🔗 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/payments/stripe/config` | GET | Get publishable key |
| `/api/v1/payments/stripe/create-intent` | POST | Create payment intent |
| `/api/v1/payments/stripe/confirm` | POST | Confirm payment |
| `/api/v1/payments/stripe/refund/{id}` | POST | Process refund |
| `/api/v1/payments/stripe/webhook` | POST | Stripe webhook handler |

## 🐛 Troubleshooting

### Issue: "Stripe is not initialized"
**Solution:** Check that `STRIPE_PUBLISHABLE_KEY` is set in environment variables.

```bash
docker logs erp-sales-service | grep -i stripe
```

### Issue: "Invalid API key"
**Solution:** Verify your Stripe keys are correct and from Test mode.

### Issue: Webhook not working
**Solution:** For local testing, use Stripe CLI:

```bash
stripe listen --forward-to localhost:8003/api/v1/payments/stripe/webhook
```

### Issue: Payment not updating order status
**Solution:** Check backend logs:

```bash
docker logs erp-sales-service -f --tail 100
```

## 🔐 Security Checklist

- [x] Stripe keys stored in environment variables
- [x] No card data stored in database
- [x] HTTPS required in production
- [x] Webhook signatures verified
- [x] Payment amount validated server-side
- [x] User authentication required for payment endpoints

## 📊 Monitoring

### View Payments in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Payments** to see all transactions
3. Click **Logs** to see API requests
4. Click **Webhooks** to monitor webhook deliveries

### Application Logs

```bash
# Sales service logs
docker logs erp-sales-service -f

# Filter Stripe-specific logs
docker logs erp-sales-service 2>&1 | grep -i "stripe\|payment"
```

## 🚀 Going to Production

Before deploying to production:

1. **Replace test keys with live keys**
   ```bash
   STRIPE_SECRET_KEY=REDACTED
   STRIPE_PUBLISHABLE_KEY=REDACTED
   ```

2. **Configure production webhook**
   - URL: `https://your-domain.com/api/v1/payments/stripe/webhook`
   - Add webhook secret to `.env`

3. **Enable HTTPS**
   - All payment pages must use HTTPS
   - Update nginx configuration

4. **Test with real card** (in test mode first!)

5. **Enable Stripe Radar** for fraud protection

## 📚 Documentation

- [Complete Integration Guide](./docs/STRIPE_INTEGRATION.md)
- [Payment Flow Diagrams](./docs/STRIPE_PAYMENT_FLOW.md)
- [Stripe Official Docs](https://stripe.com/docs)

## 🆘 Support

- **Technical Issues**: Check logs and documentation
- **Stripe API Issues**: [Stripe Support](https://support.stripe.com)
- **Integration Questions**: See detailed docs in `/docs` folder

## ✨ Features Implemented

✅ Payment intent creation  
✅ Secure card payment processing  
✅ 3D Secure authentication  
✅ Payment confirmation  
✅ Full and partial refunds  
✅ Webhook event handling  
✅ PCI DSS compliant (no card storage)  
✅ Real-time payment status updates  
✅ Multi-currency support  
✅ Error handling and retry logic  

---

**🎉 That's it! You're ready to accept payments with Stripe.**

Test your first payment and see it reflected in both your application and Stripe Dashboard!

**Questions?** Check the [full documentation](./docs/STRIPE_INTEGRATION.md) or Stripe's excellent [documentation](https://stripe.com/docs).

