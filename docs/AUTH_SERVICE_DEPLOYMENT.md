# ERP Auth Service - Deployment Guide

## 🚀 Quick Deployment

### Option 1: Docker Compose (Recommended)

```bash
# Clone and setup
git clone <your-repo>
cd erp-ai-microservices
./setup.sh

# Services will be available at:
# - Auth API: http://localhost:8001
# - API Docs: http://localhost:8001/docs
# - MongoDB Admin: http://localhost:8081
```

### Option 2: Manual Setup

```bash
# Install dependencies
cd auth-service
pip install -r requirements.txt

# Start MongoDB
docker run -d -p 27017:27017 --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:7.0

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run the service
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## 🔧 Configuration

### Environment Variables

```bash
# JWT Settings
SECRET_KEY=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
MONGODB_URL=mongodb://admin:password123@localhost:27017/erp_auth?authSource=admin
DATABASE_NAME=erp_auth

# Service
SERVICE_PORT=8001
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### Production Settings

1. **Change Default Secrets**:
   ```bash
   # Generate a secure secret key
   openssl rand -hex 32
   ```

2. **Use Environment Variables**:
   ```bash
   export SECRET_KEY="your-generated-secret"
   export MONGODB_URL="mongodb://user:pass@host:port/db"
   ```

3. **Enable Security Middleware**:
   - Set `ENVIRONMENT=production`
   - Configure trusted hosts
   - Use HTTPS in production

## 🏗️ Architecture

### Microservice Design

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└─────────┬───────┘
          │ HTTP/JWT
┌─────────▼───────┐
│   Auth Service  │
│   (FastAPI)     │
├─────────────────┤
│ • JWT Auth      │
│ • User CRUD     │
│ • Permissions   │
│ • Role Management
└─────────┬───────┘
          │ MongoDB
┌─────────▼───────┐
│   Database      │
│   (MongoDB)     │
└─────────────────┘
```

### API Structure

```
/api/v1/
├── auth/
│   ├── /login          # POST - User login
│   ├── /register       # POST - User registration
│   ├── /refresh        # POST - Token refresh
│   ├── /me             # GET  - Current user
│   └── /logout         # POST - Logout
└── users/
    ├── /               # GET/POST - List/Create users
    ├── /{id}           # GET/PUT/DELETE - User operations
    └── /{id}/permissions # PUT - Update permissions
```

## 🔒 Security

### Authentication Flow

1. **Login**: POST `/auth/login` with email/password
2. **Token**: Receive JWT access token (30min) + refresh token (7 days)
3. **Request**: Include `Authorization: Bearer <token>` header
4. **Refresh**: Use refresh token to get new access token
5. **Logout**: Client discards tokens

### Authorization

- **Role-Based**: Users assigned roles (super_admin, admin, manager, etc.)
- **Permission-Based**: Granular permissions for specific actions
- **Resource-Based**: Users can access their own resources

### Security Features

- ✅ Password hashing (bcrypt)
- ✅ JWT token expiration
- ✅ Account locking (5 failed attempts)
- ✅ CORS protection
- ✅ Input validation
- ✅ SQL injection prevention (MongoDB)

## 📊 Monitoring

### Health Checks

```bash
# Service health
curl http://localhost:8001/health

# Database connection
curl http://localhost:8001/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

### Logging

```bash
# View logs
docker-compose logs -f auth-service

# Log levels: DEBUG, INFO, WARNING, ERROR
export LOG_LEVEL=INFO
```

## 🧪 Testing

### Automated Tests

```bash
# Run test suite
cd tests
./test-auth.sh

# Expected output:
# ✅ Health endpoint working
# ✅ Admin login successful
# ✅ User creation successful
# ✅ All permissions working
```

### Manual Testing

1. **Import Postman Collection**: `tests/ERP-Auth-Service.postman_collection.json`
2. **Login as admin**: `admin@erp.com` / `admin123`
3. **Test API endpoints**: Create users, check permissions
4. **Verify security**: Try unauthorized access

## 🚨 Troubleshooting

### Common Issues

1. **Service won't start**:
   ```bash
   # Check logs
   docker-compose logs auth-service
   
   # Rebuild container
   docker-compose up --build auth-service
   ```

2. **Database connection failed**:
   ```bash
   # Check MongoDB
   docker-compose logs mongodb
   
   # Verify connection string
   echo $MONGODB_URL
   ```

3. **Authentication errors**:
   ```bash
   # Check JWT secret
   echo $SECRET_KEY
   
   # Verify token format
   curl -X POST http://localhost:8001/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@erp.com","password":"admin123"}'
   ```

## 📈 Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
auth-service:
  deploy:
    replicas: 3
  # Add load balancer
```

### Performance Optimization

- Use connection pooling for MongoDB
- Implement Redis for token blacklisting
- Add caching for user permissions
- Use async database operations

## 🔄 Updates & Maintenance

### Database Migrations

```bash
# Backup before updates
mongodump --uri="mongodb://admin:password123@localhost:27017/erp_auth"

# Apply schema changes
docker-compose exec mongodb mongo erp_auth --eval "..."
```

### Service Updates

```bash
# Update dependencies
pip install -r requirements.txt --upgrade

# Rebuild and deploy
docker-compose up --build -d auth-service
```
