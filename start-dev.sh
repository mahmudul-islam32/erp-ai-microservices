#!/bin/bash

# Start the ERP system in development mode with hot-reload

echo "🚀 Starting ERP System in Development Mode"
echo "This will start all services with hot-reload enabled"
echo ""

# Start MongoDB and Auth Service first
echo "📦 Starting MongoDB and Auth Service..."
docker-compose up -d mongodb auth-service

# Wait for auth service to be ready
echo "⏳ Waiting for Auth Service to be ready..."
sleep 5

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
echo "   - MongoDB Express: http://localhost:8081"
echo ""
echo "🔑 MongoDB Express Login:"
echo "   - Username: admin"
echo "   - Password: admin123"
echo ""
echo "🛑 To stop all services: docker-compose --profile development down"
