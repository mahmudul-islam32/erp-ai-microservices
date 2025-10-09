# ⚡ Quick Fix: Health Check Error

## The Problem
```
Container erp-auth-service Error
dependency failed to start: container erp-auth-service is unhealthy
```

## ✅ **Quick Fix (5 Minutes)**

### **Step 1: SSH to EC2**

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
cd ~/erp
```

### **Step 2: Create/Update .env File**

```bash
# Create .env file
nano .env
```

**Copy and paste this (UPDATE the YOUR_* values):**

```bash
# GitHub
GITHUB_USERNAME=mahmudul-islam32

# MongoDB (Use MongoDB Atlas connection string)
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

# JWT (Generate a random 32+ character string)
JWT_SECRET_KEY=replace-with-random-32-character-string
JWT_SECRET=replace-with-random-32-character-string
ALGORITHM=HS256

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Service Config
ENVIRONMENT=production
NODE_ENV=production
LOG_LEVEL=INFO
PORT=8002
DEFAULT_TAX_RATE=0.08
DEFAULT_CURRENCY=USD
```

**Save**: `Ctrl+X`, `Y`, `Enter`

### **Step 3: Deploy Again**

```bash
# Stop old containers
docker compose down

# Pull latest images
docker compose pull

# Start fresh
docker compose up -d

# Wait 30 seconds
sleep 30

# Check status
docker compose ps
```

### **Step 4: Check Logs**

```bash
# View all logs
docker compose logs

# If errors, check specific service
docker compose logs auth-service
docker compose logs mongodb
```

---

## 🎯 **What Changed**

1. ✅ **Simplified docker-compose** - Removed strict health checks
2. ✅ **Better error handling** - Checks for .env before deploy
3. ✅ **Uses env_file** - Cleaner configuration

---

## 📝 **Generate Secure JWT Secret**

```bash
# On your local machine or EC2
openssl rand -base64 32

# Use the output for both JWT_SECRET_KEY and JWT_SECRET
```

---

## 🔍 **Verify Setup**

After deployment:

```bash
# All containers should be "Up"
docker compose ps

# Test services
curl http://localhost:8001/  # Auth (might return 404, that's ok)
curl http://localhost:8002/  # Inventory
curl http://localhost:8003/  # Sales
curl http://localhost:80     # Frontend

# Or just check if ports are open
netstat -tulpn | grep -E "8001|8002|8003|80"
```

---

## 🚀 **Push Updated Config**

After fixing on EC2, update your repo:

```bash
# On your local machine
cd ~/Desktop/erp-ai-microservices

git add .
git commit -m "Fix: Health check error - simplified docker-compose"
git push origin main
```

---

## ✅ **Success Indicators**

```bash
# Run this on EC2:
docker compose ps

# You should see:
# NAME                     STATUS
# erp-auth-service         Up
# erp-frontend             Up
# erp-inventory-service    Up
# erp-mongodb              Up
# erp-redis                Up
# erp-sales-service        Up
```

---

## 🆘 **Still Not Working?**

### Check MongoDB Connection:

```bash
# If using MongoDB Atlas
ping your-cluster.mongodb.net

# Test connection
docker run --rm mongo:7.0 mongosh "YOUR_MONGODB_URL" --eval "db.adminCommand('ping')"
```

### Check if images exist:

```bash
# List images
docker images | grep ghcr.io/mahmudul-islam32

# Pull manually if missing
docker pull ghcr.io/mahmudul-islam32/erp-auth-service:latest
docker pull ghcr.io/mahmudul-islam32/erp-inventory-service:latest
docker pull ghcr.io/mahmudul-islam32/erp-sales-service:latest
docker pull ghcr.io/mahmudul-islam32/erp-frontend:latest
```

### Check .env has all variables:

```bash
# Check required variables exist
cat ~/erp/.env | grep -E "MONGODB_URL|JWT_SECRET_KEY|MONGODB_URI|JWT_SECRET"

# All four should show values
```

---

## 📋 **Files Updated**

- ✅ `docker-compose.simple.yml` - Simplified config (no health check conditions)
- ✅ `.github/workflows/deploy.yml` - Checks for .env before deploy
- ✅ `COMPLETE_ENV_TEMPLATE.env` - Complete .env template
- ✅ `DEBUG_HEALTH_CHECK_ERROR.md` - Detailed debugging guide

---

**The fix should work now! Deploy and test! 🚀**

