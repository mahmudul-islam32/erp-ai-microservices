#!/bin/bash

# EC2 Instance Setup Script for ERP Microservices
# Run this script on your EC2 instance after launching it

set -e

echo "🚀 Starting EC2 setup for ERP Microservices..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install AWS CLI
echo "☁️ Installing AWS CLI..."
sudo apt-get install -y awscli

# Install essential tools
echo "🛠️ Installing essential tools..."
sudo apt-get install -y \
    git \
    curl \
    wget \
    vim \
    htop \
    net-tools \
    ufw

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8001/tcp  # Auth Service
sudo ufw allow 8002/tcp  # Inventory Service
sudo ufw allow 8003/tcp  # Sales Service
sudo ufw --force enable

# Create application directory
echo "📁 Creating application directory..."
mkdir -p ~/erp
cd ~/erp

# Create log directory
mkdir -p ~/erp/logs

# Install Docker Compose plugin
echo "🔌 Installing Docker Compose plugin..."
mkdir -p ~/.docker/cli-plugins/
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose
chmod +x ~/.docker/cli-plugins/docker-compose

# Set up log rotation
echo "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/docker-containers > /dev/null << 'EOF'
/home/ubuntu/erp/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
}
EOF

# Create a backup script
echo "💾 Creating backup script..."
cat > ~/erp/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker exec erp-mongodb mongodump --out /tmp/backup
docker cp erp-mongodb:/tmp/backup $BACKUP_DIR/mongodb_$DATE

# Backup environment files
cp ~/erp/.env $BACKUP_DIR/.env_$DATE

echo "Backup completed: $BACKUP_DIR/mongodb_$DATE"
EOF
chmod +x ~/erp/backup.sh

# Create monitoring script
echo "📊 Creating monitoring script..."
cat > ~/erp/monitor.sh << 'EOF'
#!/bin/bash
echo "=== ERP Services Health Check ==="
echo "Auth Service: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health)"
echo "Inventory Service: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8002/health)"
echo "Sales Service: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8003/health)"
echo "Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)"
echo ""
echo "=== Container Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "=== Resource Usage ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
EOF
chmod +x ~/erp/monitor.sh

# Set up cron for monitoring
echo "⏰ Setting up monitoring cron job..."
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/erp/monitor.sh >> ~/erp/logs/monitor.log 2>&1") | crontab -

# Set up cron for daily backup
(crontab -l 2>/dev/null; echo "0 2 * * * ~/erp/backup.sh >> ~/erp/logs/backup.log 2>&1") | crontab -

echo "✅ EC2 setup completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Logout and login again to apply Docker group permissions (or run: newgrp docker)"
echo "2. Configure GitHub Container Registry access"
echo "3. Copy docker-compose.yml and .env files to ~/erp/"
echo "4. Run: docker compose up -d"
echo ""
echo "Useful commands:"
echo "- Monitor services: ~/erp/monitor.sh"
echo "- Backup data: ~/erp/backup.sh"
echo "- View logs: docker compose logs -f"

