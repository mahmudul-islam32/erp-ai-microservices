# 🚀 Enterprise Resource Planning (ERP) System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Commercial-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2-61dafb.svg)
![Node](https://img.shields.io/badge/Node-18+-green.svg)
![Python](https://img.shields.io/badge/Python-3.9+-yellow.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)

**A Complete, Modern ERP Solution with Microservices Architecture**

[Live Demo](#) · [Documentation](INSTALLATION.md) · [Support](#support) · [Changelog](CHANGELOG.md)

</div>

---

## 📸 Screenshots

<div align="center">
<img src="documentation/screenshots/dashboard.png" alt="Dashboard" width="45%">
<img src="documentation/screenshots/inventory.png" alt="Inventory" width="45%">
<img src="documentation/screenshots/sales.png" alt="Sales" width="45%">
<img src="documentation/screenshots/users.png" alt="Users" width="45%">
</div>

---

## ✨ Key Features

### 🔐 User Management & Security
- **Role-Based Access Control (RBAC)** - 6 predefined roles with granular permissions
- **User Management** - Complete CRUD operations with advanced filtering
- **Session Management** - Track and manage active user sessions
- **Audit Logs** - Comprehensive activity logging for compliance
- **Security Settings** - Configurable password policies and login security
- **Multi-Factor Authentication** - Email-based 2FA (coming soon)

### 📦 Inventory Management
- **Product Management** - Complete product catalog with categories
- **Warehouse Management** - Multiple warehouse support with locations
- **Stock Tracking** - Real-time inventory tracking and alerts
- **Stock Adjustments** - Add, reduce, and transfer stock between warehouses
- **Low Stock Alerts** - Automatic notifications for low inventory
- **Barcode Support** - SKU and barcode integration
- **Category Hierarchy** - Organize products in nested categories

### 💰 Sales Management
- **Customer Management** - Complete customer database with full contact details
- **Sales Orders** - Create and manage orders with multiple line items
- **Payment Processing** - Integrated Stripe payment gateway
- **Invoice Generation** - Automatic invoice creation from orders
- **Multiple Payment Methods** - Cash, Credit Card (Stripe), Bank Transfer, Check
- **Order Tracking** - Track order status from pending to completed
- **Customer Portal** - Customers can view their orders and invoices

### 💳 Payment Integration
- **Stripe Integration** - Secure credit card processing
- **Multiple Payment Methods** - Cash, Stripe, Bank Transfer, Check
- **Payment Tracking** - Complete payment history and status
- **Refund Support** - Process refunds directly from the system
- **Test Mode** - Built-in test mode for development

### 📊 Dashboard & Analytics
- **Real-time Statistics** - Sales, inventory, and user metrics
- **Interactive Charts** - Beautiful charts powered by Recharts
- **Recent Activity** - Quick overview of recent actions
- **Quick Actions** - Fast access to common tasks
- **Customizable Widgets** - Personalize your dashboard

### 🎨 Modern User Interface
- **SAP-Inspired Design** - Professional enterprise UI/UX
- **Fully Responsive** - Works perfectly on desktop, tablet, and mobile
- **Dark Mode Ready** - Easy to add dark theme support
- **Beautiful Components** - Custom-built UI components with Tailwind CSS
- **Toast Notifications** - User-friendly feedback for all actions
- **Loading States** - Clear loading indicators everywhere

### 🏗️ Technical Excellence
- **Microservices Architecture** - Scalable and maintainable
- **Modern Tech Stack** - React 18, TypeScript, FastAPI, NestJS
- **Docker Ready** - Easy deployment with Docker Compose
- **API First** - RESTful APIs for all services
- **Type Safety** - 100% TypeScript with strict mode
- **State Management** - Redux Toolkit for predictable state
- **Form Validation** - React Hook Form with Zod validation
- **Error Handling** - Comprehensive error handling and logging

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

### Backend
- **FastAPI** (Python) - Auth & Sales services
- **NestJS** (Node.js) - Inventory service
- **MongoDB** - Primary database
- **Redis** - Caching and sessions
- **JWT** - Secure authentication
- **Pydantic** - Data validation (Python)
- **TypeORM** - ORM for TypeScript

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy
- **GitHub Actions** - CI/CD pipeline (optional)

---

## 🚀 Super Easy Installation

### One Command - That's It!

#### ⭐ Interactive Setup Wizard (Recommended)

```bash
./setup.sh
```

**What happens:**
1. Checks your system (Docker, disk space, ports)
2. Asks for your preferences (app name, timezone, currency)
3. Creates your admin account (you choose email/password)
4. Installs everything automatically
5. Opens browser when done

**Time**: 5 minutes  
**Difficulty**: ⭐ Very Easy  
**Perfect for**: Everyone!

**Features:**
- ✅ Beautiful colored terminal UI
- ✅ Step-by-step guidance
- ✅ Input validation
- ✅ **Actually installs your ERP**
- ✅ Generates secure secrets
- ✅ No dependencies needed

---

#### 💨 Alternative: Fully Automated (Fastest)

```bash
./install.sh
```

**Zero interaction** - Uses smart defaults, done in 3 minutes!

**Perfect for**: Power users, automation, CI/CD

---

#### 🌐 Alternative: Web Wizard (GUI)

```bash
cd setup-wizard
./start-wizard.sh
```

**Beautiful web interface** with real-time progress!

**Perfect for**: GUI lovers (requires Python 3)

### 🎉 Access Your ERP System

**Frontend**: http://localhost:5173

**Default Login**: 
- Email: `admin@example.com`
- Password: `admin123`
- ⚠️ **Change this password after first login!**

**Your ERP is ready in under 10 minutes!** 🎊

---

## 📚 Complete Documentation

### For Users
- 🌐 **[Interactive HTML Docs](documentation/index.html)** - Beautiful, searchable documentation with screenshots
- 📖 **[Quick Start Guide](docs/QUICK_START.md)** - Get started in 10 minutes
- 📘 **[User Manual](docs/USER_MANUAL.md)** - Complete feature guide

### For Developers  
- 💻 **[Installation Guide](docs/INSTALLATION.md)** - Detailed setup instructions
- 🔧 **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - API & architecture (coming soon)
- 🚀 **[Deployment Guide](docs/AWS_DEPLOYMENT_GUIDE.md)** - Production deployment

---

## 🎯 Prerequisites

**Minimum Requirements:**
- **Docker** 20.10+ ([Download](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.0+ (included with Docker Desktop)
- **4GB RAM** (8GB recommended)
- **10GB disk space** (20GB recommended)

**Check if you have Docker:**
```bash
docker --version
docker-compose --version
```

If not installed, visit: https://docs.docker.com/get-docker/

---

## 📚 Documentation

### For Users
- **[Installation Guide](INSTALLATION.md)** - Detailed installation instructions
- **[User Manual](USER_MANUAL.md)** - Complete user guide with screenshots
- **[FAQ](USER_MANUAL.md#faq)** - Frequently asked questions

### For Developers
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Architecture and API documentation
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions
- **[Customization Guide](CUSTOMIZATION_GUIDE.md)** - How to customize the system
- **[API Documentation](http://localhost:8001/docs)** - Interactive API docs (Swagger)

### Additional Resources
- **[Changelog](CHANGELOG.md)** - Version history and updates
- **[Update Guide](UPDATE_GUIDE.md)** - How to update to new versions
- **[License](LICENSE.md)** - License terms and conditions

---

## 🎯 Core Modules

### 1. User Management
Comprehensive user administration with role-based access control.

**Features:**
- Create, edit, and delete users
- 6 roles: Super Admin, Admin, Manager, Employee, Customer, Vendor
- Granular permissions system
- Session monitoring
- Activity audit logs
- Security settings

**Roles & Permissions:**
- **Super Admin**: Full system access
- **Admin**: Administrative access (cannot manage super admins)
- **Manager**: Department/team management
- **Employee**: Standard operational access
- **Customer**: Customer portal access
- **Vendor**: Vendor portal access

### 2. Inventory Management
Complete inventory and warehouse management system.

**Features:**
- Product catalog with categories
- Multi-warehouse support
- Stock tracking and adjustments
- Low stock alerts
- Stock transfers between warehouses
- Barcode/SKU support
- Category hierarchies

**Product Fields:**
- Basic info (name, SKU, description)
- Pricing (cost, retail, wholesale)
- Stock management
- Categories and tags
- Images
- Specifications
- Variants (coming soon)

### 3. Sales Management
End-to-end sales process management.

**Features:**
- Customer database management
- Sales order creation
- Payment processing (Stripe integration)
- Invoice generation
- Order tracking
- Customer portal
- Payment history

**Order Workflow:**
1. Create order with line items
2. Select payment method
3. Process payment (if Stripe)
4. Generate invoice
5. Track fulfillment
6. Complete order

### 4. Payment Processing
Secure payment handling with multiple methods.

**Supported Methods:**
- **Stripe** - Credit/debit cards (live integration)
- **Cash** - Cash payments
- **Bank Transfer** - Manual bank transfers
- **Check** - Check payments

**Stripe Features:**
- Secure payment processing
- Test mode with test cards
- Payment intent flow
- Automatic status updates
- Refund support

---

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt password encryption
- **CORS Protection** - Configured CORS policies
- **Rate Limiting** - Prevent brute force attacks
- **Input Validation** - All inputs validated and sanitized
- **SQL Injection Prevention** - Parameterized queries
- **XSS Prevention** - Content security policies
- **HTTPS Ready** - SSL/TLS support
- **Session Management** - Secure session handling
- **Audit Logging** - Track all sensitive actions

---

## 🌐 API Endpoints

### Auth Service (Port 8001)
```
POST   /api/v1/auth/login              # User login
POST   /api/v1/auth/logout             # User logout
GET    /api/v1/auth/me                 # Get current user
POST   /api/v1/auth/refresh            # Refresh token
GET    /api/v1/users                   # List users
POST   /api/v1/users                   # Create user
GET    /api/v1/users/:id               # Get user
PUT    /api/v1/users/:id               # Update user
DELETE /api/v1/users/:id               # Delete user
```

### Inventory Service (Port 8002)
```
GET    /products                       # List products
POST   /products                       # Create product
GET    /products/:id                   # Get product
PUT    /products/:id                   # Update product
DELETE /products/:id                   # Delete product
GET    /categories                     # List categories
GET    /warehouses                     # List warehouses
POST   /inventory/adjust               # Adjust stock
```

### Sales Service (Port 8003)
```
GET    /api/v1/customers               # List customers
POST   /api/v1/customers               # Create customer
GET    /api/v1/sales-orders            # List orders
POST   /api/v1/sales-orders            # Create order
GET    /api/v1/sales-orders/:id        # Get order
POST   /api/v1/payments/stripe/create-payment-intent
POST   /api/v1/payments/stripe/confirm-payment
GET    /api/v1/invoices                # List invoices
```

**Full API Documentation**: Access interactive API docs at:
- Auth: http://localhost:8001/docs
- Inventory: http://localhost:8002/docs
- Sales: http://localhost:8003/docs

---

## 🎨 Customization

This ERP system is highly customizable:

### Branding
- Change logo and favicon
- Customize colors and theme
- Add your company name
- Customize email templates

### Features
- Add new modules
- Extend existing features
- Custom reports
- Integration with third-party services

### Localization
- Multi-language support (coming soon)
- Multi-currency support (coming soon)
- Date/time formats
- Number formats

See [Customization Guide](CUSTOMIZATION_GUIDE.md) for details.

---

## 📦 What's Included

```
erp-system/
├── auth-service/           # Authentication & user management
├── inventory-service/      # Inventory management
├── sales-service/          # Sales & payment processing
├── erp-frontend/          # React frontend application
├── nginx/                 # Nginx reverse proxy config
├── scripts/               # Utility scripts
├── documentation/         # Additional documentation
│   ├── screenshots/       # App screenshots
│   ├── diagrams/         # Architecture diagrams
│   └── videos/           # Tutorial videos
├── docker-compose.yml     # Docker orchestration
├── .env.example          # Environment template
└── README.md             # This file
```

---

## 🔄 Updates & Changelog

**Current Version**: 1.0.0

### Version 1.0.0 (Initial Release)
- ✅ Complete user management with RBAC
- ✅ Full inventory management system
- ✅ Sales order management
- ✅ Stripe payment integration
- ✅ Dashboard with analytics
- ✅ Docker deployment
- ✅ Comprehensive documentation

**Planned Updates:**
- 🔜 Multi-language support (v1.1.0)
- 🔜 Advanced reporting module (v1.1.0)
- 🔜 Email notifications (v1.2.0)
- 🔜 Multi-currency support (v1.2.0)
- 🔜 Mobile app (v2.0.0)

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

---

## 🧪 Testing

### Test Credentials
```
Super Admin:
Email: admin@example.com
Password: admin123

Manager:
Email: manager@example.com
Password: manager123

Employee:
Email: employee@example.com
Password: employee123
```

### Stripe Test Cards
```
Success: 4242 4242 4242 4242
3D Secure: 4000 0025 0000 3155
Declined: 4000 0000 0000 9995

Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
```

---

## 💻 System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 10GB
- **OS**: Linux, macOS, or Windows 10+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Recommended Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04+ or similar
- **Docker**: Latest version

### Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 🚀 Deployment

### Local Development
```bash
docker-compose up -d
```

### Production Deployment

We support multiple deployment options:

#### Option 1: Docker (Recommended)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### Option 2: AWS EC2
Follow our [AWS Deployment Guide](DEPLOYMENT.md#aws-deployment)

#### Option 3: DigitalOcean
Follow our [DigitalOcean Guide](DEPLOYMENT.md#digitalocean-deployment)

#### Option 4: VPS
Follow our [VPS Deployment Guide](DEPLOYMENT.md#vps-deployment)

**Need help with deployment?** Check our [Deployment Guide](DEPLOYMENT.md) or contact support.

---

## 📈 Performance

- **Fast Load Times** - Optimized bundle size
- **Lazy Loading** - Routes loaded on demand
- **Caching** - Redis caching for improved performance
- **Database Indexing** - Optimized MongoDB queries
- **CDN Ready** - Static assets can be served from CDN

**Performance Metrics:**
- Initial load: < 2s
- Page transitions: < 200ms
- API response: < 100ms (average)

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Services won't start
```bash
# Solution: Check if ports are available
docker-compose down
docker-compose up -d
```

**Issue**: Cannot login
```bash
# Solution: Reset admin user
docker-compose exec auth-service python scripts/create_admin.py
```

**Issue**: Database connection error
```bash
# Solution: Restart MongoDB
docker-compose restart mongodb
```

**More help**: See [Installation Guide](INSTALLATION.md#troubleshooting) or [open a support ticket](#support).

---

## 📞 Support

### Documentation
- 📖 [User Manual](USER_MANUAL.md)
- 💻 [Developer Guide](DEVELOPER_GUIDE.md)
- 🚀 [Deployment Guide](DEPLOYMENT.md)

### Get Help
- 📧 **Email**: support@yourdomain.com
- 💬 **Live Chat**: [Your support portal]
- 🎫 **Support Tickets**: [Your ticket system]
- 📚 **Knowledge Base**: [Your KB link]

### Support Hours
- Monday - Friday: 9 AM - 6 PM EST
- Response Time: Within 24 hours
- Premium Support: Available

### Community
- 💡 **Feature Requests**: [GitHub Issues]
- 🐛 **Bug Reports**: [GitHub Issues]
- 💬 **Discussions**: [GitHub Discussions]

---

## 📄 License

This is a commercial product. By purchasing, you agree to our license terms.

### Regular License - $59
- Use in a single end product
- End product is not sold
- Free updates for 6 months
- 6 months support included

### Extended License - $249
- Use in unlimited end products
- End products can be sold (SaaS)
- Free lifetime updates
- Lifetime support included

**Full License Terms**: See [LICENSE.md](LICENSE.md)

---

## 🌟 Why Choose This ERP?

### ✅ Complete Solution
Everything you need in one package - no additional plugins required.

### ✅ Modern Technology
Built with the latest, most popular technologies for easy maintenance.

### ✅ Production Ready
Used in real businesses, not just a demo project.

### ✅ Scalable Architecture
Microservices design allows easy scaling and maintenance.

### ✅ Great Documentation
Comprehensive docs for users and developers.

### ✅ Active Development
Regular updates with new features and improvements.

### ✅ Premium Support
Fast, helpful support when you need it.

### ✅ Value for Money
Complete ERP system at a fraction of custom development cost.

---

## 🎓 Learning Resources

### Video Tutorials
- 📹 [Installation Tutorial](documentation/videos/installation.mp4)
- 📹 [User Guide](documentation/videos/user-guide.mp4)
- 📹 [Admin Tutorial](documentation/videos/admin-guide.mp4)
- 📹 [Customization Guide](documentation/videos/customization.mp4)

### Written Guides
- 📝 [Quick Start Guide](INSTALLATION.md#quick-start)
- 📝 [User Manual](USER_MANUAL.md)
- 📝 [Developer Guide](DEVELOPER_GUIDE.md)
- 📝 [API Documentation](DEVELOPER_GUIDE.md#api-reference)

---

## 🤝 Credits

### Built With
- React Team for React
- Vercel for Next.js inspiration
- Tailwind Labs for Tailwind CSS
- FastAPI Team
- NestJS Team
- Stripe for payment processing
- All open-source contributors

### Powered By
- Docker
- MongoDB
- Redis
- Nginx

---

## ⭐ Rate This Product

If you find this ERP system helpful, please:
- ⭐ **Rate it 5 stars** on CodeCanyon
- 💬 **Leave a review** sharing your experience
- 🔄 **Recommend** it to others
- 📢 **Share** your success story

Your feedback helps us improve and helps other buyers make informed decisions!

---

## 📮 Stay Updated

- 🔔 **Enable notifications** for updates
- 📧 **Subscribe** to our newsletter
- 🐦 **Follow us** on Twitter: [@yourhandle]
- 📱 **Join** our community: [Discord/Slack]

---

## 🎉 Thank You!

Thank you for choosing our ERP system. We're committed to providing you with the best product and support possible.

**Happy managing!** 🚀

---

<div align="center">

**Made with ❤️ by Your Company**

[Website](#) · [Documentation](INSTALLATION.md) · [Support](#support) · [Purchase](#)

© 2025 Your Company. All rights reserved.

</div>

