# ⚡ Quick Deploy Guide - 5 Steps to AWS

The fastest way to deploy your ERP application to AWS EC2.

## 📋 Prerequisites Checklist

Before you start, gather:
- [ ] AWS Account (create at [aws.amazon.com/free](https://aws.amazon.com/free))
- [ ] GitHub Account
- [ ] Stripe API Keys (from [stripe.com/dashboard](https://dashboard.stripe.com))

---

## 🚀 Step 1: Launch EC2 Instance (5 minutes)

1. **Login to AWS Console** → Go to **EC2**
2. Click **Launch Instance**
3. Configure:
   - **Name**: `ERP-Microservices`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.micro (Free Tier)
   - **Key Pair**: Create new → Name: `erp-key` → Download `.pem` file
   - **Security Group**: Allow SSH, HTTP, HTTPS, and Custom TCP 8001-8003
   - **Storage**: 30 GB gp3
4. Click **Launch Instance**
5. **Note your EC2 Public IP** (e.g., 3.85.123.45)

---

## 🗄️ Step 2: Setup MongoDB Atlas (3 minutes)

1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up → Create Organization → Create Project
3. Click **Build a Database** → Select **FREE (M0)** → Choose AWS, same region as EC2
4. **Create Database User**:
   - Username: `erp_admin`
   - Password: Auto-generate (save it!)
5. **Network Access**: Click "Allow Access from Anywhere"
6. **Get Connection String**: 
   - Click Connect → Drivers → Copy connection string
   - Replace `<password>` with your database password
   - **Save this** - you'll need it!

Example: `mongodb+srv://erp_admin:YOUR_PASS@cluster.xxxxx.mongodb.net/`

---

## 🔧 Step 3: Setup EC2 (3 minutes)

**Connect to EC2:**
```bash
chmod 400 ~/Downloads/erp-key.pem
ssh -i ~/Downloads/erp-key.pem ubuntu@YOUR_EC2_IP
```

**Run setup commands:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p ~/erp && cd ~/erp

# Logout and login again
exit
```

**SSH back:**
```bash
ssh -i ~/Downloads/erp-key.pem ubuntu@YOUR_EC2_IP
```

---

## 📝 Step 4: Configure Environment (2 minutes)

**Create .env file:**
```bash
cd ~/erp
nano .env
```

**Paste this (replace YOUR_* values):**
```bash
GITHUB_USERNAME=YOUR_GITHUB_USERNAME
MONGODB_URL=mongodb+srv://erp_admin:YOUR_PASSWORD@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET_KEY=your-secret-key-min-32-characters-long-random-string
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLIC
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
ENVIRONMENT=production
LOG_LEVEL=INFO
DEFAULT_TAX_RATE=0.08
DEFAULT_CURRENCY=USD
```

**Save**: Press `Ctrl+X`, then `Y`, then `Enter`

---

## 🚢 Step 5: Deploy Application (2 minutes)

**Setup GitHub Container Registry:**
```bash
# Create GitHub token at: github.com/settings/tokens/new
# Select scopes: read:packages, write:packages

echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

**Download docker-compose file:**
```bash
cd ~/erp
nano docker-compose.yml
```

Paste this (replace YOUR_GITHUB_USERNAME):
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: erp-mongodb
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
    volumes:
      - mongodb_data:/data/db
    networks:
      - erp-network

  redis:
    image: redis:7.2-alpine
    container_name: erp-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - erp-network

  auth-service:
    image: ghcr.io/YOUR_GITHUB_USERNAME/erp-auth-service:latest
    container_name: erp-auth-service
    restart: always
    ports:
      - "8001:8001"
    env_file: .env
    depends_on:
      - mongodb
    networks:
      - erp-network

  inventory-service:
    image: ghcr.io/YOUR_GITHUB_USERNAME/erp-inventory-service:latest
    container_name: erp-inventory-service
    restart: always
    ports:
      - "8002:8002"
    env_file: .env
    depends_on:
      - mongodb
      - auth-service
    networks:
      - erp-network

  sales-service:
    image: ghcr.io/YOUR_GITHUB_USERNAME/erp-sales-service:latest
    container_name: erp-sales-service
    restart: always
    ports:
      - "8003:8003"
    env_file: .env
    depends_on:
      - mongodb
      - redis
      - auth-service
      - inventory-service
    networks:
      - erp-network

  frontend:
    image: ghcr.io/YOUR_GITHUB_USERNAME/erp-frontend:latest
    container_name: erp-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - auth-service
      - inventory-service
      - sales-service
    networks:
      - erp-network

volumes:
  mongodb_data:
  redis_data:

networks:
  erp-network:
    driver: bridge
```

**Save and deploy:**
```bash
# Start services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

---

## ✅ Verify Deployment

**Test services:**
```bash
curl http://localhost:8001/health  # Auth Service
curl http://localhost:8002/health  # Inventory Service  
curl http://localhost:8003/health  # Sales Service
curl http://localhost:80           # Frontend
```

**Access in browser:**
- Frontend: `http://YOUR_EC2_IP`
- Auth API: `http://YOUR_EC2_IP:8001/docs`
- Inventory API: `http://YOUR_EC2_IP:8002/docs`
- Sales API: `http://YOUR_EC2_IP:8003/docs`

---

## 🔄 Setup CI/CD (Optional - 5 minutes)

### Add GitHub Secrets

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

| Secret | Value |
|--------|-------|
| EC2_HOST | Your EC2 IP |
| EC2_USER | ubuntu |
| EC2_SSH_KEY | Content of erp-key.pem file |
| MONGODB_URL | Your MongoDB connection string |
| JWT_SECRET_KEY | Your JWT secret |
| STRIPE_SECRET_KEY | Your Stripe secret |
| STRIPE_PUBLISHABLE_KEY | Your Stripe public key |

### Enable Auto-Deploy

Every push to `main` branch will now auto-deploy! 🎉

---

## 🛠️ Common Commands

### View Logs
```bash
docker compose logs -f              # All services
docker compose logs -f auth-service # Specific service
```

### Restart Services
```bash
docker compose restart              # All
docker compose restart auth-service # Specific
```

### Update Application
```bash
docker compose pull
docker compose up -d
```

### Stop Services
```bash
docker compose stop     # Stop (keeps data)
docker compose down     # Stop and remove containers
docker compose down -v  # Remove everything including data
```

---

## 🐛 Troubleshooting

### Can't connect to EC2?
- Check security group allows your IP
- Verify key permissions: `chmod 400 erp-key.pem`

### Services not starting?
```bash
docker compose logs     # Check logs
docker compose ps       # Check status
```

### Frontend connection errors?
- Update VITE_*_URL in frontend build args with your EC2 IP
- Rebuild: `docker compose up -d --build frontend`

### MongoDB connection fails?
- Verify MongoDB Atlas allows connections from anywhere
- Check connection string in .env

---

## 💰 Free Tier Limits

- **EC2 t2.micro**: 750 hours/month (always-on = FREE)
- **30 GB Storage**: FREE
- **MongoDB Atlas M0**: FREE forever
- **Total Cost**: $0 for first 12 months!

**Pro Tip**: Stop EC2 when not using to save hours!

---

## 📚 Next Steps

1. **Add SSL Certificate**: See full guide in `AWS_DEPLOYMENT_GUIDE.md`
2. **Setup Custom Domain**: Use Route 53 or external DNS
3. **Configure Backups**: Schedule automated backups
4. **Setup Monitoring**: Use CloudWatch or custom alerts

---

## 🎉 You're Live!

Your ERP application is now running on AWS!

**Frontend**: `http://YOUR_EC2_IP`

For detailed documentation, see [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md)

