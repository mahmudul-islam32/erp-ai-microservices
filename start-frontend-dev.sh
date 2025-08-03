#!/bin/bash

# Start the frontend in development mode
echo "🚀 Starting ERP Frontend in development mode with hot-reloading..."
docker-compose --profile development up -d mongodb auth-service frontend-dev

echo "📱 Frontend will be available at: http://localhost:5173"
echo "🔧 API running at: http://localhost:8001"
echo "💾 MongoDB Admin available at: http://localhost:8081"
echo ""
echo "Changes to your frontend code will be automatically reflected in the browser!"
echo "Press Ctrl+C to view logs or run 'docker-compose logs -f frontend-dev' in another terminal"

# Show logs if requested
if [ "$1" = "--logs" ]; then
  docker-compose logs -f frontend-dev
fi
