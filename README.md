# ERP System - Microservices Architecture

A comprehensive Enterprise Resource Planning (ERP) system built with microservices architecture, featuring authentication, inventory management, sales management, and a modern React frontend with SAP-inspired design.

## 🏗️ Architecture

### Services
- **Auth Service** (FastAPI) - User authentication and authorization
- **Inventory Service** (NestJS) - Product and inventory management
- **Sales Service** (FastAPI) - Sales orders, customers, and invoicing
- **Frontend** (React + TypeScript) - Modern web interface with SAP design system

### Infrastructure
- **MongoDB** - Primary database
- **Redis** - Caching and session management
- **Docker** - Containerization and orchestration

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation & Running

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd erp-ai-microservices
   ```

2. **Start all services**
   ```bash
   docker compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Auth API: http://localhost:8001
   - Inventory API: http://localhost:8002
   - Sales API: http://localhost:8003

### Development Mode
```bash
# Start with development tools (includes Mongo Express)
docker compose --profile development up -d

# Access Mongo Express: http://localhost:8081
# Username: admin, Password: admin123
```

## 📚 Documentation

### Development & Local Setup
- **[Docker Commands Guide](DOCKER_COMMANDS.md)** - Complete Docker Compose commands reference
- **[API Documentation](docs/)** - Service-specific documentation

### Production Deployment
- **[Quick Deploy Guide](QUICK_DEPLOY.md)** - Deploy to AWS EC2 in 5 steps ⚡
- **[Complete AWS Deployment Guide](AWS_DEPLOYMENT_GUIDE.md)** - Detailed step-by-step deployment
- **[CI/CD Setup Complete](CICD_SETUP_COMPLETE.md)** - Deployment summary and checklist

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React application |
| Auth Service | http://localhost:8001 | Authentication API |
| Inventory Service | http://localhost:8002 | Inventory management |
| Sales Service | http://localhost:8003 | Sales management |
| Mongo Express | http://localhost:8081 | Database web interface |

## 🔧 Development

### Project Structure
```
erp-ai-microservices/
├── auth-service/          # FastAPI authentication service
├── inventory-service/     # NestJS inventory management
├── sales-service/         # FastAPI sales management
├── erp-frontend/          # React frontend application
├── nginx/                 # Nginx configuration
├── scripts/               # Database initialization
└── docs/                  # Documentation
```

### Key Features
- **SAP-Inspired Design System** - Professional enterprise UI
- **Role-Based Access Control** - Secure user management
- **Real-time Inventory Tracking** - Stock management and alerts
- **Sales Order Management** - Complete sales workflow
- **Responsive Design** - Works on all devices
- **Hot Reload Development** - Fast development cycle

### Technology Stack
- **Frontend**: React, TypeScript, Redux Toolkit, Mantine UI
- **Backend**: FastAPI, NestJS, Python, Node.js
- **Database**: MongoDB, Redis
- **Infrastructure**: Docker, Docker Compose

## 🛠️ Management Commands

### Start Services
```bash
docker compose up -d                    # Start all services
docker compose --profile development up -d  # Include Mongo Express
```

### Stop Services
```bash
docker compose down                     # Stop all services
docker compose down -v                  # Stop and remove data
```

### View Logs
```bash
docker compose logs                     # All services
docker compose logs auth-service        # Specific service
docker compose logs -f                  # Follow logs
```

### Rebuild Services
```bash
docker compose build                    # Rebuild all
docker compose up -d --build           # Rebuild and start
```

For complete command reference, see [DOCKER_COMMANDS.md](DOCKER_COMMANDS.md).

## ☁️ Deploy to AWS

Deploy your ERP application to AWS EC2 with automated CI/CD pipeline:

### Quick Deploy (5 Steps - 15 minutes)
```bash
# 1. Launch AWS EC2 t2.micro instance (Free Tier)
# 2. Create MongoDB Atlas free cluster
# 3. Run setup script on EC2
# 4. Configure environment variables
# 5. Deploy!
```

**See**: [QUICK_DEPLOY.md](QUICK_DEPLOY.md) for step-by-step instructions

### CI/CD Pipeline
- ✅ GitHub Actions workflow configured
- ✅ Auto-deploy on push to main
- ✅ Zero-downtime deployments
- ✅ Health checks included
- ✅ Free tier eligible

**See**: [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) for complete guide

## 🔐 Default Credentials

### Local Development
- **MongoDB**: admin / password123
- **Mongo Express**: admin / admin123
- **Application**: Create admin user through registration

### Production
- Configure secure credentials in `.env` file (see `env.production.template`)

## 📊 API Documentation

- **Auth Service**: http://localhost:8001/docs
- **Inventory Service**: http://localhost:8002/docs
- **Sales Service**: http://localhost:8003/docs

## 🚨 Troubleshooting

### Common Issues
1. **Port conflicts**: Check if ports 8001-8003, 5173, 27017, 6379 are available
2. **Service won't start**: Check logs with `docker compose logs service-name`
3. **Database issues**: Restart MongoDB with `docker compose restart mongodb`

### Reset Everything
```bash
docker compose down -v --rmi all
docker system prune -a --volumes
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker Compose
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the [Docker Commands Guide](DOCKER_COMMANDS.md)
2. Review service logs
3. Check API documentation
4. Create an issue in the repository