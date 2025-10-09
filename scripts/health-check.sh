#!/bin/bash

# Health Check Script for ERP Microservices
# Run this to check the status of all services

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🏥 ERP Microservices Health Check"
echo "=================================="
echo ""

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local response=$(curl -s -o /dev/null -w "%{http_code}" $url 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ $service_name: Healthy (HTTP $response)${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name: Unhealthy (HTTP $response)${NC}"
        return 1
    fi
}

# Check services
echo "📡 Service Health:"
check_service "Auth Service      " "http://localhost:8001/health"
check_service "Inventory Service " "http://localhost:8002/health"
check_service "Sales Service     " "http://localhost:8003/health"
check_service "Frontend          " "http://localhost:80"

echo ""
echo "🐳 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep erp || echo "No ERP containers running"

echo ""
echo "💾 Database Status:"
docker exec erp-mongodb mongosh --quiet --eval "db.adminCommand('ping')" 2>/dev/null && \
    echo -e "${GREEN}✅ MongoDB: Connected${NC}" || \
    echo -e "${RED}❌ MongoDB: Not connected${NC}"

docker exec erp-redis redis-cli ping 2>/dev/null | grep -q PONG && \
    echo -e "${GREEN}✅ Redis: Connected${NC}" || \
    echo -e "${RED}❌ Redis: Not connected${NC}"

echo ""
echo "📊 Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep erp

echo ""
echo "📝 Recent Logs (last 10 lines):"
echo "================================"
docker compose logs --tail=10 2>/dev/null || echo "Could not fetch logs"

