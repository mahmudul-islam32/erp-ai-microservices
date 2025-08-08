#!/bin/bash

# Create sample products in inventory service using REST API (if available) or direct MongoDB

echo "🔑 Getting authentication token..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@erp.com", "password": "admin123"}')

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    exit 1
fi

echo "✅ Got authentication token"

# Let's first check what categories exist
echo "📋 Checking existing categories..."
CATEGORY_QUERY=$(curl -s http://localhost:8002/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query { categories(filter: { name: \"Electronics\" }) { _id name } }"
  }')

echo "Category query response: $CATEGORY_QUERY"

# Extract category ID, use fallback if needed
CATEGORY_ID=$(echo $CATEGORY_QUERY | jq -r '.data.categories[0]._id' 2>/dev/null)

if [ "$CATEGORY_ID" = "null" ] || [ -z "$CATEGORY_ID" ]; then
    echo "📋 Creating new Electronics category..."
    # Create category with basic ObjectId
    CATEGORY_RESPONSE=$(curl -s http://localhost:8002/graphql \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "query": "mutation { createCategory(createCategoryInput: { name: \"Electronics\", description: \"Electronic devices and accessories\" }) { _id name } }"
      }')
    
    CATEGORY_ID=$(echo $CATEGORY_RESPONSE | jq -r '.data.createCategory._id' 2>/dev/null)
    echo "Category creation response: $CATEGORY_RESPONSE"
fi

if [ "$CATEGORY_ID" = "null" ] || [ -z "$CATEGORY_ID" ]; then
    echo "❌ Could not get category ID, using fallback"
    # Use a mock ObjectId for now
    CATEGORY_ID="60f3b3b3b3b3b3b3b3b3b3b3"
fi

echo "✅ Using category ID: $CATEGORY_ID"

# Check if products already exist
echo "📦 Checking existing products..."
PRODUCT_CHECK=$(curl -s http://localhost:8002/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "query { products(filter: { sku: \"LAP-PRO-001\" }) { _id sku } }"
  }')

echo "Product check response: $PRODUCT_CHECK"

EXISTING_PRODUCT=$(echo $PRODUCT_CHECK | jq -r '.data.products[0]._id' 2>/dev/null)

if [ "$EXISTING_PRODUCT" != "null" ] && [ -n "$EXISTING_PRODUCT" ]; then
    echo "✅ Products already exist! Testing with existing products..."
else
    echo "💻 Creating Professional Laptop..."
    LAPTOP_RESPONSE=$(curl -s http://localhost:8002/graphql \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"query\": \"mutation { createProduct(createProductInput: { name: \\\"Professional Laptop\\\", description: \\\"High-performance laptop for business professionals\\\", sku: \\\"LAP-PRO-001\\\", categoryId: \\\"$CATEGORY_ID\\\", price: 1299.99, cost: 800.0, unit: \\\"piece\\\", currentStock: 50, minStockLevel: 10, maxStockLevel: 100, reorderPoint: 15, reorderQuantity: 20, isActive: true, isTrackable: true }) { _id name sku } }\"
      }")

    echo "Laptop creation response: $LAPTOP_RESPONSE"
fi

echo "✅ Setup complete! Now testing sales order creation..."

# Test the sales order creation
echo "🛒 Creating sales order..."
ORDER_RESPONSE=$(curl -s -X POST http://localhost:8003/api/v1/sales-orders/ \
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

echo "📋 Sales order creation response:"
echo $ORDER_RESPONSE | jq '.' 2>/dev/null || echo $ORDER_RESPONSE
