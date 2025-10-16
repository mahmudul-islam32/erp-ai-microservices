# 🚀 Production Deployment Guide

This guide covers deploying the ERP Microservices application to production using AWS EC2 and GitHub Actions.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS EC2 Setup](#aws-ec2-setup)
3. [Server Configuration](#server-configuration)
4. [GitHub Secrets Setup](#github-secrets-setup)
5. [Environment Variables](#environment-variables)
6. [Deployment Process](#deployment-process)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ AWS Account with EC2 access
- ✅ GitHub account with repository access
- ✅ Domain name (optional, for custom domain)
- ✅ Stripe account (optional, for payments)
- ✅ SSH key pair for EC2 access

---

## AWS EC2 Setup

### 1. Launch EC2 Instance

**Recommended Specifications:**

- **Instance Type**: `t3.medium` or higher (2 vCPU, 4GB RAM minimum)
- **OS**: Ubuntu 22.04 LTS
- **Storage**: 20GB+ General Purpose SSD (gp3)
- **Security Group Rules**:
  ```
  Port 22   (SSH)       - Your IP only
  Port 80   (HTTP)      - 0.0.0.0/0
  Port 443  (HTTPS)     - 0.0.0.0/0
  Port 8001 (Auth API)  - 0.0.0.0/0 (or use reverse proxy)
  Port 8002 (Inventory) - 0.0.0.0/0 (or use reverse proxy)
  Port 8003 (Sales)     - 0.0.0.0/0 (or use reverse proxy)
  Port 8080 (Frontend)  - 0.0.0.0/0
  ```

### 2. Create or Import SSH Key Pair

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -f ~/.ssh/erp-ec2-key
```

Import this key to AWS EC2 or use AWS to generate one.

### 3. Allocate Elastic IP (Optional but Recommended)

- Go to EC2 → Elastic IPs
- Allocate a new Elastic IP
- Associate it with your EC2 instance

This ensures your IP doesn't change when you restart the instance.

---

## Server Configuration

### 1. Connect to EC2

```bash
ssh -i ~/.ssh/erp-ec2-key.pem ubuntu@YOUR_EC2_IP
```

### 2. Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

**Log out and log back in** for group changes to take effect.

### 3. Create Application Directory

```bash
mkdir -p ~/erp
cd ~/erp
```

### 4. Configure Environment Variables

```bash
# Download the example env file from your repository
nano .env
```

**Copy contents from `env.production.example` and update:**

```env
# Required changes:
MONGODB_PASSWORD=your_secure_mongodb_password_here
JWT_SECRET_KEY=your_jwt_secret_from_openssl
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_public_key
```

**Generate JWT Secret:**

```bash
openssl rand -base64 64
```

### 5. Configure Firewall (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp

# Allow application ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8001/tcp
sudo ufw allow 8002/tcp
sudo ufw allow 8003/tcp
sudo ufw allow 8080/tcp

# Check status
sudo ufw status
```

---

## GitHub Secrets Setup

### 1. Navigate to Repository Settings

Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

### 2. Add Required Secrets

Click **"New repository secret"** and add the following:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `EC2_SSH_KEY` | Private SSH key content | Contents of `~/.ssh/erp-ec2-key` |
| `EC2_HOST` | EC2 public IP or domain | `54.123.45.67` |
| `EC2_USER` | SSH user (usually ubuntu) | `ubuntu` |
| `VITE_AUTH_SERVICE_URL` | Public auth service URL | `http://YOUR_IP:8001` |
| `VITE_INVENTORY_SERVICE_URL` | Public inventory service URL | `http://YOUR_IP:8002` |
| `VITE_SALES_SERVICE_URL` | Public sales service URL | `http://YOUR_IP:8003` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key (optional) | `pk_live_...` |

**Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions.

### 3. Get EC2_SSH_KEY Content

```bash
# On your local machine
cat ~/.ssh/erp-ec2-key

# Copy the entire output including:
# -----BEGIN RSA PRIVATE KEY-----
# ... content ...
# -----END RSA PRIVATE KEY-----
```

Paste this **entire content** as the `EC2_SSH_KEY` secret.

---

## Environment Variables

### Production Environment File Structure

Create `.env` file on EC2 at `~/erp/.env`:

```env
# MongoDB
MONGODB_USERNAME=admin
MONGODB_PASSWORD=your_secure_password

# JWT
JWT_SECRET_KEY=your_jwt_secret_here
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Docker Images
IMAGE_REGISTRY=ghcr.io
IMAGE_PREFIX=your-github-username/erp
IMAGE_TAG=latest

# Stripe (optional)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# General
ENVIRONMENT=production
NODE_ENV=production
LOG_LEVEL=INFO
DEBUG=false
```

---

## Deployment Process

### Automatic Deployment (Recommended)

The application automatically deploys when you push to `main` or `master` branch.

**Steps:**

1. **Make changes locally**
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. **Monitor deployment:**
   - Go to GitHub → Actions tab
   - Watch the workflow execution
   - Check logs if errors occur

### Manual Deployment

If you need to deploy manually on EC2:

```bash
# SSH into EC2
ssh -i ~/.ssh/erp-ec2-key.pem ubuntu@YOUR_EC2_IP

# Navigate to app directory
cd ~/erp

# Pull latest images
docker compose pull

# Stop old containers
docker compose down

# Start new containers
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

---

## Post-Deployment

### 1. Create Admin User

```bash
# SSH into EC2
ssh -i ~/.ssh/erp-ec2-key.pem ubuntu@YOUR_EC2_IP

# Run the setup script to create admin
cd ~/erp
docker compose exec auth-service python -c "
import asyncio
from app.database import connect_to_mongo, get_database
from app.services.user_service import UserService
from app.models.user import UserCreate

async def create_admin():
    await connect_to_mongo()
    db = get_database()
    service = UserService()
    
    admin = UserCreate(
        email='admin@yourdomain.com',
        password='ChangeMe123!',
        first_name='Admin',
        last_name='User',
        role='SUPER_ADMIN',
        is_active=True
    )
    
    user = await service.create_user(admin)
    print(f'Admin created: {user.email}')

asyncio.run(create_admin())
"
```

### 2. Load Demo Data (Optional)

```bash
# Auth demo data
docker compose exec auth-service python scripts/seed_demo_data.py

# Inventory demo data
docker compose exec inventory-service npm run seed:demo

# Sales demo data
docker compose exec sales-service python scripts/seed_demo_data.py
```

### 3. Test the Application

**Check Services:**

```bash
# Health checks
curl http://localhost:8001/health  # Auth
curl http://localhost:8002/health  # Inventory
curl http://localhost:8003/health  # Sales
curl http://localhost:8080         # Frontend
```

**Access from Browser:**

```
Frontend: http://YOUR_EC2_IP:8080
API Docs: http://YOUR_EC2_IP:8001/docs
```

**Login Credentials:**

```
Email: admin@yourdomain.com
Password: ChangeMe123!
```

### 4. SSL/HTTPS Setup (Recommended)

**Option 1: Using Nginx Reverse Proxy with Let's Encrypt**

```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# Configure Nginx (create /etc/nginx/sites-available/erp)
sudo nano /etc/nginx/sites-available/erp
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Auth API
    location /api/auth/ {
        proxy_pass http://localhost:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Inventory API
    location /api/inventory/ {
        proxy_pass http://localhost:8002/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Sales API
    location /api/sales/ {
        proxy_pass http://localhost:8003/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Enable site and get SSL certificate:**

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

---

## Troubleshooting

### Common Issues

**1. Port Already in Use**

```bash
# Find process using port
sudo lsof -i :8001

# Kill process
sudo kill -9 <PID>
```

**2. Out of Disk Space**

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -af
docker volume prune -f

# Clean system
sudo apt clean
sudo apt autoremove
```

**3. Container Fails to Start**

```bash
# Check logs
docker compose logs auth-service
docker compose logs inventory-service
docker compose logs sales-service

# Check container status
docker compose ps

# Restart specific service
docker compose restart auth-service
```

**4. MongoDB Connection Issues**

```bash
# Check MongoDB is running
docker compose ps mongodb

# Check MongoDB logs
docker compose logs mongodb

# Restart MongoDB
docker compose restart mongodb
```

**5. GitHub Actions Failing**

- Verify all GitHub secrets are set correctly
- Check EC2 security groups allow SSH (port 22)
- Ensure EC2 instance is running
- Verify SSH key has correct permissions
- Check GitHub Actions logs for specific errors

---

## Monitoring & Maintenance

### Monitoring Container Health

```bash
# Check all containers
docker compose ps

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f auth-service

# Check resource usage
docker stats
```

### Backup MongoDB Data

```bash
# Create backup
docker compose exec mongodb mongodump \
  --username=admin \
  --password=YOUR_PASSWORD \
  --authenticationDatabase=admin \
  --out=/backup

# Copy backup from container
docker cp erp-mongodb:/backup ./mongodb-backup-$(date +%Y%m%d)

# Compress backup
tar -czf mongodb-backup-$(date +%Y%m%d).tar.gz ./mongodb-backup-$(date +%Y%m%d)
```

### Restore MongoDB Data

```bash
# Copy backup to container
docker cp ./mongodb-backup-YYYYMMDD erp-mongodb:/restore

# Restore
docker compose exec mongodb mongorestore \
  --username=admin \
  --password=YOUR_PASSWORD \
  --authenticationDatabase=admin \
  /restore
```

### Update Application

```bash
# Pull latest changes
cd ~/erp
docker compose pull

# Restart services
docker compose down
docker compose up -d

# Check logs
docker compose logs -f
```

### Log Rotation

```bash
# Configure Docker log rotation
sudo nano /etc/docker/daemon.json
```

Add:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
# Restart Docker
sudo systemctl restart docker
```

---

## Security Best Practices

### 1. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker compose pull
docker compose up -d
```

### 2. Change Default Credentials

- ✅ Change admin password immediately after first login
- ✅ Use strong MongoDB passwords
- ✅ Rotate JWT secrets periodically

### 3. Enable Firewall

```bash
sudo ufw enable
sudo ufw status
```

### 4. Monitor Logs

```bash
# Check auth logs
sudo tail -f /var/log/auth.log

# Check application logs
docker compose logs --tail=100
```

### 5. Regular Backups

- ✅ Set up automated MongoDB backups
- ✅ Back up `.env` file securely
- ✅ Keep backups in a different location

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Docker logs: `docker compose logs`
3. Check GitHub Actions logs
4. Review security group settings
5. Verify all environment variables are set

---

## Next Steps

- ✅ Set up domain name and SSL certificate
- ✅ Configure email notifications
- ✅ Set up monitoring (e.g., CloudWatch, Datadog)
- ✅ Configure automated backups
- ✅ Set up CI/CD for staging environment
- ✅ Implement log aggregation

---

**Congratulations! 🎉 Your ERP application is now deployed to production!**

