# ERP Auth Service

Authentication and authorization service for the ERP system. It issues JWT access and refresh tokens, manages users, roles and permissions, and keeps sessions and audit logs. It is a FastAPI app that listens on port 8001 and stores its data in MongoDB.

## Quick Start

1. **Start the stack** from the repository root:
   ```bash
   ./setup.sh
   ```

2. **Run the tests:**
   ```bash
   cd auth-service
   pip install -r requirements-dev.txt
   pytest
   ```

## API Endpoints

### Authentication Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/login/oauth` - Login with an OAuth2 password form (used by the Swagger UI)
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user info
- `PUT /api/v1/auth/me` - Update current user profile
- `POST /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/forgot-password` - Request a password reset (placeholder: always returns success and sends no email yet)
- `POST /api/v1/auth/reset-password` - Reset password with a token (placeholder: not implemented yet)
- `POST /api/v1/auth/logout` - Logout user

### User Management Endpoints

- `GET /api/v1/users` - List users (with pagination)
- `POST /api/v1/users` - Create user (Admin only)
- `GET /api/v1/users/chat-eligible` - List users the current user can chat with
- `GET /api/v1/users/{id}` - Get user by ID
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user (soft delete)
- `PUT /api/v1/users/{id}/permissions` - Update user permissions
- `GET /api/v1/users/roles/permissions` - List default permissions per role
- `PUT /api/v1/users/roles/{role}/permissions` - Update a role's permissions
- `GET /api/v1/users/access-control/` - List access control entries
- `POST /api/v1/users/access-control/` - Add an access control entry
- `DELETE /api/v1/users/access-control/{entry_id}` - Remove an access control entry

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

## Demo Accounts

The service does not create an admin account on its own. Seed demo users with:

```bash
docker compose exec auth-service python scripts/seed_demo_data.py
```

This creates, among others:

- **Super admin**: `admin@example.com` / `Admin123`
- **Manager**: `manager@example.com` / `Manager123`
- **Employee**: `employee@example.com` / `Employee123`

Change these passwords before using the system anywhere public.

## Environment Variables

Settings are read from the environment or a `.env` file (see `app/config.py`). Only `MONGODB_URL` is required.

| Variable | Default | Purpose |
|---|---|---|
| `MONGODB_URL` | none (required) | MongoDB connection string |
| `DATABASE_NAME` | `erp_auth` | Database name |
| `SECRET_KEY` | `your-super-secret-key-change-this-in-production` | Key used to sign JWTs; always set your own |
| `ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |
| `ENVIRONMENT` | `development` | Outside `development`, auth cookies are marked `Secure` |
| `SERVICE_NAME` | `auth-service` | Name reported by `/health` |
| `SERVICE_HOST` | `0.0.0.0` | Bind address |
| `SERVICE_PORT` | `8001` | Port |
| `LOG_LEVEL` | `INFO` | Log level |
| `SALES_SERVICE_URL` | `http://sales-service:8003` | Sales service base URL |
| `NOTIFICATION_SERVICE_URL` | `http://notification-service:8004` | Notification service base URL |

In `docker-compose.yml`, `SECRET_KEY` is filled from the `JWT_SECRET_KEY` variable in your root `.env`.

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
