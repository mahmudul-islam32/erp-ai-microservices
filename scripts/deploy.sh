#!/bin/bash

# Manual Deployment Script
# Use this for manual deployments to EC2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EC2_USER=${EC2_USER:-ubuntu}
EC2_HOST=${EC2_HOST:-}
SSH_KEY=${SSH_KEY:-~/.ssh/erp-ec2-key.pem}
GITHUB_USERNAME=${GITHUB_USERNAME:-}

# Check if EC2_HOST is provided
if [ -z "$EC2_HOST" ]; then
    echo -e "${RED}Error: EC2_HOST is not set${NC}"
    echo "Usage: EC2_HOST=your-ec2-ip ./scripts/deploy.sh"
    exit 1
fi

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY${NC}"
    exit 1
fi

echo -e "${GREEN}🚀 Starting deployment to EC2...${NC}"

# Copy docker-compose file
echo -e "${YELLOW}📦 Copying docker-compose.prod.yml...${NC}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    docker-compose.prod.yml ${EC2_USER}@${EC2_HOST}:~/erp/docker-compose.yml

# Copy environment template
echo -e "${YELLOW}📦 Copying environment template...${NC}"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    env.production.template ${EC2_USER}@${EC2_HOST}:~/erp/env.template

# Deploy on EC2
echo -e "${YELLOW}🚢 Deploying on EC2...${NC}"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} << 'ENDSSH'
set -e
cd ~/erp

# Check if .env exists, if not copy from template
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Please create one from env.template"
    cp env.template .env
    echo "📝 Please edit ~/erp/.env with your actual values before continuing"
    exit 1
fi

# Source environment variables
source .env

# Login to GitHub Container Registry
echo "🔐 Logging into GitHub Container Registry..."
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Pull latest images
echo "📥 Pulling latest images..."
docker compose pull

# Stop and remove old containers
echo "🛑 Stopping old containers..."
docker compose down

# Start services
echo "🚀 Starting services..."
docker compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 15

# Health checks
echo "🏥 Running health checks..."
curl -f http://localhost:8001/health && echo "✅ Auth Service is healthy" || echo "❌ Auth Service is unhealthy"
curl -f http://localhost:8002/health && echo "✅ Inventory Service is healthy" || echo "❌ Inventory Service is unhealthy"
curl -f http://localhost:8003/health && echo "✅ Sales Service is healthy" || echo "❌ Sales Service is unhealthy"
curl -f http://localhost:80 && echo "✅ Frontend is healthy" || echo "❌ Frontend is unhealthy"

# Show running containers
echo ""
echo "📊 Running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Cleanup old images
echo "🧹 Cleaning up old images..."
docker image prune -af --filter "until=24h"

echo "✅ Deployment completed successfully!"
ENDSSH

echo -e "${GREEN}✅ Deployment to EC2 completed!${NC}"
echo ""
echo "Access your application at:"
echo "  Frontend: http://${EC2_HOST}"
echo "  Auth API: http://${EC2_HOST}:8001/docs"
echo "  Inventory API: http://${EC2_HOST}:8002/docs"
echo "  Sales API: http://${EC2_HOST}:8003/docs"

