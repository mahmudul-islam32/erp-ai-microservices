#!/bin/bash

echo "=== Testing Invoice Setup ==="
echo ""

echo "1. Checking if frontend container is running..."
docker-compose ps | grep frontend

echo ""
echo "2. Checking if sales service is running..."
docker-compose ps | grep sales-service

echo ""
echo "3. Testing invoice API endpoint..."
docker-compose exec sales-service curl -s http://localhost:8003/api/v1/invoices/ -H "Authorization: Bearer test" 2>&1 | head -5

echo ""
echo "4. Checking frontend routes..."
docker-compose exec frontend-dev grep -A 2 "sales/invoices" /app/src/App.tsx

echo ""
echo "5. Checking sidebar navigation..."
docker-compose exec frontend-dev grep -A 1 "Invoices" /app/src/shared/components/layout/Sidebar.tsx

echo ""
echo "6. Checking invoice pages exist..."
docker-compose exec frontend-dev ls -la /app/src/features/sales/pages/ | grep -i invoice

echo ""
echo "=== Test Complete ==="
echo ""
echo "To access invoices:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Login to the system"
echo "3. Click 'Sales' in the sidebar to expand"
echo "4. Click 'Invoices'"
echo "5. Or go directly to: http://localhost:5173/dashboard/sales/invoices"

