# ✅ Deployment Checklist - Before First Deploy

Before pushing to GitHub for automated deployment, ensure these steps are completed.

## 🔧 On EC2 Instance (One-Time Setup)

### 1. **Create .env File** ⚠️ CRITICAL

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Create app directory
mkdir -p ~/erp
cd ~/erp

# Create .env file
nano .env
```

**Paste this configuration (update YOUR_* values):**

```bash
# GitHub Container Registry
GITHUB_USERNAME=mahmudul-islam32

# MongoDB Configuration
MONGODB_URL=mongodb+srv://erp_admin:YOUR_PASSWORD@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-min-32-characters-long
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Service Configuration
ENVIRONMENT=production
LOG_LEVEL=INFO

# Sales Configuration
DEFAULT_TAX_RATE=0.08
DEFAULT_CURRENCY=USD

# Stripe Payment Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_API_VERSION=2023-10-16

# MongoDB (if using local instead of Atlas)
MONGO_USERNAME=admin
MONGO_PASSWORD=password123
```

**Save**: Press `Ctrl+X`, then `Y`, then `Enter`

### 2. **Verify .env File Exists**

```bash
# Check file exists
ls -la ~/erp/.env

# Should show:
# -rw-r--r-- 1 ubuntu ubuntu XXX Oct 9 XX:XX .env
```

---

## 🔑 On GitHub (One-Time Setup)

### Configure GitHub Secrets

Go to: `https://github.com/mahmudul-islam32/erp-ai-microservices/settings/secrets/actions`

Click **"New repository secret"** and add each of these:

| Secret Name | Value | Required |
|-------------|-------|----------|
| `EC2_HOST` | Your EC2 public IP (e.g., `3.85.123.45`) | ✅ YES |
| `EC2_USER` | `ubuntu` | ✅ YES |
| `EC2_SSH_KEY` | Full content of your `.pem` file | ✅ YES |
| `MONGODB_URL` | MongoDB connection string | ✅ YES |
| `JWT_SECRET_KEY` | Your JWT secret (32+ chars) | ✅ YES |
| `STRIPE_SECRET_KEY` | Your Stripe secret key | ✅ YES |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe public key | ✅ YES |
| `VITE_AUTH_SERVICE_URL` | `http://YOUR_EC2_IP:8001` | ✅ YES |
| `VITE_INVENTORY_SERVICE_URL` | `http://YOUR_EC2_IP:8002` | ✅ YES |
| `VITE_SALES_SERVICE_URL` | `http://YOUR_EC2_IP:8003` | ✅ YES |
| `STRIPE_WEBHOOK_SECRET` | Your webhook secret | ⚠️ Optional |

### How to Get EC2_SSH_KEY Value

```bash
# On Mac
cat ~/Downloads/your-key.pem | pbcopy

# On Linux/Windows
cat ~/Downloads/your-key.pem
# Then copy the entire output including:
# -----BEGIN RSA PRIVATE KEY-----
# ... all the content ...
# -----END RSA PRIVATE KEY-----
```

---

## 🐳 On EC2 - Docker Setup (One-Time)

### Ensure Docker is Installed

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Check Docker
docker --version
docker compose version

# If not installed, run:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again
exit
```

---

## 📋 Pre-Deploy Checklist

Before running `git push origin main`:

### EC2 Setup
- [ ] EC2 instance is running
- [ ] Can SSH to EC2: `ssh -i key.pem ubuntu@IP`
- [ ] Docker installed: `docker --version`
- [ ] Docker Compose installed: `docker compose version`
- [ ] User in docker group: `groups | grep docker`
- [ ] Directory exists: `~/erp/`
- [ ] `.env` file created in `~/erp/.env`
- [ ] `.env` has all required variables
- [ ] Can login to GHCR (optional, for private images)

### GitHub Setup
- [ ] Repository exists: `https://github.com/mahmudul-islam32/erp-ai-microservices`
- [ ] All 10 GitHub Secrets configured
- [ ] `EC2_SSH_KEY` has complete .pem file content
- [ ] EC2_HOST has correct public IP
- [ ] Workflow file exists: `.github/workflows/deploy.yml`

### Local Setup
- [ ] All code changes committed
- [ ] Frontend Dockerfile fixed (npm install)
- [ ] package-lock.json regenerated
- [ ] Tested build locally (optional)
- [ ] Ready to push to main

### MongoDB Setup
- [ ] MongoDB Atlas cluster created (or local MongoDB)
- [ ] Database user created
- [ ] Connection string obtained
- [ ] Network access configured (0.0.0.0/0 or EC2 IP)
- [ ] Connection string added to GitHub Secrets and EC2 .env

---

## 🚀 Deploy Now

Once all checkboxes are ✅, deploy:

```bash
# On your local machine
cd ~/Desktop/erp-ai-microservices

# Add all changes
git add .

# Commit
git commit -m "Ready for deployment"

# Push to trigger auto-deploy
git push origin main
```

---

## 📊 Monitor Deployment

### 1. Watch GitHub Actions
```
https://github.com/mahmudul-islam32/erp-ai-microservices/actions
```

**Expected stages:**
- ✅ Build and push images (3-5 min)
- ✅ Deploy to EC2 (1-2 min)
- ✅ Health checks
- ✅ Success!

### 2. Check EC2
```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Check containers
cd ~/erp
docker compose ps

# Should show:
# erp-mongodb           Up
# erp-redis             Up
# erp-auth-service      Up
# erp-inventory-service Up
# erp-sales-service     Up
# erp-frontend          Up

# Check logs
docker compose logs -f
```

### 3. Test Application
```bash
# Health checks
curl http://YOUR_EC2_IP:8001/health
curl http://YOUR_EC2_IP:8002/health
curl http://YOUR_EC2_IP:8003/health

# Frontend
curl http://YOUR_EC2_IP

# Or open in browser:
# http://YOUR_EC2_IP
```

---

## 🐛 Common Issues & Fixes

### Issue: "Permission denied (publickey)"
**Fix:**
```bash
# Verify EC2_SSH_KEY secret has complete .pem content
# Check security group allows SSH from GitHub IPs
```

### Issue: ".env file not found" on EC2
**Fix:**
```bash
ssh -i key.pem ubuntu@YOUR_EC2_IP
cd ~/erp
nano .env
# Create the file with your configuration
```

### Issue: "Cannot connect to MongoDB"
**Fix:**
```bash
# Verify MongoDB URL in both:
# 1. GitHub Secrets (MONGODB_URL)
# 2. EC2 .env file (MONGODB_URL)
# 3. MongoDB Atlas network access allows EC2 IP
```

### Issue: Images not pulling
**Fix:**
```bash
# Make packages public on GitHub:
# https://github.com/mahmudul-islam32?tab=packages
# Or login to GHCR on EC2:
echo TOKEN | docker login ghcr.io -u mahmudul-islam32 --password-stdin
```

### Issue: Deployment fails at health check
**Fix:**
```bash
# SSH to EC2 and check logs
docker compose logs
# Check .env has all required variables
# Restart services: docker compose restart
```

---

## ✅ Success Indicators

After successful deployment:

```
✅ GitHub Actions: All green checkmarks
✅ EC2: All containers "Up" status
✅ Health checks: All return 200 OK
✅ Frontend accessible in browser
✅ Can create user account
✅ All features working
```

---

## 🔄 Future Deployments

After initial setup, deploying is simple:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Automatically deploys! ✨
```

---

## 📚 Related Documentation

- [AWS Deployment Guide](AWS_DEPLOYMENT_GUIDE.md) - Complete setup guide
- [Quick Deploy](QUICK_DEPLOY.md) - Fast deployment in 5 steps
- [Fix Deployment Errors](FIX_DEPLOYMENT_ERROR.md) - Troubleshooting
- [GitHub Actions Info](GITHUB_ACTIONS_CONFIGURED.md) - CI/CD details

---

## 🆘 Need Help?

If deployment fails:

1. **Check GitHub Actions logs** - Shows build/deploy errors
2. **SSH to EC2 and check logs** - `docker compose logs`
3. **Verify all secrets** - GitHub Settings → Secrets
4. **Check .env on EC2** - `cat ~/erp/.env`
5. **Review this checklist** - Ensure all steps completed

---

## 🎉 Ready to Deploy!

All checkboxes checked? Let's go:

```bash
git push origin main
```

Watch it deploy at: https://github.com/mahmudul-islam32/erp-ai-microservices/actions

**Good luck! 🚀**

