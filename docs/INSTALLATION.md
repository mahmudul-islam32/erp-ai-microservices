# 📦 Installation Guide - ERP System

Complete step-by-step guide to install and configure your ERP system.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Installation (Recommended)](#quick-installation-recommended)
3. [Manual Installation](#manual-installation)
4. [Environment Configuration](#environment-configuration)
5. [First Time Setup](#first-time-setup)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)
8. [Updating](#updating)
9. [Uninstallation](#uninstallation)

---

## Prerequisites

Before installing, ensure your system meets the following requirements:

### System Requirements

#### Minimum
- **OS**: Linux, macOS, or Windows 10+
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 10GB free space
- **Internet**: Required for initial setup

#### Recommended
- **OS**: Ubuntu 20.04+ or macOS 12+
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 20GB SSD
- **Internet**: High-speed connection

### Required Software

#### 1. Docker
**Required Version**: 20.10 or higher

**Check if installed:**
```bash
docker --version
# Should show: Docker version 20.10.x or higher
```

**Install Docker:**

**macOS:**
```bash
# Download Docker Desktop from:
# https://docs.docker.com/desktop/mac/install/
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Logout and login again
```

**Windows:**
```bash
# Download Docker Desktop from:
# https://docs.docker.com/desktop/windows/install/
# Enable WSL 2
```

#### 2. Docker Compose
**Required Version**: 2.0 or higher

**Check if installed:**
```bash
docker-compose --version
# Should show: Docker Compose version 2.x.x or higher
```

**Install Docker Compose:**
```bash
# Usually included with Docker Desktop
# For Linux, if not included:
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 3. Git (Optional but recommended)
```bash
git --version
# If not installed:
# macOS: xcode-select --install
# Linux: sudo apt-get install git
# Windows: https://git-scm.com/download/win
```

### Optional Tools
- **Text Editor**: VS Code, Sublime Text, or similar
- **Database Client**: MongoDB Compass (for viewing database)
- **API Client**: Postman or Insomnia (for testing APIs)

---

## Quick Installation (Recommended)

### Step 1: Download the Package

#### Option A: From CodeCanyon
1. Login to your CodeCanyon account
2. Go to **Downloads** page
3. Find **ERP System** in your purchases
4. Click **Download** → **All files & documentation**
5. Extract the ZIP file to your desired location

#### Option B: From Git Repository
```bash
git clone <your-repository-url>
cd erp-ai-microservices
```

### Step 2: Configure Environment Variables

```bash
# Copy the environment template
cp .env.example .env
```

**Edit `.env` file** with your settings (optional - works with defaults):
```bash
# Use your preferred text editor
nano .env
# or
code .env
# or
vim .env
```

**Minimum configuration** (optional, defaults work fine):
```env
# Application
APP_NAME=ERP System
APP_ENV=production

# MongoDB (use defaults or customize)
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your-secure-password-here

# Stripe (for payment processing)
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here

# Email (optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Step 3: Start the Application

```bash
# Start all services
docker-compose up -d

# This will:
# ✅ Download required Docker images (~2-5 minutes)
# ✅ Create and start all containers
# ✅ Initialize databases
# ✅ Load demo data (if enabled)
```

**Wait for services to start** (about 30-60 seconds):
```bash
# Check service status
docker-compose ps

# All services should show "Up" status
```

### Step 4: Access Your ERP System

Open your browser and navigate to:

🌐 **Frontend**: http://localhost:5173

**Default Login Credentials:**
```
Email: admin@example.com
Password: admin123
```

> ⚠️ **Important**: Change the default password after first login!

### Step 5: Complete Initial Setup

1. **Login** with default credentials
2. **Change password**:
   - Click on your profile (top right)
   - Select "Change Password"
   - Enter new secure password
3. **Configure settings**:
   - Go to Settings page
   - Update company information
   - Configure branding (optional)
4. **Create users** (if needed):
   - Go to Users page
   - Add team members

**🎉 Congratulations! Your ERP system is ready to use!**

---

## Manual Installation

For advanced users or custom configurations.

### Step 1: Prepare Directory Structure

```bash
mkdir erp-system
cd erp-system
```

### Step 2: Extract Source Files

Extract the downloaded package to this directory:

```
erp-system/
├── auth-service/
├── inventory-service/
├── sales-service/
├── erp-frontend/
├── nginx/
├── docker-compose.yml
└── .env.example
```

### Step 3: Configure Services

#### A. Environment Variables

Create `.env` file in the root directory:

```bash
# Application Settings
APP_NAME=ERP System
APP_ENV=production
APP_DEBUG=false

# MongoDB Configuration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=SecurePassword123!
MONGO_HOST=mongodb
MONGO_PORT=27017
MONGO_DATABASE=erp_db

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=SecureRedisPassword123!

# Auth Service
AUTH_SERVICE_PORT=8001
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Inventory Service
INVENTORY_SERVICE_PORT=8002
MONGODB_URI=mongodb://admin:SecurePassword123!@mongodb:27017/erp_db?authSource=admin

# Sales Service
SALES_SERVICE_PORT=8003

# Frontend
VITE_AUTH_SERVICE_URL=http://localhost:8001
VITE_INVENTORY_SERVICE_URL=http://localhost:8002
VITE_SALES_SERVICE_URL=http://localhost:8003

# Stripe Payment (Optional)
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM=noreply@yourdomain.com

# Demo Data
LOAD_DEMO_DATA=true

# Security
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
RATE_LIMIT_PER_MINUTE=60
```

#### B. Generate Secure Secrets

```bash
# Generate JWT secret
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate MongoDB password
python3 -c "import secrets; print(secrets.token_urlsafe(16))"

# Generate Redis password
python3 -c "import secrets; print(secrets.token_urlsafe(16))"
```

Update your `.env` file with these generated values.

### Step 4: Build and Start Services

```bash
# Build Docker images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Step 5: Initialize Database

```bash
# Wait for MongoDB to be ready
sleep 10

# Create admin user (if demo data not loaded)
docker-compose exec auth-service python scripts/create_admin.py

# Load demo data (optional)
docker-compose exec auth-service python scripts/seed_demo_data.py
docker-compose exec inventory-service npm run seed:demo
docker-compose exec sales-service python scripts/seed_demo_data.py
```

### Step 6: Verify Installation

```bash
# Check all services are running
docker-compose ps

# Test API endpoints
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health

# Access frontend
open http://localhost:5173
```

---

## Environment Configuration

### Essential Environment Variables

#### Application Settings
```env
APP_NAME=ERP System              # Your application name
APP_ENV=production               # Environment: production, development, staging
APP_DEBUG=false                  # Debug mode (true for development)
```

#### Database Configuration
```env
# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=<secure-password>
MONGO_HOST=mongodb
MONGO_PORT=27017
MONGO_DATABASE=erp_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<secure-password>
```

#### Service Ports
```env
AUTH_SERVICE_PORT=8001           # Auth API port
INVENTORY_SERVICE_PORT=8002      # Inventory API port
SALES_SERVICE_PORT=8003          # Sales API port
FRONTEND_PORT=5173              # Frontend port
```

#### Security Settings
```env
JWT_SECRET_KEY=<64-char-secret>  # JWT signing key
JWT_ALGORITHM=HS256              # JWT algorithm
ACCESS_TOKEN_EXPIRE_MINUTES=30   # Access token lifetime
REFRESH_TOKEN_EXPIRE_DAYS=7      # Refresh token lifetime
```

#### Stripe Payment (Optional)
```env
STRIPE_PUBLISHABLE_KEY=pk_test_xxx   # Stripe public key
STRIPE_SECRET_KEY=sk_test_xxx        # Stripe secret key
```

#### Email Configuration (Optional)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
SMTP_USE_TLS=true
```

### Configuration Tips

1. **Never commit `.env` to version control**
2. **Use strong passwords** (16+ characters, mixed case, numbers, symbols)
3. **Generate unique secrets** for each environment
4. **Keep Stripe test keys** separate from production keys
5. **Use environment-specific** `.env` files (`.env.production`, `.env.staging`)

---

## First Time Setup

### Option 1: Setup Wizard (Recommended)

1. **Access setup wizard**:
   ```
   http://localhost:5173/setup
   ```

2. **Follow the wizard steps**:
   - **Welcome**: Introduction and requirements check
   - **Database**: Configure database connection
   - **Admin Account**: Create super admin user
   - **Email**: Configure SMTP settings (optional)
   - **Payments**: Configure Stripe (optional)
   - **Demo Data**: Choose to load sample data
   - **Complete**: Review and finish setup

3. **Login** with your created credentials

### Option 2: Manual Setup

#### Create Admin User

```bash
docker-compose exec auth-service python -c "
from app.database.mongodb import get_database
from app.services.user_service import UserService
from app.models.user import UserRole
import asyncio

async def create_admin():
    db = await get_database()
    user_service = UserService(db)
    admin = await user_service.create_user({
        'email': 'admin@example.com',
        'password': 'admin123',
        'first_name': 'System',
        'last_name': 'Administrator',
        'role': UserRole.SUPER_ADMIN
    })
    print(f'Admin created: {admin.email}')

asyncio.run(create_admin())
"
```

#### Load Demo Data

```bash
# Auth service demo data
docker-compose exec auth-service python scripts/seed_demo_data.py

# Inventory service demo data
docker-compose exec inventory-service npm run seed:demo

# Sales service demo data
docker-compose exec sales-service python scripts/seed_demo_data.py
```

---

## Verification

### Check Service Health

```bash
# Check all services
docker-compose ps

# Expected output:
# NAME                    STATUS
# auth-service           Up
# inventory-service      Up
# sales-service          Up
# frontend-dev           Up
# mongodb                Up
# redis                  Up
# nginx                  Up (optional)
```

### Test API Endpoints

```bash
# Auth service
curl http://localhost:8001/health
# Expected: {"status":"healthy"}

# Inventory service
curl http://localhost:8002/health
# Expected: {"status":"ok"}

# Sales service
curl http://localhost:8003/health
# Expected: {"status":"healthy"}
```

### Test Frontend

1. Open browser to http://localhost:5173
2. Should see login page
3. Login with credentials
4. Should redirect to dashboard

### Test Database Connection

```bash
# Connect to MongoDB
docker-compose exec mongodb mongosh -u admin -p <password>

# List databases
show dbs

# Should see: erp_db
```

### Verify Demo Data (if loaded)

1. Login to frontend
2. Navigate to:
   - **Users** → Should see 10+ users
   - **Inventory → Products** → Should see 50+ products
   - **Sales → Customers** → Should see 20+ customers
   - **Sales → Orders** → Should see 30+ orders

---

## Troubleshooting

### Common Issues

#### Issue 1: Services Won't Start

**Symptoms:**
- Containers exit immediately
- Services show "Exited" status

**Solutions:**

```bash
# Check logs for errors
docker-compose logs

# Restart services
docker-compose down
docker-compose up -d

# Rebuild if needed
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Issue 2: Port Already in Use

**Symptoms:**
- Error: "port is already allocated"

**Solutions:**

```bash
# Find process using the port (example for port 8001)
lsof -i :8001  # macOS/Linux
netstat -ano | findstr :8001  # Windows

# Kill the process or change port in .env
# Then restart services
docker-compose down
docker-compose up -d
```

#### Issue 3: Cannot Connect to Database

**Symptoms:**
- Services start but can't access database
- Error: "Connection refused"

**Solutions:**

```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb

# Wait 10 seconds, then restart other services
sleep 10
docker-compose restart auth-service inventory-service sales-service
```

#### Issue 4: Cannot Login

**Symptoms:**
- Login fails with "Invalid credentials"
- No admin user exists

**Solutions:**

```bash
# Create admin user
docker-compose exec auth-service python scripts/create_admin.py

# Or manually create:
docker-compose exec auth-service python -c "
# (Use script from First Time Setup section)
"
```

#### Issue 5: Frontend Shows Blank Page

**Symptoms:**
- Frontend loads but shows blank/white page
- Console shows errors

**Solutions:**

```bash
# Check frontend logs
docker-compose logs frontend-dev

# Rebuild frontend
docker-compose down frontend-dev
docker-compose build frontend-dev
docker-compose up -d frontend-dev

# Clear browser cache
# Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

#### Issue 6: Stripe Payments Not Working

**Symptoms:**
- Payment button disabled
- Error in payment processing

**Solutions:**

1. **Check Stripe configuration** in `.env`:
   ```env
   STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   STRIPE_SECRET_KEY=sk_test_xxx
   ```

2. **Use test cards**:
   ```
   Card: 4242 4242 4242 4242
   Expiry: 12/25
   CVC: 123
   ```

3. **Check frontend environment**:
   ```bash
   docker-compose exec frontend-dev printenv | grep STRIPE
   ```

#### Issue 7: Permission Denied Errors

**Symptoms:**
- "Permission denied" when running commands

**Solutions:**

```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
# Logout and login again

# Or run with sudo (not recommended)
sudo docker-compose up -d
```

### Getting Help

If you still have issues:

1. **Check logs**:
   ```bash
   docker-compose logs --tail=100
   ```

2. **Check service-specific logs**:
   ```bash
   docker-compose logs auth-service
   docker-compose logs inventory-service
   docker-compose logs sales-service
   ```

3. **Verify environment variables**:
   ```bash
   docker-compose config
   ```

4. **Contact support**:
   - Email: support@yourdomain.com
   - Include: logs, OS version, Docker version, error messages

---

## Updating

### Update to New Version

```bash
# 1. Backup your data first!
./scripts/backup.sh

# 2. Stop services
docker-compose down

# 3. Backup .env file
cp .env .env.backup

# 4. Download new version
# (Extract new files, but don't overwrite .env)

# 5. Check for breaking changes
cat CHANGELOG.md

# 6. Update .env if needed
# Compare .env.backup with new .env.example

# 7. Rebuild and start
docker-compose build
docker-compose up -d

# 8. Run migrations if needed
./scripts/migrate.sh
```

### Automatic Updates

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d
```

---

## Uninstallation

### Remove Application Only

```bash
# Stop and remove containers
docker-compose down

# Remove images
docker-compose down --rmi all
```

### Complete Removal (Including Data)

```bash
# Stop and remove everything
docker-compose down -v --rmi all

# Remove project directory
cd ..
rm -rf erp-system

# Remove orphaned Docker resources
docker system prune -a --volumes
```

---

## Next Steps

After successful installation:

1. ✅ **Read the [User Manual](USER_MANUAL.md)** - Learn how to use the system
2. ✅ **Configure branding** - Add your company logo and colors
3. ✅ **Add users** - Create accounts for your team
4. ✅ **Import data** - Add your products, customers, etc.
5. ✅ **Configure Stripe** - Set up payment processing
6. ✅ **Set up email** - Configure SMTP for notifications
7. ✅ **Customize** - See [Customization Guide](CUSTOMIZATION_GUIDE.md)
8. ✅ **Deploy to production** - See [Deployment Guide](DEPLOYMENT.md)

---

## Support

Need help with installation?

- 📧 **Email**: support@yourdomain.com
- 📖 **Documentation**: [Full documentation](README.md)
- 💬 **Live Chat**: [Support portal]
- 🎥 **Video Tutorial**: [Installation video](documentation/videos/installation.mp4)

---

**Happy installing!** 🚀

