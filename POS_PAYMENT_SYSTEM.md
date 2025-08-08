# Point of Sale (POS) Payment System Documentation

## Overview

The POS Payment System has been integrated into the ERP Sales Service to support point-of-sale operations with multiple payment methods including cash and card payments. This system allows for:

- Multiple payment methods per transaction
- Real-time payment processing
- Payment tracking and reporting
- Refund management
- Integration with existing sales orders

## Supported Payment Methods

### Currently Implemented:
1. **Cash Payments** - Fully implemented with change calculation
2. **Credit Card Payments** - Implemented with mock processing
3. **Debit Card Payments** - Implemented with mock processing

### Planned for Future:
- PayPal integration
- Digital wallets (Apple Pay, Google Pay)
- Bank transfers
- Store credit/gift cards

## API Endpoints

### Payment Management

#### Create Payment
```http
POST /api/v1/payments/
```
Creates a generic payment record.

#### Create Cash Payment
```http
POST /api/v1/payments/cash
```
Creates a cash payment with automatic change calculation.

**Request Body:**
```json
{
    "payment_method": "cash",
    "amount": 150.00,
    "cash_details": {
        "amount_tendered": 200.00,
        "currency": "USD",
        "cashier_id": "cashier_001"
    },
    "customer_id": "walk-in",
    "terminal_id": "POS_001",
    "notes": "Walk-in customer payment"
}
```

#### Create Card Payment
```http
POST /api/v1/payments/card
```
Creates a credit/debit card payment with processing simulation.

**Request Body:**
```json
{
    "payment_method": "credit_card",
    "amount": 250.00,
    "card_details": {
        "card_type": "visa",
        "last_four_digits": "1234",
        "expiry_month": 12,
        "expiry_year": 2025,
        "cardholder_name": "John Doe"
    },
    "customer_id": "customer_001",
    "terminal_id": "POS_001"
}
```

#### Complete POS Transaction
```http
POST /api/v1/payments/pos-transaction
```
Creates a complete transaction with order and multiple payments.

**Request Body:**
```json
{
    "customer_id": "walk-in",
    "line_items": [
        {
            "product_id": "PROD_001",
            "quantity": 2,
            "unit_price": 25.00
        }
    ],
    "payments": [
        {
            "payment_method": "cash",
            "amount": 30.00,
            "cash_details": {
                "amount_tendered": 50.00,
                "change_given": 20.00
            }
        },
        {
            "payment_method": "credit_card",
            "amount": 20.00,
            "card_details": {
                "card_type": "visa",
                "last_four_digits": "5678"
            }
        }
    ],
    "subtotal": 50.00,
    "tax_amount": 0.00,
    "total_amount": 50.00,
    "terminal_id": "POS_001"
}
```

### Payment Retrieval

#### Get Payments
```http
GET /api/v1/payments/
```
Retrieves paginated list of payments with filters.

**Query Parameters:**
- `skip`: Number of records to skip (default: 0)
- `limit`: Number of records to return (default: 100)
- `payment_method`: Filter by payment method
- `status`: Filter by payment status
- `customer_id`: Filter by customer
- `order_id`: Filter by order
- `start_date`: Start date for date range filter
- `end_date`: End date for date range filter
- `search`: Search in payment number, customer name, etc.

#### Get Payment by ID
```http
GET /api/v1/payments/{payment_id}
```

#### Get Payments by Order
```http
GET /api/v1/payments/order/{order_id}/payments
```

#### Get Payments by Customer
```http
GET /api/v1/payments/customer/{customer_id}/payments
```

### Refund Management

#### Create Refund
```http
POST /api/v1/payments/{payment_id}/refund
```

**Request Body:**
```json
{
    "amount": 25.00,
    "reason": "Customer return",
    "notes": "Defective item returned"
}
```

### Reporting

#### Daily Summary
```http
GET /api/v1/payments/daily-summary?date_filter=2024-01-15
```

Returns daily payment statistics:
```json
{
    "date": "2024-01-15",
    "total_payments": 45,
    "total_amount": 2850.00,
    "completed_payments": 43,
    "completed_amount": 2750.00,
    "by_method": {
        "cash": {"count": 20, "amount": 1200.00},
        "credit_card": {"count": 23, "amount": 1550.00}
    }
}
```

## Data Models

### Payment Response Model
```json
{
    "id": "payment_id",
    "payment_number": "PAY-20240115123456-ABC12345",
    "order_id": "order_id",
    "customer_id": "customer_id",
    "payment_method": "cash",
    "amount": 150.00,
    "currency": "USD",
    "status": "completed",
    "cash_details": {
        "amount_tendered": 200.00,
        "change_given": 50.00,
        "currency": "USD",
        "cashier_id": "cashier_001"
    },
    "payment_date": "2024-01-15T10:30:00Z",
    "processed_at": "2024-01-15T10:30:01Z",
    "terminal_id": "POS_001",
    "cashier_id": "cashier_001",
    "created_at": "2024-01-15T10:30:00Z"
}
```

### Payment Status Values
- `pending`: Payment initiated but not processed
- `processing`: Payment being processed
- `completed`: Payment successfully completed
- `failed`: Payment failed
- `cancelled`: Payment cancelled
- `refunded`: Payment fully refunded
- `partially_refunded`: Payment partially refunded
- `authorized`: Card payment authorized (not captured)
- `captured`: Card payment captured

## Integration with Sales Orders

The payment system integrates seamlessly with the existing sales order system:

1. **Order Creation**: POS transactions create sales orders automatically
2. **Payment Tracking**: Orders track payment status and amounts
3. **Status Updates**: Payment completion updates order payment status
4. **Reporting**: Combined order and payment reporting

### Update Order Payment Status
```http
POST /api/v1/sales-orders/{order_id}/payment-status
```

**Request Body:**
```json
{
    "payment_status": "paid",
    "paid_amount": 150.00
}
```

## Security Considerations

1. **Card Data**: Card details are stored securely with minimal information
2. **Authentication**: All endpoints require valid authentication
3. **Authorization**: Users need appropriate permissions for payment operations
4. **Audit Trail**: All payment operations are logged with user tracking

## Testing

Use the provided test script to verify functionality:

```bash
./test_pos_payments.sh
```

This script tests:
- Cash payment creation
- Card payment creation
- Complete POS transactions
- Payment retrieval
- Daily summaries
- Refund creation

## Database Schema

### Payments Collection
```javascript
{
    _id: ObjectId,
    payment_number: String,
    order_id: String,
    invoice_id: String,
    customer_id: String,
    customer_name: String,
    customer_email: String,
    payment_method: String,
    amount: Number,
    currency: String,
    status: String,
    transaction_type: String,
    cash_details: {
        amount_tendered: Number,
        change_given: Number,
        currency: String,
        cashier_id: String
    },
    card_details: {
        card_type: String,
        last_four_digits: String,
        cardholder_name: String,
        authorization_code: String,
        transaction_id: String
    },
    payment_date: Date,
    processed_at: Date,
    terminal_id: String,
    cashier_id: String,
    shift_id: String,
    refunded_amount: Number,
    refund_transactions: [String],
    created_at: Date,
    updated_at: Date,
    created_by: String
}
```

### Refunds Collection
```javascript
{
    _id: ObjectId,
    refund_number: String,
    payment_id: String,
    payment_number: String,
    order_id: String,
    customer_id: String,
    amount: Number,
    reason: String,
    refund_method: String,
    status: String,
    processed_at: Date,
    notes: String,
    created_at: Date,
    created_by: String
}
```

## Error Handling

Common error responses:

### Validation Errors (400)
```json
{
    "detail": "Amount tendered cannot be less than payment amount"
}
```

### Not Found (404)
```json
{
    "detail": "Payment not found"
}
```

### Processing Errors (400)
```json
{
    "detail": "Card payment failed. Please try again or use a different payment method."
}
```

## Future Enhancements

1. **Payment Gateway Integration**
   - Stripe integration for card processing
   - PayPal API integration
   - Square POS integration

2. **Advanced Features**
   - Split payments across multiple cards
   - Recurring payment setup
   - Payment plans and installments
   - Loyalty program integration

3. **Reporting Enhancements**
   - Advanced analytics dashboard
   - Payment trend analysis
   - Cashier performance reports
   - Settlement reports

4. **Hardware Integration**
   - Card reader integration
   - Receipt printer support
   - Cash drawer management
   - Barcode scanner integration

## Configuration

Environment variables for payment configuration:

```env
# Payment processing
PAYMENT_PROCESSOR=mock  # mock, stripe, square
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# POS settings
DEFAULT_CURRENCY=USD
ENABLE_CASH_PAYMENTS=true
ENABLE_CARD_PAYMENTS=true
CARD_PROCESSING_TIMEOUT=30

# Receipt settings
RECEIPT_TEMPLATE=default
PRINT_RECEIPTS=true
EMAIL_RECEIPTS=true
```

This payment system provides a solid foundation for point-of-sale operations while maintaining integration with the broader ERP system.
