# 🚀 Deployment Cheat Sheet - Quick Reference

Copy-paste commands for fast deployment. Bookmark this page!

---

## 📋 Prerequisites

- [ ] AWS Account → [aws.amazon.com/free](https://aws.amazon.com/free)
- [ ] MongoDB Atlas → [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- [ ] GitHub Token → [github.com/settings/tokens](https://github.com/settings/tokens)
- [ ] Stripe Keys → [dashboard.stripe.com](https://dashboard.stripe.com)

---

## ⚡ 5-Minute Deploy

### 1. Launch EC2 (AWS Console)
```
Name: ERP-Microservices
AMI: Ubuntu 22.04 LTS
Type: t2.micro
Key: Create new (save .pem)
Ports: 22, 80, 443, 8001-8003
Storage: 30 GB
```

### 2. Connect to EC2
```bash
chmod 400 ~/Downloads/your-key.pem
ssh -i ~/Downloads/your-key.pem ubuntu@YOUR_EC2_IP
```

### 3. Install Docker
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
mkdir -p ~/erp && cd ~/erp
exit
```

### 4. Configure (SSH back in)
```bash
ssh -i ~/Downloads/your-key.pem ubuntu@YOUR_EC2_IP
cd ~/erp
cat > .env << 'EOF'
GITHUB_USERNAME=your-github-username
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET_KEY=your-32-char-secret-key-here
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
ENVIRONMENT=production
LOG_LEVEL=INFO
DEFAULT_TAX_RATE=0.08
DEFAULT_CURRENCY=USD
EOF
```

### 5. Deploy
```bash
# Login to GHCR
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Create docker-compose.yml (copy from docker-compose.prod.yml)
# Update image names with your GitHub username

# Start
docker compose up -d

# Verify
docker compose ps
curl http://localhost:8001/health
```

**Access**: `http://YOUR_EC2_IP`

---

## 🔧 Common Commands

### EC2 Connection
```bash
# SSH
ssh -i key.pem ubuntu@IP

# Copy file to EC2
scp -i key.pem file.txt ubuntu@IP:~/erp/

# Copy file from EC2
scp -i key.pem ubuntu@IP:~/erp/file.txt ./
```

### Docker Compose
```bash
# Start all
docker compose up -d

# Stop all
docker compose down

# View logs
docker compose logs -f

# Restart service
docker compose restart auth-service

# Update
docker compose pull && docker compose up -d

# Status
docker compose ps

# Clean up
docker system prune -af
```

### Service Management
```bash
# Health checks
curl http://localhost:8001/health  # Auth
curl http://localhost:8002/health  # Inventory
curl http://localhost:8003/health  # Sales
curl http://localhost:80           # Frontend

# View specific logs
docker compose logs -f auth-service
docker compose logs -f inventory-service
docker compose logs -f sales-service

# Restart specific service
docker compose restart auth-service
```

### Monitoring
```bash
# Container stats
docker stats

# Disk usage
df -h

# Container logs
docker compose logs --tail=100

# System info
free -h
top
```

---

## 🔐 GitHub Secrets (for CI/CD)

Settings → Secrets and variables → Actions → New secret

```
EC2_HOST = your-ec2-ip
EC2_USER = ubuntu
EC2_SSH_KEY = [paste entire .pem file]
MONGODB_URL = mongodb+srv://...
JWT_SECRET_KEY = your-secret
STRIPE_SECRET_KEY = sk_...
STRIPE_PUBLISHABLE_KEY = pk_...
VITE_AUTH_SERVICE_URL = http://your-ec2-ip:8001
VITE_INVENTORY_SERVICE_URL = http://your-ec2-ip:8002
VITE_SALES_SERVICE_URL = http://your-ec2-ip:8003
```

---

## 🔄 Update Application

### With CI/CD
```bash
git add .
git commit -m "Update"
git push origin main
# Auto-deploys!
```

### Manual
```bash
ssh -i key.pem ubuntu@IP
cd ~/erp
docker compose pull
docker compose up -d
```

---

## 🐛 Quick Troubleshooting

### Can't SSH?
```bash
chmod 400 key.pem
# Check AWS security group allows your IP
```

### Services down?
```bash
docker compose logs
docker compose restart
```

### Out of space?
```bash
docker system prune -af
docker volume prune
```

### MongoDB connection fails?
```bash
# Check Atlas network access (0.0.0.0/0)
# Verify connection string in .env
mongosh "YOUR_CONNECTION_STRING"
```

### Frontend can't connect to APIs?
```bash
# Rebuild frontend with correct URLs
docker compose up -d --build frontend
```

---

## 📊 MongoDB Atlas Quick Setup

1. **Create account** → [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. **Create organization** → ERP-Organization
3. **Create project** → ERP-Microservices
4. **Build Database** → FREE (M0)
5. **Create user** → erp_admin / auto-password
6. **Network Access** → 0.0.0.0/0
7. **Get connection string** → Copy & replace `<password>`

---

## 🔑 Generate Secure Keys

### JWT Secret (32+ chars)
```bash
openssl rand -base64 32
```

### Random password
```bash
openssl rand -hex 16
```

---

## 📝 .env Template (Copy-Paste)

```bash
# GitHub
GITHUB_USERNAME=your-github-username

# MongoDB Atlas
MONGODB_URL=mongodb+srv://erp_admin:PASSWORD@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority

# Security
JWT_SECRET_KEY=$(openssl rand -base64 32)
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Service
ENVIRONMENT=production
LOG_LEVEL=INFO
DEFAULT_TAX_RATE=0.08
DEFAULT_CURRENCY=USD
```

---

## 🎯 Service URLs

| Service | Development | Production |
|---------|------------|------------|
| Frontend | http://localhost:5173 | http://YOUR_EC2_IP |
| Auth API | http://localhost:8001/docs | http://YOUR_EC2_IP:8001/docs |
| Inventory API | http://localhost:8002/docs | http://YOUR_EC2_IP:8002/docs |
| Sales API | http://localhost:8003/docs | http://YOUR_EC2_IP:8003/docs |

---

## 🔍 Health Check One-Liner

```bash
for port in 8001 8002 8003 80; do echo -n "Port $port: "; curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health || curl -s -o /dev/null -w "%{http_code}" http://localhost:$port; echo; done
```

---

## 💾 Backup & Restore

### Backup
```bash
# MongoDB
docker exec erp-mongodb mongodump --out /tmp/backup
docker cp erp-mongodb:/tmp/backup ./backup-$(date +%Y%m%d)

# Environment
cp ~/erp/.env ~/backups/.env-$(date +%Y%m%d)
```

### Restore
```bash
docker cp ./backup erp-mongodb:/tmp/
docker exec erp-mongodb mongorestore /tmp/backup
```

### Download to local
```bash
scp -i key.pem -r ubuntu@IP:~/backups ./local-backups
```

---

## 📦 Docker Image Management

### GitHub Container Registry
```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Pull image
docker pull ghcr.io/username/erp-auth-service:latest

# List images
docker images | grep ghcr.io
```

### Cleanup
```bash
# Remove unused images
docker image prune -a

# Remove old images (older than 24h)
docker image prune -af --filter "until=24h"

# Remove everything
docker system prune -af --volumes
```

---

## 🔒 Security Quick Wins

```bash
# Firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8001:8003/tcp
sudo ufw enable

# Update system
sudo apt update && sudo apt upgrade -y

# Restrict SSH
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

---

## 🌐 Add Custom Domain (Optional)

### With DuckDNS (Free)
```bash
# 1. Go to duckdns.org
# 2. Create subdomain: your-erp.duckdns.org
# 3. Set IP to EC2 IP
# 4. Install SSL:
sudo certbot certonly --standalone -d your-erp.duckdns.org
```

---

## 💰 Cost Calculator

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| EC2 t2.micro | 750 hrs/mo FREE | $8.50/mo |
| 30 GB EBS | FREE | $2.40/mo |
| MongoDB Atlas M0 | FREE forever | FREE |
| Data Transfer | 15 GB FREE | ~$0.09/GB |
| **Total** | **$0** | **~$10-15/mo** |

**Stop EC2 when not using to save!**

---

## 📚 Quick Links

- **Quick Deploy**: [QUICK_DEPLOY.md](QUICK_DEPLOY.md)
- **Full Guide**: [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)
- **Summary**: [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)
- **Scripts**: [scripts/README.md](scripts/README.md)

---

## ✅ Pre-Flight Checklist

**Before Deploy:**
- [ ] EC2 instance running
- [ ] SSH key downloaded
- [ ] MongoDB Atlas cluster created
- [ ] Connection string ready
- [ ] GitHub token created
- [ ] Stripe keys ready

**After Deploy:**
- [ ] All containers running
- [ ] Health checks passing
- [ ] Frontend accessible
- [ ] APIs accessible
- [ ] Can create user
- [ ] Backups scheduled

---

**🚀 Happy Deploying!**

*Bookmark this page for quick reference!*

