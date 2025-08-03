#!/bin/bash

# Start the ERP system in development mode with hot-reload

echo "🚀 Starting ERP System in Development Mode"
echo "This will start all services with hot-reload enabled"
echo ""

# Start MongoDB and core services first
echo "📦 Starting MongoDB and Core Services..."
docker-compose up -d mongodb auth-service

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 8

# Start inventory service in development mode
echo "📦 Starting Inventory Service..."
docker-compose --profile development up -d inventory-service-dev

# Start MongoDB Express for development
echo "🗄️ Starting MongoDB Express..."
docker-compose --profile development up -d mongo-express

# Start frontend in development mode
echo "🎨 Starting Frontend in Development Mode..."
docker-compose --profile development up frontend-dev

echo ""
echo "✅ All services started!"
echo ""
echo "🌐 Available URLs:"
echo "   - Frontend (with hot-reload): http://localhost:5173"
echo "   - Auth API: http://localhost:8001"
echo "   - Auth API Docs: http://localhost:8001/docs"
echo "   - Inventory API: http://localhost:8002"
echo "   - Inventory API Docs: http://localhost:8002/docs"
echo "   - Inventory GraphQL: http://localhost:8002/graphql"
echo "   - MongoDB Express: http://localhost:8081"
echo ""
echo "🔑 MongoDB Express Login:"
echo "   - Username: admin"
echo "   - Password: admin123"
echo ""
echo "🛑 To stop all services: docker-compose --profile development down"
