# POS Payment System Quick Start Examples

## Example 1: Simple Cash Sale

### Scenario
Customer buys $25 worth of items and pays with $30 cash.

```bash
curl -X POST "http://localhost:8001/api/v1/payments/cash" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "payment_method": "cash",
    "amount": 25.00,
    "cash_details": {
      "amount_tendered": 30.00,
      "change_given": 5.00,
      "currency": "USD",
      "cashier_id": "john_doe"
    },
    "customer_id": "walk-in",
    "terminal_id": "POS_001",
    "notes": "Walk-in customer"
  }'
```

## Example 2: Credit Card Payment

### Scenario
Customer buys $75 worth of items and pays with credit card.

```bash
curl -X POST "http://localhost:8001/api/v1/payments/card" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "payment_method": "credit_card",
    "amount": 75.00,
    "card_details": {
      "card_type": "visa",
      "last_four_digits": "1234",
      "expiry_month": 12,
      "expiry_year": 2025,
      "cardholder_name": "Jane Smith"
    },
    "customer_id": "customer_12345",
    "terminal_id": "POS_001",
    "receipt_email": "jane@example.com"
  }'
```

## Example 3: Complete POS Transaction (Mixed Payment)

### Scenario
Customer buys multiple items totaling $100. Pays $60 cash and $40 on credit card.

```bash
curl -X POST "http://localhost:8001/api/v1/payments/pos-transaction" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "customer_id": "customer_67890",
    "line_items": [
      {
        "product_id": "SKU001",
        "quantity": 2,
        "unit_price": 25.00,
        "notes": "Regular price items"
      },
      {
        "product_id": "SKU002",
        "quantity": 1,
        "unit_price": 50.00,
        "notes": "Premium item"
      }
    ],
    "payments": [
      {
        "payment_method": "cash",
        "amount": 60.00,
        "cash_details": {
          "amount_tendered": 60.00,
          "change_given": 0.00,
          "currency": "USD"
        }
      },
      {
        "payment_method": "credit_card",
        "amount": 40.00,
        "card_details": {
          "card_type": "mastercard",
          "last_four_digits": "5678",
          "cardholder_name": "John Customer"
        }
      }
    ],
    "subtotal": 100.00,
    "tax_amount": 0.00,
    "discount_amount": 0.00,
    "total_amount": 100.00,
    "terminal_id": "POS_001",
    "cashier_id": "sarah_wilson",
    "notes": "Mixed payment transaction"
  }'
```

## Example 4: Processing a Refund

### Scenario
Customer returns an item worth $25 from a previous cash payment.

```bash
# First, get the payment ID from the original transaction
# Then create the refund:

curl -X POST "http://localhost:8001/api/v1/payments/PAYMENT_ID/refund" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 25.00,
    "reason": "Customer return - defective item",
    "notes": "Item had manufacturing defect"
  }'
```

## Example 5: Daily Sales Report

### Scenario
Get summary of all payments for today.

```bash
curl -X GET "http://localhost:8001/api/v1/payments/daily-summary" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
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

## Example 6: Search Payments

### Scenario
Find all payments for a specific customer.

```bash
curl -X GET "http://localhost:8001/api/v1/payments?customer_id=customer_12345&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Search by payment method
```bash
curl -X GET "http://localhost:8001/api/v1/payments?payment_method=cash&start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Example 7: Get Specific Payment Details

### Scenario
Get details of a specific payment.

```bash
curl -X GET "http://localhost:8001/api/v1/payments/PAYMENT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Integration with Frontend

### JavaScript Example (React/Vue/Angular)

```javascript
// Create a cash payment
const createCashPayment = async (paymentData) => {
  try {
    const response = await fetch('/api/v1/payments/cash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(paymentData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Payment successful:', result);
      // Update UI with payment confirmation
      showPaymentSuccess(result);
    } else {
      console.error('Payment failed:', result.detail);
      showPaymentError(result.detail);
    }
  } catch (error) {
    console.error('Network error:', error);
    showPaymentError('Network error occurred');
  }
};

// Usage
const paymentData = {
  payment_method: 'cash',
  amount: 25.00,
  cash_details: {
    amount_tendered: 30.00,
    change_given: 5.00,
    currency: 'USD',
    cashier_id: getCurrentCashierId()
  },
  customer_id: 'walk-in',
  terminal_id: getTerminalId(),
  notes: 'Walk-in customer purchase'
};

createCashPayment(paymentData);
```

### React Component Example

```jsx
import React, { useState } from 'react';

const CashPaymentForm = () => {
  const [amount, setAmount] = useState('');
  const [tendered, setTendered] = useState('');
  const [change, setChange] = useState(0);

  const handleTenderedChange = (value) => {
    setTendered(value);
    const changeAmount = parseFloat(value) - parseFloat(amount || 0);
    setChange(changeAmount > 0 ? changeAmount : 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const paymentData = {
      payment_method: 'cash',
      amount: parseFloat(amount),
      cash_details: {
        amount_tendered: parseFloat(tendered),
        change_given: change,
        currency: 'USD',
        cashier_id: 'current_user'
      },
      customer_id: 'walk-in',
      terminal_id: 'POS_001'
    };

    try {
      const response = await fetch('/api/v1/payments/cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`Payment successful! Change: $${change.toFixed(2)}`);
        // Reset form
        setAmount('');
        setTendered('');
        setChange(0);
      } else {
        alert(`Payment failed: ${result.detail}`);
      }
    } catch (error) {
      alert('Network error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Amount Due:</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label>Amount Tendered:</label>
        <input
          type="number"
          step="0.01"
          value={tendered}
          onChange={(e) => handleTenderedChange(e.target.value)}
          required
        />
      </div>
      
      <div>
        <strong>Change: ${change.toFixed(2)}</strong>
      </div>
      
      <button type="submit" disabled={!amount || !tendered || parseFloat(tendered) < parseFloat(amount)}>
        Process Payment
      </button>
    </form>
  );
};

export default CashPaymentForm;
```

## Error Handling Examples

### Common Error Scenarios

1. **Insufficient Cash Tendered**
```json
{
  "detail": "Amount tendered cannot be less than payment amount"
}
```

2. **Missing Card Details**
```json
{
  "detail": "Card details are required for card payments"
}
```

3. **Payment Processing Failed**
```json
{
  "detail": "Card payment failed. Please try again or use a different payment method."
}
```

4. **Invalid Refund Amount**
```json
{
  "detail": "Refund amount cannot exceed available amount: 25.00"
}
```

### Frontend Error Handling

```javascript
const handlePaymentError = (error) => {
  switch (error.status) {
    case 400:
      showUserError(error.detail);
      break;
    case 401:
      redirectToLogin();
      break;
    case 404:
      showError('Payment or resource not found');
      break;
    case 500:
      showError('Server error. Please try again.');
      break;
    default:
      showError('An unexpected error occurred');
  }
};
```

These examples demonstrate the core functionality of the POS payment system and how to integrate it into your applications.
