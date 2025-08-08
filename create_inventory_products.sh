#!/bin/bash

# Create sample products in inventory service for testing

# Get auth token
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@erp.com", "password": "admin123"}')

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    exit 1
fi

echo "✅ Got authentication token"

# Create category first
echo "📋 Creating Electronics category..."
CATEGORY_RESPONSE=$(curl -s http://localhost:8002/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "mutation { createCategory(createCategoryInput: { name: \"Electronics\", description: \"Electronic devices and accessories\" }) { _id name } }"
  }')

CATEGORY_ID=$(echo $CATEGORY_RESPONSE | jq -r '.data.createCategory._id')
echo "Category ID: $CATEGORY_ID"

if [ "$CATEGORY_ID" = "null" ] || [ -z "$CATEGORY_ID" ]; then
    echo "❌ Failed to create category: $CATEGORY_RESPONSE"
    exit 1
fi

echo "✅ Created Electronics category with ID: $CATEGORY_ID"

# Create Professional Laptop
echo "💻 Creating Professional Laptop..."
LAPTOP_RESPONSE=$(curl -s http://localhost:8002/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"query\": \"mutation { createProduct(createProductInput: { name: \\\"Professional Laptop\\\", description: \\\"High-performance laptop for business professionals\\\", sku: \\\"LAP-PRO-001\\\", categoryId: \\\"$CATEGORY_ID\\\", price: 1299.99, cost: 800.0, unit: \\\"piece\\\", currentStock: 50, minStockLevel: 10, maxStockLevel: 100, reorderPoint: 15, reorderQuantity: 20, isActive: true, isTrackable: true }) { _id name sku } }\"
  }")

echo "Laptop creation response: $LAPTOP_RESPONSE"

# Create Wireless Mouse
echo "🖱️ Creating Wireless Mouse..."
MOUSE_RESPONSE=$(curl -s http://localhost:8002/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"query\": \"mutation { createProduct(createProductInput: { name: \\\"Wireless Mouse\\\", description: \\\"Ergonomic wireless mouse with precision tracking\\\", sku: \\\"MOU-WIR-001\\\", categoryId: \\\"$CATEGORY_ID\\\", price: 29.99, cost: 15.0, unit: \\\"piece\\\", currentStock: 200, minStockLevel: 50, maxStockLevel: 500, reorderPoint: 75, reorderQuantity: 100, isActive: true, isTrackable: true }) { _id name sku } }\"
  }")

echo "Mouse creation response: $MOUSE_RESPONSE"

echo "✅ Products created successfully!"
echo "You can now test the sales order API with SKUs: LAP-PRO-001, MOU-WIR-001"
