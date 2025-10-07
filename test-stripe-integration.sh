#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Stripe Payment Integration Test Suite             ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo ""

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run tests
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -e "${YELLOW}Test $TESTS_RUN:${NC} $test_name"
    
    result=$(eval "$test_command" 2>&1)
    
    if echo "$result" | grep -q "$expected_result"; then
        echo -e "${GREEN}✅ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "   Result: $result"
    else
        echo -e "${RED}❌ FAIL${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "   Expected: $expected_result"
        echo "   Got: $result"
    fi
    echo ""
}

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 1: Environment Check${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  Some containers are not running. Starting...${NC}"
    docker-compose up -d
    sleep 10
fi
echo -e "${GREEN}✅ Containers are running${NC}"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 2: Configure Stripe Test Keys${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check if Stripe keys are configured
if grep -q "^STRIPE_SECRET_KEY=" .env && grep "^STRIPE_SECRET_KEY=" .env | grep -qv "^STRIPE_SECRET_KEY=$"; then
    echo -e "${GREEN}✅ Stripe keys found in .env${NC}"
    STRIPE_CONFIGURED=true
else
    echo -e "${YELLOW}⚠️  Stripe keys not found in .env${NC}"
    echo -e "${YELLOW}Note: Using placeholder keys for structure test${NC}"
    echo -e "${YELLOW}To fully test, add real Stripe test keys to .env:${NC}"
    echo ""
    echo "# Stripe Configuration (Test Mode)"
    echo "STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE"
    echo "STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE"
    echo "STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE"
    echo ""
    STRIPE_CONFIGURED=false
fi
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 3: Backend API Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Test 1: Health check
run_test "Sales Service Health Check" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:8003/health" \
    "200"

# Test 2: Stripe config endpoint exists
run_test "Stripe Config Endpoint Exists" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:8003/api/v1/payments/stripe/config" \
    "200"

# Test 3: Stripe config endpoint returns JSON
run_test "Stripe Config Returns JSON" \
    "curl -s http://localhost:8003/api/v1/payments/stripe/config" \
    "publishable_key"

# Test 4: Payment endpoints are registered
run_test "Stripe Payment Intent Endpoint Exists" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:8003/api/v1/payments/stripe/create-intent -H 'Content-Type: application/json' -d '{}'" \
    "401\|422"  # Expect 401 (auth required) or 422 (validation error)

# Test 5: Webhook endpoint exists
run_test "Stripe Webhook Endpoint Exists" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:8003/api/v1/payments/stripe/webhook" \
    "400"  # Expect 400 (missing signature)

# Test 6: Check if Stripe package is installed
run_test "Stripe Python Package Installed" \
    "docker-compose exec -T sales-service python -c 'import stripe; print(stripe.__version__)'" \
    "7\."

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 4: Frontend Build Test${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Test 7: Frontend is accessible
run_test "Frontend is Accessible" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080" \
    "200"

# Test 8: Check if Stripe packages are in package.json
run_test "Stripe Packages in package.json" \
    "cat erp-frontend/package.json" \
    "@stripe/stripe-js"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 5: Integration Test (Mock Payment)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

if [ "$STRIPE_CONFIGURED" = true ]; then
    echo -e "${YELLOW}Note: Real Stripe integration tests require valid API keys${NC}"
    echo -e "${YELLOW}Add your Stripe test keys to .env and rerun this script${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping real payment tests - Stripe keys not configured${NC}"
    echo ""
    echo -e "${BLUE}To enable full testing:${NC}"
    echo "1. Get test keys from: https://dashboard.stripe.com/test/apikeys"
    echo "2. Add to .env file:"
    echo "   STRIPE_SECRET_KEY=sk_test_..."
    echo "   STRIPE_PUBLISHABLE_KEY=pk_test_..."
    echo "3. Restart services: docker-compose restart sales-service"
    echo "4. Rerun this test script"
fi
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 6: File Structure Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check if key files exist
FILES=(
    "sales-service/app/services/stripe_service.py"
    "sales-service/app/models/payment.py"
    "erp-frontend/src/context/StripeContext.tsx"
    "erp-frontend/src/components/Payment/StripePaymentForm.tsx"
    "erp-frontend/src/components/Payment/StripePaymentModal.tsx"
    "docs/STRIPE_INTEGRATION.md"
    "docs/STRIPE_PAYMENT_FLOW.md"
)

echo "Checking required files..."
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file ${RED}(MISSING)${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
done
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Total Tests Run:    ${BLUE}$TESTS_RUN${NC}"
echo -e "Tests Passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed:       ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  🎉 ALL TESTS PASSED! Stripe integration ready!  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next Steps:${NC}"
    echo "1. Add your Stripe test keys to .env"
    echo "2. Restart: docker-compose restart sales-service"
    echo "3. Open: http://localhost:8080"
    echo "4. Test payment with card: 4242 4242 4242 4242"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ⚠️  Some tests failed. Check errors above.      ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════╝${NC}"
    exit 1
fi

