# 🚀 Your Deployment Configuration

**GitHub Username**: `mahmudul-islam32`

---

## ✅ Files Updated with Your Username

1. ✅ `docker-compose.prod.yml` - All Docker images updated
2. ✅ `.github/workflows/deploy.yml` - CI/CD workflow updated
3. ✅ `env.production.template` - Environment template updated

---

## 📦 Your Docker Images

Your services will use these images from GitHub Container Registry:

- **Auth Service**: `ghcr.io/mahmudul-islam32/erp-auth-service:latest`
- **Inventory Service**: `ghcr.io/mahmudul-islam32/erp-inventory-service:latest`
- **Sales Service**: `ghcr.io/mahmudul-islam32/erp-sales-service:latest`
- **Frontend**: `ghcr.io/mahmudul-islam32/erp-frontend:latest`

---

## 🔑 Your GitHub Personal Access Token

Before deploying, create a GitHub Personal Access Token:

1. Go to: https://github.com/settings/tokens/new
2. Name: `ERP Deployment Token`
3. Expiration: `90 days` or `No expiration`
4. Select scopes:
   - ✅ `read:packages`
   - ✅ `write:packages`
   - ✅ `delete:packages` (optional)
5. Click **Generate token**
6. **Copy the token** - you'll need it!

---

## 🚀 Quick Deploy Commands

### On Your EC2 Instance:

```bash
# 1. Login to GitHub Container Registry
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u mahmudul-islam32 --password-stdin

# 2. Create .env file
cd ~/erp
cat > .env << 'EOF'
GITHUB_USERNAME=mahmudul-islam32
MONGODB_URL=your-mongodb-connection-string
JWT_SECRET_KEY=your-secret-key-min-32-chars
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
ENVIRONMENT=production
LOG_LEVEL=INFO
DEFAULT_TAX_RATE=0.08
DEFAULT_CURRENCY=USD
EOF

# 3. Create docker-compose.yml (copy from docker-compose.prod.yml)
# Images are already configured with your username!

# 4. Deploy
docker compose up -d

# 5. Check status
docker compose ps
curl http://localhost:8001/health
```

---

## 🔄 GitHub Secrets for CI/CD

Configure these in: **GitHub → Settings → Secrets → Actions**

### Required Secrets:

| Secret Name | Value |
|-------------|-------|
| `EC2_HOST` | Your EC2 public IP |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Content of your .pem file |
| `MONGODB_URL` | Your MongoDB connection string |
| `JWT_SECRET_KEY` | Your JWT secret (32+ chars) |
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe public key |
| `VITE_AUTH_SERVICE_URL` | `http://YOUR_EC2_IP:8001` |
| `VITE_INVENTORY_SERVICE_URL` | `http://YOUR_EC2_IP:8002` |
| `VITE_SALES_SERVICE_URL` | `http://YOUR_EC2_IP:8003` |

### How to Add Secrets:

1. Go to your repository: https://github.com/mahmudul-islam32/erp-ai-microservices
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret from the table above

---

## 📝 Your .env File Template

Copy this to your EC2 instance at `~/erp/.env`:

```bash
# GitHub Container Registry
GITHUB_USERNAME=mahmudul-islam32

# MongoDB Configuration (Update with your actual values)
MONGODB_URL=mongodb+srv://erp_admin:YOUR_PASSWORD@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET_KEY=generate-a-secure-random-32-character-string
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
```

---

## 🎯 Next Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Configure deployment with GitHub username"
git push origin main
```

### Step 2: Create GitHub Token
- Go to: https://github.com/settings/tokens/new
- Select: `read:packages`, `write:packages`
- Copy token

### Step 3: Configure GitHub Secrets
- Add all secrets listed above
- Make sure EC2_SSH_KEY contains full .pem file content

### Step 4: Deploy
- Push to main branch → Auto-deploys via GitHub Actions!
- Or manually deploy on EC2 using commands above

---

## ✅ Verification Checklist

After deployment:

- [ ] GitHub repository exists: `mahmudul-islam32/erp-ai-microservices`
- [ ] GitHub token created with package permissions
- [ ] All GitHub secrets configured
- [ ] EC2 instance running
- [ ] MongoDB Atlas cluster created
- [ ] .env file created on EC2 with your values
- [ ] Docker images building and pushing successfully
- [ ] Services running on EC2
- [ ] Health checks passing
- [ ] Application accessible at `http://YOUR_EC2_IP`

---

## 🔗 Your Repository

Make sure your repository is at:
**https://github.com/mahmudul-islam32/erp-ai-microservices**

If not, update the repository name or the username in the files.

---

## 📚 Documentation

Refer to these guides for detailed instructions:

- **Quick Deploy**: [QUICK_DEPLOY.md](QUICK_DEPLOY.md)
- **Complete Guide**: [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)
- **Cheat Sheet**: [DEPLOY_CHEATSHEET.md](DEPLOY_CHEATSHEET.md)

---

## 🆘 Troubleshooting

### Images not found?
```bash
# Make sure you're logged in to GHCR
echo YOUR_TOKEN | docker login ghcr.io -u mahmudul-islam32 --password-stdin

# Verify images exist
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/users/mahmudul-islam32/packages
```

### GitHub Actions failing?
- Check all secrets are configured
- Verify GitHub token has package permissions
- Check repository name matches: `mahmudul-islam32/erp-ai-microservices`

### Can't pull images on EC2?
```bash
# Login to GHCR on EC2
echo YOUR_TOKEN | docker login ghcr.io -u mahmudul-islam32 --password-stdin

# Make images public (optional):
# GitHub → Packages → Select package → Package settings → Change visibility
```

---

## 🎉 You're Ready!

All configuration files are updated with your GitHub username `mahmudul-islam32`.

**Start deploying**: Follow [QUICK_DEPLOY.md](QUICK_DEPLOY.md) or [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)

**Happy Deploying! 🚀**

