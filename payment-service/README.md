# Payment Service

A dedicated microservice for handling payment processing with Stripe integration. This service provides endpoints for creating payment intents, checking payment status, and handling Stripe webhooks.

## Features

- **Payment Intent Creation**: Create Stripe payment intents for processing payments
- **Payment Status**: Retrieve real-time payment status from Stripe
- **Webhook Handling**: Process Stripe webhook events securely
- **Database Storage**: Store payment intents and webhook events for audit and tracking
- **RESTful API**: Clean FastAPI-based REST endpoints

## Prerequisites

- Python 3.11+
- MongoDB (for storing payment records)
- Stripe account with API keys

## Environment Variables

Create a `.env` file in the `payment-service` directory with the following variables:

```env
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=payment_db

# Service Configuration
ENVIRONMENT=development
SERVICE_NAME=payment-service
SERVICE_PORT=8009
SERVICE_HOST=0.0.0.0
LOG_LEVEL=INFO

# External Services
AUTH_SERVICE_URL=http://auth-service:8001

# JWT Settings
SECRET_KEY=REDACTED
ALGORITHM=HS256

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2023-10-16
STRIPE_CURRENCY=usd
```

### Getting Stripe Keys

1. **Secret Key & Publishable Key**:
   - Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
   - Go to Developers → API keys
   - Copy your **Secret key** (starts with `sk_`) and **Publishable key** (starts with `pk_`)

2. **Webhook Secret**:
   - Go to Developers → Webhooks
   - Click "Add endpoint" or select an existing endpoint
   - Set the endpoint URL to: `https://your-domain.com/api/v1/payments/webhook`
   - Copy the **Signing secret** (starts with `whsec_`)

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd /path/to/erp-ai-microservices
   ```

2. **Navigate to payment service**:
   ```bash
   cd payment-service
   ```

3. **Create virtual environment** (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.example .env  # If you have an example file
   # Edit .env with your actual values
   ```

6. **Run the service**:
   ```bash
   python main.py
   ```

The service will start on `http://localhost:8009`

## Docker Deployment

### Build the Docker image:
```bash
docker build -t payment-service .
```

### Run with Docker:
```bash
docker run -d \
  --name payment-service \
  -p 8009:8009 \
  --env-file .env \
  payment-service
```

## API Endpoints

### Base URL
- **Development**: `http://localhost:8009`
- **Production**: `https://your-domain.com`

### 1. Create Payment Intent

Create a new payment intent for processing a payment.

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

**Response**:
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

**Example using cURL**:
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

### 2. Get Payment Status

Retrieve the current status of a payment intent.

**Endpoint**: `GET /api/v1/payments/status/{payment_intent_id}`

**Path Parameters**:
- `payment_intent_id` (string): The Stripe payment intent ID

**Response**:
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

**Example using cURL**:
```bash
curl http://localhost:8009/api/v1/payments/status/pi_1234567890
```

### 3. Stripe Webhook

Handle webhook events from Stripe. This endpoint verifies the webhook signature and processes the event.

**Endpoint**: `POST /api/v1/payments/webhook`

**Headers**:
- `stripe-signature` (required): Stripe webhook signature

**Response**:
```json
{
  "received": true,
  "event_id": "evt_1234567890",
  "event_type": "payment_intent.succeeded",
  "processed": true
}
```

**Note**: This endpoint should be configured in your Stripe Dashboard. The webhook secret must match the `STRIPE_WEBHOOK_SECRET` environment variable.

### 4. Get Stripe Configuration

Get Stripe publishable key and currency configuration for frontend initialization.

**Endpoint**: `GET /api/v1/payments/config`

**Response**:
```json
{
  "publishable_key": "pk_test_...",
  "currency": "usd"
}
```

**Example using cURL**:
```bash
curl http://localhost:8009/api/v1/payments/config
```

## Payment Status Values

The payment status can be one of the following:

- `requires_payment_method`: Payment intent created, waiting for payment method
- `requires_confirmation`: Payment method attached, requires confirmation
- `requires_action`: Additional action required (e.g., 3D Secure)
- `processing`: Payment is being processed
- `succeeded`: Payment completed successfully
- `requires_capture`: Payment authorized, waiting for capture
- `canceled`: Payment intent canceled
- `payment_failed`: Payment failed

## Webhook Events

The service handles the following Stripe webhook events:

- `payment_intent.succeeded`: Payment completed successfully
- `payment_intent.payment_failed`: Payment failed
- `payment_intent.canceled`: Payment intent canceled
- `charge.succeeded`: Charge completed successfully
- `charge.refunded`: Refund processed

All webhook events are stored in the database for audit purposes.

## Frontend Integration

### Using Stripe.js

1. **Get the publishable key**:
   ```javascript
   const response = await fetch('http://localhost:8009/api/v1/payments/config');
   const { publishable_key } = await response.json();
   ```

2. **Initialize Stripe**:
   ```javascript
   const stripe = Stripe(publishable_key);
   ```

3. **Create payment intent**:
   ```javascript
   const response = await fetch('http://localhost:8009/api/v1/payments/create-intent', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       amount: 100.00,
       currency: 'usd',
       order_id: 'order_123'
     })
   });
   const { client_secret } = await response.json();
   ```

4. **Confirm payment**:
   ```javascript
   const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
     payment_method: {
       card: cardElement,
       billing_details: {
         name: 'Customer Name'
       }
     }
   });
   ```

5. **Check payment status**:
   ```javascript
   const response = await fetch(`http://localhost:8009/api/v1/payments/status/${paymentIntent.id}`);
   const status = await response.json();
   ```

## Database Schema

### Payment Intents Collection

```javascript
{
  payment_intent_id: String (unique, indexed),
  status: String (indexed),
  amount: Number,
  amount_cents: Number,
  currency: String,
  order_id: String (indexed),
  customer_id: String (indexed),
  metadata: Object,
  created_at: Date (indexed),
  updated_at: Date
}
```

### Webhook Events Collection

```javascript
{
  event_id: String (unique, indexed),
  event_type: String (indexed),
  payment_intent_id: String (indexed),
  amount: Number,
  data: Object,
  created_at: Date (indexed)
}
```

## Error Handling

The API returns standard HTTP status codes:

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

Error response format:
```json
{
  "detail": "Error message description"
}
```

## Testing

### Test Payment Intent Creation

```bash
curl -X POST http://localhost:8009/api/v1/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.00,
    "currency": "usd",
    "order_id": "test_order_001",
    "description": "Test payment"
  }'
```

### Test Payment Status

```bash
# Replace with actual payment_intent_id from previous response
curl http://localhost:8009/api/v1/payments/status/pi_1234567890
```

### Test Webhook (using Stripe CLI)

```bash
stripe listen --forward-to http://localhost:8009/api/v1/payments/webhook
stripe trigger payment_intent.succeeded
```

## Health Check

Check if the service is running:

```bash
curl http://localhost:8009/health
```

Response:
```json
{
  "status": "healthy",
  "service": "payment-service"
}
```

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:8009/docs`
- **ReDoc**: `http://localhost:8009/redoc`

## Security Considerations

1. **Webhook Signature Verification**: All webhook requests are verified using Stripe's signature verification
2. **Environment Variables**: Never commit `.env` files with real API keys
3. **HTTPS**: Always use HTTPS in production
4. **Authentication**: Consider adding authentication middleware for production use
5. **Rate Limiting**: Consider implementing rate limiting for production

## Troubleshooting

### Common Issues

1. **"Invalid webhook signature"**
   - Verify `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint secret in Stripe Dashboard
   - Ensure the webhook endpoint URL is correctly configured

2. **"Payment intent not found"**
   - Verify the payment intent ID is correct
   - Check if the payment intent was created in the same Stripe account

3. **"Failed to connect to MongoDB"**
   - Verify `MONGODB_URL` is correct
   - Ensure MongoDB is running and accessible

4. **"Invalid Stripe API key"**
   - Verify `STRIPE_SECRET_KEY` is correct
   - Ensure you're using the correct key for your environment (test vs live)

## Support

For issues and questions:
- Check the [Stripe Documentation](https://stripe.com/docs)
- Review the API documentation at `/docs`
- Check service logs for detailed error messages

## License

This service is part of the ERP AI Microservices project.

