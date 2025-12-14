#!/bin/bash

# Master script to seed all services with demo data using Docker containers
# This script runs all seed scripts inside Docker containers where dependencies are installed

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌱 Starting seed process for all services (using Docker)...${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Track failures
FAILED_SERVICES=()

# Function to run seed script in Docker container
run_docker_seed() {
    local container_name=$1
    local script_path=$2
    local description=$3
    
    echo -e "${YELLOW}📦 Seeding ${description}...${NC}"
    echo "-----------------------------------"
    
    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo -e "${RED}   ⚠️  Container ${container_name} is not running${NC}"
        FAILED_SERVICES+=("${description}")
        return 1
    fi
    
    # Run the seed script inside the container
    if docker exec "${container_name}" python3 "${script_path}" 2>&1; then
        echo -e "${GREEN}   ✅ ${description} seeded successfully${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}   ❌ Failed to seed ${description}${NC}"
        echo ""
        FAILED_SERVICES+=("${description}")
        return 1
    fi
}

# Function to run inventory seed in Docker container
run_inventory_docker_seed() {
    echo -e "${YELLOW}📦 Seeding Inventory Service...${NC}"
    echo "-----------------------------------"
    
    if ! docker ps --format '{{.Names}}' | grep -q "^erp-inventory-service$"; then
        echo -e "${RED}   ⚠️  Container erp-inventory-service is not running${NC}"
        FAILED_SERVICES+=("inventory")
        return 1
    fi
    
    # Run the seed script inside the container
    if docker exec erp-inventory-service npm run seed 2>&1 || \
       docker exec erp-inventory-service npx ts-node src/database/seed.ts 2>&1; then
        echo -e "${GREEN}   ✅ Inventory Service seeded successfully${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}   ❌ Failed to seed Inventory Service${NC}"
        echo ""
        FAILED_SERVICES+=("inventory")
        return 1
    fi
}

# 1. Seed Auth Service (must be first - creates users)
run_docker_seed "erp-auth-service" "/app/scripts/seed_demo_data.py" "Auth Service (Users, Roles, Sessions)"

# 2. Seed Inventory Service
run_inventory_docker_seed

# 3. Seed Sales Service (depends on auth and inventory)
run_docker_seed "erp-sales-service" "/app/scripts/seed_demo_data.py" "Sales Service (Customers, Orders)"

# Seed Sales Invoices (if separate script exists)
if docker exec erp-sales-service test -f /app/scripts/seed_invoices.py 2>/dev/null; then
    run_docker_seed "erp-sales-service" "/app/scripts/seed_invoices.py" "Sales Service (Invoices)"
fi

# 4. Seed Finance Service
run_docker_seed "erp-finance-service" "/app/scripts/seed_demo_data.py" "Finance Service (Accounts, Journal Entries, Invoices)"

# 5. Seed HRM Service
run_docker_seed "erp-hrm-service" "/app/scripts/seed_demo_data.py" "HRM Service (Employees, Payroll, Attendance)"

# Summary
echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}📊 Seeding Summary${NC}"
echo -e "${BLUE}===========================================${NC}"

if [ ${#FAILED_SERVICES[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All services seeded successfully!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Your ERP system is ready with demo data!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Test Credentials:${NC}"
    echo "   Super Admin: admin@example.com / Admin123"
    echo "   Manager: manager@example.com / Manager123"
    echo "   Employee: employee@example.com / Employee123"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some services failed to seed:${NC}"
    for service in "${FAILED_SERVICES[@]}"; do
        echo -e "${RED}   - ${service}${NC}"
    done
    echo ""
    echo -e "${YELLOW}⚠️  Please check the errors above and try again${NC}"
    exit 1
fi

