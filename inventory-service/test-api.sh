#!/bin/bash

# Test script for ERP Inventory Service API endpoints
# This script tests all major API endpoints to ensure they're working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL="http://localhost:8002"
AUTH_TOKEN=""
CATEGORY_ID=""
SUPPLIER_ID=""
WAREHOUSE_ID=""
PRODUCT_ID=""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to make HTTP requests and check response
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=${4:-200}
    
    print_status "Testing $method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
            -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        print_success "$method $endpoint - Status: $http_code"
        echo "$body"
        return 0
    else
        print_error "$method $endpoint - Expected: $expected_status, Got: $http_code"
        echo "$body"
        return 1
    fi
}

# Check if service is running
print_status "Checking if Inventory Service is running..."
if ! curl -s "$BASE_URL/health" > /dev/null; then
    print_error "Inventory Service is not running at $BASE_URL"
    print_status "Please start the service first using: ./start-inventory.sh"
    exit 1
fi

print_success "Inventory Service is running"

# Get authentication token (you'll need to implement this based on your auth service)
print_status "Getting authentication token..."
# This is a placeholder - you'll need to implement actual authentication
# AUTH_TOKEN="your-jwt-token-here"

print_status "Starting API tests..."

# Test health endpoint
print_status "=== Testing Health Endpoint ==="
make_request "GET" "/health"

echo ""

# Test categories endpoints
print_status "=== Testing Categories Endpoints ==="

# Create category
print_status "Creating a test category..."
category_data='{
    "name": "Test Electronics",
    "description": "Test category for electronics",
    "code": "TEST_ELEC",
    "isActive": true,
    "sortOrder": 1
}'

response=$(make_request "POST" "/categories" "$category_data" 201)
CATEGORY_ID=$(echo "$response" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
print_status "Created category with ID: $CATEGORY_ID"

# List categories
make_request "GET" "/categories"

# Get category by ID
if [ -n "$CATEGORY_ID" ]; then
    make_request "GET" "/categories/$CATEGORY_ID"
fi

echo ""

# Test suppliers endpoints
print_status "=== Testing Suppliers Endpoints ==="

# Create supplier
supplier_data='{
    "name": "Test Supplier Corp",
    "code": "TEST_SUP",
    "description": "Test supplier for electronics",
    "contactPerson": "John Test",
    "email": "test@supplier.com",
    "phone": "+1-555-TEST",
    "address": "123 Test Street",
    "city": "Test City",
    "country": "USA",
    "isActive": true
}'

response=$(make_request "POST" "/suppliers" "$supplier_data" 201)
SUPPLIER_ID=$(echo "$response" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
print_status "Created supplier with ID: $SUPPLIER_ID"

# List suppliers
make_request "GET" "/suppliers"

echo ""

# Test warehouses endpoints
print_status "=== Testing Warehouses Endpoints ==="

# Create warehouse
warehouse_data='{
    "name": "Test Warehouse",
    "code": "TEST_WH",
    "description": "Test warehouse facility",
    "address": "456 Warehouse Blvd",
    "city": "Test City",
    "country": "USA",
    "contactPerson": "Jane Test",
    "phone": "+1-555-WAREHOUSE",
    "email": "warehouse@test.com",
    "isActive": true,
    "isMainWarehouse": false
}'

response=$(make_request "POST" "/warehouses" "$warehouse_data" 201)
WAREHOUSE_ID=$(echo "$response" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
print_status "Created warehouse with ID: $WAREHOUSE_ID"

# List warehouses
make_request "GET" "/warehouses"

echo ""

# Test products endpoints
print_status "=== Testing Products Endpoints ==="

if [ -n "$CATEGORY_ID" ] && [ -n "$SUPPLIER_ID" ]; then
    # Create product
    product_data="{
        \"sku\": \"TEST_PROD_001\",
        \"name\": \"Test Product\",
        \"description\": \"A test product for API testing\",
        \"categoryId\": \"$CATEGORY_ID\",
        \"price\": 99.99,
        \"cost\": 59.99,
        \"unit\": \"piece\",
        \"currentStock\": 0,
        \"minStockLevel\": 5,
        \"maxStockLevel\": 100,
        \"reorderPoint\": 10,
        \"reorderQuantity\": 50,
        \"isActive\": true,
        \"isTrackable\": true,
        \"supplierIds\": [\"$SUPPLIER_ID\"]
    }"
    
    response=$(make_request "POST" "/products" "$product_data" 201)
    PRODUCT_ID=$(echo "$response" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
    print_status "Created product with ID: $PRODUCT_ID"
    
    # List products
    make_request "GET" "/products"
    
    # Get product by ID
    if [ -n "$PRODUCT_ID" ]; then
        make_request "GET" "/products/$PRODUCT_ID"
    fi
    
    # Get product statistics
    make_request "GET" "/products/stats"
fi

echo ""

# Test inventory endpoints
print_status "=== Testing Inventory Endpoints ==="

if [ -n "$PRODUCT_ID" ] && [ -n "$WAREHOUSE_ID" ]; then
    # Add initial stock
    stock_data='{
        "quantity": 50,
        "operation": "set"
    }'
    
    make_request "PUT" "/products/$PRODUCT_ID/stock" "$stock_data"
    
    # List inventory
    make_request "GET" "/inventory"
    
    # Get inventory by product
    make_request "GET" "/inventory?productId=$PRODUCT_ID"
    
    # Get inventory statistics
    make_request "GET" "/inventory/stats"
fi

echo ""

# Test GraphQL endpoint
print_status "=== Testing GraphQL Endpoint ==="

graphql_query='{
    "query": "{ __schema { types { name } } }"
}'

make_request "POST" "/graphql" "$graphql_query"

echo ""

# Cleanup - delete test data
print_status "=== Cleaning Up Test Data ==="

if [ -n "$PRODUCT_ID" ]; then
    print_status "Deleting test product..."
    make_request "DELETE" "/products/$PRODUCT_ID" "" 200
fi

if [ -n "$WAREHOUSE_ID" ]; then
    print_status "Deleting test warehouse..."
    make_request "DELETE" "/warehouses/$WAREHOUSE_ID" "" 200
fi

if [ -n "$SUPPLIER_ID" ]; then
    print_status "Deleting test supplier..."
    make_request "DELETE" "/suppliers/$SUPPLIER_ID" "" 200
fi

if [ -n "$CATEGORY_ID" ]; then
    print_status "Deleting test category..."
    make_request "DELETE" "/categories/$CATEGORY_ID" "" 200
fi

print_success "API testing completed successfully!"
print_status "All major endpoints are working correctly."
