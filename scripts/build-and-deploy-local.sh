#!/bin/bash

# Build and Deploy Locally on EC2
# This script builds Docker images locally and deploys them

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Building and Deploying ERP Microservices Locally${NC}"
echo "=================================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create .env file with your configuration"
    echo "See env.production.template for reference"
    exit 1
fi

echo -e "${YELLOW}📦 Stopping existing containers...${NC}"
docker compose down 2>/dev/null || true

echo ""
echo -e "${YELLOW}🏗️  Building Docker images...${NC}"
echo "This may take 5-10 minutes on first run..."
echo ""

# Build auth service
echo -e "${GREEN}Building Auth Service...${NC}"
cd auth-service
docker build -t erp-auth-service:latest . --no-cache
cd ..

# Build inventory service
echo -e "${GREEN}Building Inventory Service...${NC}"
cd inventory-service
docker build -t erp-inventory-service:latest . --no-cache
cd ..

# Build sales service
echo -e "${GREEN}Building Sales Service...${NC}"
cd sales-service
docker build -t erp-sales-service:latest . --no-cache
cd ..

# Build frontend
echo -e "${GREEN}Building Frontend...${NC}"
cd erp-frontend
docker build \
  --build-arg VITE_AUTH_SERVICE_URL=${VITE_AUTH_SERVICE_URL:-http://localhost:8001} \
  --build-arg VITE_INVENTORY_SERVICE_URL=${VITE_INVENTORY_SERVICE_URL:-http://localhost:8002} \
  --build-arg VITE_SALES_SERVICE_URL=${VITE_SALES_SERVICE_URL:-http://localhost:8003} \
  --build-arg VITE_STRIPE_PUBLIC_KEY=${STRIPE_PUBLISHABLE_KEY} \
  -t erp-frontend:latest . --no-cache
cd ..

echo ""
echo -e "${GREEN}✅ All images built successfully!${NC}"
echo ""

# Create docker-compose file for local images
echo -e "${YELLOW}📝 Creating docker-compose configuration...${NC}"
cat > docker-compose.local-deploy.yml << 'EOF'
services:
  mongodb:
    image: mongo:7.0
    container_name: erp-mongodb
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USERNAME:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:-password123}
    volumes:
      - mongodb_data:/data/db
    networks:
      - erp-network

  redis:
    image: redis:7.2-alpine
    container_name: erp-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - erp-network

  auth-service:
    image: erp-auth-service:latest
    container_name: erp-auth-service
    restart: always
    ports:
      - "8001:8001"
    env_file: .env
    depends_on:
      - mongodb
    networks:
      - erp-network

  inventory-service:
    image: erp-inventory-service:latest
    container_name: erp-inventory-service
    restart: always
    ports:
      - "8002:8002"
    env_file: .env
    depends_on:
      - mongodb
      - auth-service
    volumes:
      - inventory_uploads:/app/uploads
    networks:
      - erp-network

  sales-service:
    image: erp-sales-service:latest
    container_name: erp-sales-service
    restart: always
    ports:
      - "8003:8003"
    env_file: .env
    depends_on:
      - mongodb
      - redis
      - auth-service
      - inventory-service
    networks:
      - erp-network

  frontend:
    image: erp-frontend:latest
    container_name: erp-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - auth-service
      - inventory-service
      - sales-service
    networks:
      - erp-network

volumes:
  mongodb_data:
  redis_data:
  inventory_uploads:

networks:
  erp-network:
    driver: bridge
EOF

echo ""
echo -e "${YELLOW}🚢 Starting services...${NC}"
docker compose -f docker-compose.local-deploy.yml up -d

echo ""
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 15

echo ""
echo -e "${YELLOW}🏥 Running health checks...${NC}"

# Health checks
check_service() {
    local name=$1
    local url=$2
    local response=$(curl -s -o /dev/null -w "%{http_code}" $url 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ $name: Healthy${NC}"
    else
        echo -e "${RED}❌ $name: Unhealthy (HTTP $response)${NC}"
    fi
}

check_service "Auth Service      " "http://localhost:8001/health"
check_service "Inventory Service " "http://localhost:8002/health"
check_service "Sales Service     " "http://localhost:8003/health"
check_service "Frontend          " "http://localhost:80"

echo ""
echo -e "${GREEN}🐳 Container Status:${NC}"
docker compose -f docker-compose.local-deploy.yml ps

echo ""
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo "📊 Access your application:"
echo "  - Frontend: http://$(curl -s ifconfig.me || hostname -I | awk '{print $1}')"
echo "  - Auth API: http://$(curl -s ifconfig.me || hostname -I | awk '{print $1}'):8001/docs"
echo "  - Inventory API: http://$(curl -s ifconfig.me || hostname -I | awk '{print $1}'):8002/docs"
echo "  - Sales API: http://$(curl -s ifconfig.me || hostname -I | awk '{print $1}'):8003/docs"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: docker compose -f docker-compose.local-deploy.yml logs -f"
echo "  - Restart: docker compose -f docker-compose.local-deploy.yml restart"
echo "  - Stop: docker compose -f docker-compose.local-deploy.yml down"
echo ""

