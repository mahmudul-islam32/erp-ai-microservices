#!/bin/bash

# Test script to create a sales order with valid data

echo "🔑 Getting authentication token..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@erp.com", "password": "admin123"}')

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Got authentication token"

echo "👥 Getting customers..."
CUSTOMERS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8003/api/v1/customers)
echo "Customers response: $CUSTOMERS"

echo "📦 Getting products..."
PRODUCTS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8003/api/v1/products)
echo "Products response: $PRODUCTS"

echo "🛒 Creating sales order with valid customer email and product SKU..."
ORDER_RESPONSE=$(curl -s -X POST http://localhost:8003/api/v1/sales-orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "john.smith@acmecorp.com",
    "line_items": [
      {
        "product_id": "LAP-PRO-001",
        "quantity": 2,
        "unit_price": 1299.99
      }
    ],
    "notes": "Test order created via API"
  }')

echo "📋 Order creation response:"
echo $ORDER_RESPONSE | jq '.' 2>/dev/null || echo $ORDER_RESPONSE
