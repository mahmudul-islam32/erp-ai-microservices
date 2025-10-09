# ✅ GitHub Actions - EC2 Deployment Only

## 🎯 Current Configuration

Your repository now has **only ONE GitHub Actions workflow**:

### `.github/workflows/deploy.yml` - EC2 Auto-Deployment

**Triggers on:**
- Push to `main` or `master` branch
- Manual workflow dispatch

**What it does:**
1. ✅ Builds all Docker images (Auth, Inventory, Sales, Frontend)
2. ✅ Pushes to GitHub Container Registry (ghcr.io)
3. ✅ SSHs to your EC2 instance
4. ✅ Pulls latest images
5. ✅ Deploys with zero downtime
6. ✅ Runs health checks

**Images built:**
- `ghcr.io/mahmudul-islam32/erp-auth-service:latest`
- `ghcr.io/mahmudul-islam32/erp-inventory-service:latest`
- `ghcr.io/mahmudul-islam32/erp-sales-service:latest`
- `ghcr.io/mahmudul-islam32/erp-frontend:latest`

---

## 🗑️ Removed Workflows

The following workflows have been **removed**:
- ❌ `.github/workflows/frontend-pages.yml` (GitHub Pages deployment)
- ❌ `.github/workflows/backend-render.yml` (Render.com deployment)

---

## 🚀 How to Use

### First-time Setup:

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Configure EC2 deployment"
   git push origin main
   ```

2. **Configure GitHub Secrets** (one-time):
   
   Go to: `https://github.com/mahmudul-islam32/erp-ai-microservices/settings/secrets/actions`
   
   Add these secrets:
   ```
   EC2_HOST = your-ec2-ip
   EC2_USER = ubuntu
   EC2_SSH_KEY = (paste entire .pem file)
   MONGODB_URL = mongodb+srv://...
   JWT_SECRET_KEY = your-secret-key
   STRIPE_SECRET_KEY = sk_test_...
   STRIPE_PUBLISHABLE_KEY = pk_test_...
   VITE_AUTH_SERVICE_URL = http://your-ec2-ip:8001
   VITE_INVENTORY_SERVICE_URL = http://your-ec2-ip:8002
   VITE_SALES_SERVICE_URL = http://your-ec2-ip:8003
   ```

3. **Prepare EC2** (one-time):
   ```bash
   # SSH to EC2
   ssh -i your-key.pem ubuntu@YOUR_EC2_IP
   
   # Create app directory and .env
   mkdir -p ~/erp
   cd ~/erp
   nano .env
   # (add your configuration)
   ```

### Daily Use:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# ✨ Automatically deploys to EC2!
```

---

## 📊 Monitor Deployments

### View Workflow Runs:
https://github.com/mahmudul-islam32/erp-ai-microservices/actions

### Check EC2 Status:
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
cd ~/erp
docker compose ps
docker compose logs -f
```

### Health Checks:
```bash
curl http://YOUR_EC2_IP:8001/health  # Auth
curl http://YOUR_EC2_IP:8002/health  # Inventory
curl http://YOUR_EC2_IP:8003/health  # Sales
curl http://YOUR_EC2_IP              # Frontend
```

---

## 🔧 Workflow Details

### Build Phase (3-5 min):
- Checks out code
- Sets up Docker Buildx
- Logs into GitHub Container Registry
- Builds 4 Docker images in parallel
- Pushes to GHCR with caching

### Deploy Phase (1-2 min):
- Copies docker-compose.yml to EC2
- SSHs to EC2
- Logs into GHCR
- Pulls latest images
- Deploys with `docker compose up -d`
- Runs health checks on all services
- Cleans up old images

---

## 🎯 Workflow File Location

```
.github/workflows/deploy.yml
```

### Customize if needed:
- Change AWS region (line 9)
- Modify build args (lines 50-54)
- Add more services
- Change deployment commands

---

## ⚡ Quick Commands

### Manual Trigger:
```bash
# From GitHub UI:
# Actions → Deploy ERP Microservices to AWS EC2 → Run workflow
```

### Test Deployment:
```bash
# Make a small change
echo "# Test" >> README.md
git add .
git commit -m "Test deployment"
git push origin main

# Watch: https://github.com/mahmudul-islam32/erp-ai-microservices/actions
```

### Rollback if needed:
```bash
# On EC2
ssh -i key.pem ubuntu@YOUR_EC2_IP
cd ~/erp
docker compose down
# Pull specific version if needed
docker compose up -d
```

---

## 📋 Deployment Checklist

Before pushing:
- [ ] Code tested locally
- [ ] All tests passing
- [ ] .env configured on EC2
- [ ] GitHub Secrets set up
- [ ] EC2 has enough disk space

After pushing:
- [ ] GitHub Actions completed successfully
- [ ] All containers running on EC2
- [ ] Health checks passing
- [ ] Application accessible

---

## 🐛 Troubleshooting

### Workflow fails at build:
- Check Dockerfiles are valid
- Verify all build contexts exist
- Check GitHub Actions logs

### Workflow fails at deploy:
- Verify EC2_SSH_KEY secret is correct
- Check EC2 security group allows SSH from GitHub
- Verify EC2 is running

### Images not pulling:
- Make packages public on GitHub
- Or login to GHCR on EC2:
  ```bash
  echo TOKEN | docker login ghcr.io -u mahmudul-islam32 --password-stdin
  ```

### Services not starting:
- Check .env file on EC2
- Verify MongoDB connection
- Check logs: `docker compose logs`

---

## 🎉 Success!

Your GitHub Actions is now configured for **AWS EC2 deployment only**.

Every push to `main` automatically:
- ✅ Builds images
- ✅ Deploys to EC2
- ✅ Zero downtime
- ✅ Health checks

**No other deployment workflows are active.**

---

## 📚 Related Documentation

- [AWS Deployment Guide](AWS_DEPLOYMENT_GUIDE.md)
- [Quick Deploy](QUICK_DEPLOY.md)
- [Deployment Summary](DEPLOYMENT_SUMMARY.md)
- [Fix Deployment Errors](FIX_DEPLOYMENT_ERROR.md)

---

**Happy Deploying! 🚀**

