#!/bin/bash

# ============================================
# ERP System - Automated Installation Script
# ============================================
# This script automates the complete installation process
# Usage: ./install.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/.env"
WIZARD_FILE="$SCRIPT_DIR/setup-wizard/wizard-data.json"

# Functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Welcome
clear
echo "============================================"
echo "  ERP System - Automated Installation"
echo "============================================"
echo ""

# Step 1: Check Prerequisites
log_info "Checking system requirements..."

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed!"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi
log_success "Docker is installed ($(docker --version))"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed!"
    echo "Please install Docker Compose"
    exit 1
fi
log_success "Docker Compose is installed ($(docker-compose --version))"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running!"
    echo "Please start Docker and try again"
    exit 1
fi
log_success "Docker is running"

# Check disk space (need at least 10GB)
AVAILABLE_SPACE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 10 ]; then
    log_warning "Less than 10GB disk space available. Installation may fail."
fi
log_success "Sufficient disk space available"

echo ""

# Step 2: Configuration
log_info "Setting up configuration..."

if [ -f "$ENV_FILE" ]; then
    log_warning ".env file already exists"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Using existing .env file"
    else
        rm "$ENV_FILE"
        cp .env.example "$ENV_FILE"
        log_success "Created new .env file"
    fi
else
    if [ -f ".env.example" ]; then
        cp .env.example "$ENV_FILE"
        log_success "Created .env file from template"
    else
        log_error ".env.example file not found!"
        exit 1
    fi
fi

# Generate secrets
log_info "Generating secure secrets..."

if command -v python3 &> /dev/null; then
    JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")
    MONGO_PASS=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")
    REDIS_PASS=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")

    # Update .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|JWT_SECRET_KEY=.*|JWT_SECRET_KEY=$JWT_SECRET|" "$ENV_FILE"
        sed -i '' "s|MONGO_INITDB_ROOT_PASSWORD=.*|MONGO_INITDB_ROOT_PASSWORD=$MONGO_PASS|" "$ENV_FILE"
        sed -i '' "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASS|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|JWT_SECRET_KEY=.*|JWT_SECRET_KEY=$JWT_SECRET|" "$ENV_FILE"
        sed -i "s|MONGO_INITDB_ROOT_PASSWORD=.*|MONGO_INITDB_ROOT_PASSWORD=$MONGO_PASS|" "$ENV_FILE"
        sed -i "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASS|" "$ENV_FILE"
    fi
    
    log_success "Secure secrets generated and saved"
else
    log_warning "Python3 not found. Using default secrets (change them later!)"
fi

echo ""

# Step 3: Pull Docker images
log_info "Pulling Docker images (this may take a while)..."

if docker-compose pull; then
    log_success "Docker images pulled successfully"
else
    log_warning "Some images might need to be built locally"
fi

echo ""

# Step 4: Start services
log_info "Starting Docker containers..."

if docker-compose up -d; then
    log_success "Docker containers started"
else
    log_error "Failed to start Docker containers"
    exit 1
fi

echo ""

# Step 5: Wait for services to be ready
log_info "Waiting for services to initialize (this may take 30-60 seconds)..."

wait_for_service() {
    local name=$1
    local url=$2
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
        echo -n "."
    done
    return 1
}

# Wait for MongoDB
log_info "Waiting for MongoDB..."
sleep 10
log_success "MongoDB should be ready"

# Wait for Redis
log_info "Waiting for Redis..."
sleep 5
log_success "Redis should be ready"

# Wait for services
log_info "Waiting for Auth Service..."
if wait_for_service "Auth Service" "http://localhost:8001/health"; then
    log_success "Auth Service is ready"
else
    log_warning "Auth Service may not be ready. Check logs: docker-compose logs auth-service"
fi

log_info "Waiting for Inventory Service..."
if wait_for_service "Inventory Service" "http://localhost:8002/health"; then
    log_success "Inventory Service is ready"
else
    log_warning "Inventory Service may not be ready. Check logs: docker-compose logs inventory-service"
fi

log_info "Waiting for Sales Service..."
if wait_for_service "Sales Service" "http://localhost:8003/health"; then
    log_success "Sales Service is ready"
else
    log_warning "Sales Service may not be ready. Check logs: docker-compose logs sales-service"
fi

log_info "Waiting for Frontend..."
if wait_for_service "Frontend" "http://localhost:5173"; then
    log_success "Frontend is ready"
else
    log_warning "Frontend may not be ready. Check logs: docker-compose logs frontend-dev"
fi

echo ""

# Step 6: Create admin user
log_info "Creating admin user..."

DEFAULT_EMAIL="admin@example.com"
DEFAULT_PASSWORD="admin123"

log_warning "Creating default admin account:"
echo "   Email: $DEFAULT_EMAIL"
echo "   Password: $DEFAULT_PASSWORD"
echo "   ⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!"

# Create admin user via Docker exec
docker-compose exec -T auth-service python -c "
import asyncio
import sys
sys.path.insert(0, '/app')

async def create_admin():
    from app.database.connection import get_database
    from app.services.user_service import UserService
    from app.models.user import UserRole
    
    try:
        db = await get_database()
        user_service = UserService(db)
        
        # Check if admin already exists
        existing = await db.users.find_one({'email': '$DEFAULT_EMAIL'})
        if existing:
            print('Admin user already exists')
            return
        
        # Create admin
        await user_service.create_user({
            'email': '$DEFAULT_EMAIL',
            'password': '$DEFAULT_PASSWORD',
            'first_name': 'System',
            'last_name': 'Administrator',
            'role': UserRole.SUPER_ADMIN,
            'is_active': True
        })
        print('Admin user created successfully')
    except Exception as e:
        print(f'Error creating admin: {str(e)}')

asyncio.run(create_admin())
" 2>/dev/null && log_success "Admin user created" || log_warning "Admin user creation may have failed. You can create it manually later."

echo ""

# Step 7: Load demo data (optional)
read -p "Load demo data for testing? (Y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    log_info "Loading demo data..."
    
    # Load auth service demo data
    if [ -f "auth-service/scripts/seed_demo_data.py" ]; then
        docker-compose exec -T auth-service python scripts/seed_demo_data.py && \
            log_success "Auth demo data loaded" || \
            log_warning "Failed to load auth demo data"
    fi
    
    # Load inventory demo data
    if [ -f "inventory-service/src/scripts/seed-demo-data.ts" ]; then
        docker-compose exec -T inventory-service npm run seed:demo && \
            log_success "Inventory demo data loaded" || \
            log_warning "Failed to load inventory demo data"
    fi
    
    echo ""
fi

# Step 8: Verify installation
log_info "Verifying installation..."

SERVICES_OK=true

# Check if containers are running
if [ "$(docker-compose ps | grep -c "Up")" -lt 6 ]; then
    log_warning "Some containers may not be running properly"
    SERVICES_OK=false
else
    log_success "All containers are running"
fi

echo ""
echo "============================================"
echo "  Installation Complete!"
echo "============================================"
echo ""

if [ "$SERVICES_OK" = true ]; then
    log_success "Your ERP system is ready to use!"
    echo ""
    echo "📍 Access your ERP system:"
    echo "   URL: http://localhost:5173"
    echo ""
    echo "🔐 Login credentials:"
    echo "   Email: $DEFAULT_EMAIL"
    echo "   Password: $DEFAULT_PASSWORD"
    echo "   ${RED}⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!${NC}"
    echo ""
    echo "📚 Documentation:"
    echo "   - Quick Start: docs/QUICK_START.md"
    echo "   - User Manual: docs/USER_MANUAL.md"
    echo "   - Interactive Docs: documentation/index.html"
    echo ""
    echo "🛠️  Useful commands:"
    echo "   - View logs: docker-compose logs -f"
    echo "   - Stop services: docker-compose down"
    echo "   - Restart services: docker-compose restart"
    echo ""
    
    # Try to open browser
    if command -v open &> /dev/null; then
        read -p "Open ERP in browser now? (Y/n): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            open http://localhost:5173
        fi
    elif command -v xdg-open &> /dev/null; then
        read -p "Open ERP in browser now? (Y/n): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            xdg-open http://localhost:5173
        fi
    fi
else
    log_warning "Installation completed with warnings"
    echo ""
    echo "Some services may not be running properly."
    echo "Check the logs: docker-compose logs"
    echo ""
    echo "If you continue to have issues:"
    echo "1. Stop all containers: docker-compose down"
    echo "2. Start again: docker-compose up -d"
    echo "3. Check logs for errors"
fi

echo "============================================"
echo ""

