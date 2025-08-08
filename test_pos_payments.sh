#!/bin/bash

# Test script for POS payment functionality
BASE_URL="http://localhost:8001/api/v1"

echo "=== Testing POS Payment System ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if services are running
print_info "Checking if sales service is running..."
if curl -s "$BASE_URL/../health" > /dev/null; then
    print_success "Sales service is running"
else
    print_error "Sales service is not running. Please start it first."
    exit 1
fi

# Get auth token (you'll need to replace this with actual token)
AUTH_TOKEN="your-auth-token-here"

# Headers for API calls
HEADERS="Content-Type: application/json"
AUTH_HEADER="Authorization: Bearer $AUTH_TOKEN"

print_info "Testing Payment API endpoints..."

echo ""
echo "1. Testing Cash Payment Creation"
echo "================================"

# Test cash payment data
CASH_PAYMENT_DATA='{
    "payment_method": "cash",
    "amount": 150.00,
    "cash_details": {
        "amount_tendered": 200.00,
        "change_given": 50.00,
        "currency": "USD",
        "cashier_id": "cashier_001"
    },
    "customer_id": "walk-in",
    "terminal_id": "POS_001",
    "notes": "Walk-in customer payment"
}'

echo "Creating cash payment..."
CASH_RESPONSE=$(curl -s -X POST "$BASE_URL/payments/cash" \
    -H "$HEADERS" \
    -H "$AUTH_HEADER" \
    -d "$CASH_PAYMENT_DATA")

if echo "$CASH_RESPONSE" | grep -q "payment_number"; then
    print_success "Cash payment created successfully"
    PAYMENT_ID=$(echo "$CASH_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "Payment ID: $PAYMENT_ID"
else
    print_error "Cash payment creation failed"
    echo "Response: $CASH_RESPONSE"
fi

echo ""
echo "2. Testing Card Payment Creation"
echo "================================"

# Test card payment data
CARD_PAYMENT_DATA='{
    "payment_method": "credit_card",
    "amount": 250.00,
    "card_details": {
        "card_type": "visa",
        "last_four_digits": "1234",
        "expiry_month": 12,
        "expiry_year": 2025,
        "cardholder_name": "John Doe"
    },
    "customer_id": "customer_001",
    "terminal_id": "POS_001",
    "notes": "Credit card payment"
}'

echo "Creating card payment..."
CARD_RESPONSE=$(curl -s -X POST "$BASE_URL/payments/card" \
    -H "$HEADERS" \
    -H "$AUTH_HEADER" \
    -d "$CARD_PAYMENT_DATA")

if echo "$CARD_RESPONSE" | grep -q "payment_number"; then
    print_success "Card payment created successfully"
    CARD_PAYMENT_ID=$(echo "$CARD_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "Payment ID: $CARD_PAYMENT_ID"
else
    print_error "Card payment creation failed"
    echo "Response: $CARD_RESPONSE"
fi

echo ""
echo "3. Testing POS Transaction Creation"
echo "==================================="

# Test complete POS transaction
POS_TRANSACTION_DATA='{
    "customer_id": "walk-in",
    "line_items": [
        {
            "product_id": "PROD_001",
            "quantity": 2,
            "unit_price": 25.00,
            "notes": "Regular item"
        },
        {
            "product_id": "PROD_002", 
            "quantity": 1,
            "unit_price": 15.00,
            "notes": "Discounted item"
        }
    ],
    "payments": [
        {
            "payment_method": "cash",
            "amount": 50.00,
            "cash_details": {
                "amount_tendered": 50.00,
                "change_given": 0.00,
                "currency": "USD"
            }
        },
        {
            "payment_method": "credit_card",
            "amount": 15.00,
            "card_details": {
                "card_type": "visa",
                "last_four_digits": "5678",
                "cardholder_name": "Jane Smith"
            }
        }
    ],
    "subtotal": 65.00,
    "tax_amount": 0.00,
    "discount_amount": 0.00,
    "total_amount": 65.00,
    "terminal_id": "POS_001",
    "cashier_id": "cashier_001",
    "notes": "Mixed payment transaction"
}'

echo "Creating POS transaction..."
POS_RESPONSE=$(curl -s -X POST "$BASE_URL/payments/pos-transaction" \
    -H "$HEADERS" \
    -H "$AUTH_HEADER" \
    -d "$POS_TRANSACTION_DATA")

if echo "$POS_RESPONSE" | grep -q "transaction_number"; then
    print_success "POS transaction created successfully"
    TRANSACTION_ID=$(echo "$POS_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "Transaction ID: $TRANSACTION_ID"
else
    print_error "POS transaction creation failed"
    echo "Response: $POS_RESPONSE"
fi

echo ""
echo "4. Testing Payment Retrieval"
echo "============================="

echo "Getting payments list..."
PAYMENTS_LIST=$(curl -s -X GET "$BASE_URL/payments?limit=10" \
    -H "$AUTH_HEADER")

if echo "$PAYMENTS_LIST" | grep -q "items"; then
    print_success "Payments list retrieved successfully"
    PAYMENT_COUNT=$(echo "$PAYMENTS_LIST" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    echo "Total payments: $PAYMENT_COUNT"
else
    print_error "Failed to retrieve payments list"
    echo "Response: $PAYMENTS_LIST"
fi

echo ""
echo "5. Testing Daily Summary"
echo "========================"

echo "Getting daily payments summary..."
DAILY_SUMMARY=$(curl -s -X GET "$BASE_URL/payments/daily-summary" \
    -H "$AUTH_HEADER")

if echo "$DAILY_SUMMARY" | grep -q "total_payments"; then
    print_success "Daily summary retrieved successfully"
    echo "Summary: $DAILY_SUMMARY"
else
    print_error "Failed to retrieve daily summary"
    echo "Response: $DAILY_SUMMARY"
fi

echo ""
echo "6. Testing Refund Creation (if payment exists)"
echo "=============================================="

if [ ! -z "$PAYMENT_ID" ]; then
    REFUND_DATA='{
        "amount": 25.00,
        "reason": "Customer return",
        "notes": "Defective item returned"
    }'
    
    echo "Creating refund for payment $PAYMENT_ID..."
    REFUND_RESPONSE=$(curl -s -X POST "$BASE_URL/payments/$PAYMENT_ID/refund" \
        -H "$HEADERS" \
        -H "$AUTH_HEADER" \
        -d "$REFUND_DATA")
    
    if echo "$REFUND_RESPONSE" | grep -q "refund_number"; then
        print_success "Refund created successfully"
        echo "Refund ID: $(echo "$REFUND_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)"
    else
        print_error "Refund creation failed"
        echo "Response: $REFUND_RESPONSE"
    fi
else
    print_info "Skipping refund test - no payment ID available"
fi

echo ""
echo "=== POS Payment System Test Complete ==="
echo ""
print_info "Note: This script requires a valid auth token and running services."
print_info "Some tests may fail if dependencies (customers, products) are not set up."
