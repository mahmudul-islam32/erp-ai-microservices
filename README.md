# 🏢 Enterprise Resource Planning (ERP) System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Commercial-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2-61dafb.svg)
![Python](https://img.shields.io/badge/Python-3.9+-yellow.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)

**A Complete, Modern ERP Solution with Microservices Architecture**

[Documentation](#-documentation) · [Installation](#-installation) · [Features](#-key-features) · [Support](#-support)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Support](#-support)
- [License](#-license)

---

## 🎯 Overview

This is a comprehensive Enterprise Resource Planning (ERP) system built with a modern microservices architecture. It provides complete business management capabilities including user management, inventory control, sales processing, financial accounting, human resources, and real-time communication.

### What Makes This ERP Special?

- ✅ **Complete Solution** - All business modules in one integrated system
- ✅ **Microservices Architecture** - Scalable, maintainable, and fault-tolerant
- ✅ **Modern Tech Stack** - Built with latest technologies (React 18, FastAPI, NestJS)
- ✅ **Production Ready** - Battle-tested in real business environments
- ✅ **Docker Native** - Easy deployment with Docker Compose
- ✅ **Type Safe** - Full TypeScript coverage for reliability
- ✅ **Real-time Updates** - WebSocket support for live notifications and chat
- ✅ **Customizable** - Appearance settings, themes, and extensible modules

---

## ✨ Key Features

### 🔐 Authentication & User Management
- **Role-Based Access Control (RBAC)** - 6 predefined roles with granular permissions
- **User Management** - Complete CRUD operations with advanced filtering
- **Session Management** - Track and manage active user sessions
- **Audit Logs** - Comprehensive activity logging for compliance
- **Security Settings** - Configurable password policies and login security
- **Multi-Factor Authentication** - Email-based 2FA support
- **Access Control** - Fine-grained permission system

### 📦 Inventory Management
- **Product Management** - Complete product catalog with categories and variants
- **Warehouse Management** - Multiple warehouse support with locations
- **Stock Tracking** - Real-time inventory tracking and alerts
- **Stock Adjustments** - Add, reduce, and transfer stock between warehouses
- **Low Stock Alerts** - Automatic notifications for low inventory
- **Barcode Support** - SKU and barcode integration
- **Category Hierarchy** - Organize products in nested categories
- **Serial/Batch Tracking** - Track individual items and batches

### 💰 Sales Management
- **Customer Management** - Complete customer database with full contact details
- **Sales Orders** - Create and manage orders with multiple line items
- **Quotes & Invoices** - Generate quotes and convert to invoices
- **Payment Processing** - Integrated Stripe payment gateway
- **Multiple Payment Methods** - Cash, Credit Card (Stripe), Bank Transfer, Check
- **Order Tracking** - Track order status from pending to completed
- **Customer Portal** - Customers can view their orders and invoices
- **Payment History** - Complete payment tracking and history

### 💳 Financial Management & Accounting
- **Chart of Accounts** - Hierarchical account management with account types
- **General Ledger** - Complete double-entry bookkeeping system
- **Journal Entries** - Full lifecycle with posting and reversals
- **Accounts Payable** - Vendor invoice and payment management
- **Accounts Receivable** - Customer invoice and payment tracking
- **Bank Management** - Bank account and transaction management
- **Financial Reporting** - P&L, Balance Sheet, Trial Balance
- **Multi-Currency Support** - Multiple currencies with exchange rates
- **Aging Reports** - AP/AR aging analysis with multiple buckets
- **Automated Entries** - Auto-posting from invoices and payments

### 👥 Human Resources Management (HRM)
- **Employee Management** - Complete employee database and profiles
- **Payroll Processing** - Automated payroll calculations
- **Attendance Tracking** - Time tracking and attendance management
- **Leave Management** - Leave requests, approvals, and tracking
- **Performance Reviews** - Employee performance evaluation system
- **Recruitment** - Job postings, applications, and interview management
- **Training & Development** - Training programs and certification tracking
- **Benefits Management** - Employee benefits administration
- **Analytics** - HR metrics and reporting

### 💬 Communication & Collaboration
- **Real-time Chat** - Internal messaging between users
- **Notifications** - Real-time system notifications via WebSocket
- **Message History** - Complete conversation history
- **Unread Tracking** - Unread message and notification counts
- **Online Status** - User presence indicators
- **Notification Preferences** - Customizable notification settings

### 📊 Dashboard & Analytics
- **Real-time Statistics** - Sales, inventory, and user metrics
- **Interactive Charts** - Beautiful charts powered by Recharts
- **Recent Activity** - Quick overview of recent actions
- **Quick Actions** - Fast access to common tasks
- **Customizable Widgets** - Personalize your dashboard
- **Module-specific Dashboards** - Dedicated dashboards for each module

### 🎨 Appearance & Customization
- **Font Customization** - Choose from 10+ font families
- **Color Themes** - Customize primary, secondary, accent, and status colors
- **UI Settings** - Adjust border radius, spacing, and more
- **Custom CSS** - Advanced styling with custom CSS rules
- **Live Preview** - See changes in real-time
- **Persistent Settings** - Settings saved and loaded automatically

### ⚙️ System Settings
- **Company Information** - Manage company details and address
- **Email Configuration** - SMTP settings for email notifications
- **Integration Settings** - Third-party service integrations (Stripe, etc.)
- **Notification Preferences** - Configure notification types and channels
- **General Settings** - Timezone, date format, language, and more
- **Service-specific Settings** - Dedicated settings for each module

---

## 🏗️ Architecture

### Microservices Architecture

This ERP system follows a microservices architecture pattern, where each business domain is implemented as an independent service:

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                       │
│                    Port: 8080 (Production)                 │
│                      Port: 5173 (Dev)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│ Auth Service │ │ Inventory   │ │ Sales      │
│   Port: 8001 │ │   Port: 8002│ │ Port: 8003 │
└───────┬──────┘ └──────┬──────┘ └─────┬──────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│ Notification │ │ Chat Service │ │ Finance    │
│   Port: 8004│ │   Port: 8005 │ │ Port: 8006 │
└───────┬──────┘ └──────┬──────┘ └─────┬──────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│ HRM Service  │ │   MongoDB   │ │   Redis    │
│   Port: 8007 │ │  Port: 27017│ │ Port: 6379 │
└──────────────┘ └─────────────┘ └────────────┘
```

### Service Overview

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| **Frontend** | 8080/5173 | React + TypeScript | User interface |
| **Auth Service** | 8001 | FastAPI (Python) | Authentication & user management |
| **Inventory Service** | 8002 | NestJS (Node.js) | Product & warehouse management |
| **Sales Service** | 8003 | FastAPI (Python) | Sales orders & payments |
| **Notification Service** | 8004 | FastAPI (Python) | Real-time notifications |
| **Chat Service** | 8005 | FastAPI (Python) | Internal messaging |
| **Finance Service** | 8006 | FastAPI (Python) | Accounting & financial management |
| **HRM Service** | 8007 | FastAPI (Python) | Human resources management |
| **MongoDB** | 27017 | MongoDB | Primary database |
| **Redis** | 6379 | Redis | Caching & sessions |

### Data Flow

1. **Frontend** makes API requests to backend services
2. **Auth Service** validates JWT tokens for all requests
3. **Services** communicate with each other via HTTP
4. **MongoDB** stores persistent data for each service
5. **Redis** handles caching and session management
6. **WebSocket** connections provide real-time updates

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Redux Toolkit** - State management
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Performant form handling
- **Zod** - TypeScript-first schema validation
- **Axios** - HTTP client with interceptors
- **Recharts** - Composable charting library
- **React Router v6** - Client-side routing
- **Stripe Elements** - Secure payment UI
- **Vite** - Fast build tool and dev server

### Backend Services
- **FastAPI** (Python) - Auth, Sales, Notification, Chat, Finance, HRM services
- **NestJS** (Node.js) - Inventory service
- **Pydantic** - Data validation (Python)
- **MongoDB** - Primary database
- **Redis** - Caching and sessions
- **JWT** - Secure authentication
- **WebSocket** - Real-time communication
- **Stripe API** - Payment processing

### DevOps & Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy (production)
- **GitHub Actions** - CI/CD pipeline (optional)

---

## 🚀 Installation

### Prerequisites

Before installing, ensure you have the following:

- **Docker** 20.10+ ([Download](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.0+ (included with Docker Desktop)
- **4GB RAM** minimum (8GB recommended)
- **10GB disk space** (20GB recommended)
- **Internet connection** for downloading Docker images

**Verify Docker Installation:**
```bash
docker --version
docker-compose --version
```

If Docker is not installed, visit: https://docs.docker.com/get-docker/

### Quick Installation (Recommended)

#### Option 1: Interactive Setup Wizard

The easiest way to install the ERP system:

```bash
./setup.sh
```

**What it does:**
1. ✅ Checks your system (Docker, disk space, ports)
2. ✅ Asks for your preferences (app name, timezone, currency)
3. ✅ Creates your admin account (you choose email/password)
4. ✅ Installs everything automatically
5. ✅ Opens browser when done

**Time**: ~5 minutes  
**Difficulty**: ⭐ Very Easy

#### Option 2: Automated Installation

For quick installation with default settings:

```bash
./install.sh
```

**Time**: ~3 minutes  
**Perfect for**: Power users, automation, CI/CD

#### Option 3: Manual Installation

If you prefer manual control:

```bash
# 1. Clone or download the repository
cd erp-ai-microservices

# 2. Set environment variables (optional)
cp .env.example .env
# Edit .env with your settings

# 3. Start all services
docker-compose up -d

# 4. Wait for services to be ready (about 2-3 minutes)
docker-compose ps

# 5. Access the application
# Frontend: http://localhost:8080
# Default login: admin@example.com / admin123
```

### Installation Steps Explained

#### Step 1: System Check

The setup script checks:
- Docker and Docker Compose are installed
- Required ports are available (8001-8007, 8080, 27017, 6379)
- Sufficient disk space (10GB minimum)
- Internet connectivity

#### Step 2: Configuration

You'll be asked for:
- **Company Name**: Your business name
- **Admin Email**: Email for the super admin account
- **Admin Password**: Password for the super admin account
- **Timezone**: Your timezone (e.g., America/New_York)
- **Currency**: Default currency (e.g., USD)

#### Step 3: Service Startup

The script will:
1. Build Docker images for all services
2. Start MongoDB and Redis
3. Start all backend services
4. Start the frontend
5. Initialize the database with default data

#### Step 4: Verification

The script verifies:
- All services are running
- Health checks pass
- Database is initialized
- Frontend is accessible

### Post-Installation

After installation:

1. **Access the Application**
   - Frontend: http://localhost:8080
   - Default credentials: `admin@example.com` / `admin123`
   - ⚠️ **Change the default password immediately!**

2. **Verify Services**
   ```bash
   docker-compose ps
   ```
   All services should show "Up" status

3. **Check Logs** (if needed)
   ```bash
   docker-compose logs -f [service-name]
   ```

4. **Access API Documentation**
   - Auth Service: http://localhost:8001/docs
   - Inventory Service: http://localhost:8002/docs
   - Sales Service: http://localhost:8003/docs
   - Finance Service: http://localhost:8006/docs
   - HRM Service: http://localhost:8007/docs

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# JWT Configuration
JWT_SECRET_KEY=REDACTED

# MongoDB Configuration
MONGO_USERNAME=admin
MONGO_PASSWORD=password123

# Stripe Configuration (for payments)
STRIPE_SECRET_KEY=REDACTED
STRIPE_PUBLISHABLE_KEY=REDACTED

# Application Settings
APP_NAME=ERP System
DEFAULT_TIMEZONE=UTC
DEFAULT_CURRENCY=USD
```

### Service-Specific Configuration

Each service can be configured via environment variables in `docker-compose.yml`:

**Auth Service:**
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration (default: 30)
- `REFRESH_TOKEN_EXPIRE_DAYS`: Refresh token expiration (default: 7)

**Inventory Service:**
- `LOW_STOCK_THRESHOLD`: Low stock alert threshold (default: 10)

**Sales Service:**
- `DEFAULT_TAX_RATE`: Default tax rate (default: 0.08)

### Database Configuration

MongoDB is configured with:
- **Username**: admin (default)
- **Password**: password123 (default - change in production!)
- **Port**: 27017
- **Databases**: Separate database per service (erp_auth, erp_inventory, etc.)

**⚠️ Important**: Change default MongoDB credentials in production!

---

## 📖 Usage

### First Login

1. Navigate to http://localhost:8080
2. Login with default credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
3. **Immediately change your password** in Profile Settings

### Creating Your First Order

1. **Add Products** (Inventory → Products)
   - Create products with prices and stock
   
2. **Add Customers** (Sales → Customers)
   - Create customer records
   
3. **Create Sales Order** (Sales → Orders)
   - Select customer
   - Add products
   - Process payment
   - Generate invoice

### Setting Up Company Information

1. Go to **Settings → Company**
2. Enter your company details
3. Add company address
4. Save settings

### Configuring Email

1. Go to **Settings → Email**
2. Enter SMTP server details
3. Test email connection
4. Save settings

### Customizing Appearance

1. Go to **Settings → Appearance**
2. Choose font family
3. Customize colors
4. Adjust UI settings
5. Save (changes apply immediately)

### Managing Users

1. Go to **Users & Auth → Users**
2. Click "Create User"
3. Fill in user details
4. Assign role and permissions
5. Save

---

## 📡 API Documentation

### Base URLs

- **Auth Service**: http://localhost:8001
- **Inventory Service**: http://localhost:8002
- **Sales Service**: http://localhost:8003
- **Notification Service**: http://localhost:8004
- **Chat Service**: http://localhost:8005
- **Finance Service**: http://localhost:8006
- **HRM Service**: http://localhost:8007

### Interactive API Docs

Each service provides interactive Swagger documentation:

- Auth: http://localhost:8001/docs
- Inventory: http://localhost:8002/docs
- Sales: http://localhost:8003/docs
- Finance: http://localhost:8006/docs
- HRM: http://localhost:8007/docs

### Authentication

All API requests (except login) require a JWT token:

```bash
Authorization: Bearer <your-access-token>
```

### Example API Calls

**Login:**
```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

**Get Users:**
```bash
curl -X GET http://localhost:8001/api/v1/users \
  -H "Authorization: Bearer <token>"
```

**Create Product:**
```bash
curl -X POST http://localhost:8002/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Product Name", "price": 99.99, "stock": 100}'
```

---

## 💻 Development

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd erp-ai-microservices
   ```

2. **Start development environment**
   ```bash
   docker-compose --profile development up -d
   ```
   This starts services with hot-reload enabled

3. **Frontend Development**
   - Frontend runs on http://localhost:5173
   - Hot-reload enabled
   - Changes reflect immediately

4. **Backend Development**
   - Services have volume mounts for live code updates
   - Restart service to apply changes:
     ```bash
     docker-compose restart [service-name]
     ```

### Project Structure

```
erp-ai-microservices/
├── auth-service/          # Authentication & user management
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── models/       # Data models
│   │   ├── services/     # Business logic
│   │   └── database/     # Database connection
│   ├── main.py           # FastAPI application
│   └── requirements.txt  # Python dependencies
│
├── inventory-service/     # Inventory management
│   ├── src/
│   │   ├── products/     # Product module
│   │   ├── categories/   # Category module
│   │   └── warehouses/   # Warehouse module
│   └── package.json      # Node dependencies
│
├── sales-service/        # Sales & payments
├── finance-service/      # Financial management
├── hrm-service/          # Human resources
├── notification-service/ # Notifications
├── chat-service/         # Internal messaging
│
├── erp-frontend/         # React frontend
│   ├── src/
│   │   ├── features/     # Feature modules
│   │   ├── shared/       # Shared components
│   │   └── app/          # App configuration
│   └── package.json
│
├── scripts/              # Utility scripts
├── docs/                 # Documentation
├── docker-compose.yml    # Docker configuration
└── README.md            # This file
```

### Running Tests

```bash
# Run tests for a specific service
docker-compose exec auth-service pytest
docker-compose exec inventory-service npm test
```

### Code Style

- **Python**: Follow PEP 8, use Black formatter
- **TypeScript**: ESLint + Prettier
- **React**: Follow React best practices

---

## 🚀 Deployment

### Production Deployment

#### Option 1: Docker Compose (Recommended)

1. **Use production compose file**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Set production environment variables**
   - Update `.env` with production values
   - Change default passwords
   - Set secure JWT secret
   - Configure SMTP for emails

3. **Enable HTTPS** (recommended)
   - Use Nginx reverse proxy with SSL
   - Obtain SSL certificate (Let's Encrypt)

#### Option 2: Cloud Deployment

**AWS EC2:**
1. Launch EC2 instance
2. Install Docker
3. Clone repository
4. Run `docker-compose up -d`

**DigitalOcean:**
1. Create Droplet
2. Follow same steps as AWS

**Docker Swarm / Kubernetes:**
- See deployment guides in `docs/` directory

### Backup & Recovery

**Database Backup:**
```bash
docker-compose exec mongodb mongodump --out /backup
```

**Restore:**
```bash
docker-compose exec mongodb mongorestore /backup
```

### Monitoring

- Check service health: `docker-compose ps`
- View logs: `docker-compose logs -f [service]`
- Monitor resources: `docker stats`

---

## 🐛 Troubleshooting

### Common Issues

#### Services Won't Start

**Problem**: Docker containers fail to start

**Solution**:
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose down
docker-compose up -d

# Check port conflicts
netstat -tulpn | grep -E '8001|8002|8003|8080'
```

#### Cannot Login

**Problem**: Login fails with default credentials

**Solution**:
```bash
# Reset admin user
docker-compose exec auth-service python scripts/create_admin.py

# Or create new admin
docker-compose exec auth-service python -c "
from app.services.user_service import user_service
import asyncio
asyncio.run(user_service.create_user({
    'email': 'admin@example.com',
    'password': 'newpassword123',
    'is_superuser': True
}))
"
```

#### Database Connection Error

**Problem**: Services can't connect to MongoDB

**Solution**:
```bash
# Restart MongoDB
docker-compose restart mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Verify MongoDB is running
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

#### Frontend Not Loading

**Problem**: Frontend shows blank page or errors

**Solution**:
```bash
# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend

# Check browser console for errors
# Verify API endpoints are accessible
```

#### Port Already in Use

**Problem**: Port conflict error

**Solution**:
```bash
# Find process using port
lsof -i :8001  # or any port

# Kill process or change port in docker-compose.yml
```

### Getting Help

1. **Check Logs**: `docker-compose logs -f [service-name]`
2. **Service Health**: `docker-compose ps`
3. **Documentation**: See `docs/` directory
4. **Support**: Contact support team

---

## 📞 Support

### Documentation

- 📖 **User Manual**: `docs/USER_MANUAL.md`
- 💻 **Installation Guide**: `docs/INSTALLATION.md`
- 🚀 **Deployment Guide**: `docs/DEPLOYMENT.md`
- 📡 **API Documentation**: http://localhost:8001/docs

### Getting Help

- 📧 **Email**: support@yourdomain.com
- 💬 **Issues**: GitHub Issues
- 📚 **Documentation**: Check `docs/` directory
- 🎫 **Support Tickets**: Your support portal

### Community

- 💡 **Feature Requests**: GitHub Issues
- 🐛 **Bug Reports**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions

---

## 📄 License

This is a commercial product. See [LICENSE.md](LICENSE.md) for full license terms.

### License Types

- **Regular License**: Single end product, non-commercial
- **Extended License**: Multiple end products, commercial use allowed

---

## 🎉 Getting Started Checklist

- [ ] Install Docker and Docker Compose
- [ ] Run `./setup.sh` or `./install.sh`
- [ ] Access http://localhost:8080
- [ ] Login with default credentials
- [ ] Change admin password
- [ ] Configure company information
- [ ] Set up email settings
- [ ] Add your first product
- [ ] Create a customer
- [ ] Make your first sale!

---

## 🙏 Acknowledgments

Built with:
- React Team for React
- FastAPI Team for FastAPI
- NestJS Team for NestJS
- Tailwind Labs for Tailwind CSS
- Stripe for payment processing
- All open-source contributors

---

<div align="center">

**Made with ❤️ for modern businesses**

[Documentation](#-documentation) · [Installation](#-installation) · [Support](#-support)

© 2025 ERP System. All rights reserved.

</div>
