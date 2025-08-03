# ERP Inventory Service

A comprehensive inventory management microservice built with NestJS, GraphQL, and MongoDB for the ERP AI Microservices ecosystem.

## 🚀 Features

### ✅ Implemented Features
- **Product Management** - CRUD operations with full lifecycle management
- **Category Management** - Hierarchical product categorization
- **Supplier Management** - Supplier information and relationship tracking
- **Warehouse Management** - Multi-warehouse inventory tracking
- **Inventory Tracking** - Real-time stock levels and transactions
- **Stock Management** - Automated stock adjustments and transfers
- **Low Stock Alerts** - Automatic notifications for reorder points
- **Batch/Serial Tracking** - Full traceability for products
- **GraphQL API** - Modern query language with real-time subscriptions
- **REST API** - Traditional REST endpoints with OpenAPI documentation
- **Authentication** - JWT-based security with role-based access control
- **Validation** - Comprehensive input validation and error handling
- **Audit Trail** - Complete transaction history and logging

### 🚧 Planned Features
- **Barcode Integration** - Barcode scanning and generation
- **Inventory Forecasting** - AI-powered demand prediction
- **Multi-location Transfers** - Inter-warehouse stock movements
- **Purchase Order Integration** - Automatic stock receiving from orders
- **Sales Order Integration** - Automatic stock reservation and allocation
- **Inventory Valuation** - FIFO, LIFO, and weighted average costing
- **Physical Count** - Inventory counting and reconciliation tools
- **Expiry Management** - Expiration date tracking and alerts
- **Reporting & Analytics** - Advanced inventory reports and dashboards

## 🏗️ Architecture

### Tech Stack
- **Framework**: NestJS (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **API**: GraphQL + REST (Hybrid approach)
- **Authentication**: JWT with role-based access control
- **Documentation**: Swagger/OpenAPI
- **Validation**: Class-validator and Class-transformer
- **Testing**: Jest with supertest
- **Containerization**: Docker

### Database Schema
```
├── Products Collection
│   ├── Basic Information (SKU, name, description)
│   ├── Pricing (cost, price, currency)
│   ├── Stock Management (min/max levels, reorder points)
│   ├── Physical Properties (weight, dimensions)
│   └── Relationships (categories, suppliers)
│
├── Categories Collection
│   ├── Hierarchical Structure (parent-child relationships)
│   ├── Metadata (name, description, code)
│   └── Organization (sort order, active status)
│
├── Suppliers Collection
│   ├── Contact Information (name, email, phone)
│   ├── Address Details (full address, country)
│   └── Business Info (tax ID, terms, notes)
│
├── Warehouses Collection
│   ├── Location Details (name, address, contact)
│   ├── Configuration (main warehouse flag)
│   └── Status Management (active/inactive)
│
├── Inventory Collection
│   ├── Stock Levels (quantity, reserved, available)
│   ├── Cost Tracking (average cost, valuation)
│   ├── Location Tracking (warehouse, specific location)
│   └── Batch/Serial Information
│
└── Inventory Transactions Collection
    ├── Transaction Details (type, reason, quantity)
    ├── Financial Impact (unit cost, total cost)
    ├── Traceability (batch, serial, reference)
    └── Audit Information (user, timestamp)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- MongoDB 5.x or higher
- npm or yarn package manager

### Installation

1. **Clone and navigate to the directory**:
   ```bash
   cd inventory-service
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   # Using Docker
   docker run -d --name mongodb -p 27017:27017 mongo:latest
   
   # Or start your local MongoDB service
   brew services start mongodb-community  # macOS
   sudo systemctl start mongod             # Linux
   ```

5. **Run database migrations/seed** (optional):
   ```bash
   npm run seed
   ```

### Development

```bash
# Start in development mode with hot-reload
npm run start:dev

# Start in debug mode
npm run start:debug

# Build the application
npm run build

# Start in production mode
npm run start:prod
```

### Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run test coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## 📚 API Documentation

### REST API
- **Base URL**: `http://localhost:8002`
- **Documentation**: `http://localhost:8002/docs` (Swagger UI)
- **Health Check**: `http://localhost:8002/health`

### GraphQL API
- **Endpoint**: `http://localhost:8002/graphql`
- **Playground**: `http://localhost:8002/graphql` (in development)

### Key Endpoints

#### Products
- `GET /products` - List all products with filtering
- `POST /products` - Create new product
- `GET /products/:id` - Get product by ID
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `PUT /products/:id/stock` - Update stock levels

#### Categories
- `GET /categories` - List all categories
- `POST /categories` - Create new category
- `GET /categories/:id` - Get category by ID
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

#### Suppliers
- `GET /suppliers` - List all suppliers
- `POST /suppliers` - Create new supplier
- `GET /suppliers/:id` - Get supplier by ID
- `PUT /suppliers/:id` - Update supplier
- `DELETE /suppliers/:id` - Delete supplier

#### Warehouses
- `GET /warehouses` - List all warehouses
- `POST /warehouses` - Create new warehouse
- `GET /warehouses/:id` - Get warehouse by ID
- `PUT /warehouses/:id` - Update warehouse
- `DELETE /warehouses/:id` - Delete warehouse

#### Inventory
- `GET /inventory` - List inventory records
- `POST /inventory/adjust` - Adjust inventory levels
- `POST /inventory/transfer` - Transfer between warehouses
- `GET /inventory/transactions` - View transaction history
- `GET /inventory/low-stock` - Get low stock alerts

## 🔐 Authentication & Authorization

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **SUPER_ADMIN** | Full system access |
| **ADMIN** | All inventory operations |
| **MANAGER** | Product/Category/Supplier CRUD, Inventory adjustments |
| **EMPLOYEE** | Read access, Stock updates |
| **CUSTOMER** | Limited read access to products |
| **VENDOR** | Limited access to supplier-related data |

### API Authentication

All API endpoints require a valid JWT token:

```bash
# Include in Authorization header
Authorization: Bearer <your-jwt-token>

# Or use the cookie-based authentication
Cookie: access_token=<your-jwt-token>
```

## 🐳 Docker Deployment

### Development

```bash
# Build development image
docker build -f Dockerfile.dev -t erp-inventory-service:dev .

# Run with docker-compose
docker-compose up inventory-service
```

### Production

```bash
# Build production image
docker build -t erp-inventory-service:latest .

# Run production container
docker run -d \\
  --name inventory-service \\
  -p 8002:8002 \\
  -e MONGODB_URI=mongodb://mongo:27017/erp_inventory \\
  erp-inventory-service:latest
```

## 📊 Monitoring & Health Checks

### Health Check Endpoint
```bash
curl http://localhost:8002/health
```

Response:
```json
{
  "status": "healthy",
  "service": "inventory-service",
  "version": "1.0.0",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "database": "connected",
  "memory": {
    "used": "50MB",
    "total": "100MB"
  }
}
```

## 🧪 Testing

### Test Structure
```
test/
├── unit/           # Unit tests for services, controllers
├── integration/    # Integration tests for modules
├── e2e/           # End-to-end API tests
└── fixtures/      # Test data and utilities
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern=products
npm test -- --testPathPattern=inventory

# Generate coverage report
npm run test:cov
```

## 🚀 Integration with Other Services

### Auth Service
- JWT token validation
- User role verification
- Permission checking

### Order Service
- Automatic stock reservation
- Stock allocation for orders
- Stock release on cancellation

### Finance Service
- Inventory valuation
- Cost tracking
- Financial reporting

### Notification Service
- Low stock alerts
- Expiry notifications
- Stock movement notifications

## 📈 Performance Considerations

### Database Optimization
- Strategic indexing on frequently queried fields
- Compound indexes for complex queries
- Aggregation pipelines for reporting

### Caching Strategy
- Redis caching for frequently accessed data
- Query result caching
- Session caching

### Pagination
- Cursor-based pagination for large datasets
- Configurable page sizes
- Sorting and filtering optimization

## 🔧 Configuration

### Environment Variables
See `.env.example` for all available configuration options.

### Key Configuration Areas
- Database connection strings
- JWT secrets and expiration
- CORS settings
- File upload limits
- Rate limiting
- External service URLs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use conventional commit messages
- Update documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation at `/docs`

---

**Part of the ERP AI Microservices Ecosystem** 🚀
