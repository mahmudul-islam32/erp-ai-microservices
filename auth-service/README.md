# API Testing Scripts for ERP Auth Service

This directory contains scripts to test the Authentication & Authorization microservice.

## Quick Start

1. **Start the service:**
   ```bash
   ./setup.sh
   ```

2. **Test basic authentication:**
   ```bash
   cd tests
   ./test-auth.sh
   ```

## API Endpoints

### Authentication Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/logout` - Logout user

### User Management Endpoints

- `GET /api/v1/users` - List users (with pagination)
- `POST /api/v1/users` - Create user (Admin only)
- `GET /api/v1/users/{id}` - Get user by ID
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user (soft delete)
- `PUT /api/v1/users/{id}/permissions` - Update user permissions

## User Roles & Permissions

### Roles
- **SUPER_ADMIN**: All permissions
- **ADMIN**: Management permissions
- **MANAGER**: Departmental permissions
- **EMPLOYEE**: Basic permissions
- **CUSTOMER**: Customer-specific permissions
- **VENDOR**: Vendor-specific permissions

### Permission Categories
- **User Management**: user:create, user:read, user:update, user:delete
- **Inventory**: inventory:create, inventory:read, inventory:update, inventory:delete
- **Sales**: sales:create, sales:read, sales:update, sales:delete
- **Finance**: finance:create, finance:read, finance:update, finance:delete
- **HR**: hr:create, hr:read, hr:update, hr:delete
- **AI**: ai:access, ai:admin

## Default Admin Account

- **Email**: admin@erp.com
- **Password**: admin123
- **Role**: super_admin

## Environment Variables

```bash
# JWT Configuration
JWT_SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
MONGODB_URL=mongodb://admin:password123@mongodb:27017/erp_auth?authSource=admin
DATABASE_NAME=erp_auth

# Service
SERVICE_PORT=8001
ENVIRONMENT=development
```

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: bcrypt with salt rounds
3. **Account Locking**: Automatic locking after failed attempts
4. **Role-Based Access Control**: Granular permissions system
5. **Token Refresh**: Secure token refresh mechanism
6. **CORS Protection**: Configurable CORS policies
7. **Input Validation**: Pydantic models for data validation

## Microservice Architecture

The auth service is designed to be:
- **Stateless**: No session storage, JWT-based
- **Scalable**: Can be horizontally scaled
- **Independent**: Standalone database and configuration
- **Docker Ready**: Containerized for easy deployment
- **API First**: RESTful API with OpenAPI documentation
