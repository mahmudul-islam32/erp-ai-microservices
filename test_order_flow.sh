#!/bin/bash

# Test Order Flow and Stock Reduction
# This script tests the complete order → payment → confirm → stock reduction flow

set -e

PRODUCT_ID="68d08c3fed804d3d1e5a2eaf"
CUSTOMER_ID="68d08cc6feaa5135b9f14284"
WAREHOUSE_ID="68d08c39a40a9a1be958a581"

echo "═══════════════════════════════════════════════════════════"
echo "  🧪 TESTING INVENTORY STOCK REDUCTION"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Step 1: Check initial stock
echo "📊 STEP 1: Checking initial stock..."
echo "----------------------------------------"
INITIAL_STOCK=$(curl -s "http://localhost:8002/inventory/verify/${PRODUCT_ID}" | jq -r '.product.totalQuantity')
INVENTORY_QTY=$(curl -s "http://localhost:8002/inventory/verify/${PRODUCT_ID}" | jq -r '.totalInventory.totalQuantity')
echo "Product totalQuantity: $INITIAL_STOCK"
echo "Inventory total: $INVENTORY_QTY"
echo ""

# Step 2: Login and get token
echo "🔐 STEP 2: Getting auth token..."
echo "----------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST 'http://localhost:8001/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@erp.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Failed to get auth token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Auth token obtained"
echo ""

# Step 3: Create order
echo "📝 STEP 3: Creating test order..."
echo "----------------------------------------"
ORDER_DATA='{
  "customer_id": "'${CUSTOMER_ID}'",
  "line_items": [{
    "product_id": "'${PRODUCT_ID}'",
    "quantity": 5,
    "unit_price": 24.99,
    "discount_percent": 0,
    "discount_amount": 0,
    "notes": "Test order item"
  }],
  "subtotal_discount_percent": 0,
  "subtotal_discount_amount": 0,
  "shipping_cost": 0,
  "notes": "Test order for stock reduction"
}'

ORDER_RESPONSE=$(curl -s -X POST 'http://localhost:8003/api/v1/sales-orders/' \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "$ORDER_DATA")

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '._id // .id // empty')

if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" = "null" ]; then
  echo "❌ Failed to create order"
  echo "Response: $ORDER_RESPONSE"
  exit 1
fi

echo "✅ Order created: $ORDER_ID"
echo ""

# Step 4: Process payment
echo "💰 STEP 4: Processing payment..."
echo "----------------------------------------"
PAYMENT_DATA='{
  "order_id": "'${ORDER_ID}'",
  "customer_id": "'${CUSTOMER_ID}'",
  "amount": 124.95,
  "amount_tendered": 125.00,
  "currency": "USD",
  "notes": "Test payment"
}'

PAYMENT_RESPONSE=$(curl -s -X POST 'http://localhost:8003/api/v1/payments/cash' \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "$PAYMENT_DATA")

PAYMENT_ID=$(echo $PAYMENT_RESPONSE | jq -r '._id // .id // empty')

if [ -z "$PAYMENT_ID" ] || [ "$PAYMENT_ID" = "null" ]; then
  echo "❌ Failed to process payment"
  echo "Response: $PAYMENT_RESPONSE"
else
  echo "✅ Payment processed: $PAYMENT_ID"
fi
echo ""

# Step 5: Confirm order (THIS SHOULD REDUCE STOCK!)
echo "✅ STEP 5: Confirming order (reducing stock)..."
echo "----------------------------------------"
CONFIRM_RESPONSE=$(curl -s -X PATCH "http://localhost:8003/api/v1/sales-orders/${ORDER_ID}/status" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"status": "confirmed"}')

echo "Confirm response: $(echo $CONFIRM_RESPONSE | jq -r '.message')"
echo ""

# Wait for processing
echo "⏳ Waiting 3 seconds for inventory to process..."
sleep 3
echo ""

# Step 6: Check final stock
echo "📊 STEP 6: Checking final stock..."
echo "----------------------------------------"
FINAL_STOCK=$(curl -s "http://localhost:8002/inventory/verify/${PRODUCT_ID}" | jq -r '.product.totalQuantity')
FINAL_INVENTORY=$(curl -s "http://localhost:8002/inventory/verify/${PRODUCT_ID}" | jq -r '.totalInventory.totalQuantity')

echo "Initial Product Stock: $INITIAL_STOCK"
echo "Final Product Stock:   $FINAL_STOCK"
echo "Expected Change:       -5"
echo "Actual Change:         $((FINAL_STOCK - INITIAL_STOCK))"
echo ""
echo "Inventory Total Before: $INVENTORY_QTY"
echo "Inventory Total After:  $FINAL_INVENTORY"
echo ""

# Step 7: Verify results
echo "═══════════════════════════════════════════════════════════"
if [ "$FINAL_INVENTORY" -lt "$INVENTORY_QTY" ]; then
  echo "✅ SUCCESS! Stock was reduced!"
  echo "   Inventory decreased from $INVENTORY_QTY to $FINAL_INVENTORY"
  echo "   Reduction: $((INVENTORY_QTY - FINAL_INVENTORY)) units"
else
  echo "❌ FAILED! Stock was NOT reduced!"
  echo "   Inventory still at: $FINAL_INVENTORY"
  echo ""
  echo "🔍 Troubleshooting:"
  echo "   1. Check if inventory records exist for product"
  echo "   2. Check logs: docker-compose logs sales-service inventory-service"
  echo "   3. Verify order was confirmed"
fi
echo "═══════════════════════════════════════════════════════════"
echo ""

# Get detailed verification
echo "📋 Detailed Verification:"
curl -s "http://localhost:8002/inventory/verify/${PRODUCT_ID}" | jq '{
  product: .product.name,
  productTotalQty: .product.totalQuantity,
  inventoryTotalQty: .totalInventory.totalQuantity,
  consistent: .isConsistent,
  message: .message
}'

