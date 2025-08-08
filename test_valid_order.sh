#!/bin/bash

# Test with valid real data from the system

echo "=== Testing Order Creation API ==="

# Get authentication via frontend cookies or create test data
echo "Testing with real customer email and product SKU..."

# Test with known good data
curl -X POST 'http://localhost:8003/api/v1/sales-orders/' \
-H 'Content-Type: application/json' \
-H 'Cookie: access_token=your_token_here' \
-d '{
  "customer_id": "john.doe@example.com",
  "order_date": "2025-08-08",
  "expected_delivery_date": "2025-08-10",
  "shipping_method": "standard",
  "shipping_address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "USA"
  },
  "priority": "normal",
  "sales_rep_id": "",
  "line_items": [
    {
      "product_id": "STAT-015",
      "quantity": 2,
      "unit_price": 15.99,
      "discount_percent": 0,
      "discount_amount": 0,
      "notes": "Test order item"
    }
  ],
  "subtotal_discount_percent": 0,
  "subtotal_discount_amount": 0,
  "shipping_cost": 5.99,
  "notes": "Test order from API",
  "internal_notes": "Internal test note"
}' | jq .

echo ""
echo "=== End Test ==="
