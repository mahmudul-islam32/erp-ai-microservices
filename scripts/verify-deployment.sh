#!/bin/bash

# CI/CD Deployment Verification Script
# Run this after deployment to verify all services are working

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EC2_HOST=${1:-}

if [ -z "$EC2_HOST" ]; then
    echo -e "${RED}Usage: $0 <EC2_HOST>${NC}"
    echo "Example: $0 54.123.45.67"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Deployment Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Target: $EC2_HOST${NC}"
echo ""

# Function to check service health
check_service() {
    local name=$1
    local port=$2
    local endpoint=$3
    
    echo -n "Checking $name... "
    
    if curl -f -s "http://$EC2_HOST:$port$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ Unhealthy${NC}"
        return 1
    fi
}

# Function to check service with retries
check_service_retry() {
    local name=$1
    local port=$2
    local endpoint=$3
    local max_retries=3
    
    for i in $(seq 1 $max_retries); do
        if check_service "$name" "$port" "$endpoint"; then
            return 0
        fi
        if [ $i -lt $max_retries ]; then
            echo -e "   ${YELLOW}Retrying in 5 seconds...${NC}"
            sleep 5
        fi
    done
    return 1
}

echo -e "${BLUE}🔍 Checking Services...${NC}"
echo ""

# Check each service
all_healthy=true

if ! check_service_retry "Auth Service" "8001" "/health"; then
    all_healthy=false
fi

if ! check_service_retry "Inventory Service" "8002" "/health"; then
    all_healthy=false
fi

if ! check_service_retry "Sales Service" "8003" "/health"; then
    all_healthy=false
fi

if ! check_service_retry "Frontend" "8080" ""; then
    all_healthy=false
fi

echo ""
echo -e "${BLUE}🔍 Checking Additional Endpoints...${NC}"
echo ""

# Check auth service endpoints
echo -n "Auth Service - Login endpoint... "
if curl -f -s "http://$EC2_HOST:8001/docs" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Available${NC}"
else
    echo -e "${YELLOW}⚠️  API docs not accessible${NC}"
fi

# Check MongoDB connection (indirect - through services being up)
echo -n "Database connectivity... "
if $all_healthy; then
    echo -e "${GREEN}✅ Services connected to database${NC}"
else
    echo -e "${RED}❌ Some services cannot connect${NC}"
fi

echo ""
echo -e "${BLUE}📊 Summary${NC}"
echo ""

if $all_healthy; then
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ All services are healthy!${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Service URLs:${NC}"
    echo -e "  Auth Service:      ${GREEN}http://$EC2_HOST:8001${NC}"
    echo -e "  Inventory Service: ${GREEN}http://$EC2_HOST:8002${NC}"
    echo -e "  Sales Service:     ${GREEN}http://$EC2_HOST:8003${NC}"
    echo -e "  Frontend:          ${GREEN}http://$EC2_HOST:8080${NC}"
    echo ""
    echo -e "${YELLOW}API Documentation:${NC}"
    echo -e "  Auth:      ${GREEN}http://$EC2_HOST:8001/docs${NC}"
    echo -e "  Inventory: ${GREEN}http://$EC2_HOST:8002/docs${NC}"
    echo -e "  Sales:     ${GREEN}http://$EC2_HOST:8003/docs${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}════════════════════════════════════════${NC}"
    echo -e "${RED}❌ Some services are unhealthy${NC}"
    echo -e "${RED}════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting steps:${NC}"
    echo "1. SSH into EC2: ${GREEN}ssh -i your-key.pem ubuntu@$EC2_HOST${NC}"
    echo "2. Check container status: ${GREEN}cd ~/erp && docker compose ps${NC}"
    echo "3. Check logs: ${GREEN}docker compose logs${NC}"
    echo "4. Check specific service: ${GREEN}docker compose logs <service-name>${NC}"
    echo "5. Restart services: ${GREEN}docker compose restart${NC}"
    echo ""
    echo -e "${YELLOW}Common issues:${NC}"
    echo "- Services still starting up (wait 1-2 minutes)"
    echo "- Environment variables not set (check ~/erp/.env)"
    echo "- MongoDB not ready (check mongodb container)"
    echo "- Network issues (check security groups)"
    echo ""
    exit 1
fi
