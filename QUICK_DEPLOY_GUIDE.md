# ⚡ Quick Deploy Guide - 10 Minutes to Production

## 🎯 What You Need

- AWS EC2 instance (Ubuntu 22.04, t3.medium)
- GitHub account
- 10 minutes

---

## 📝 Step 1: EC2 Setup (3 min)

```bash
# SSH into EC2
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP

# Install Docker (one command)
curl -fsSL https://get.docker.com | sh && \
sudo usermod -aG docker $USER && \
sudo apt install -y docker-compose-plugin

# Log out and back in
exit
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP

# Create app directory and .env
mkdir -p ~/erp && cd ~/erp && nano .env
```

**Paste this (update YOUR_XXX values):**
```env
MONGODB_USERNAME=admin
MONGODB_PASSWORD=YourSecurePassword123!
JWT_SECRET_KEY=YourJWTSecretFrom_openssl_rand_base64_64
IMAGE_REGISTRY=ghcr.io
IMAGE_PREFIX=YOUR_GITHUB_USERNAME/erp
IMAGE_TAG=latest
ENVIRONMENT=production
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

Save: `Ctrl+X`, `Y`, `Enter`

**Generate JWT Secret:**
```bash
openssl rand -base64 64
# Copy output and paste into JWT_SECRET_KEY above
```

---

## 🔑 Step 2: GitHub Secrets (3 min)

**Navigate to:**  
GitHub Repo → Settings → Secrets and variables → Actions → New secret

**Add 7 secrets:**

| Name | Value |
|------|-------|
| `EC2_SSH_KEY` | Content of `cat ~/.ssh/your-key.pem` (entire file) |
| `EC2_HOST` | `54.123.45.67` (your EC2 IP) |
| `EC2_USER` | `ubuntu` |
| `VITE_AUTH_SERVICE_URL` | `http://54.123.45.67:8001` |
| `VITE_INVENTORY_SERVICE_URL` | `http://54.123.45.67:8002` |
| `VITE_SALES_SERVICE_URL` | `http://54.123.45.67:8003` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_xxx` (optional) |

---

## 🚀 Step 3: Deploy (2 min)

```bash
# On your local machine
cd /path/to/erp-ai-microservices

# Add, commit, push
git add .
git commit -m "Deploy to production"
git push origin main
```

**Watch deployment:**  
GitHub → Actions tab → Wait ~5 minutes

---

## ✅ Step 4: Verify (2 min)

```bash
# SSH into EC2
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP

# Check containers
cd ~/erp
docker compose ps

# Should see 6 containers "Up (healthy)"

# Test endpoints
curl http://localhost:8001/health  # Auth
curl http://localhost:8002/health  # Inventory
curl http://localhost:8003/health  # Sales
curl http://localhost:8080         # Frontend
```

**Open browser:**
```
http://YOUR_EC2_IP:8080
```

---

## 👤 Step 5: Create Admin

```bash
# Quick command to create admin
docker compose exec auth-service python -c "
import asyncio
from app.database import connect_to_mongo
from app.services.user_service import UserService
from app.models.user import UserCreate

async def create_admin():
    await connect_to_mongo()
    user = await UserService().create_user(UserCreate(
        email='admin@yourdomain.com',
        password='Admin123!',
        first_name='Admin',
        last_name='User',
        role='SUPER_ADMIN',
        is_active=True
    ))
    print(f'✅ Admin: {user.email}')

asyncio.run(create_admin())
"
```

**Login:**
```
Email: admin@yourdomain.com
Password: Admin123!
```

⚠️ **Change password after first login!**

---

## 🎉 Done!

Your ERP is now live at: `http://YOUR_EC2_IP:8080`

---

## 📋 Quick Commands

```bash
# Check status
docker compose ps

# View logs
docker compose logs -f

# Restart service
docker compose restart auth-service

# Update deployment
docker compose pull && docker compose up -d

# Backup MongoDB
docker compose exec mongodb mongodump --out=/backup
docker cp erp-mongodb:/backup ./backup-$(date +%Y%m%d)
```

---

## 🆘 Troubleshooting

**Containers not starting?**
```bash
docker compose logs
cat .env  # Check all values are set
```

**GitHub Actions failing?**
- Check all 7 secrets are set
- Verify EC2 Security Group allows port 22 (SSH)
- Test SSH: `ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP`

**Can't access from browser?**
- Check EC2 Security Group allows ports 8001-8003, 8080
- Test: `curl http://YOUR_EC2_IP:8080`

---

## 📖 Full Documentation

- **Complete Guide**: `docs/DEPLOYMENT.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Fix Details**: `GITHUB_ACTIONS_FIXED.md`
- **Full Summary**: `DEPLOYMENT_FIX_SUMMARY.md`

---

## 🔒 Security Checklist

- [ ] Change admin password
- [ ] Use strong MongoDB password
- [ ] Set up SSL/HTTPS
- [ ] Configure firewall (UFW)
- [ ] Set up automated backups
- [ ] Enable monitoring

---

**Time to Production:** ~10 minutes  
**Difficulty:** Easy  
**Status:** ✅ Ready to Deploy

---

**Need help?** Check `docs/DEPLOYMENT.md` for detailed instructions.

