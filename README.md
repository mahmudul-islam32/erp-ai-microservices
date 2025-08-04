# ERP AI Microservices

A modern ERP system buil## ⚙️ Tech Stack

### **Frontend**
- **Web**: React 18 + TypeScript + Vite + Mantine UI
- **Mobile**: React Native + TypeScript
- **State Management**: React Context + Custom Hooks

### **Backend Microservices**
- **API Gateway**: Node.js + Apollo GraphQL Federation
- **Auth Service**: FastAPI + Python (JWT + Cookie-based auth)
- **Business Services**: Node.js + Express.js / FastAPI + Python
- **Database**: MongoDB + Redis (caching)

### **AI/ML Stack**
- **Framework**: Python + FastAPI
- **Libraries**: Scikit-learn, TensorFlow, PyTorch, Prophet
- **Features**: Demand forecasting, Customer segmentation, Fraud detection

### **DevOps & Infrastructure**
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes + Helm
- **Infrastructure**: Terraform
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Message Queue**: Redis/RabbitMQicroservices architecture, combining FastAPI, Node.js (Express), React, GraphQL, and MongoDB. Includes built-in AI capabilities for forecasting, segmentation, fraud detection, and more.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/mahmudul-islam32/erp-ai-microservices.git
cd erp-ai-microservices

# Start Development Environment (with hot-reload)
./start-dev.sh

# Or start Production Environment
./start-prod.sh

# Test the API
cd tests && ./test-auth.sh
```

### 🌐 Available URLs (Development)
- **Frontend**: http://localhost:5173 (with hot-reload)
- **Auth API**: http://localhost:8001
- **MongoDB Express**: http://localhost:8081 (admin/admin123)

## 🌐 Features

### ✅ Implemented: Auth Service
- 🔐 **JWT Authentication** – Secure HTTP-only cookie-based auth with refresh tokens
- 👤 **User Management** – CRUD operations with role-based access
- 🛡️ **Authorization** – Granular permission system
- 🔄 **Auto-Refresh** – Background token refresh every 10 minutes
- 🔒 **Security Features** – Account locking, password hashing, CORS protection
- 📊 **Role Hierarchy** – Super Admin → Admin → Manager → Employee → Customer/Vendor
- 🐳 **Docker Ready** – Fully containerized with MongoDB

### ✅ Implemented: Inventory Service
- � **Product Management** – Complete CRUD with SKU, pricing, categories
- 🏭 **Supplier Management** – Supplier information and relationships
- 🏢 **Warehouse Management** – Multi-location inventory tracking
- � **Inventory Tracking** – Real-time stock levels and transactions
- 🔄 **Stock Operations** – Add, subtract, adjust, transfer between locations
- 🚨 **Low Stock Alerts** – Automatic reorder point monitoring
- 📝 **Transaction History** – Complete audit trail of all movements
- 🏷️ **Batch/Serial Tracking** – Product traceability features
- 🌐 **GraphQL + REST APIs** – Dual API approach for maximum flexibility
- 🔐 **Role-Based Security** – Integrated with auth service
- 📚 **Swagger Documentation** – Auto-generated API documentation
- 🐳 **Docker Ready** – NestJS microservice with MongoDB

### 🚧 Planned Modules
- 🧾 **Sales & Orders** – Customer orders, status tracking (Express)
- 💰 **Finance** – Invoicing, payments, fraud detection
- 🧑‍💼 **HR** – Employee records, attendance, attrition prediction

### 🤖 AI Features (Planned)
- 📊 Demand forecasting (Prophet/LSTM)
- 🧍 Customer segmentation (KMeans)
- 🕵️ Fraud detection (Anomaly detection)
- 🗣️ Smart assistant (optional)

## �️ Tech Stack

- **Frontend**: React, Tailwind, Apollo Client
- **Backend**:
  - ✅ FastAPI (Python) - Auth Service
  - ✅ NestJS (Node.js) - Inventory Service 
  - 🚧 Express.js (Node.js) - Other services
  - 🚧 Apollo GraphQL Federation Gateway
- **Database**: MongoDB
- **AI**: Scikit-learn, TensorFlow, PyTorch
- **DevOps**: Docker, Docker Compose, GitHub Actions

## 📁 Project Structure

```bash
erp-ai-microservices/
├── 🔐 auth-service/                  # ✅ Authentication & Authorization (FastAPI)
│   ├── app/
│   │   ├── api/v1/                  # API routes and dependencies
│   │   ├── models/                  # Pydantic models
│   │   ├── services/                # Business logic
│   │   ├── database/                # MongoDB connection
│   │   └── config.py               # Configuration settings
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
├── 📦 inventory-service/             # ✅ Inventory Management (NestJS/GraphQL)
│   ├── src/
│   │   ├── products/                # Product management
│   │   ├── categories/              # Product categories
│   │   ├── suppliers/               # Supplier management
│   │   ├── warehouses/              # Warehouse management
│   │   ├── inventory/               # Stock tracking & transactions
│   │   ├── auth/                    # Authentication integration
│   │   └── database/                # MongoDB schemas & seed data
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── package.json
│   ├── README.md
│   ├── QUICKSTART.md
│   └── start-inventory.sh
│   ├── src/
│   │   ├── controllers/             # Request handlers
│   │   ├── models/                  # Database models
│   │   ├── services/                # Business logic
│   │   ├── middleware/              # Custom middleware
│   │   ├── routes/                  # API routes
│   │   └── config/                  # Configuration
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
│
├── 🧾 order-service/                 # 🚧 Sales & Order Management (Node.js/Express)
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── config/
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
│
├── 💰 finance-service/               # 🚧 Financial Management (FastAPI/Python)
│   ├── app/
│   │   ├── api/v1/
│   │   ├── models/
│   │   ├── services/
│   │   ├── database/
│   │   └── config.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
├── 🧑‍💼 hr-service/                     # 🚧 Human Resources (FastAPI/Python)
│   ├── app/
│   │   ├── api/v1/
│   │   ├── models/
│   │   ├── services/
│   │   ├── database/
│   │   └── config.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
├── 🤖 ai-service/                    # 🚧 AI/ML Analytics (Python/FastAPI)
│   ├── app/
│   │   ├── api/v1/
│   │   ├── models/                  # ML models and data models
│   │   ├── services/
│   │   ├── ml/                      # Machine learning modules
│   │   │   ├── forecasting/         # Demand forecasting
│   │   │   ├── segmentation/        # Customer segmentation
│   │   │   └── fraud_detection/     # Fraud detection
│   │   └── config.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
├── 🌐 api-gateway/                   # 🚧 API Gateway (Node.js/Apollo GraphQL)
│   ├── src/
│   │   ├── schema/                  # GraphQL schemas
│   │   ├── resolvers/               # GraphQL resolvers
│   │   ├── middleware/              # Authentication, rate limiting
│   │   ├── services/                # Service integrations
│   │   └── config/
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
│
├── 📧 notification-service/          # 🚧 Email/SMS/Push Notifications (Node.js)
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── templates/               # Email templates
│   │   ├── providers/               # Email/SMS providers
│   │   └── config/
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
│
├── 📊 reporting-service/             # 🚧 Reports & Analytics (Python/FastAPI)
│   ├── app/
│   │   ├── api/v1/
│   │   ├── models/
│   │   ├── services/
│   │   ├── generators/              # Report generators
│   │   └── config.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
├── 🎨 erp-frontend/                  # ✅ React Frontend (TypeScript/Vite)
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # Page components
│   │   ├── context/                 # React contexts
│   │   ├── hooks/                   # Custom hooks
│   │   ├── services/                # API services
│   │   ├── types/                   # TypeScript types
│   │   ├── utils/                   # Utility functions
│   │   └── assets/                  # Static assets
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── package.json
│   └── README.md
│
├── 📱 mobile-app/                    # 🚧 React Native Mobile App
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── navigation/
│   │   ├── services/
│   │   └── utils/
│   ├── android/
│   ├── ios/
│   ├── package.json
│   └── README.md
│
├── 🏗️ infrastructure/                # Infrastructure as Code
│   ├── terraform/                   # Terraform configurations
│   ├── kubernetes/                  # K8s manifests
│   │   ├── auth-service/
│   │   ├── inventory-service/
│   │   ├── order-service/
│   │   ├── finance-service/
│   │   ├── hr-service/
│   │   ├── ai-service/
│   │   ├── api-gateway/
│   │   ├── notification-service/
│   │   ├── reporting-service/
│   │   └── frontend/
│   ├── helm/                        # Helm charts
│   └── monitoring/                  # Prometheus, Grafana configs
│
├── 🧪 tests/                         # Integration & E2E Tests
│   ├── integration/                 # Cross-service tests
│   ├── e2e/                         # End-to-end tests
│   ├── load/                        # Load testing scripts
│   └── fixtures/                    # Test data
│
├── 📜 scripts/                       # Automation Scripts
│   ├── setup/                       # Environment setup
│   ├── database/                    # Database migrations
│   ├── deployment/                  # Deployment scripts
│   └── monitoring/                  # Health checks
│
├── 📚 docs/                          # Documentation
│   ├── api/                         # API documentation
│   ├── architecture/                # System architecture
│   ├── deployment/                  # Deployment guides
│   └── user-guides/                 # User manuals
│
├── .github/                          # GitHub workflows
│   ├── workflows/                   # CI/CD pipelines
│   └── templates/                   # Issue/PR templates
│
├── docker-compose.yml                # Multi-service orchestration
├── docker-compose.dev.yml            # Development environment
├── docker-compose.prod.yml           # Production environment
├── start-dev.sh                      # Development startup script
├── start-prod.sh                     # Production startup script
├── .env.example                      # Environment variables template
└── README.md                         # Main documentation
