# 🔧 Fix: Manifest Unknown Error

## ❌ The Problem

The error "manifest unknown" means the Docker images don't exist in GitHub Container Registry (GHCR) yet. You're trying to pull images that haven't been built and pushed.

```
✘ inventory-service Error manifest unknown
Error response from daemon: manifest unknown
```

## ✅ Solutions

### **Option 1: Build Images Locally on EC2 (Quickest - Recommended)**

This builds images directly on your EC2 instance without needing GHCR.

#### Step 1: Copy project files to EC2

```bash
# On your local machine, copy project to EC2
scp -i your-key.pem -r ~/Desktop/erp-ai-microservices ubuntu@YOUR_EC2_IP:~/
```

Or clone from GitHub:
```bash
# On EC2
cd ~
git clone https://github.com/mahmudul-islam32/erp-ai-microservices.git
cd erp-ai-microservices
```

#### Step 2: Use the local build docker-compose file

```bash
# On EC2
cd ~/erp-ai-microservices

# Use docker-compose.local.yml (builds locally)
docker compose -f docker-compose.local.yml up -d --build
```

#### Step 3: Check status

```bash
docker compose -f docker-compose.local.yml ps
docker compose -f docker-compose.local.yml logs -f
```

---

### **Option 2: Use GitHub Actions to Build & Push to GHCR**

This is the proper CI/CD approach but requires GitHub setup first.

#### Step 1: Push code to GitHub

```bash
# On your local machine
cd ~/Desktop/erp-ai-microservices
git add .
git commit -m "Setup deployment configuration"
git push origin main
```

#### Step 2: GitHub Actions builds images automatically

- Go to: https://github.com/mahmudul-islam32/erp-ai-microservices/actions
- Watch the workflow run
- It will build and push images to GHCR

#### Step 3: Make images public (important!)

After GitHub Actions completes:

1. Go to: https://github.com/mahmudul-islam32?tab=packages
2. For each package (erp-auth-service, erp-inventory-service, etc.):
   - Click on the package
   - Click **Package settings** (right side)
   - Scroll to **Danger Zone**
   - Click **Change visibility** → Select **Public**
   - Type package name to confirm

#### Step 4: Pull and deploy on EC2

```bash
# On EC2
cd ~/erp
docker compose pull
docker compose up -d
```

---

### **Option 3: Build and Push Manually from Local Machine**

Build images locally and push to GHCR:

```bash
# On your local machine
cd ~/Desktop/erp-ai-microservices

# Login to GHCR
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u mahmudul-islam32 --password-stdin

# Build and push auth-service
cd auth-service
docker build -t ghcr.io/mahmudul-islam32/erp-auth-service:latest .
docker push ghcr.io/mahmudul-islam32/erp-auth-service:latest

# Build and push inventory-service
cd ../inventory-service
docker build -t ghcr.io/mahmudul-islam32/erp-inventory-service:latest .
docker push ghcr.io/mahmudul-islam32/erp-inventory-service:latest

# Build and push sales-service
cd ../sales-service
docker build -t ghcr.io/mahmudul-islam32/erp-sales-service:latest .
docker push ghcr.io/mahmudul-islam32/erp-sales-service:latest

# Build and push frontend (with build args)
cd ../erp-frontend
docker build \
  --build-arg VITE_AUTH_SERVICE_URL=http://YOUR_EC2_IP:8001 \
  --build-arg VITE_INVENTORY_SERVICE_URL=http://YOUR_EC2_IP:8002 \
  --build-arg VITE_SALES_SERVICE_URL=http://YOUR_EC2_IP:8003 \
  --build-arg VITE_STRIPE_PUBLIC_KEY=your_stripe_key \
  -t ghcr.io/mahmudul-islam32/erp-frontend:latest .
docker push ghcr.io/mahmudul-islam32/erp-frontend:latest
```

Then on EC2:
```bash
docker compose pull
docker compose up -d
```

---

## 🚀 Quick Fix Command (On EC2)

**If you have the code on EC2**, use this one command:

```bash
# Navigate to project directory
cd ~/erp-ai-microservices

# Build and run locally
docker compose -f docker-compose.local.yml up -d --build

# Check status
docker compose -f docker-compose.local.yml ps
```

---

## 📋 Complete Step-by-Step (Recommended for First Deploy)

### On Your Local Machine:

```bash
# 1. Navigate to project
cd ~/Desktop/erp-ai-microservices

# 2. Copy docker-compose.local.yml to EC2
scp -i your-key.pem docker-compose.local.yml ubuntu@YOUR_EC2_IP:~/erp/docker-compose.yml

# 3. Copy all service directories to EC2
scp -i your-key.pem -r auth-service ubuntu@YOUR_EC2_IP:~/erp/
scp -i your-key.pem -r inventory-service ubuntu@YOUR_EC2_IP:~/erp/
scp -i your-key.pem -r sales-service ubuntu@YOUR_EC2_IP:~/erp/
scp -i your-key.pem -r erp-frontend ubuntu@YOUR_EC2_IP:~/erp/
scp -i your-key.pem -r scripts ubuntu@YOUR_EC2_IP:~/erp/
```

### On EC2:

```bash
# 1. SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# 2. Navigate to project
cd ~/erp

# 3. Make sure .env file exists
ls -la .env

# 4. Update .env if needed
nano .env

# 5. Build and deploy
docker compose up -d --build

# 6. Check logs
docker compose logs -f

# 7. Verify services
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
```

---

## 🔍 Verify Deployment

```bash
# Check all containers are running
docker compose ps

# Should show:
# erp-mongodb          Up
# erp-redis            Up
# erp-auth-service     Up
# erp-inventory-service Up
# erp-sales-service    Up
# erp-frontend         Up

# Check logs
docker compose logs --tail=50

# Test services
curl http://localhost:8001/health  # Should return 200
curl http://localhost:8002/health  # Should return 200
curl http://localhost:8003/health  # Should return 200
curl http://localhost:80           # Should return frontend
```

---

## ⚠️ Fix Docker Compose Version Warning

The warning about `version` is harmless but you can remove it:

```bash
# On EC2, edit docker-compose.yml
nano ~/erp/docker-compose.yml

# Remove the first line: version: '3.8'
# Save and exit
```

Or use this command:
```bash
sed -i '1d' ~/erp/docker-compose.yml  # Remove first line
```

---

## 🆘 Still Having Issues?

### Issue: "Cannot connect to Docker daemon"
```bash
sudo usermod -aG docker ubuntu
exit  # Logout
# SSH back in
```

### Issue: "Out of disk space"
```bash
# Check disk space
df -h

# Clean up
docker system prune -af
```

### Issue: "Port already in use"
```bash
# Check what's using the port
sudo netstat -tulpn | grep :8001

# Stop conflicting service
docker compose down
```

### Issue: "MongoDB connection failed"
```bash
# Check MongoDB is running
docker compose ps mongodb

# Check MongoDB logs
docker compose logs mongodb

# Restart MongoDB
docker compose restart mongodb
```

---

## 📝 Summary

**Fastest solution**: Build locally on EC2
```bash
# Copy code to EC2, then:
cd ~/erp-ai-microservices
docker compose -f docker-compose.local.yml up -d --build
```

**Production solution**: Use GitHub Actions (requires GitHub setup first)
```bash
# Push to GitHub → GitHub Actions builds → Deploy on EC2
git push origin main
# Wait for GitHub Actions
# Then on EC2: docker compose pull && docker compose up -d
```

---

## ✅ Next Steps After Successful Deploy

1. Access your app: `http://YOUR_EC2_IP`
2. Create admin user
3. Test all features
4. Set up GitHub Actions for auto-deploy
5. Configure custom domain (optional)
6. Set up SSL certificate (optional)

---

**Need more help?** Check:
- [QUICK_DEPLOY.md](QUICK_DEPLOY.md)
- [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)
- [DEPLOY_CHEATSHEET.md](DEPLOY_CHEATSHEET.md)

