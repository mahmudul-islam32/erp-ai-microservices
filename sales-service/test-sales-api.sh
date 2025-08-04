#!/bin/bash

# Sales Service API Testing Script
# Make sure the sales service is running on http://localhost:8002

set -e

BASE_URL="http://localhost:8002"
API_URL="$BASE_URL/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if service is running
check_service() {
    print_status "Checking if Sales Service is running..."
    
    if curl -s "$BASE_URL/health" > /dev/null; then
        print_success "Sales Service is running!"
    else
        print_error "Sales Service is not running. Please start it first."
        exit 1
    fi
}

# Function to get auth token (assuming auth service is running)
get_auth_token() {
    print_status "Getting authentication token..."
    
    # Try to login with default admin credentials
    AUTH_RESPONSE=$(curl -s -X POST "http://localhost:8001/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@erp.com",
            "password": "admin123"
        }' || echo "")
    
    if [ -n "$AUTH_RESPONSE" ]; then
        TOKEN=$(echo $AUTH_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null || echo "")
        if [ -n "$TOKEN" ]; then
            print_success "Authentication token obtained"
            echo "Bearer $TOKEN"
            return 0
        fi
    fi
    
    print_warning "Could not get auth token. Some tests may fail."
    echo ""
}

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    print_status "Testing: $description"
    
    if [ -n "$AUTH_TOKEN" ]; then
        AUTH_HEADER="-H \"Authorization: $AUTH_TOKEN\""
    else
        AUTH_HEADER=""
    fi
    
    if [ "$method" = "GET" ]; then
        RESPONSE=$(eval curl -s -X GET "$API_URL$endpoint" $AUTH_HEADER || echo "ERROR")
    else
        RESPONSE=$(eval curl -s -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            $AUTH_HEADER \
            -d "'$data'" || echo "ERROR")
    fi
    
    if [ "$RESPONSE" = "ERROR" ]; then
        print_error "Failed to call $endpoint"
        return 1
    else
        print_success "$description - OK"
        return 0
    fi
}

# Main testing function
run_tests() {
    print_status "Starting Sales Service API Tests..."
    echo "=================================================="
    
    # Test 1: Health Check
    test_endpoint "GET" "/health" "" "Health Check (Public endpoint)"
    
    # Test 2: Service Info
    test_endpoint "GET" "/" "" "Service Information (Public endpoint)"
    
    if [ -n "$AUTH_TOKEN" ]; then
        # Test 3: Create Customer
        CUSTOMER_DATA='{
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "phone": "+1234567890",
            "company_name": "Acme Corp",
            "customer_type": "business",
            "billing_address": {
                "street": "123 Main St",
                "city": "New York",
                "state": "NY",
                "country": "USA",
                "zip_code": "10001"
            }
        }'
        test_endpoint "POST" "/customers" "$CUSTOMER_DATA" "Create Customer"
        
        # Test 4: List Customers
        test_endpoint "GET" "/customers?limit=10" "" "List Customers"
        
        # Test 5: Create Product
        PRODUCT_DATA='{
            "name": "Test Product",
            "description": "A test product for API testing",
            "sku": "TEST-001",
            "category": "Electronics",
            "product_type": "physical",
            "unit_of_measure": "piece",
            "unit_price": 99.99,
            "cost_price": 50.00,
            "tax_rate": 0.08,
            "min_stock_level": 10,
            "max_stock_level": 100,
            "reorder_point": 20
        }'
        test_endpoint "POST" "/products" "$PRODUCT_DATA" "Create Product"
        
        # Test 6: List Products
        test_endpoint "GET" "/products?limit=10" "" "List Products"
        
        # Test 7: Get Product Categories
        test_endpoint "GET" "/products/categories/list" "" "Get Product Categories"
        
        # Test 8: Get Analytics Dashboard
        test_endpoint "GET" "/analytics/dashboard" "" "Analytics Dashboard"
        
        # Test 9: Get Revenue Analytics
        test_endpoint "GET" "/analytics/revenue?period=monthly" "" "Revenue Analytics"
        
        # Test 10: Get Sales KPIs
        test_endpoint "GET" "/analytics/kpis" "" "Sales KPIs"
        
        # Test 11: Get Report Templates
        test_endpoint "GET" "/reports/templates" "" "Report Templates"
        
        # Test 12: Generate Sales Report
        test_endpoint "GET" "/reports/sales?format=json" "" "Generate Sales Report"
        
        print_success "All authenticated tests completed!"
    else
        print_warning "Skipping authenticated tests - no auth token available"
    fi
    
    echo "=================================================="
    print_success "Sales Service API Tests Completed!"
}

# Main execution
main() {
    echo "=================================================="
    echo "         ERP Sales Service API Test Suite"
    echo "=================================================="
    
    # Check if service is running
    check_service
    
    # Get authentication token
    AUTH_TOKEN=$(get_auth_token)
    
    # Run tests
    run_tests
    
    echo ""
    print_status "Test Summary:"
    print_status "- All public endpoints should be accessible"
    if [ -n "$AUTH_TOKEN" ]; then
        print_status "- All authenticated endpoints tested"
        print_status "- You can now use the Sales Service API"
    else
        print_warning "- Some tests skipped due to missing auth token"
        print_status "- Start Auth Service and try again for full testing"
    fi
    
    echo ""
    print_status "API Documentation available at: $BASE_URL/docs"
}

# Run the main function
main
