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

  Ports 80 and 443 are only used once you put Nginx in front of the app (see [SSL/HTTPS Setup](#4-sslhttps-setup-recommended)). `docker-compose.prod.yml` also publishes Redis on port 6379 without a password, so do not open 6379 in the security group. Docker writes its own iptables rules for published ports, which means UFW alone does not block them; the security group is what keeps Redis private.

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

**Use the repository's `.env.example` as a reference and set at least:**

```env
# Required: docker-compose.prod.yml stops with an error if any of these is missing
MONGODB_ATLAS_HOST=your-cluster.mongodb.net
MONGODB_ATLAS_USER=your_mongodb_atlas_username
MONGODB_ATLAS_PASSWORD=<generate-a-strong-password>

# Strongly recommended
JWT_SECRET_KEY=<python3 -c "import secrets; print(secrets.token_urlsafe(64))">
STRIPE_SECRET_KEY=sk_test_your_key_from_dashboard_stripe_com
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
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
# Do not allow 6379: Redis is published on the host but has no password

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
# <contents of your private key file>
```

Paste this **entire content** as the `EC2_SSH_KEY` secret.

---

## Environment Variables

### Production Environment File Structure

Create `.env` file on EC2 at `~/erp/.env`:

The production compose file does not start a MongoDB container. Every service connects to MongoDB Atlas through a connection string built from the three `MONGODB_ATLAS_*` values.

```env
# MongoDB Atlas (required)
MONGODB_ATLAS_HOST=your-cluster.mongodb.net
MONGODB_ATLAS_USER=your_mongodb_atlas_username
MONGODB_ATLAS_PASSWORD=<generate-a-strong-password>

# JWT
JWT_SECRET_KEY=<python3 -c "import secrets; print(secrets.token_urlsafe(64))">
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

If `JWT_SECRET_KEY` is not set, the compose file falls back to a placeholder secret, so always set it in production. The deploy workflow exports `IMAGE_REGISTRY=ghcr.io`, `IMAGE_PREFIX=mahmudul-islam32/erp` and `IMAGE_TAG=latest` before it runs Docker Compose, which takes precedence over the `IMAGE_*` values in `.env`; those values only apply when you run Compose by hand.

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
        role='super_admin'
    )
    
    user = await service.create_user(admin)
    print(f'Admin created: {user.email}')

asyncio.run(create_admin())
"
```

The auth service does not create an admin account on its own. The `role` value must be one of the lowercase `UserRole` values from `auth-service/app/models/user.py`, such as `super_admin`, and the password has to pass the password rules from the security settings (by default at least 8 characters with upper case, lower case and a number).

### 2. Load Demo Data (Optional)

```bash
# Auth demo data (also creates admin@example.com / Admin123)
docker compose exec auth-service python scripts/seed_demo_data.py

# Sales demo data
docker compose exec sales-service python scripts/seed_demo_data.py
```

The inventory seed is `npm run seed`, which runs through `ts-node`. That is a dev dependency, and the production image removes dev dependencies after the build, so run the inventory seed from a local checkout of `inventory-service` with `MONGODB_URI` pointing at your Atlas cluster instead of inside the container. Demo accounts use well-known passwords, so change or remove them on a public server.

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

Production uses MongoDB Atlas, so there is no `mongodb` container to inspect. Look at the service logs and check the Atlas side instead:

```bash
# Connection errors show up in the service logs
docker compose logs auth-service | grep -i mongo

# Confirm the Atlas values are present in .env
grep MONGODB_ATLAS ~/erp/.env
```

- Make sure the EC2 instance's public IP is on the Atlas project's IP access list.
- Check that the Atlas database user and password match `MONGODB_ATLAS_USER` and `MONGODB_ATLAS_PASSWORD`.

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

The data lives in MongoDB Atlas, so use Atlas backups for your cluster tier, or run `mongodump` from any machine that has the MongoDB Database Tools installed and is allowed by the Atlas IP access list:

```bash
# Create backup
mongodump \
  --uri="mongodb+srv://USER:PASSWORD@your-cluster.mongodb.net/" \
  --out=./mongodb-backup-$(date +%Y%m%d)

# Compress backup
tar -czf mongodb-backup-$(date +%Y%m%d).tar.gz ./mongodb-backup-$(date +%Y%m%d)
```

### Restore MongoDB Data

```bash
mongorestore \
  --uri="mongodb+srv://USER:PASSWORD@your-cluster.mongodb.net/" \
  ./mongodb-backup-YYYYMMDD
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

