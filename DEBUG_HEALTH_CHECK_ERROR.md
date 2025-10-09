# 🔧 Fix: Container Health Check Failed

## ❌ The Error

```
Container erp-auth-service Error
dependency failed to start: container erp-auth-service is unhealthy
```

This means the auth-service health check is failing, blocking other services.

---

## 🔍 Quick Diagnosis on EC2

SSH to your EC2 and run these commands:

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
cd ~/erp

# Check all containers
docker compose ps

# Check auth-service logs
docker compose logs auth-service

# Check if .env file exists
cat .env

# Check MongoDB connection
docker compose logs mongodb
```

---

## ✅ Common Fixes

### **Fix 1: Remove Health Check Conditions (Quick Fix)**

The health checks might be too strict. Let's make the deployment more forgiving:

```bash
# On your EC2
cd ~/erp

# Edit docker-compose.yml
nano docker-compose.yml
```

Change the auth-service section to remove health check dependency:

```yaml
auth-service:
  image: ghcr.io/mahmudul-islam32/erp-auth-service:latest
  container_name: erp-auth-service
  restart: always
  ports:
    - "8001:8001"
  environment:
    ENVIRONMENT: production
    MONGODB_URL: ${MONGODB_URL}
    DATABASE_NAME: erp_auth
    SECRET_KEY: ${JWT_SECRET_KEY}
    # ... rest of environment variables
  depends_on:
    - mongodb  # Remove condition: service_healthy
  networks:
    - erp-network
  # Remove or increase timeout on healthcheck
```

### **Fix 2: Verify .env File Has All Variables**

```bash
# Check .env on EC2
cat ~/erp/.env

# Should have:
MONGODB_URL=mongodb+srv://...  # Or mongodb://admin:password123@mongodb:27017
JWT_SECRET_KEY=your-secret-key
# ... all other variables
```

If missing, create it:

```bash
nano ~/erp/.env

# Add:
GITHUB_USERNAME=mahmudul-islam32
MONGODB_URL=mongodb+srv://erp_admin:YOUR_PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET_KEY=your-super-secret-key-min-32-chars
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### **Fix 3: Use MongoDB Atlas (Recommended)**

If using MongoDB Atlas, verify:

```bash
# Test MongoDB connection
docker run --rm mongo:7.0 mongosh "YOUR_MONGODB_URL" --eval "db.adminCommand('ping')"
```

If using local MongoDB in docker-compose:

```bash
# Check MongoDB is running
docker compose ps mongodb

# Check MongoDB logs
docker compose logs mongodb

# Restart MongoDB if needed
docker compose restart mongodb
```

---

## 🚀 Complete Fix Script

Update your `docker-compose.prod.yml` to be more forgiving:

```yaml
services:
  mongodb:
    image: mongo:7.0
    container_name: erp-mongodb
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USERNAME:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:-password123}
    volumes:
      - mongodb_data:/data/db
    networks:
      - erp-network

  redis:
    image: redis:7.2-alpine
    container_name: erp-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - erp-network

  auth-service:
    image: ghcr.io/mahmudul-islam32/erp-auth-service:latest
    container_name: erp-auth-service
    restart: always
    ports:
      - "8001:8001"
    env_file: .env
    depends_on:
      - mongodb
    networks:
      - erp-network

  inventory-service:
    image: ghcr.io/mahmudul-islam32/erp-inventory-service:latest
    container_name: erp-inventory-service
    restart: always
    ports:
      - "8002:8002"
    env_file: .env
    depends_on:
      - mongodb
      - auth-service
    volumes:
      - inventory_uploads:/app/uploads
    networks:
      - erp-network

  sales-service:
    image: ghcr.io/mahmudul-islam32/erp-sales-service:latest
    container_name: erp-sales-service
    restart: always
    ports:
      - "8003:8003"
    env_file: .env
    depends_on:
      - mongodb
      - redis
      - auth-service
      - inventory-service
    networks:
      - erp-network

  frontend:
    image: ghcr.io/mahmudul-islam32/erp-frontend:latest
    container_name: erp-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - auth-service
      - inventory-service
      - sales-service
    networks:
      - erp-network

volumes:
  mongodb_data:
  redis_data:
  inventory_uploads:

networks:
  erp-network:
    driver: bridge
```

---

## 🔧 Apply Fix Now

### **On EC2:**

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
cd ~/erp

# Stop current deployment
docker compose down

# Make sure .env exists with all variables
nano .env

# Restart with simplified config
docker compose up -d

# Wait 30 seconds
sleep 30

# Check status
docker compose ps

# Check logs
docker compose logs --tail=50

# Test services
curl http://localhost:8001/health || curl http://localhost:8001/
curl http://localhost:8002/health || curl http://localhost:8002/
curl http://localhost:8003/health || curl http://localhost:8003/
```

---

## 🎯 Alternative: Simplify docker-compose.prod.yml

Update the docker-compose file to use `env_file` instead of individual env vars:

```yaml
auth-service:
  image: ghcr.io/mahmudul-islam32/erp-auth-service:latest
  container_name: erp-auth-service
  restart: always
  ports:
    - "8001:8001"
  env_file: .env  # Use .env file
  depends_on:
    - mongodb
  networks:
    - erp-network
  # Remove health check for now
```

---

## 📋 Debug Checklist

If services still won't start:

### Check 1: MongoDB Connection
```bash
# If using MongoDB Atlas
ping cluster.mongodb.net

# If using local MongoDB
docker compose ps mongodb
docker compose logs mongodb
```

### Check 2: Environment Variables
```bash
# Check .env exists
ls -la ~/erp/.env

# Check .env has all variables
cat ~/erp/.env | grep -E "MONGODB_URL|JWT_SECRET_KEY"
```

### Check 3: Container Logs
```bash
# View all logs
docker compose logs

# Specific service
docker compose logs auth-service
docker compose logs mongodb
```

### Check 4: Network Issues
```bash
# Check Docker network
docker network ls
docker network inspect erp_erp-network
```

### Check 5: Image Issues
```bash
# Check images exist
docker images | grep ghcr.io/mahmudul-islam32

# Pull images manually
docker compose pull
```

---

## 🚀 Updated Deployment Workflow

I'll update the workflow to use `env_file` instead of individual environment variables:

