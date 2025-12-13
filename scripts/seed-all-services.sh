#!/bin/bash

# Master script to seed all services with demo data
# This script runs all seed scripts in the correct order

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create a .env file with MongoDB Atlas credentials:"
    echo "  MONGODB_ATLAS_HOST=cluster0.zedw7ti.mongodb.net"
    echo "  MONGODB_ATLAS_USER=your_username"
    echo "  MONGODB_ATLAS_PASSWORD=your_password"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required environment variables
if [ -z "$MONGODB_ATLAS_HOST" ] || [ -z "$MONGODB_ATLAS_USER" ] || [ -z "$MONGODB_ATLAS_PASSWORD" ]; then
    echo -e "${RED}❌ Error: Missing required MongoDB Atlas environment variables!${NC}"
    echo "Please set in .env file:"
    echo "  MONGODB_ATLAS_HOST"
    echo "  MONGODB_ATLAS_USER"
    echo "  MONGODB_ATLAS_PASSWORD"
    exit 1
fi

# Build MongoDB Atlas URL
MONGODB_URL="mongodb+srv://${MONGODB_ATLAS_USER}:${MONGODB_ATLAS_PASSWORD}@${MONGODB_ATLAS_HOST}/?retryWrites=true&w=majority&appName=Cluster0"

echo -e "${BLUE}🌱 Starting seed process for all services...${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Function to run seed script
run_seed() {
    local service_name=$1
    local script_path=$2
    local description=$3
    
    echo -e "${YELLOW}📦 Seeding ${service_name}...${NC}"
    echo "-----------------------------------"
    
    if [ ! -f "$script_path" ]; then
        echo -e "${RED}   ⚠️  Script not found: ${script_path}${NC}"
        return 1
    fi
    
    # Set service-specific environment variables
    export MONGODB_URL="${MONGODB_URL}"
    export DATABASE_NAME="${4:-erp_${service_name}}"
    
    # Run the seed script
    if python3 "$script_path" 2>&1; then
        echo -e "${GREEN}   ✅ ${description} seeded successfully${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}   ❌ Failed to seed ${description}${NC}"
        echo ""
        return 1
    fi
}

# Function to run inventory seed (TypeScript/NestJS)
run_inventory_seed() {
    echo -e "${YELLOW}📦 Seeding inventory-service...${NC}"
    echo "-----------------------------------"
    
    cd inventory-service
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}   Installing dependencies...${NC}"
        npm install
    fi
    
    # Set MongoDB URI for inventory service
    export MONGODB_URI="${MONGODB_URL}"
    
    # Run the seed script using ts-node
    if npx ts-node src/database/seed.ts 2>&1; then
        echo -e "${GREEN}   ✅ Inventory service seeded successfully${NC}"
        echo ""
        cd ..
        return 0
    else
        echo -e "${RED}   ❌ Failed to seed inventory service${NC}"
        echo ""
        cd ..
        return 1
    fi
}

# Track failures
FAILED_SERVICES=()

# 1. Seed Auth Service (must be first - creates users)
if ! run_seed "auth" "auth-service/scripts/seed_demo_data.py" "Auth Service (Users, Roles, Sessions)"; then
    FAILED_SERVICES+=("auth")
fi

# 2. Seed Inventory Service
if ! run_inventory_seed; then
    FAILED_SERVICES+=("inventory")
fi

# 3. Seed Sales Service (depends on auth and inventory)
if ! run_seed "sales" "sales-service/scripts/seed_demo_data.py" "Sales Service (Customers, Orders)"; then
    FAILED_SERVICES+=("sales")
fi

# Seed Sales Invoices (if separate script exists)
if [ -f "sales-service/scripts/seed_invoices.py" ]; then
    if ! run_seed "sales" "sales-service/scripts/seed_invoices.py" "Sales Service (Invoices)"; then
        FAILED_SERVICES+=("sales-invoices")
    fi
fi

# 4. Seed Finance Service
if ! run_seed "finance" "finance-service/scripts/seed_demo_data.py" "Finance Service (Accounts, Journal Entries, Invoices)"; then
    FAILED_SERVICES+=("finance")
fi

# 5. Seed HRM Service
if ! run_seed "hrm" "hrm-service/scripts/seed_demo_data.py" "HRM Service (Employees, Payroll, Attendance)"; then
    FAILED_SERVICES+=("hrm")
fi

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
    echo "   Super Admin: admin@example.com / admin123"
    echo "   Manager: manager@example.com / manager123"
    echo "   Employee: employee@example.com / employee123"
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

