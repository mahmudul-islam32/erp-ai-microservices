#!/bin/bash

echo "🚀 Starting ERP Auth Service Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

print_header "Building and starting services..."

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose down

# Build and start services
print_status "Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 10

# Check service health
print_header "Checking service health..."

# Check MongoDB
if docker-compose ps mongodb | grep -q "Up"; then
    print_status "✅ MongoDB is running"
else
    print_error "❌ MongoDB failed to start"
fi

# Check Auth Service
if docker-compose ps auth-service | grep -q "Up"; then
    print_status "✅ Auth Service is running"
else
    print_error "❌ Auth Service failed to start"
fi

# Display service URLs
print_header "Service URLs:"
echo -e "${GREEN}🔐 Auth Service API:${NC} http://localhost:8001"
echo -e "${GREEN}📚 API Documentation:${NC} http://localhost:8001/docs"
echo -e "${GREEN}🗄️  Database Admin:${NC} http://localhost:8081 (admin/admin123)"

print_header "Default Admin Credentials:"
echo -e "${GREEN}Email:${NC} admin@erp.com"
echo -e "${GREEN}Password:${NC} admin123"

print_header "Testing the API..."
sleep 5

# Test health endpoint
if curl -s http://localhost:8001/health > /dev/null; then
    print_status "✅ Health endpoint is responding"
else
    print_warning "⚠️  Health endpoint is not responding yet. Services might still be starting."
fi

print_header "Setup Complete! 🎉"
print_status "Your ERP Auth Service is now running!"
print_status "View logs with: docker-compose logs -f auth-service"
print_status "Stop services with: docker-compose down"

echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Test the API at http://localhost:8001/docs"
echo "2. Login with admin@erp.com / admin123"
echo "3. Create additional users and test permissions"
echo "4. Integrate with your frontend application"
