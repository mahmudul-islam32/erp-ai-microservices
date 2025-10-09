# 🚀 AWS EC2 Deployment Guide with CI/CD Pipeline

Complete step-by-step guide to deploy your ERP Microservices to AWS EC2 with GitHub Actions CI/CD.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [MongoDB Setup (MongoDB Atlas)](#mongodb-setup)
4. [EC2 Instance Launch](#ec2-instance-launch)
5. [EC2 Configuration](#ec2-configuration)
6. [GitHub Secrets Configuration](#github-secrets-configuration)
7. [First Deployment](#first-deployment)
8. [Domain & SSL Setup (Optional)](#domain-ssl-setup)
9. [Monitoring & Maintenance](#monitoring-maintenance)

---

## Prerequisites

Before starting, ensure you have:
- ✅ AWS Account (free tier eligible)
- ✅ GitHub Account
- ✅ Domain name (optional, for custom URL)
- ✅ Stripe account (for payment processing)
- ✅ Terminal/Command Line access

---

## Step 1: AWS Account Setup

### 1.1 Create AWS Account

1. Go to [AWS Console](https://aws.amazon.com/free/)
2. Click **Create an AWS Account**
3. Enter your email and password
4. Choose **Personal** account type
5. Enter payment information (required for verification)
6. Complete phone verification
7. Select **Basic Support - Free**

**Note**: You get 12 months of free tier access with:
- 750 hours/month of t2.micro EC2
- 30 GB EBS storage
- 5 GB S3 storage

### 1.2 Create IAM User for Deployment

1. Sign in to AWS Console
2. Go to **IAM** → **Users** → **Create User**
3. User name: `github-actions-deploy`
4. Click **Next**
5. Select **Attach policies directly**
6. Search and attach these policies:
   - `AmazonEC2FullAccess`
   - `AmazonEC2ContainerRegistryFullAccess`
7. Click **Create User**
8. Select the user → **Security Credentials** tab
9. Click **Create Access Key**
10. Select **Third-party service** → Click **Next**
11. **Save both Access Key ID and Secret Access Key** (you'll need these later)

---

## Step 2: MongoDB Setup (MongoDB Atlas Free Tier)

### 2.1 Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with Google/GitHub or email
3. Create a new organization: `ERP-Organization`
4. Create a new project: `ERP-Microservices`

### 2.2 Create Free Cluster

1. Click **Build a Database**
2. Select **FREE** (M0 Sandbox) - 512MB
3. Choose **AWS** as provider
4. Select region closest to your EC2 region (e.g., `us-east-1`)
5. Name your cluster: `erp-cluster`
6. Click **Create**

### 2.3 Configure Database Access

1. Click **Database Access** → **Add New Database User**
2. Authentication Method: **Password**
3. Username: `erp_admin`
4. Auto-generate secure password (save it!)
5. Built-in Role: **Atlas Admin**
6. Click **Add User**

### 2.4 Configure Network Access

1. Click **Network Access** → **Add IP Address**
2. Click **Allow Access from Anywhere** (for testing)
   - Or enter your EC2 IP later for security
3. Click **Confirm**

### 2.5 Get Connection String

1. Click **Databases** → **Connect**
2. Choose **Connect your application**
3. Driver: **Node.js** or **Python**
4. Copy the connection string
5. Replace `<password>` with your database password
6. Save this connection string - you'll need it!

Example:
```
mongodb+srv://erp_admin:YOUR_PASSWORD@erp-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

---

## Step 3: EC2 Instance Launch

### 3.1 Launch EC2 Instance

1. Go to **EC2 Dashboard** → **Launch Instance**
2. **Name**: `ERP-Microservices-Server`

### 3.2 Choose AMI

1. Select **Ubuntu Server 22.04 LTS**
2. Architecture: **64-bit (x86)**

### 3.3 Choose Instance Type

1. Select **t2.micro** (Free tier eligible)
2. 1 vCPU, 1 GB RAM

### 3.4 Create Key Pair

1. Click **Create new key pair**
2. Key pair name: `erp-ec2-key`
3. Key pair type: **RSA**
4. Private key format: **`.pem`** (for Mac/Linux) or **`.ppk`** (for Windows/PuTTY)
5. Click **Create key pair**
6. **Save the .pem file securely** - you can't download it again!

### 3.5 Network Settings

1. Check **Allow SSH traffic from** → Select **My IP**
2. Check **Allow HTTPS traffic from the internet**
3. Check **Allow HTTP traffic from the internet**

### 3.6 Configure Storage

1. Size: **30 GiB** (free tier limit)
2. Volume type: **gp3**

### 3.7 Advanced Details (Optional)

Add this user data script to auto-setup on first boot:

```bash
#!/bin/bash
apt-get update
apt-get upgrade -y
```

### 3.8 Launch Instance

1. Review summary on right side
2. Click **Launch Instance**
3. Wait 2-3 minutes for instance to initialize

### 3.9 Get Instance Details

1. Go to **EC2** → **Instances**
2. Select your instance
3. Note down:
   - **Public IPv4 address** (e.g., 3.85.123.45)
   - **Public IPv4 DNS** (e.g., ec2-3-85-123-45.compute-1.amazonaws.com)

### 3.10 Configure Security Group

1. Click on **Security** tab
2. Click on the Security Group ID
3. Click **Edit inbound rules**
4. Add these rules:

| Type        | Protocol | Port Range | Source    | Description      |
|-------------|----------|------------|-----------|------------------|
| SSH         | TCP      | 22         | My IP     | SSH access       |
| HTTP        | TCP      | 80         | 0.0.0.0/0 | Frontend         |
| HTTPS       | TCP      | 443        | 0.0.0.0/0 | Frontend SSL     |
| Custom TCP  | TCP      | 8001       | 0.0.0.0/0 | Auth Service     |
| Custom TCP  | TCP      | 8002       | 0.0.0.0/0 | Inventory Service|
| Custom TCP  | TCP      | 8003       | 0.0.0.0/0 | Sales Service    |

5. Click **Save rules**

---

## Step 4: EC2 Configuration

### 4.1 Connect to EC2 Instance

**On Mac/Linux:**
```bash
# Set permissions for key file
chmod 400 ~/Downloads/erp-ec2-key.pem

# Connect via SSH
ssh -i ~/Downloads/erp-ec2-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

**On Windows (using Git Bash or WSL):**
```bash
ssh -i /path/to/erp-ec2-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

**Using AWS Console (Browser-based):**
1. Go to EC2 → Instances
2. Select your instance
3. Click **Connect**
4. Click **Connect** button

### 4.2 Run Setup Script

Once connected to EC2, run these commands:

```bash
# Download setup script
curl -o setup-ec2.sh https://raw.githubusercontent.com/YOUR_USERNAME/erp-ai-microservices/main/scripts/setup-ec2.sh

# Make it executable
chmod +x setup-ec2.sh

# Run setup
./setup-ec2.sh
```

**Or manually run these commands:**

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p ~/erp
cd ~/erp

# Logout and login again
exit
```

**SSH back in:**
```bash
ssh -i ~/Downloads/erp-ec2-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

Verify installations:
```bash
docker --version
docker-compose --version
```

### 4.3 Configure GitHub Container Registry

```bash
# Create GitHub Personal Access Token
# Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
# Click "Generate new token (classic)"
# Select scopes: read:packages, write:packages
# Copy the token

# Login to GitHub Container Registry
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 4.4 Create Environment File

```bash
cd ~/erp

# Create .env file
nano .env
```

Paste this content (replace with your actual values):

```bash
# GitHub Container Registry
GITHUB_USERNAME=your-github-username

# MongoDB Atlas Connection
MONGODB_URL=mongodb+srv://erp_admin:YOUR_PASSWORD@erp-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority

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

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 5: GitHub Secrets Configuration

### 5.1 Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these secrets one by one:

| Secret Name              | Value / Description                              |
|--------------------------|--------------------------------------------------|
| `EC2_HOST`               | Your EC2 public IP address                       |
| `EC2_USER`               | `ubuntu`                                         |
| `EC2_SSH_KEY`            | Contents of your `.pem` file (copy entire file)  |
| `MONGODB_URL`            | Your MongoDB Atlas connection string             |
| `JWT_SECRET_KEY`         | Same as in .env file                             |
| `STRIPE_SECRET_KEY`      | Your Stripe secret key                           |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key                      |
| `STRIPE_WEBHOOK_SECRET`  | Your Stripe webhook secret                       |
| `VITE_AUTH_SERVICE_URL`  | `http://YOUR_EC2_IP:8001`                        |
| `VITE_INVENTORY_SERVICE_URL` | `http://YOUR_EC2_IP:8002`                    |
| `VITE_SALES_SERVICE_URL` | `http://YOUR_EC2_IP:8003`                        |

### 5.2 Add EC2 SSH Key Secret

To copy your SSH key content:

**On Mac/Linux:**
```bash
cat ~/Downloads/erp-ec2-key.pem | pbcopy  # Mac
cat ~/Downloads/erp-ec2-key.pem           # Linux (copy manually)
```

**On Windows:**
```bash
type C:\path\to\erp-ec2-key.pem
```

Paste entire content (including BEGIN and END lines) into `EC2_SSH_KEY` secret.

---

## Step 6: First Deployment

### 6.1 Manual First Deployment (Recommended)

From your EC2 instance:

```bash
cd ~/erp

# Create docker-compose.yml (copy from docker-compose.prod.yml)
# You'll get this file from GitHub or copy it manually

# Pull images manually first time
docker login ghcr.io -u YOUR_GITHUB_USERNAME
# Enter your GitHub Personal Access Token as password

# Download docker-compose file
wget https://raw.githubusercontent.com/YOUR_USERNAME/erp-ai-microservices/main/docker-compose.prod.yml -O docker-compose.yml

# Start services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### 6.2 Verify Deployment

```bash
# Check service health
curl http://localhost:8001/health  # Auth Service
curl http://localhost:8002/health  # Inventory Service
curl http://localhost:8003/health  # Sales Service
curl http://localhost:80           # Frontend

# Or use the health check script
~/erp/monitor.sh
```

### 6.3 Access Your Application

Open in browser:
- **Frontend**: `http://YOUR_EC2_IP`
- **Auth API Docs**: `http://YOUR_EC2_IP:8001/docs`
- **Inventory API Docs**: `http://YOUR_EC2_IP:8002/docs`
- **Sales API Docs**: `http://YOUR_EC2_IP:8003/docs`

### 6.4 CI/CD Deployment (After Manual Works)

Once manual deployment works:

1. **Push code to GitHub**:
```bash
git add .
git commit -m "Setup CI/CD deployment"
git push origin main
```

2. **Monitor GitHub Actions**:
   - Go to your repo → **Actions** tab
   - Watch the deployment workflow
   - Check logs if it fails

3. **Automatic deployments** will now trigger on every push to main branch!

---

## Step 7: Domain & SSL Setup (Optional)

### 7.1 Get a Free Domain

**Option 1: Use DuckDNS (Free Subdomain)**
1. Go to [DuckDNS.org](https://www.duckdns.org/)
2. Sign in with GitHub
3. Create subdomain: `your-erp.duckdns.org`
4. Set IP to your EC2 public IP
5. Save token

**Option 2: Buy a Domain**
- Namecheap, GoDaddy, Google Domains
- Update DNS A record to point to EC2 IP

### 7.2 Install SSL Certificate

On EC2:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Stop frontend temporarily
docker compose stop frontend

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Certificate will be at: /etc/letsencrypt/live/your-domain.com/

# Update nginx config to use SSL
# Then restart frontend
docker compose up -d frontend
```

### 7.3 Auto-renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Add cron job for auto-renewal
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet
```

---

## Step 8: Monitoring & Maintenance

### 8.1 Daily Monitoring

```bash
# Check service health
~/erp/monitor.sh

# View logs
docker compose logs --tail=100

# Check resource usage
docker stats

# Check disk space
df -h
```

### 8.2 Backup Strategy

```bash
# Manual backup
~/erp/backup.sh

# Backups are stored in: ~/backups/

# Download backup to local machine
scp -i erp-ec2-key.pem ubuntu@EC2_IP:~/backups/* ./local-backups/
```

### 8.3 Update Application

**Option 1: Via CI/CD (Automatic)**
- Just push to main branch

**Option 2: Manual Update**
```bash
cd ~/erp
docker compose pull
docker compose up -d
docker image prune -af
```

### 8.4 View Application Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f auth-service
docker compose logs -f inventory-service
docker compose logs -f sales-service
docker compose logs -f frontend
```

### 8.5 Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart auth-service
```

### 8.6 Stop Services

```bash
# Stop all (keeps data)
docker compose stop

# Stop and remove containers (keeps data)
docker compose down

# Stop and remove everything including data
docker compose down -v
```

---

## 🎯 Quick Reference Commands

### EC2 Management
```bash
# SSH to EC2
ssh -i erp-ec2-key.pem ubuntu@YOUR_EC2_IP

# Check EC2 status (local)
aws ec2 describe-instances --instance-ids i-xxxxx
```

### Docker Commands
```bash
# Start all services
docker compose up -d

# View status
docker compose ps

# View logs
docker compose logs -f

# Restart service
docker compose restart SERVICE_NAME

# Update services
docker compose pull && docker compose up -d

# Clean up
docker system prune -af
```

### Monitoring
```bash
# Health check
~/erp/monitor.sh

# Resource usage
docker stats

# Disk space
df -h
```

### Backup & Restore
```bash
# Backup
~/erp/backup.sh

# List backups
ls -lh ~/backups/
```

---

## 💰 Cost Estimation

### Free Tier (First 12 months)
- **EC2 t2.micro**: FREE (750 hours/month)
- **30 GB EBS**: FREE
- **MongoDB Atlas M0**: FREE Forever
- **Data Transfer**: 15 GB/month FREE
- **Total**: $0/month

### After Free Tier
- **EC2 t2.micro**: ~$8.50/month
- **30 GB EBS**: ~$2.40/month
- **Data Transfer**: ~$0-5/month
- **Total**: ~$10-15/month

**Tip**: Stop EC2 when not using to save costs!

---

## 🔧 Troubleshooting

### Issue: Can't connect to EC2
- Check security group allows SSH from your IP
- Verify .pem file permissions: `chmod 400 key.pem`
- Use correct username: `ubuntu`

### Issue: Docker commands fail
- Run: `sudo usermod -aG docker ubuntu`
- Logout and login again

### Issue: Services not starting
- Check logs: `docker compose logs`
- Verify .env file has all variables
- Check MongoDB connection string

### Issue: Out of disk space
- Clean images: `docker image prune -af`
- Clean volumes: `docker volume prune`
- Check: `df -h`

### Issue: Frontend shows connection errors
- Update .env with correct EC2 public IP
- Rebuild frontend: `docker compose up -d --build frontend`

### Issue: MongoDB connection fails
- Check MongoDB Atlas whitelist includes EC2 IP or 0.0.0.0/0
- Verify connection string in .env
- Test: `mongosh "YOUR_CONNECTION_STRING"`

---

## 📚 Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## ✅ Deployment Checklist

- [ ] AWS Account created
- [ ] IAM user created with credentials
- [ ] MongoDB Atlas cluster created
- [ ] EC2 instance launched (t2.micro)
- [ ] Security group configured
- [ ] SSH key downloaded and secured
- [ ] Connected to EC2 via SSH
- [ ] Docker and Docker Compose installed
- [ ] GitHub Container Registry configured
- [ ] .env file created on EC2
- [ ] GitHub secrets configured
- [ ] Manual deployment successful
- [ ] All services health checks passing
- [ ] CI/CD workflow tested
- [ ] Domain configured (optional)
- [ ] SSL certificate installed (optional)
- [ ] Backups configured

---

## 🎉 You're Done!

Your ERP application is now deployed on AWS with CI/CD pipeline!

Every push to the `main` branch will automatically deploy to your EC2 instance.

**Access your app**: `http://YOUR_EC2_IP`

For support, check the logs or raise an issue in the GitHub repository.

