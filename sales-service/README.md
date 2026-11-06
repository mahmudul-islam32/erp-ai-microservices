# Sales Service - ERP System

A comprehensive sales management microservice built with FastAPI and MongoDB for the ERP AI Microservices system.

## 🌟 Features

### Core Sales Management
- **Customer Management**: Complete CRUD operations for customer data
- **Product Catalog**: Read-only product and category lookup via the inventory service
- **Sales Orders**: Full order lifecycle management from draft to delivery
- **Payments**: Cash, card and Stripe payments with refunds
- **Invoicing**: Automated invoice generation with payment tracking
- **Analytics**: Real-time sales analytics and KPIs
- **Reporting**: Comprehensive reporting system with multiple export formats

### Advanced Features
- **Stock Integration**: Real-time inventory checking and reservation
- **Payment Processing**: Payment tracking and aging reports
- **Commission Calculation**: Automated sales commission reports
- **Forecasting**: AI-powered sales forecasting
- **PDF Generation**: Invoice PDF download
- **Email Integration**: Send invoices to customers

## 🏗️ Architecture

### Technology Stack
- **Framework**: FastAPI
- **Database**: MongoDB with Motor async driver
- **Authentication**: JWT token validation (Auth Service integration)
- **Background Tasks**: Celery with Redis
- **Caching**: Redis for performance optimization

### Service Structure
```
sales-service/
├── main.py                    # FastAPI application entry point
├── app/
│   ├── api/                   # API route definitions
│   │   ├── dependencies.py    # Authentication and permissions
│   │   └── v1/               # API version 1
│   │       ├── customers.py   # Customer endpoints
│   │       ├── products.py    # Product endpoints
│   │       ├── sales_orders.py # Sales order endpoints
│   │       ├── quotes.py      # Quote endpoints
│   │       ├── invoices.py    # Invoice endpoints
│   │       ├── analytics.py   # Analytics endpoints
│   │       └── reports.py     # Reporting endpoints
│   ├── models/               # Pydantic models
│   │   ├── customer.py       # Customer data models
│   │   ├── product.py        # Product data models
│   │   ├── sales_order.py    # Sales order models
│   │   ├── quote.py          # Quote models
│   │   └── invoice.py        # Invoice models
│   ├── services/             # Business logic
│   │   ├── customer_service.py    # Customer operations
│   │   ├── product_service.py     # Product operations
│   │   ├── sales_order_service.py # Order management
│   │   ├── quote_service.py       # Quote operations
│   │   ├── invoice_service.py     # Invoice operations
│   │   ├── analytics_service.py   # Analytics calculations
│   │   ├── reports_service.py     # Report generation
│   │   └── external_services.py   # External API integrations
│   ├── database/             # Database configuration
│   │   ├── connection.py     # MongoDB connection
│   │   └── __init__.py       # Database utilities
│   └── config.py             # Application settings
├── requirements.txt          # Python dependencies
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- MongoDB 5.0+
- Redis 6.0+ (for caching and background tasks)
- Auth Service running (for authentication)

### Installation

1. **Clone and navigate to the sales service**:
```bash
cd erp-ai-microservices/sales-service
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the service**:
```bash
# Development mode
uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8002
```

### Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up -d sales-service
```

## 📊 API Endpoints

### Authentication
All endpoints require JWT authentication via the Auth Service.

### Customer Management
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers` - List customers
- `GET /api/v1/customers/{customer_id}` - Get customer details
- `GET /api/v1/customers/email/{email}` - Get customer by email
- `PUT /api/v1/customers/{customer_id}` - Update customer
- `DELETE /api/v1/customers/{customer_id}` - Delete customer
- `GET /api/v1/customers/search/{query}` - Search customers

### Products (proxied from Inventory)
Products are not stored in this service. These routes call the inventory service and only support reads:

- `GET /api/v1/products` - List products (`page`, `limit`, `search`, `categoryId`, `isActive`)
- `GET /api/v1/products/{product_id}` - Get product by ID
- `GET /api/v1/products/sku/{sku}` - Get product by SKU
- `GET /api/v1/products/categories/list` - List product categories
- `GET /api/v1/products/search` - Search products (`q`, `limit`)

### Sales Orders
- `POST /api/v1/sales-orders` - Create sales order
- `GET /api/v1/sales-orders` - List orders
- `GET /api/v1/sales-orders/{order_id}` - Get order details
- `PUT /api/v1/sales-orders/{order_id}` - Update order
- `DELETE /api/v1/sales-orders/{order_id}` - Delete order
- `POST /api/v1/sales-orders/{order_id}/confirm` - Confirm order
- `POST /api/v1/sales-orders/{order_id}/cancel` - Cancel order
- `PATCH /api/v1/sales-orders/{order_id}/status` - Update order status
- `POST /api/v1/sales-orders/{order_id}/payment-status` - Update payment status
- `GET /api/v1/sales-orders/number/{order_number}` - Get by order number
- `GET /api/v1/sales-orders/customer/{customer_id}/orders` - Orders for a customer
- `POST /api/v1/sales-orders/{order_id}/duplicate` - Duplicate order

### Payments
- `POST /api/v1/payments` - Create a payment
- `POST /api/v1/payments/cash` - Record a cash payment
- `POST /api/v1/payments/card` - Record a card payment
- `GET /api/v1/payments` - List payments
- `GET /api/v1/payments/{payment_id}` - Get a payment
- `POST /api/v1/payments/{payment_id}/refund` - Refund a payment
- `GET /api/v1/payments/order/{order_id}/payments` - Payments for an order
- `GET /api/v1/payments/customer/{customer_id}/payments` - Payments for a customer
- `GET /api/v1/payments/methods/summary` - Payment methods summary (placeholder response today)
- `GET /api/v1/payments/daily-summary` - Daily payments summary
- `GET /api/v1/payments/stripe/config` - Stripe publishable config
- `POST /api/v1/payments/stripe/create-intent` - Create a Stripe payment intent
- `POST /api/v1/payments/stripe/confirm` - Confirm a Stripe payment
- `POST /api/v1/payments/stripe/refund/{payment_id}` - Refund via Stripe
- `POST /api/v1/payments/stripe/webhook` - Stripe webhook handler

### Invoices
- `POST /api/v1/invoices` - Create invoice
- `GET /api/v1/invoices` - List invoices
- `GET /api/v1/invoices/{invoice_id}` - Get invoice details
- `PUT /api/v1/invoices/{invoice_id}` - Update invoice
- `POST /api/v1/invoices/{invoice_id}/send` - Send invoice
- `POST /api/v1/invoices/{invoice_id}/payments` - Record a payment against the invoice
- `GET /api/v1/invoices/number/{invoice_number}` - Get by invoice number
- `POST /api/v1/invoices/from-order/{order_id}` - Create from a sales order
- `GET /api/v1/invoices/{invoice_id}/pdf` - Download invoice PDF
- `GET /api/v1/invoices/overdue/list` - List overdue invoices
- `POST /api/v1/invoices/{invoice_id}/void` - Void invoice

### Analytics
- `GET /api/v1/analytics/dashboard` - Sales dashboard
- `GET /api/v1/analytics/revenue` - Revenue analytics
- `GET /api/v1/analytics/sales-performance` - Sales rep performance
- `GET /api/v1/analytics/customer-analytics` - Customer analytics
- `GET /api/v1/analytics/product-analytics` - Product analytics
- `GET /api/v1/analytics/conversion-funnel` - Conversion funnel
- `GET /api/v1/analytics/top-customers` - Top customers
- `GET /api/v1/analytics/top-products` - Top products
- `GET /api/v1/analytics/trends` - Sales trends
- `GET /api/v1/analytics/forecast` - Sales forecast
- `GET /api/v1/analytics/kpis` - Key performance indicators

### Reports
- `GET /api/v1/reports/sales` - Generate sales report
- `GET /api/v1/reports/revenue` - Generate revenue report
- `GET /api/v1/reports/customer` - Generate customer report
- `GET /api/v1/reports/product` - Generate product report
- `GET /api/v1/reports/aging` - Generate aging report
- `GET /api/v1/reports/commission` - Generate commission report
- `GET /api/v1/reports/templates` - Get report templates
- `POST /api/v1/reports/custom` - Generate custom report

## 🔧 Configuration

### Environment Variables

```bash
# Environment
ENVIRONMENT=development

# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=erp_sales

# Service
SERVICE_PORT=8002
SERVICE_HOST=0.0.0.0

# External Services
AUTH_SERVICE_URL=http://localhost:8001
INVENTORY_SERVICE_URL=http://localhost:8003

# JWT Settings
SECRET_KEY=your-secret-key
ALGORITHM=HS256

# Redis
REDIS_URL=redis://localhost:6379

# Email Settings
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-password

# Business Settings
DEFAULT_TAX_RATE=0.15
DEFAULT_DISCOUNT_LIMIT=0.20

# Logging
LOG_LEVEL=INFO
```

## 📈 Business Logic

### Order Workflow
1. **Draft** → Customer creates order
2. **Confirmed** → Stock reserved, order confirmed
3. **Processing** → Order being prepared
4. **Shipped** → Order dispatched
5. **Delivered** → Order completed
6. **Cancelled** → Order cancelled, stock released

### Invoice Workflow
1. **Draft** → Invoice being prepared
2. **Sent** → Invoice sent to customer
3. **Paid** → Payment received
4. **Overdue** → Past due date
5. **Void** → Invoice cancelled

## 🔐 Security & Permissions

### Required Permissions
- `sales:read` - View sales data
- `sales:create` - Create sales records
- `sales:update` - Update sales records
- `sales:delete` - Delete sales records

### Role-Based Access
- **Sales Rep**: Can manage their own sales
- **Sales Manager**: Can manage team sales
- **Admin**: Full access to all sales data

## 🧪 Testing

### Run Tests
```bash
# Unit tests
pytest tests/unit/

# Integration tests
pytest tests/integration/

# All tests
pytest
```

### API Testing
Use the included Postman collection:
```bash
# Import collection
tests/Sales-Service.postman_collection.json
```

## 📊 Monitoring & Observability

### Health Checks
- `GET /health` - Service health status
- `GET /` - Service information

### Logging
Structured logging with correlation IDs for request tracing.

### Metrics
Key business metrics tracked:
- Total revenue
- Order count
- Customer acquisition
- Product performance
- Sales rep performance

## 🔄 Integration

### External Services
- **Auth Service**: User authentication and authorization
- **Inventory Service**: Stock checking and reservation
- **Notification Service**: Email and SMS notifications
- **Finance Service**: Payment processing integration

### Event-Driven Architecture
The service publishes events for:
- Order confirmations
- Payment receipts
- Inventory updates
- Customer updates

## 🚧 Future Enhancements

### Planned Features
- **Advanced Forecasting**: ML-based demand prediction
- **Dynamic Pricing**: AI-powered pricing optimization
- **Customer Segmentation**: Automated customer categorization
- **Subscription Management**: Recurring billing support
- **Multi-currency Support**: International sales
- **Advanced Analytics**: Predictive analytics dashboard

### Performance Optimizations
- Database query optimization
- Caching strategy improvements
- Background job processing
- Real-time notifications

## 📝 API Documentation

### Interactive Documentation
When running in development mode:
- **Swagger UI**: http://localhost:8002/docs
- **ReDoc**: http://localhost:8002/redoc

### Example Requests

#### Create Customer
```bash
curl -X POST "http://localhost:8002/api/v1/customers" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "company_name": "Acme Corp",
    "customer_type": "business"
  }'
```

#### Create Sales Order
```bash
curl -X POST "http://localhost:8002/api/v1/sales-orders" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "customer_id_here",
    "line_items": [
      {
        "product_id": "product_id_here",
        "quantity": 2,
        "unit_price": 100.00
      }
    ],
    "notes": "Rush order"
  }'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Join our Discord community
- Email: support@erp-system.com

---

**Note**: This is part of the larger ERP AI Microservices system. Make sure to have the Auth Service running for proper authentication.
