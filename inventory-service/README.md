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

All REST routes are mounted at the root of the service (there is no `/api` prefix).

#### Products
- `GET /products` - List products with filtering
- `POST /products` - Create a product
- `GET /products/stats` - Product statistics
- `GET /products/low-stock` - Products at or below their reorder level
- `GET /products/sku/:sku` - Get a product by SKU
- `GET /products/:id` - Get a product by ID
- `PUT /products/:id` - Update a product
- `PUT /products/:id/stock` - Update stock levels
- `DELETE /products/:id` - Delete a product

#### Categories
- `GET /categories` - List categories
- `POST /categories` - Create a category
- `GET /categories/tree` - Categories as a parent-child tree
- `GET /categories/stats` - Category statistics
- `GET /categories/root` - Top-level categories only
- `GET /categories/code/:code` - Get a category by code
- `GET /categories/:id` - Get a category by ID
- `GET /categories/:id/children` - Direct children of a category
- `PUT /categories/:id` - Update a category
- `DELETE /categories/:id` - Delete a category

#### Suppliers
- `GET /suppliers` - List suppliers
- `POST /suppliers` - Create a supplier
- `GET /suppliers/stats` - Supplier statistics
- `GET /suppliers/search` - Search suppliers
- `GET /suppliers/location` - Suppliers by location
- `GET /suppliers/code/:code` - Get a supplier by code
- `GET /suppliers/:id` - Get a supplier by ID
- `PUT /suppliers/:id` - Update a supplier
- `DELETE /suppliers/:id` - Delete a supplier

#### Warehouses
- `GET /warehouses` - List warehouses
- `POST /warehouses` - Create a warehouse
- `GET /warehouses/active` - Active warehouses only
- `GET /warehouses/stats` - Warehouse statistics
- `GET /warehouses/search` - Search warehouses
- `GET /warehouses/location` - Warehouses by location
- `GET /warehouses/type/:type` - Warehouses of one type
- `GET /warehouses/code/:code` - Get a warehouse by code
- `GET /warehouses/:id` - Get a warehouse by ID
- `PUT /warehouses/:id` - Update a warehouse
- `DELETE /warehouses/:id` - Delete a warehouse

#### Inventory
- `GET /inventory` - List inventory records
- `POST /inventory` - Create an inventory record
- `GET /inventory/low-stock` - Records with low stock
- `GET /inventory/out-of-stock` - Records with no stock
- `GET /inventory/stats` - Inventory statistics
- `GET /inventory/product/:productId` - Inventory for one product
- `GET /inventory/warehouse/:warehouseId` - Inventory in one warehouse
- `GET /inventory/:id` - Get an inventory record by ID
- `PUT /inventory/:id` - Update an inventory record
- `DELETE /inventory/:id` - Delete an inventory record
- `POST /inventory/transactions` - Record an inventory transaction
- `GET /inventory/transactions/history/:inventoryId` - Transaction history for one record
- `GET /inventory/transactions/product/:productId` - Transaction history for one product
- `POST /inventory/adjust` - Adjust inventory levels
- `POST /inventory/transfer` - Transfer stock between warehouses
- `POST /inventory/reserve` - Reserve stock for an order
- `POST /inventory/release` - Release reserved stock
- `GET /inventory/verify/:productId` - Compare inventory and product stock data for a product
- `POST /inventory/fulfill` - Reduce available stock directly

#### Uploads
- `POST /upload/image` - Upload an image file (multipart field `image`)
- `DELETE /upload/image/:filename` - Delete an uploaded image

Uploaded files are served from `/uploads/`.

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

Requests are authenticated with a JWT from the auth service, sent either way:

```bash
# Include in Authorization header
Authorization: Bearer <your-jwt-token>

# Or use the cookie-based authentication
Cookie: access_token=<your-jwt-token>
```

The `JwtAuthGuard` checks each token by calling the auth service's `GET /api/v1/auth/me`, so the auth service must be reachable at `AUTH_SERVICE_URL`.

How the guards are applied in the current code:

- **GraphQL:** every resolver (products, categories, suppliers, warehouses, inventory) uses `JwtAuthGuard` and `RolesGuard`, so GraphQL requests need a token.
- **REST `/products`:** the controller uses both guards, so every products route needs a token. `POST /products` is also limited to the admin and manager roles; the role checks on the other products routes are commented out.
- **REST `/categories`, `/suppliers`, `/warehouses`, `/inventory`:** the guards are commented out on these controllers, so these routes currently accept requests without a token.
- **REST `/upload`:** no guard is applied.

The role table above describes the intended access model; only the checks listed here are enforced today.

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
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

The health route is registered in `src/main.ts` and always returns this fixed body with the current time. It does not check the MongoDB connection, so a `healthy` response only means the HTTP server is up.

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

The service reads these settings (from the environment or a `.env` file in the service folder):

| Variable | Default in code | Used for |
|---|---|---|
| `MONGODB_URI` | none, required | MongoDB connection string; the service will not start without it |
| `PORT` | `8002` | HTTP port |
| `JWT_SECRET` | `your-super-secret-key` | JWT strategy secret; set it to the same value as the auth service |
| `AUTH_SERVICE_URL` | `http://auth-service:8001` | Token validation, via the auth service `GET /api/v1/auth/me` |
| `NOTIFICATION_SERVICE_URL` | `http://notification-service:8004` | Sending stock notifications |
| `PUBLIC_URL` | `http://localhost:8002` | Base URL used to build links to uploaded images |

`.env.example` also lists settings such as `ALLOWED_ORIGINS`, `GRAPHQL_PLAYGROUND`, `REDIS_URL`, `MAX_FILE_SIZE` and the pagination and rate limit values, but the current code does not read them. CORS is set in `src/main.ts` to allow all origins, and the GraphQL playground and introspection are always enabled in `src/app.module.ts`. Note that `.env.example` points `NOTIFICATION_SERVICE_URL` at port 8005, while the notification service runs on 8004 in `docker-compose.yml`.

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

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation at `/docs`

---

**Part of the ERP AI Microservices Ecosystem** 🚀
