#!/bin/bash

# ERP Auth Service API Testing Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://localhost:8001"
ACCESS_TOKEN=""
REFRESH_TOKEN=""

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test health endpoint
test_health() {
    print_test "Testing health endpoint..."
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$BASE_URL/health")
    
    if [ "$response" -eq 200 ]; then
        print_success "Health endpoint is working"
    else
        print_fail "Health endpoint failed (HTTP $response)"
        return 1
    fi
}

# Test admin login
test_admin_login() {
    print_test "Testing admin login..."
    
    response=$(curl -s -w "%{http_code}" -o /tmp/login_response.json \
        -X POST "$BASE_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@erp.com",
            "password": "admin123"
        }')
    
    if [ "$response" -eq 200 ]; then
        ACCESS_TOKEN=$(cat /tmp/login_response.json | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
        REFRESH_TOKEN=$(cat /tmp/login_response.json | python3 -c "import sys, json; print(json.load(sys.stdin)['refresh_token'])")
        print_success "Admin login successful"
        print_info "Access token: ${ACCESS_TOKEN:0:20}..."
        return 0
    else
        print_fail "Admin login failed (HTTP $response)"
        cat /tmp/login_response.json
        return 1
    fi
}

# Test get current user
test_get_current_user() {
    print_test "Testing get current user..."
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_fail "No access token available"
        return 1
    fi
    
    response=$(curl -s -w "%{http_code}" -o /tmp/me_response.json \
        -X GET "$BASE_URL/api/v1/auth/me" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if [ "$response" -eq 200 ]; then
        print_success "Get current user successful"
        user_email=$(cat /tmp/me_response.json | python3 -c "import sys, json; print(json.load(sys.stdin)['email'])")
        print_info "User email: $user_email"
    else
        print_fail "Get current user failed (HTTP $response)"
        cat /tmp/me_response.json
        return 1
    fi
}

# Test create user
test_create_user() {
    print_test "Testing create user..."
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_fail "No access token available"
        return 1
    fi
    
    response=$(curl -s -w "%{http_code}" -o /tmp/create_user_response.json \
        -X POST "$BASE_URL/api/v1/users" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "test.employee@erp.com",
            "password": "testpass123",
            "first_name": "Test",
            "last_name": "Employee",
            "role": "employee",
            "department": "Testing"
        }')
    
    if [ "$response" -eq 201 ]; then
        print_success "User creation successful"
        user_id=$(cat /tmp/create_user_response.json | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
        print_info "Created user ID: $user_id"
    else
        print_fail "User creation failed (HTTP $response)"
        cat /tmp/create_user_response.json
        return 1
    fi
}

# Test get users list
test_get_users() {
    print_test "Testing get users list..."
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_fail "No access token available"
        return 1
    fi
    
    response=$(curl -s -w "%{http_code}" -o /tmp/users_response.json \
        -X GET "$BASE_URL/api/v1/users?limit=10" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if [ "$response" -eq 200 ]; then
        print_success "Get users list successful"
        user_count=$(cat /tmp/users_response.json | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
        print_info "Number of users: $user_count"
    else
        print_fail "Get users list failed (HTTP $response)"
        cat /tmp/users_response.json
        return 1
    fi
}

# Test token refresh
test_token_refresh() {
    print_test "Testing token refresh..."
    
    if [ -z "$REFRESH_TOKEN" ]; then
        print_fail "No refresh token available"
        return 1
    fi
    
    response=$(curl -s -w "%{http_code}" -o /tmp/refresh_response.json \
        -X POST "$BASE_URL/api/v1/auth/refresh" \
        -H "Content-Type: application/json" \
        -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}")
    
    if [ "$response" -eq 200 ]; then
        print_success "Token refresh successful"
        NEW_ACCESS_TOKEN=$(cat /tmp/refresh_response.json | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
        print_info "New access token: ${NEW_ACCESS_TOKEN:0:20}..."
    else
        print_fail "Token refresh failed (HTTP $response)"
        cat /tmp/refresh_response.json
        return 1
    fi
}

# Test invalid login
test_invalid_login() {
    print_test "Testing invalid login..."
    
    response=$(curl -s -w "%{http_code}" -o /tmp/invalid_login_response.json \
        -X POST "$BASE_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "invalid@erp.com",
            "password": "wrongpassword"
        }')
    
    if [ "$response" -eq 401 ]; then
        print_success "Invalid login correctly rejected"
    else
        print_fail "Invalid login should return 401, got $response"
        return 1
    fi
}

# Test unauthorized access
test_unauthorized_access() {
    print_test "Testing unauthorized access..."
    
    response=$(curl -s -w "%{http_code}" -o /tmp/unauthorized_response.json \
        -X GET "$BASE_URL/api/v1/users")
    
    if [ "$response" -eq 401 ] || [ "$response" -eq 403 ]; then
        print_success "Unauthorized access correctly rejected"
    else
        print_fail "Unauthorized access should return 401/403, got $response"
        return 1
    fi
}

# Main test runner
main() {
    echo -e "${BLUE}🧪 ERP Auth Service API Test Suite${NC}"
    echo "=================================="
    
    # Check if service is running
    if ! curl -s "$BASE_URL/health" > /dev/null; then
        print_fail "Auth service is not running at $BASE_URL"
        echo "Please start the service with: ./setup.sh"
        exit 1
    fi
    
    passed=0
    total=0
    
    # Run tests
    tests=(
        "test_health"
        "test_admin_login"
        "test_get_current_user"
        "test_create_user"
        "test_get_users"
        "test_token_refresh"
        "test_invalid_login"
        "test_unauthorized_access"
    )
    
    for test in "${tests[@]}"; do
        total=$((total + 1))
        echo ""
        if $test; then
            passed=$((passed + 1))
        fi
    done
    
    echo ""
    echo "=================================="
    echo -e "${BLUE}Test Results:${NC} $passed/$total tests passed"
    
    if [ $passed -eq $total ]; then
        echo -e "${GREEN}🎉 All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some tests failed${NC}"
        exit 1
    fi
}

# Run tests
main "$@"
