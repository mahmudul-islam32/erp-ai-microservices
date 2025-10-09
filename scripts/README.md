# 📜 Deployment Scripts

Collection of scripts to help you deploy and manage your ERP application on AWS EC2.

## 📁 Available Scripts

### 1. `setup-ec2.sh` - EC2 Initial Setup
**Purpose**: Automated setup of a fresh EC2 instance with all required dependencies.

**What it does**:
- Updates system packages
- Installs Docker and Docker Compose
- Installs AWS CLI
- Configures firewall (UFW)
- Creates application directories
- Sets up log rotation
- Creates monitoring and backup scripts
- Configures cron jobs

**Usage**:
```bash
# On EC2 instance
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/erp-ai-microservices/main/scripts/setup-ec2.sh | bash

# Or manually
wget https://raw.githubusercontent.com/YOUR_USERNAME/erp-ai-microservices/main/scripts/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

**Time**: ~5 minutes

---

### 2. `deploy.sh` - Manual Deployment
**Purpose**: Manually deploy application from local machine to EC2.

**What it does**:
- Copies docker-compose and config files to EC2
- Logs into GitHub Container Registry
- Pulls latest Docker images
- Deploys services with zero downtime
- Runs health checks
- Cleans up old images

**Usage**:
```bash
# From your local machine
EC2_HOST=your-ec2-ip ./scripts/deploy.sh

# With custom SSH key
EC2_HOST=your-ec2-ip SSH_KEY=~/.ssh/custom-key.pem ./scripts/deploy.sh

# With custom GitHub username
EC2_HOST=your-ec2-ip GITHUB_USERNAME=yourname ./scripts/deploy.sh
```

**Environment Variables**:
- `EC2_HOST` (required): EC2 public IP address
- `EC2_USER` (optional): SSH user, defaults to `ubuntu`
- `SSH_KEY` (optional): Path to SSH key, defaults to `~/.ssh/erp-ec2-key.pem`
- `GITHUB_USERNAME` (optional): GitHub username

**Time**: ~2-3 minutes

---

### 3. `health-check.sh` - Service Health Monitoring
**Purpose**: Check the health status of all services and resources.

**What it does**:
- Checks HTTP health endpoints for all services
- Displays container status
- Checks database connectivity (MongoDB, Redis)
- Shows resource usage (CPU, Memory)
- Displays recent logs

**Usage**:
```bash
# On EC2 instance
~/erp/health-check.sh

# Or if in scripts directory
./scripts/health-check.sh
```

**Output Example**:
```
🏥 ERP Microservices Health Check
==================================

📡 Service Health:
✅ Auth Service      : Healthy (HTTP 200)
✅ Inventory Service : Healthy (HTTP 200)
✅ Sales Service     : Healthy (HTTP 200)
✅ Frontend          : Healthy (HTTP 200)

🐳 Container Status:
erp-auth-service       Up 2 hours     0.0.0.0:8001->8001/tcp
erp-inventory-service  Up 2 hours     0.0.0.0:8002->8002/tcp
...

💾 Database Status:
✅ MongoDB: Connected
✅ Redis: Connected

📊 Resource Usage:
erp-auth-service       0.50%   128MB / 1GB    12.5%
...
```

**Time**: Instant

---

### 4. `monitor.sh` (Auto-created by setup-ec2.sh)
**Purpose**: Automated monitoring script created on EC2.

**What it does**:
- Runs health checks
- Logs results to `~/erp/logs/monitor.log`
- Automatically runs every 5 minutes via cron

**Usage**:
```bash
# On EC2 instance
~/erp/monitor.sh

# View monitor logs
tail -f ~/erp/logs/monitor.log
```

**Cron Schedule**: `*/5 * * * *` (every 5 minutes)

---

### 5. `backup.sh` (Auto-created by setup-ec2.sh)
**Purpose**: Backup MongoDB data and environment files.

**What it does**:
- Creates MongoDB dump
- Backs up .env file
- Stores in `~/backups/` with timestamp
- Automatically runs daily at 2 AM via cron

**Usage**:
```bash
# On EC2 instance
~/erp/backup.sh

# List backups
ls -lh ~/backups/

# Download backup to local
scp -i key.pem ubuntu@EC2_IP:~/backups/mongodb_20231009_120000.tar.gz ./
```

**Cron Schedule**: `0 2 * * *` (daily at 2 AM)

---

## 🚀 Quick Start Workflow

### First Time Setup

1. **Launch EC2 instance** (AWS Console)
2. **Run setup script** on EC2:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/erp-ai-microservices/main/scripts/setup-ec2.sh | bash
   ```
3. **Create .env file** on EC2:
   ```bash
   cd ~/erp
   nano .env
   # Add your configuration
   ```
4. **Deploy from local machine**:
   ```bash
   EC2_HOST=your-ec2-ip ./scripts/deploy.sh
   ```

### Regular Deployment

After initial setup, you have two options:

**Option A: Automatic CI/CD** (Recommended)
- Just push to `main` branch
- GitHub Actions handles deployment

**Option B: Manual Deployment**
```bash
EC2_HOST=your-ec2-ip ./scripts/deploy.sh
```

---

## 📋 Script Permissions

Make scripts executable:
```bash
# All scripts
chmod +x scripts/*.sh

# Individual scripts
chmod +x scripts/setup-ec2.sh
chmod +x scripts/deploy.sh
chmod +x scripts/health-check.sh
```

---

## 🔧 Customization

### Modify setup-ec2.sh
Edit the script to add custom tools:
```bash
# Add your custom installations
sudo apt-get install -y your-tool

# Add custom configurations
echo "export CUSTOM_VAR=value" >> ~/.bashrc
```

### Modify deploy.sh
Customize deployment behavior:
```bash
# Change deployment directory
# Change health check URLs
# Add custom post-deployment tasks
```

### Modify health-check.sh
Add custom health checks:
```bash
# Add custom service checks
check_service "Custom Service" "http://localhost:9000/health"

# Add custom database checks
# Add custom metric collections
```

---

## 🐛 Troubleshooting

### setup-ec2.sh fails
```bash
# Check logs
sudo tail -f /var/log/cloud-init-output.log

# Rerun specific steps manually
sudo apt-get update
curl -fsSL https://get.docker.com | sh
```

### deploy.sh can't connect
```bash
# Verify SSH key
ls -l ~/.ssh/erp-ec2-key.pem

# Check key permissions
chmod 400 ~/.ssh/erp-ec2-key.pem

# Test SSH connection
ssh -i ~/.ssh/erp-ec2-key.pem ubuntu@YOUR_EC2_IP
```

### health-check.sh shows unhealthy
```bash
# Check container logs
docker compose logs SERVICE_NAME

# Restart service
docker compose restart SERVICE_NAME

# Check .env configuration
cat ~/erp/.env
```

---

## 📊 Monitoring & Logs

### View All Logs
```bash
# Real-time logs
docker compose logs -f

# Specific service
docker compose logs -f auth-service

# Last 100 lines
docker compose logs --tail=100

# Monitor logs
tail -f ~/erp/logs/monitor.log

# Backup logs
tail -f ~/erp/logs/backup.log
```

### Check Resource Usage
```bash
# Real-time stats
docker stats

# Disk usage
df -h

# Memory usage
free -h

# Network usage
netstat -tuln
```

---

## 🔄 Update Scripts

### Pull Latest Scripts
```bash
# On EC2
cd ~/erp
wget https://raw.githubusercontent.com/YOUR_USERNAME/erp-ai-microservices/main/scripts/health-check.sh -O health-check.sh
chmod +x health-check.sh
```

### Update from Git
```bash
# If you have git repo cloned on EC2
cd ~/erp-ai-microservices
git pull
cp scripts/*.sh ~/erp/
chmod +x ~/erp/*.sh
```

---

## 🔐 Security Best Practices

1. **Secure SSH Keys**
   ```bash
   chmod 400 ~/.ssh/*.pem
   ```

2. **Use Environment Variables**
   - Never hardcode secrets in scripts
   - Use .env file for sensitive data

3. **Restrict Script Execution**
   ```bash
   # Only owner can execute
   chmod 700 scripts/*.sh
   ```

4. **Review Before Running**
   - Always review scripts before execution
   - Understand what each command does

---

## 📝 Script Maintenance

### Regular Updates
- Update scripts when dependencies change
- Add new health checks for new services
- Optimize backup retention policy

### Version Control
- Keep scripts in Git
- Tag releases
- Document changes in commits

### Testing
```bash
# Test in staging first
EC2_HOST=staging-ip ./scripts/deploy.sh

# Then deploy to production
EC2_HOST=production-ip ./scripts/deploy.sh
```

---

## 🆘 Getting Help

If scripts fail:
1. Check script output for error messages
2. Review logs in `~/erp/logs/`
3. Check Docker logs: `docker compose logs`
4. Verify .env configuration
5. Test network connectivity
6. Check disk space: `df -h`

For issues, refer to:
- [AWS_DEPLOYMENT_GUIDE.md](../AWS_DEPLOYMENT_GUIDE.md)
- [QUICK_DEPLOY.md](../QUICK_DEPLOY.md)
- [CICD_SETUP_COMPLETE.md](../CICD_SETUP_COMPLETE.md)

---

**Happy Deploying! 🚀**

