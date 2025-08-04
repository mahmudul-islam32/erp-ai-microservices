# Sales Service Quick Start Guide

## 🚀 Quick Start

### 1. Start the Sales Service

Navigate to your project root and start the sales service:

```bash
cd /Users/mohammadmahmudulislam/Desktop/erp-ai-microservices

# Start all services (including sales service)
docker-compose up -d

# Or start only the sales service
docker-compose up -d sales-service mongodb
```

### 2. Verify Service is Running

Check if the service is healthy:

```bash
curl http://localhost:8002/health
```

You should see:
```json
{
  "status": "healthy",
  "service": "ERP Sales Service",
  "version": "1.0.0",
  "timestamp": "2024-01-XX..."
}
```

### 3. Initialize Sample Data

Run the sample data initialization script:

```bash
cd sales-service
python init_sample_data.py
```

This will create:
- 3 sample customers (2 businesses, 1 individual)
- 5 sample products (laptops, accessories, furniture, software)
- 2 sample quotes (1 sent, 1 approved)
- 1 sample sales order (converted from approved quote)
- 1 sample invoice

### 4. Test the API

Run the comprehensive API test script:

```bash
cd sales-service
chmod +x test-sales-api.sh
./test-sales-api.sh
```

### 5. Explore the API Documentation

Open your browser and visit:
- **Interactive API Docs**: http://localhost:8002/docs
- **ReDoc Documentation**: http://localhost:8002/redoc

## 🔗 Available Endpoints

### Public Endpoints
- `GET /health` - Health check
- `GET /` - Service information

### Customer Management
- `GET /api/v1/customers` - List customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers/{id}` - Get customer details
- `PUT /api/v1/customers/{id}` - Update customer
- `DELETE /api/v1/customers/{id}` - Delete customer

### Product Management
- `GET /api/v1/products` - List products
- `POST /api/v1/products` - Create product
- `GET /api/v1/products/{id}` - Get product details
- `PUT /api/v1/products/{id}` - Update product
- `DELETE /api/v1/products/{id}` - Delete product
- `GET /api/v1/products/categories/list` - List product categories
- `GET /api/v1/products/search` - Search products

### Sales Order Management
- `GET /api/v1/sales-orders` - List sales orders
- `POST /api/v1/sales-orders` - Create sales order
- `GET /api/v1/sales-orders/{id}` - Get sales order details
- `PUT /api/v1/sales-orders/{id}` - Update sales order
- `POST /api/v1/sales-orders/{id}/confirm` - Confirm order
- `POST /api/v1/sales-orders/{id}/ship` - Ship order
- `POST /api/v1/sales-orders/{id}/complete` - Complete order
- `POST /api/v1/sales-orders/{id}/cancel` - Cancel order

### Quote Management
- `GET /api/v1/quotes` - List quotes
- `POST /api/v1/quotes` - Create quote
- `GET /api/v1/quotes/{id}` - Get quote details
- `PUT /api/v1/quotes/{id}` - Update quote
- `POST /api/v1/quotes/{id}/send` - Send quote to customer
- `POST /api/v1/quotes/{id}/approve` - Approve quote
- `POST /api/v1/quotes/{id}/reject` - Reject quote
- `POST /api/v1/quotes/{id}/convert` - Convert quote to sales order

### Invoice Management
- `GET /api/v1/invoices` - List invoices
- `POST /api/v1/invoices` - Create invoice
- `GET /api/v1/invoices/{id}` - Get invoice details
- `PUT /api/v1/invoices/{id}` - Update invoice
- `POST /api/v1/invoices/{id}/send` - Send invoice to customer
- `POST /api/v1/invoices/{id}/mark-paid` - Mark invoice as paid
- `POST /api/v1/invoices/{id}/mark-overdue` - Mark invoice as overdue
- `GET /api/v1/invoices/{id}/pdf` - Generate invoice PDF

### Analytics & Reporting
- `GET /api/v1/analytics/dashboard` - Analytics dashboard
- `GET /api/v1/analytics/revenue` - Revenue analytics
- `GET /api/v1/analytics/products` - Product performance
- `GET /api/v1/analytics/customers` - Customer analytics
- `GET /api/v1/analytics/kpis` - Key performance indicators
- `GET /api/v1/analytics/forecast` - Sales forecasting

### Reports
- `GET /api/v1/reports/templates` - Available report templates
- `GET /api/v1/reports/sales` - Sales reports
- `GET /api/v1/reports/inventory` - Inventory reports
- `GET /api/v1/reports/customers` - Customer reports
- `GET /api/v1/reports/financial` - Financial reports

## 🔧 Environment Configuration

The service uses these key environment variables (see `.env.example`):

```bash
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=erp_sales

# Service Configuration
SERVICE_NAME=Sales Service
SERVICE_VERSION=1.0.0
DEBUG=true
PORT=8002

# Authentication (if auth service is running)
AUTH_SERVICE_URL=http://auth-service:8001
JWT_SECRET_KEY=your-secret-key

# External Services
INVENTORY_SERVICE_URL=http://inventory-service:8003
EMAIL_SERVICE_URL=http://email-service:8004

# Business Configuration
DEFAULT_TAX_RATE=0.08
DEFAULT_CURRENCY=USD
```

## 🧪 Sample API Calls

### Create a Customer
```bash
curl -X POST "http://localhost:8002/api/v1/customers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@example.com",
    "phone": "+1234567890",
    "company_name": "Example Corp",
    "customer_type": "business"
  }'
```

### Create a Product
```bash
curl -X POST "http://localhost:8002/api/v1/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "New Product",
    "description": "A great product",
    "sku": "PROD-001",
    "category": "Electronics",
    "unit_price": 99.99,
    "cost_price": 50.00
  }'
```

### Create a Quote
```bash
curl -X POST "http://localhost:8002/api/v1/quotes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "customer_id": "CUSTOMER_ID_HERE",
    "items": [
      {
        "product_id": "PRODUCT_ID_HERE",
        "quantity": 2,
        "unit_price": 99.99
      }
    ],
    "valid_until": "2024-12-31T23:59:59Z"
  }'
```

### Get Analytics Dashboard
```bash
curl -X GET "http://localhost:8002/api/v1/analytics/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐳 Docker Commands

### View Logs
```bash
# All services
docker-compose logs

# Sales service only
docker-compose logs sales-service

# Follow logs in real-time
docker-compose logs -f sales-service
```

### Restart Service
```bash
# Restart sales service
docker-compose restart sales-service

# Rebuild and restart
docker-compose up -d --build sales-service
```

### Database Access
```bash
# Connect to MongoDB
docker-compose exec mongodb mongosh

# Use the sales database
use erp_sales

# List collections
show collections

# Query customers
db.customers.find().pretty()
```

## 🔍 Troubleshooting

### Service Not Starting
1. Check if MongoDB is running: `docker-compose ps`
2. Check service logs: `docker-compose logs sales-service`
3. Verify environment variables in `docker-compose.yml`

### Authentication Issues
1. Ensure auth-service is running
2. Check JWT token validity
3. Verify AUTH_SERVICE_URL configuration

### Database Connection Issues
1. Check MongoDB connection string
2. Verify database name configuration
3. Check MongoDB logs: `docker-compose logs mongodb`

### Port Conflicts
1. Check if port 8002 is already in use: `lsof -i :8002`
2. Update port in `docker-compose.yml` if needed

## 📝 Next Steps

1. **Integration Testing**: Test with auth-service and other microservices
2. **Custom Configuration**: Update environment variables for your needs
3. **Data Migration**: Import your existing customer and product data
4. **API Integration**: Integrate with your frontend application
5. **Monitoring**: Set up logging and monitoring for production use

## 🆘 Support

- **API Documentation**: http://localhost:8002/docs
- **Health Check**: http://localhost:8002/health
- **Service Info**: http://localhost:8002/

The Sales Service is now ready for use! 🎉
