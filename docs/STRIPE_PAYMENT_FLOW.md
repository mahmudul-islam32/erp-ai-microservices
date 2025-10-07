# Stripe Payment Flow Documentation

This document describes the complete payment flow for the Stripe integration in the ERP system, including sequence diagrams, state transitions, and error handling.

## Table of Contents

- [Payment Intent Flow](#payment-intent-flow)
- [Payment Confirmation Flow](#payment-confirmation-flow)
- [Webhook Processing Flow](#webhook-processing-flow)
- [Refund Flow](#refund-flow)
- [State Transitions](#state-transitions)
- [Error Handling](#error-handling)

---

## Payment Intent Flow

### Overview
The payment intent flow initializes a payment session and returns a client secret for the frontend to process the payment securely.

### Sequence Diagram

```
┌─────────┐         ┌──────────┐         ┌──────────┐         ┌─────────┐
│ User/   │         │ Frontend │         │  Sales   │         │ Stripe  │
│ Browser │         │  (React) │         │ Service  │         │   API   │
└────┬────┘         └────┬─────┘         └────┬─────┘         └────┬────┘
     │                   │                    │                    │
     │  1. Click "Pay    │                    │                    │
     │     with Stripe"  │                    │                    │
     ├──────────────────>│                    │                    │
     │                   │                    │                    │
     │                   │ 2. Open Payment    │                    │
     │                   │    Modal           │                    │
     │                   │                    │                    │
     │                   │ 3. POST            │                    │
     │                   │ /stripe/create-    │                    │
     │                   │  intent            │                    │
     │                   ├───────────────────>│                    │
     │                   │  {order_id,        │                    │
     │                   │   amount,          │                    │
     │                   │   customer_id}     │                    │
     │                   │                    │                    │
     │                   │                    │ 4. Verify Order    │
     │                   │                    │    Exists          │
     │                   │                    │                    │
     │                   │                    │ 5. Create Payment  │
     │                   │                    │    Intent          │
     │                   │                    ├───────────────────>│
     │                   │                    │ stripe.PaymentIntent│
     │                   │                    │ .create()          │
     │                   │                    │                    │
     │                   │                    │ 6. Return PI ID    │
     │                   │                    │    & client_secret │
     │                   │                    │<───────────────────│
     │                   │                    │                    │
     │                   │ 7. Return client   │                    │
     │                   │    secret          │                    │
     │                   │<───────────────────│                    │
     │                   │  {client_secret,   │                    │
     │                   │   payment_intent_  │                    │
     │                   │   id}              │                    │
     │                   │                    │                    │
     │  8. Display       │                    │                    │
     │     Stripe        │                    │                    │
     │     Elements      │                    │                    │
     │<──────────────────│                    │                    │
     │                   │                    │                    │
```

### Steps Explained

1. **User Initiates Payment**: User clicks "Pay with Stripe" button on order detail page
2. **Modal Opens**: Frontend displays payment modal with Stripe Elements
3. **Create Intent Request**: Frontend calls backend to create a payment intent
4. **Verify Order**: Backend verifies the order exists and amount is correct
5. **Stripe API Call**: Backend creates payment intent via Stripe API
6. **Return Payment Intent**: Stripe returns payment intent ID and client secret
7. **Return to Frontend**: Backend forwards client secret to frontend
8. **Display Payment Form**: Frontend renders Stripe Elements with payment form

---

## Payment Confirmation Flow

### Overview
After the user enters payment details and confirms, this flow processes the payment and updates the order status.

### Sequence Diagram

```
┌─────────┐         ┌──────────┐         ┌──────────┐         ┌─────────┐
│ User/   │         │ Frontend │         │  Sales   │         │ Stripe  │
│ Browser │         │  (React) │         │ Service  │         │   API   │
└────┬────┘         └────┬─────┘         └────┬─────┘         └────┬────┘
     │                   │                    │                    │
     │  1. Enter Card    │                    │                    │
     │     Details       │                    │                    │
     ├──────────────────>│                    │                    │
     │                   │                    │                    │
     │  2. Click "Pay"   │                    │                    │
     ├──────────────────>│                    │                    │
     │                   │                    │                    │
     │                   │ 3. Confirm Payment │                    │
     │                   │    with Stripe.js  │                    │
     │                   ├───────────────────────────────────────>│
     │                   │ stripe.confirmPayment()                │
     │                   │                                         │
     │                   │ 4. Process Payment                     │
     │                   │    (may require 3DS)                   │
     │                   │                                         │
     │                   │ 5. Payment Success                     │
     │                   │<────────────────────────────────────────│
     │                   │  {status: succeeded}                   │
     │                   │                                         │
     │                   │ 6. POST                                 │
     │                   │ /stripe/confirm                         │
     │                   ├───────────────────>│                    │
     │                   │  {payment_intent_  │                    │
     │                   │   id, order_id}    │                    │
     │                   │                    │                    │
     │                   │                    │ 7. Retrieve PI     │
     │                   │                    │    from Stripe     │
     │                   │                    ├───────────────────>│
     │                   │                    │ stripe.PaymentIntent│
     │                   │                    │ .retrieve()        │
     │                   │                    │<───────────────────│
     │                   │                    │                    │
     │                   │                    │ 8. Create Payment  │
     │                   │                    │    Record in DB    │
     │                   │                    │                    │
     │                   │                    │ 9. Update Order    │
     │                   │                    │    Status to PAID  │
     │                   │                    │                    │
     │                   │ 10. Return Payment │                    │
     │                   │     Record         │                    │
     │                   │<───────────────────│                    │
     │                   │                    │                    │
     │  11. Show Success │                    │                    │
     │      Message      │                    │                    │
     │<──────────────────│                    │                    │
     │                   │                    │                    │
```

### Steps Explained

1. **Enter Card Details**: User enters card information in Stripe Elements
2. **Submit Payment**: User clicks "Pay" button
3. **Client-Side Confirmation**: Frontend calls Stripe.js to confirm payment
4. **Process Payment**: Stripe processes the payment (may trigger 3D Secure)
5. **Payment Success**: Stripe returns successful payment status
6. **Confirm with Backend**: Frontend notifies backend of successful payment
7. **Retrieve Payment Intent**: Backend fetches full payment details from Stripe
8. **Create Payment Record**: Backend creates payment record in MongoDB
9. **Update Order**: Backend updates order payment_status to "paid"
10. **Return Payment Object**: Backend returns payment record to frontend
11. **Success Notification**: User sees success message and order updates

---

## Webhook Processing Flow

### Overview
Stripe sends webhook events to notify about payment status changes. This allows asynchronous status updates.

### Sequence Diagram

```
┌─────────┐              ┌──────────┐              ┌──────────┐
│ Stripe  │              │  Sales   │              │ MongoDB  │
│   API   │              │ Service  │              │ Database │
└────┬────┘              └────┬─────┘              └────┬─────┘
     │                        │                         │
     │ 1. Payment Event       │                         │
     │    Occurs              │                         │
     │    (succeeded/failed)  │                         │
     │                        │                         │
     │ 2. POST /stripe/       │                         │
     │    webhook             │                         │
     ├───────────────────────>│                         │
     │  {event_type,          │                         │
     │   event_data,          │                         │
     │   signature}           │                         │
     │                        │                         │
     │                        │ 3. Verify Signature     │
     │                        │    stripe.Webhook       │
     │                        │    .construct_event()   │
     │                        │                         │
     │                        │ 4. Parse Event Type     │
     │                        │                         │
     │                        │ 5. Find Payment by      │
     │                        │    payment_intent_id    │
     │                        ├────────────────────────>│
     │                        │                         │
     │                        │ 6. Return Payment       │
     │                        │<────────────────────────┤
     │                        │                         │
     │                        │ 7. Update Payment       │
     │                        │    Status               │
     │                        ├────────────────────────>│
     │                        │                         │
     │                        │ 8. Update Order         │
     │                        │    Payment Status       │
     │                        ├────────────────────────>│
     │                        │                         │
     │ 9. Return 200 OK       │                         │
     │<───────────────────────│                         │
     │  {received: true}      │                         │
     │                        │                         │
```

### Webhook Events Handled

| Event | Action | Payment Status | Order Status |
|-------|--------|----------------|--------------|
| `payment_intent.succeeded` | Mark payment as completed | `completed` | `paid` |
| `payment_intent.payment_failed` | Mark payment as failed | `failed` | `unpaid` |
| `charge.refunded` | Update refund amount | `refunded` | Updated based on amount |
| `payment_intent.canceled` | Mark payment as cancelled | `cancelled` | `unpaid` |

---

## Refund Flow

### Overview
Process refunds for completed payments through Stripe.

### Sequence Diagram

```
┌─────────┐         ┌──────────┐         ┌──────────┐         ┌─────────┐
│  Admin  │         │ Frontend │         │  Sales   │         │ Stripe  │
│  User   │         │  (React) │         │ Service  │         │   API   │
└────┬────┘         └────┬─────┘         └────┬─────┘         └────┬────┘
     │                   │                    │                    │
     │  1. Click "Refund"│                    │                    │
     ├──────────────────>│                    │                    │
     │                   │                    │                    │
     │                   │ 2. POST            │                    │
     │                   │ /stripe/refund/    │                    │
     │                   │  {payment_id}      │                    │
     │                   ├───────────────────>│                    │
     │                   │  {amount, reason}  │                    │
     │                   │                    │                    │
     │                   │                    │ 3. Get Payment     │
     │                   │                    │    Record          │
     │                   │                    │                    │
     │                   │                    │ 4. Verify Stripe   │
     │                   │                    │    Payment         │
     │                   │                    │                    │
     │                   │                    │ 5. Create Refund   │
     │                   │                    ├───────────────────>│
     │                   │                    │ stripe.Refund      │
     │                   │                    │ .create()          │
     │                   │                    │                    │
     │                   │                    │ 6. Refund Created  │
     │                   │                    │<───────────────────│
     │                   │                    │  {refund_id}       │
     │                   │                    │                    │
     │                   │                    │ 7. Create Refund   │
     │                   │                    │    Record in DB    │
     │                   │                    │                    │
     │                   │                    │ 8. Update Payment  │
     │                   │                    │    Status          │
     │                   │                    │                    │
     │                   │ 9. Return Refund   │                    │
     │                   │    Object          │                    │
     │                   │<───────────────────│                    │
     │                   │                    │                    │
     │  10. Show Success │                    │                    │
     │<──────────────────│                    │                    │
     │                   │                    │                    │
```

---

## State Transitions

### Payment Status State Machine

```
                    ┌──────────┐
                    │  PENDING │
                    └────┬─────┘
                         │
                         │ Payment Intent Created
                         ▼
                  ┌─────────────┐
                  │ PROCESSING  │
                  └──────┬──────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         │ Success       │ Failure       │ Cancel
         ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │COMPLETED │   │  FAILED  │   │CANCELLED │
    └────┬─────┘   └──────────┘   └──────────┘
         │
         │ Refund Requested
         ▼
    ┌──────────┐
    │ REFUNDED │
    └──────────┘
```

### Order Payment Status Transitions

```
┌────────┐    Payment Intent    ┌──────────────┐
│ UNPAID ├───────────────────────>│ PENDING      │
└────────┘                       └──────┬───────┘
                                        │
                                        │ Payment Succeeded
                                        ▼
                                 ┌──────────────┐
                          ┌──────┤     PAID     │
                          │      └──────┬───────┘
                          │             │
                Partial   │             │ Full Refund
                Refund    │             ▼
                          │      ┌──────────────┐
                          └─────>│ PARTIALLY    │
                                 │ REFUNDED     │
                                 └──────────────┘
```

---

## Error Handling

### Payment Errors

#### Card Declined
```
Error Code: card_declined
Action: 
  - Display user-friendly error message
  - Suggest trying another card
  - Do not update order status
  - Log attempt for fraud detection
```

#### Insufficient Funds
```
Error Code: insufficient_funds
Action:
  - Inform user of insufficient funds
  - Suggest using different payment method
  - Payment status: FAILED
```

#### 3D Secure Required
```
Status: requires_action
Action:
  - Automatically trigger 3D Secure flow
  - Wait for user authentication
  - Retry payment confirmation
  - Update based on final result
```

#### Network Timeout
```
Error: timeout
Action:
  - Verify payment status with Stripe
  - Check if payment_intent succeeded
  - Update local database accordingly
  - Notify user of verification in progress
```

### Webhook Errors

#### Invalid Signature
```
Error: SignatureVerificationError
Action:
  - Return 400 Bad Request
  - Log security event
  - Do not process event
  - Alert security team
```

#### Payment Not Found
```
Error: Payment not found in database
Action:
  - Log warning
  - Return 200 OK (to prevent retries)
  - Create support ticket
  - Manual reconciliation required
```

---

## Security Considerations

### PCI DSS Compliance

1. **No Card Storage**: Card details never touch our servers
2. **Tokenization**: All card data tokenized by Stripe.js
3. **HTTPS Only**: All payment endpoints use HTTPS
4. **Webhook Signatures**: All webhooks verified with signatures

### Authentication & Authorization

```
Payment Endpoints:
├── GET /stripe/config           [Public - No auth]
├── POST /stripe/create-intent   [Auth Required - Write Permission]
├── POST /stripe/confirm         [Auth Required - Write Permission]
├── POST /stripe/refund          [Auth Required - Admin Only]
└── POST /stripe/webhook         [No Auth - Signature Verified]
```

---

## Monitoring & Alerts

### Key Metrics

- **Payment Success Rate**: Target > 95%
- **Average Processing Time**: Target < 3 seconds
- **Webhook Processing Latency**: Target < 1 second
- **Failed Payment Rate**: Alert if > 5%
- **Refund Rate**: Alert if > 10%

### Alert Conditions

```yaml
alerts:
  - name: High Payment Failure Rate
    condition: failure_rate > 10% in 1 hour
    severity: high
    
  - name: Webhook Processing Delay
    condition: webhook_delay > 10 seconds
    severity: medium
    
  - name: Unusual Refund Activity
    condition: refunds > 20 in 1 hour
    severity: high
```

---

## Testing Scenarios

### Test Case 1: Successful Payment
```
1. Create order with amount $99.99
2. Click "Pay with Stripe"
3. Enter card: 4242 4242 4242 4242
4. Verify payment succeeds
5. Check order status = PAID
6. Verify payment record created
```

### Test Case 2: Failed Payment
```
1. Create order with amount $50.00
2. Click "Pay with Stripe"
3. Enter card: 4000 0000 0000 0002
4. Verify payment fails
5. Check order status = UNPAID
6. Verify error message shown
```

### Test Case 3: 3D Secure
```
1. Create order with amount $100.00
2. Click "Pay with Stripe"
3. Enter card: 4000 0025 0000 3155
4. Complete 3D Secure authentication
5. Verify payment succeeds
6. Check order status = PAID
```

### Test Case 4: Refund
```
1. Find completed payment
2. Click "Refund" button
3. Enter amount and reason
4. Verify refund succeeds
5. Check payment status = REFUNDED
6. Verify refund record created
```

---

## Related Documentation

- [Stripe Integration Guide](./STRIPE_INTEGRATION.md)
- [API Documentation](../sales-service/README.md)
- [Stripe Official Docs](https://stripe.com/docs)

---

**Last Updated:** October 7, 2025  
**Version:** 1.0.0  
**Maintainer:** Development Team

