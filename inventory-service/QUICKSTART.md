# 🚀 Quick Start Guide - ERP Inventory Service

This guide will help you get the ERP Inventory Management microservice up and running quickly.

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js 18.x or higher** - [Download here](https://nodejs.org/)
- **MongoDB 5.x or higher** - [Download here](https://www.mongodb.com/try/download/community) or use Docker
- **Docker & Docker Compose** (optional but recommended) - [Download here](https://www.docker.com/products/docker-desktop/)

## 🏃‍♂️ Quick Start (3 options)

### Option 1: Docker Compose (Recommended)

The easiest way to start the entire ERP system including the inventory service:

```bash
# From the project root directory
cd /Users/mohammadmahmudulislam/Desktop/erp-ai-microservices

# Start in development mode (with hot-reload)
./start-dev.sh

# OR start in production mode
./start-prod.sh
```

This will start:
- MongoDB database
- Auth service (port 8001)
- **Inventory service (port 8002)** ⭐
- Frontend application (port 5173 for dev, 80 for prod)

### Option 2: Individual Service (Development)

To run just the inventory service for development:

```bash
cd inventory-service

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start MongoDB (if not already running)
docker run -d --name mongodb -p 27017:27017 mongo:7.0

# Start the service with sample data
./start-inventory.sh development seed

# OR start without seeding
./start-inventory.sh development
```

### Option 3: Manual Setup

```bash
cd inventory-service

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB
# ... (start your MongoDB instance)

# Run database migrations/seed (optional)
npm run seed:dev

# Start the service
npm run start:dev
```

## 🌐 Access Points

Once running, the inventory service provides:

### REST API
- **Base URL**: http://localhost:8002
- **API Documentation**: http://localhost:8002/docs (Swagger UI)
- **Health Check**: http://localhost:8002/health

### GraphQL API
- **Endpoint**: http://localhost:8002/graphql
- **GraphQL Playground**: http://localhost:8002/graphql (in development mode)

### Example Endpoints
```bash
# Health check
curl http://localhost:8002/health

# List products
curl http://localhost:8002/products

# Create a category
curl -X POST http://localhost:8002/categories \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Electronics","description":"Electronic devices"}'
```

## 🔑 Authentication

The inventory service integrates with the auth service. To access protected endpoints:

1. **Get a JWT token** from the auth service:
   ```bash
   # Login to get token
   curl -X POST http://localhost:8001/auth/login \\
     -H "Content-Type: application/json" \\
     -d '{"email":"admin@erp.com","password":"admin123"}'
   ```

2. **Use the token** in inventory service requests:
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     http://localhost:8002/products
   ```

## 📊 Sample Data

The service includes a comprehensive seeding script that creates:

- **3 Product Categories** (Electronics, Furniture, Stationery)
- **2 Suppliers** (TechCorp, Modern Furniture Co.)
- **2 Warehouses** (Main Warehouse, East Coast Warehouse)
- **3 Products** with full specifications
- **Initial Inventory** with stock levels
- **Sample Transactions** showing stock movements

To seed the database:
```bash
npm run seed:dev
```

## 🧪 Testing

### API Testing
Use the included test script:
```bash
./test-api.sh
```

### Unit Testing
```bash
npm test
```

### Integration Testing
```bash
npm run test:e2e
```

## 📈 Key Features Available

### ✅ Fully Implemented
- **Product Management** - Complete CRUD with SKU, pricing, stock levels
- **Category Management** - Hierarchical categories with codes
- **Supplier Management** - Supplier information and relationships
- **Warehouse Management** - Multi-location inventory tracking
- **Inventory Tracking** - Real-time stock levels and transactions
- **Stock Operations** - Add, subtract, adjust, and transfer stock
- **Low Stock Alerts** - Automatic reorder point monitoring
- **Transaction History** - Complete audit trail of all movements
- **Batch/Serial Tracking** - Product traceability features
- **GraphQL + REST APIs** - Dual API approach for flexibility
- **Role-Based Security** - Integration with auth service
- **Comprehensive Validation** - Input validation and error handling
- **Swagger Documentation** - Auto-generated API docs

### 🔄 Sample Operations

After seeding, you can perform these operations:

```bash
# Check inventory levels
curl http://localhost:8002/inventory

# View low stock items
curl http://localhost:8002/inventory/low-stock

# Get inventory statistics
curl http://localhost:8002/inventory/stats

# Update stock levels
curl -X PUT http://localhost:8002/products/{productId}/stock \\
  -H "Content-Type: application/json" \\
  -d '{"quantity":10,"operation":"add"}'

# Transfer stock between warehouses
curl -X POST http://localhost:8002/inventory/transfer \\
  -H "Content-Type: application/json" \\
  -d '{
    "productId":"...",
    "fromWarehouseId":"...",
    "toWarehouseId":"...",
    "quantity":5,
    "performedBy":"user123"
  }'
```

## 🐛 Troubleshooting

### Common Issues

**Service won't start:**
- Check if MongoDB is running: `nc -z localhost 27017`
- Verify Node.js version: `node -v` (should be 18+)
- Check port 8002 is not in use: `lsof -i :8002`

**Authentication errors:**
- Ensure auth service is running on port 8001
- Verify JWT token is valid and not expired
- Check if user has required permissions

**Database connection issues:**
- Check MongoDB connection string in `.env`
- Ensure MongoDB is accessible from the service
- Verify database credentials if using authentication

**GraphQL errors:**
- Check if GraphQL playground is enabled in development
- Verify GraphQL endpoint is accessible
- Check request format and query syntax

### Getting Help

1. **Check the logs** - The service provides detailed logging
2. **Health endpoint** - Visit http://localhost:8002/health
3. **API documentation** - Review http://localhost:8002/docs
4. **Test scripts** - Run `./test-api.sh` to verify functionality

## 🎯 Next Steps

Once the service is running:

1. **Explore the API** - Use the Swagger documentation
2. **Try GraphQL** - Experiment with the GraphQL playground
3. **Integrate with frontend** - The React frontend can consume this API
4. **Add custom business logic** - Extend the service for your needs
5. **Set up monitoring** - Implement health checks and metrics

## 🚀 Production Deployment

For production deployment:

```bash
# Build and start in production mode
./start-prod.sh

# Or using Docker directly
docker-compose up -d inventory-service

# Or build and run manually
npm run build
npm run start:prod
```

Remember to:
- Update environment variables for production
- Set up proper database backups
- Configure logging and monitoring
- Set up SSL/TLS certificates
- Configure reverse proxy if needed

---

**Happy coding! 🎉**

The ERP Inventory Service is now ready to handle your inventory management needs with a robust, scalable, and modern architecture.
