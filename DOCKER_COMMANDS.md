# ERP System - Docker Commands Guide

This guide provides all the necessary Docker Compose commands to manage your ERP system.

## 🚀 Quick Start

### Start All Services
```bash
docker compose up -d
```

### Start with Development Profile (includes Mongo Express)
```bash
docker compose --profile development up -d
```

## 📋 Service Management

### Start Specific Services
```bash
# Start only backend services
docker compose up -d mongodb redis auth-service inventory-service sales-service

# Start only frontend
docker compose up -d frontend-dev

# Start production frontend
docker compose up -d frontend
```

### Stop Services
```bash
# Stop all services
docker compose down

# Stop specific services
docker compose stop auth-service inventory-service

# Stop and remove volumes (WARNING: This will delete all data)
docker compose down -v
```

### Restart Services
```bash
# Restart all services
docker compose restart

# Restart specific services
docker compose restart auth-service inventory-service sales-service
```

## 🔧 Development Commands

### View Logs
```bash
# View all logs
docker compose logs

# View specific service logs
docker compose logs auth-service
docker compose logs inventory-service
docker compose logs sales-service
docker compose logs frontend-dev

# Follow logs in real-time
docker compose logs -f auth-service
```

### Rebuild Services
```bash
# Rebuild all services
docker compose build

# Rebuild specific service
docker compose build auth-service
docker compose build inventory-service
docker compose build sales-service
docker compose build frontend-dev

# Rebuild and start
docker compose up -d --build
```

### Execute Commands in Containers
```bash
# Access auth service container
docker compose exec auth-service bash

# Access inventory service container
docker compose exec inventory-service sh

# Access sales service container
docker compose exec sales-service bash

# Access frontend container
docker compose exec frontend-dev sh

# Run npm commands in frontend
docker compose exec frontend-dev npm install
docker compose exec frontend-dev npm run build
```

## 🗄️ Database Management

### MongoDB Access
```bash
# Access MongoDB container
docker compose exec mongodb mongosh

# Access with authentication
docker compose exec mongodb mongosh -u admin -p password123 --authenticationDatabase admin
```

### Mongo Express (Web UI)
```bash
# Start with development profile to include Mongo Express
docker compose --profile development up -d

# Access at: http://localhost:8081
# Username: admin
# Password: admin123
```

### Redis Access
```bash
# Access Redis container
docker compose exec redis redis-cli
```

## 🔍 Monitoring & Debugging

### Check Service Status
```bash
# List all containers
docker compose ps

# Check service health
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

### Service Health Checks
```bash
# Test auth service
curl http://localhost:8001/health

# Test inventory service
curl http://localhost:8002/health

# Test sales service
curl http://localhost:8003/health

# Test frontend
curl http://localhost:5173
```

### Resource Usage
```bash
# View resource usage
docker stats

# View specific service stats
docker stats erp-auth-service erp-inventory-service erp-sales-service
```

## 🧹 Cleanup Commands

### Remove Unused Resources
```bash
# Remove stopped containers
docker compose rm

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Clean everything (WARNING: This removes all unused Docker resources)
docker system prune -a
```

### Reset Everything
```bash
# Stop and remove everything (including data)
docker compose down -v --rmi all

# Remove all containers, networks, and volumes
docker system prune -a --volumes
```

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend (Dev)** | http://localhost:5173 | React development server |
| **Frontend (Prod)** | http://localhost:80 | Production frontend |
| **Auth Service** | http://localhost:8001 | Authentication API |
| **Inventory Service** | http://localhost:8002 | Inventory management API |
| **Sales Service** | http://localhost:8003 | Sales management API |
| **Mongo Express** | http://localhost:8081 | MongoDB web interface |
| **MongoDB** | localhost:27017 | Database |
| **Redis** | localhost:6379 | Cache & sessions |

## 📚 API Documentation

| Service | Swagger Docs | GraphQL |
|---------|--------------|---------|
| **Auth Service** | http://localhost:8001/docs | - |
| **Inventory Service** | http://localhost:8002/docs | http://localhost:8002/graphql |
| **Sales Service** | http://localhost:8003/docs | - |

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :8001
   
   # Stop conflicting services
   docker compose down
   ```

2. **Service Won't Start**
   ```bash
   # Check logs
   docker compose logs service-name
   
   # Rebuild service
   docker compose build service-name
   docker compose up -d service-name
   ```

3. **Database Connection Issues**
   ```bash
   # Restart database
   docker compose restart mongodb redis
   
   # Check database logs
   docker compose logs mongodb
   ```

4. **Frontend Build Issues**
   ```bash
   # Rebuild frontend
   docker compose build frontend-dev
   docker compose up -d frontend-dev
   
   # Check frontend logs
   docker compose logs frontend-dev
   ```

### Reset Single Service
```bash
# Stop and remove specific service
docker compose stop service-name
docker compose rm -f service-name

# Rebuild and start
docker compose build service-name
docker compose up -d service-name
```

## 🔐 Environment Variables

Create a `.env` file in the root directory for custom configuration:

```env
# JWT Secret (change in production)
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production

# Database credentials
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=password123

# Service ports (optional)
AUTH_SERVICE_PORT=8001
INVENTORY_SERVICE_PORT=8002
SALES_SERVICE_PORT=8003
FRONTEND_PORT=5173
```

## 📝 Notes

- All services are configured with hot-reload for development
- Data persists in Docker volumes
- CORS is configured for localhost development
- Services communicate through Docker network
- Use `--profile development` to include Mongo Express
- Frontend runs on port 5173 by default, 5174 if 5173 is busy
