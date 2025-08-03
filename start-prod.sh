#!/bin/bash

# Start the ERP system in production mode

echo "🚀 Starting ERP System in Production Mode"
echo ""

# Build and start all production services
echo "🏗️ Building and starting all services..."
docker-compose up -d mongodb auth-service inventory-service frontend

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "✅ All services started!"
echo ""
echo "🌐 Available URLs:"
echo "   - Frontend: http://localhost:80"
echo "   - Auth API: http://localhost:8001"
echo "   - Auth API Docs: http://localhost:8001/docs"
echo "   - Inventory API: http://localhost:8002"
echo "   - Inventory API Docs: http://localhost:8002/docs"
echo "   - Inventory GraphQL: http://localhost:8002/graphql"
echo ""
echo "🛑 To stop all services: docker-compose down"
