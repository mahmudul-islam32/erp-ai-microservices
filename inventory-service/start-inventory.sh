#!/bin/bash

# Inventory Service Startup Script
# This script starts the ERP Inventory Service with proper configuration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the inventory-service directory."
    exit 1
fi

# Parse command line arguments
MODE=${1:-development}
SEED_DATA=${2:-false}

print_status "Starting ERP Inventory Service in $MODE mode..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18.x or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18.x or higher is required. Current version: $(node -v)"
    exit 1
fi

# Check if MongoDB is running
print_status "Checking MongoDB connection..."
if ! nc -z localhost 27017 2>/dev/null; then
    print_warning "MongoDB is not running on localhost:27017"
    print_status "Attempting to start MongoDB with Docker..."
    
    if command -v docker &> /dev/null; then
        docker run -d --name erp-mongodb -p 27017:27017 mongo:7.0 || true
        sleep 5
        
        if ! nc -z localhost 27017 2>/dev/null; then
            print_error "Failed to start MongoDB. Please start MongoDB manually."
            exit 1
        fi
        print_success "MongoDB started successfully with Docker"
    else
        print_error "Docker not found. Please start MongoDB manually or install Docker."
        exit 1
    fi
else
    print_success "MongoDB is running"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating .env file from .env.example..."
    cp .env.example .env
    print_warning "Please review and update the .env file with your specific configuration"
fi

# Build the application for production
if [ "$MODE" = "production" ]; then
    print_status "Building application for production..."
    npm run build
    print_success "Application built successfully"
fi

# Seed database if requested
if [ "$SEED_DATA" = "true" ] || [ "$SEED_DATA" = "seed" ]; then
    print_status "Seeding database with sample data..."
    if [ "$MODE" = "production" ]; then
        npm run seed:prod
    else
        npm run seed:dev
    fi
    print_success "Database seeded successfully"
fi

# Start the service based on mode
print_status "Starting Inventory Service..."

case $MODE in
    "development" | "dev")
        print_status "Starting in development mode with hot-reload..."
        npm run start:dev
        ;;
    "debug")
        print_status "Starting in debug mode..."
        npm run start:debug
        ;;
    "production" | "prod")
        print_status "Starting in production mode..."
        npm run start:prod
        ;;
    *)
        print_error "Invalid mode: $MODE. Use 'development', 'debug', or 'production'"
        exit 1
        ;;
esac
