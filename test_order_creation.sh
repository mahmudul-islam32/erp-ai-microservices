#!/bin/bash

# Test script for order creation with proper data format

echo "Getting authentication token..."
TOKEN=$(curl -s -X POST 'http://localhost:8001/api/v1/auth/login' \
-H 'Content-Type: application/json' \
-d '{"email":"admin@example.com","password":"admin123"}' | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "Failed to get authentication token. Trying different credentials..."
    TOKEN=$(curl -s -X POST 'http://localhost:8001/api/v1/auth/login' \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@example.com","password":"password123"}' | jq -r '.access_token')
fi

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "Authentication failed. Testing without auth..."
    AUTH_HEADER=""
else
    echo "Got token: ${TOKEN:0:20}..."
    AUTH_HEADER="Authorization: Bearer $TOKEN"
fi

echo "Testing order creation with valid customer email and product SKU..."

# Use customer email instead of ID, and product SKU
curl -X POST 'http://localhost:8003/api/v1/sales-orders/' \
-H 'Content-Type: application/json' \
-H "$AUTH_HEADER" \
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
}'

echo ""
echo "Test completed."
