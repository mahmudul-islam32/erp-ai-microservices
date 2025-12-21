# Payment Service - Quick Start Guide

## Quick Setup

### 1. Environment Setup

Create a `.env` file in the `payment-service` directory:

```bash
cd payment-service
cp .env.example .env
# Edit .env with your actual Stripe keys
```

Required environment variables:
- `MONGODB_URL`: MongoDB connection string
- `STRIPE_SECRET_KEY`: Your Stripe secret key (starts with `sk_`)
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (starts with `pk_`)
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret (starts with `whsec_`)

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Service

```bash
python main.py
```

The service will start on `http://localhost:8009`

## Quick Test

### 1. Create a Payment Intent

```bash
curl -X POST http://localhost:8009/api/v1/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "usd",
    "order_id": "test_order_001",
    "description": "Test payment"
  }'
```

### 2. Check Payment Status

```bash
# Replace with actual payment_intent_id from step 1
curl http://localhost:8009/api/v1/payments/status/pi_1234567890
```

### 3. Get Stripe Config

```bash
curl http://localhost:8009/api/v1/payments/config
```

## Docker Quick Start

```bash
# Build and run with docker-compose
docker-compose up payment-service

# Or build individually
cd payment-service
docker build -t payment-service .
docker run -d -p 8009:8009 --env-file .env payment-service
```

## API Documentation

Once the service is running, visit:
- Swagger UI: `http://localhost:8009/docs`
- ReDoc: `http://localhost:8009/redoc`

## Next Steps

1. Configure webhook endpoint in Stripe Dashboard
2. Test webhook events using Stripe CLI
3. Integrate with frontend using Stripe.js
4. Review full documentation in `README.md`

## Getting Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers → API keys**
3. Copy your **Secret key** and **Publishable key**
4. Navigate to **Developers → Webhooks**
5. Create a webhook endpoint pointing to: `https://your-domain.com/api/v1/payments/webhook`
6. Copy the **Signing secret**

## Support

- Full documentation: `README.md`
- API documentation: `docs/PAYMENT_SERVICE_API.md`
- Stripe documentation: https://stripe.com/docs

