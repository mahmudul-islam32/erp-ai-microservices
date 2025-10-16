#!/bin/bash

# ============================================
# Demo Data Setup Script
# ============================================
# This script loads demo/sample data into your ERP system
# Usage: ./scripts/setup-demo-data.sh

set -e

echo "🎯 Loading Demo Data into ERP System"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi

# Check if services are running
if ! docker-compose ps | grep -q "Up"; then
    echo "${RED}❌ Services are not running${NC}"
    echo "Please start services first: docker-compose up -d"
    exit 1
fi

echo "${BLUE}Loading demo data...${NC}"
echo ""

# Load Auth Service Demo Data
echo "${YELLOW}1/3${NC} Loading users and audit logs..."
docker-compose exec -T auth-service python -c "
from scripts.seed_demo_data import seed_demo_data
import asyncio
asyncio.run(seed_demo_data())
print('✅ Users loaded successfully')
" || echo "${RED}⚠️  Failed to load auth demo data${NC}"

echo ""

# Load Inventory Service Demo Data
echo "${YELLOW}2/3${NC} Loading products, categories, and warehouses..."
docker-compose exec -T inventory-service npm run seed:demo || echo "${RED}⚠️  Failed to load inventory demo data${NC}"

echo ""

# Load Sales Service Demo Data
echo "${YELLOW}3/3${NC} Loading customers, orders, and invoices..."
docker-compose exec -T sales-service python -c "
from scripts.seed_demo_data import seed_demo_data
import asyncio
asyncio.run(seed_demo_data())
print('✅ Sales data loaded successfully')
" || echo "${RED}⚠️  Failed to load sales demo data${NC}"

echo ""
echo "===================================="
echo "${GREEN}✅ Demo data loading complete!${NC}"
echo ""
echo "📊 Demo Data Includes:"
echo "   • 10+ Users (Super Admin, Admins, Managers, Employees)"
echo "   • 50+ Products across 10 categories"
echo "   • 3 Warehouses with locations"
echo "   • 20+ Customers with full details"
echo "   • 30+ Sales Orders (various statuses)"
echo "   • 15+ Invoices"
echo "   • Sample audit logs and sessions"
echo ""
echo "🔐 Default Login Credentials:"
echo "   Super Admin:"
echo "   Email: admin@example.com"
echo "   Password: admin123"
echo ""
echo "   Manager:"
echo "   Email: manager@example.com"
echo "   Password: manager123"
echo ""
echo "   Employee:"
echo "   Email: employee@example.com"
echo "   Password: employee123"
echo ""
echo "${YELLOW}⚠️  Change these passwords in production!${NC}"
echo ""
echo "🌐 Access your ERP:"
echo "   Frontend: http://localhost:5173"
echo "   Auth API: http://localhost:8001/docs"
echo "   Inventory API: http://localhost:8002/docs"
echo "   Sales API: http://localhost:8003/docs"
echo ""
echo "===================================="

