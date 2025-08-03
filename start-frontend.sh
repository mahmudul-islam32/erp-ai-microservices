#!/bin/bash

echo "🚀 Starting ERP Frontend Development Server..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd erp-frontend

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}[WARNING]${NC} Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${GREEN}[INFO]${NC} Installing dependencies..."
    npm install
fi

# Start the development server
echo -e "${GREEN}[INFO]${NC} Starting development server..."
npm run dev

# This script will keep running until the development server is stopped
