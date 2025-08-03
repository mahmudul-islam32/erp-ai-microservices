# ERP AI Microservices

A modern ERP system built with a microservices architecture, combining FastAPI, Node.js (Express), React, GraphQL, and MongoDB. Includes built-in AI capabilities for forecasting, segmentation, fraud detection, and more.

## 🌐 Features

### Core Modules
- 🔐 **Auth Service** – JWT-based login, roles, permissions
- 👥 **User Management** – Manage users and roles (FastAPI)
- 📦 **Inventory Management** – Products, stock, AI-powered demand prediction
- 🧾 **Sales & Orders** – Customer orders, status tracking (Express)
- 💰 **Finance** – Invoicing, payments, fraud detection
- 🧑‍💼 **HR** – Employee records, attendance, attrition prediction

### AI Features
- 📊 Demand forecasting (Prophet/LSTM)
- 🧍 Customer segmentation (KMeans)
- 🕵️ Fraud detection (Anomaly detection)
- 🗣️ Smart assistant (optional)

## 🚀 Tech Stack

- **Frontend**: React, Tailwind, Apollo Client
- **Backend**:
  - FastAPI (Python) & Express.js (Node.js)
  - Apollo GraphQL Federation Gateway
- **Database**: MongoDB
- **AI**: Scikit-learn, TensorFlow, PyTorch
- **DevOps**: Docker, GitHub Actions, Swagger

## 🧱 Project Structure

```bash
erp-ai-microservices/
├── gateway/
├── auth-service/
├── user-service/
├── inventory-service/
├── sales-service/
├── finance-service/
├── hr-service/
├── ai-service/
├── frontend/
├── shared-libs/
└── docs/
