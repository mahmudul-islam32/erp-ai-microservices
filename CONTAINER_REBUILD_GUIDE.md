# Container Rebuild Guide - Stripe Integration

## 🔄 Do You Need to Rebuild Containers?

### Quick Answer: **YES and NO** - It depends on what changed:

| Change Type | Rebuild Needed? | Command |
|------------|----------------|---------|
| **Frontend code** (React/TypeScript) | ❌ NO (Dev mode) | Just save, auto-reload |
| **Frontend dependencies** (package.json) | ✅ YES | `npm install` in container |
| **Backend code** (Python FastAPI) | ❌ NO (if volumes mounted) | Just save, auto-reload |
| **Backend dependencies** (requirements.txt) | ✅ YES | Rebuild container |
| **Environment variables** | ✅ YES | Restart containers |
| **Docker config** (Dockerfile, docker-compose.yml) | ✅ YES | Rebuild containers |

---

## 📦 For Stripe Integration Changes

### Backend (Sales Service) - ✅ **REBUILD REQUIRED**

**Why?** We added `stripe==7.8.0` to `requirements.txt`

```bash
# Option 1: Rebuild just sales-service
docker-compose up -d --build sales-service

# Option 2: Rebuild all services
docker-compose up -d --build

# Option 3: Rebuild and recreate
docker-compose down
docker-compose up -d --build
```

### Frontend - ❌ **NO REBUILD** (if using dev mode)

**Why?** Frontend changes are code only, volumes are mounted

```bash
# If using frontend-dev (development mode)
# Just save files - hot reload happens automatically ✨

# If using production frontend container
docker-compose up -d --build frontend
```

---

## 🚀 Step-by-Step: Apply Stripe Changes

### 1. Install Frontend Dependencies

If not already installed:

```bash
# Option A: Inside running container
docker-compose exec frontend-dev npm install

# Option B: On your local machine (if not using Docker for dev)
cd erp-frontend
npm install
```

### 2. Install Backend Dependencies & Rebuild

```bash
# From project root
docker-compose up -d --build sales-service
```

This will:
- Stop the sales-service container
- Rebuild with new dependencies (`stripe==7.8.0`)
- Start the updated container

### 3. Restart Services (for environment variables)

```bash
# If you added Stripe environment variables
docker-compose down
docker-compose up -d
```

### 4. Verify Everything Works

```bash
# Check if services are running
docker-compose ps

# Check sales-service logs
docker logs erp-sales-service -f

# Look for this line:
# "Stripe service initialized with API version: 2023-10-16"

# Check frontend is running
curl http://localhost:5173

# Check Stripe config endpoint
curl http://localhost:8003/api/v1/payments/stripe/config
```

---

## 🎯 Recommended Workflow

### For Development (Fastest)

```bash
# 1. Make code changes
# 2. Save files (auto-reload happens)
# 3. Only rebuild when dependencies change

# When you change requirements.txt or package.json:
docker-compose up -d --build sales-service
# or
docker-compose exec frontend-dev npm install
```

### For Production Deployment

```bash
# Always rebuild everything
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🔧 Specific Commands for Stripe Integration

### Initial Setup (First Time)

```bash
# 1. Add environment variables to .env
cat >> .env << 'EOF'
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
EOF

# 2. Rebuild sales service with Stripe dependency
docker-compose up -d --build sales-service

# 3. Install frontend dependencies (if needed)
docker-compose exec frontend-dev npm install

# 4. Restart all services to load env vars
docker-compose restart
```

### After Code Changes Only

```bash
# NO rebuild needed! 
# Just save your files

# Verify changes are live:
docker logs erp-sales-service --tail 50
docker logs erp-frontend-dev --tail 50
```

### If Something's Not Working

```bash
# Nuclear option - full rebuild
docker-compose down -v  # Warning: removes volumes!
docker-compose build --no-cache
docker-compose up -d

# Safer option - rebuild without removing data
docker-compose down
docker-compose build
docker-compose up -d
```

---

## ⚠️ Common Issues & Fixes

### Issue 1: "Stripe module not found"

**Cause:** Dependencies not installed

**Fix:**
```bash
docker-compose exec sales-service pip install stripe
# OR rebuild container
docker-compose up -d --build sales-service
```

### Issue 2: "Stripe publishable key not configured"

**Cause:** Environment variables not loaded

**Fix:**
```bash
# Add to .env
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Restart services
docker-compose restart sales-service
```

### Issue 3: Frontend changes not appearing

**Cause:** Browser cache or wrong container running

**Fix:**
```bash
# Clear browser cache (Ctrl+Shift+R)
# Check if dev container is running
docker-compose ps | grep frontend-dev

# If not running:
docker-compose up -d frontend-dev
```

### Issue 4: "Cannot connect to backend"

**Cause:** Services not communicating

**Fix:**
```bash
# Check network
docker network ls | grep erp

# Restart all services
docker-compose restart

# Check logs
docker-compose logs -f
```

---

## 📊 Quick Reference

### Check Status

```bash
# All services status
docker-compose ps

# Service-specific status
docker-compose ps sales-service
docker-compose ps frontend-dev

# View logs
docker logs erp-sales-service --tail 100 -f
docker logs erp-frontend-dev --tail 100 -f
```

### Restart Services

```bash
# Restart specific service
docker-compose restart sales-service

# Restart all services
docker-compose restart

# Stop and start (harder restart)
docker-compose down
docker-compose up -d
```

### Rebuild Containers

```bash
# Rebuild specific service
docker-compose up -d --build sales-service

# Rebuild all services
docker-compose up -d --build

# Rebuild with no cache (cleanest)
docker-compose build --no-cache sales-service
docker-compose up -d sales-service
```

---

## 🎬 Complete Setup Script

Save this as `setup-stripe.sh`:

```bash
#!/bin/bash
echo "🚀 Setting up Stripe integration..."

# 1. Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Creating .env file..."
    cat > .env << 'EOF'
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
STRIPE_API_VERSION=2023-10-16
STRIPE_CURRENCY=usd
EOF
    echo "✅ Created .env - Please update with your Stripe keys!"
    exit 1
fi

# 2. Install backend dependencies & rebuild
echo "📦 Rebuilding sales service with Stripe..."
docker-compose up -d --build sales-service

# 3. Install frontend dependencies
echo "📦 Installing frontend dependencies..."
docker-compose exec -T frontend-dev npm install

# 4. Restart to load env vars
echo "🔄 Restarting services..."
docker-compose restart

# 5. Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# 6. Test configuration
echo "🧪 Testing Stripe configuration..."
curl -s http://localhost:8003/api/v1/payments/stripe/config

echo ""
echo "✅ Setup complete! Visit http://localhost:5173"
echo ""
echo "📝 Next steps:"
echo "1. Update .env with your Stripe keys"
echo "2. Restart: docker-compose restart"
echo "3. Test payment with card: 4242 4242 4242 4242"
```

Make it executable:
```bash
chmod +x setup-stripe.sh
./setup-stripe.sh
```

---

## 🎯 Summary for Stripe Integration

### What Needs Rebuild:

✅ **Sales Service** - Added `stripe==7.8.0` to requirements.txt
```bash
docker-compose up -d --build sales-service
```

✅ **Environment Variables** - Added Stripe configuration
```bash
# After updating .env
docker-compose restart
```

❌ **Frontend** - Only code changes (if using dev mode with volumes)
```bash
# No rebuild needed - just save files!
```

### Full Update Command:

```bash
# One command to rule them all:
docker-compose down && \
docker-compose up -d --build sales-service && \
docker-compose exec frontend-dev npm install && \
docker-compose restart

# Then verify:
curl http://localhost:8003/api/v1/payments/stripe/config
```

---

**🎉 That's it! Your containers are ready for Stripe payments.**

Questions? Check the logs:
```bash
docker-compose logs -f sales-service
```

