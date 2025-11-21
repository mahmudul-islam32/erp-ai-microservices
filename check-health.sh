#!/bin/bash

echo "🔍 ERP Health Check Diagnostics"
echo "================================"
echo ""

echo "📊 Container Status:"
docker compose ps
echo ""

echo "🔧 Testing MongoDB Health Check:"
docker compose exec mongodb mongosh --quiet --eval "db.adminCommand('ping')" 2>&1
if [ $? -eq 0 ]; then
    echo "✅ MongoDB health check: PASS"
else
    echo "❌ MongoDB health check: FAIL"
fi
echo ""

echo "🔧 Testing Frontend Health Check:"
docker compose exec frontend wget --no-verbose --tries=1 --spider http://localhost:80 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Frontend health check: PASS"
else
    echo "❌ Frontend health check: FAIL"
fi
echo ""

echo "🌐 Testing Service Endpoints:"
echo -n "Auth Service (8001): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health
echo ""

echo -n "Inventory Service (8002): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8002/health
echo ""

echo -n "Sales Service (8003): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8003/health
echo ""

echo -n "Frontend (8080): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080
echo ""

echo ""
echo "📋 Recent Logs (MongoDB):"
docker compose logs mongodb --tail 10
echo ""

echo "📋 Recent Logs (Frontend):"
docker compose logs frontend --tail 10
echo ""

echo "✅ Diagnostic complete!"















