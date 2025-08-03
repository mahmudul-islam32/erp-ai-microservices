# ERP AI Microservices

A modern ERP system built with a microservices architecture, combining FastAPI, Node.js (Express), React, GraphQL, and MongoDB. Includes built-in AI capabilities for forecasting, segmentation, fraud detection, and more.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/mahmudul-islam32/erp-ai-microservices.git
cd erp-ai-microservices

# Start the Auth Service
./setup.sh

# Test the API
cd tests && ./test-auth.sh
```

## 🌐 Features

### ✅ Implemented: Auth Service
- 🔐 **JWT Authentication** – Secure token-based auth with refresh tokens
- 👤 **User Management** – CRUD operations with role-based access
- 🛡️ **Authorization** – Granular permission system
- � **Security Features** – Account locking, password hashing, CORS protection
- 📊 **Role Hierarchy** – Super Admin → Admin → Manager → Employee → Customer/Vendor
- 🐳 **Docker Ready** – Fully containerized with MongoDB

### 🚧 Planned Modules
- 📦 **Inventory Management** – Products, stock, AI-powered demand prediction
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
  - 🚧 Express.js (Node.js) - Other services
  - 🚧 Apollo GraphQL Federation Gateway
- **Database**: MongoDB
- **AI**: Scikit-learn, TensorFlow, PyTorch
- **DevOps**: Docker, Docker Compose, GitHub Actions

## 📁 Project Structure

```bash
erp-ai-microservices/
├── auth-service/           # ✅ Authentication & Authorization (FastAPI)
│   ├── app/
│   │   ├── api/           # API routes and dependencies
│   │   ├── models/        # Pydantic models
│   │   ├── services/      # Business logic
│   │   └── database/      # MongoDB connection
│   ├── Dockerfile
│   └── requirements.txt
├── tests/                 # API testing scripts
├── scripts/              # Database initialization
├── docker-compose.yml    # Multi-service orchestration
├── setup.sh             # Quick setup script
└── .env                 # Environment variables
