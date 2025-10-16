# 🚀 Quick Start Guide

Get your ERP system up and running in **under 10 minutes**!

---

## ⚡ 3-Step Installation

### Step 1: Prerequisites ✅

Make sure you have installed:
- ✅ **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- ✅ **Git** (optional, for cloning)

**Check your installation:**
```bash
docker --version
docker-compose --version
```

### Step 2: Get the Code 📥

**Option A: Extract ZIP**
```bash
# Extract the downloaded ZIP file
# Navigate to the extracted folder
cd erp-system
```

**Option B: Git Clone** (if applicable)
```bash
git clone <your-repository-url>
cd erp-ai-microservices
```

### Step 3: Launch! 🎉

```bash
# Copy environment template (optional - works with defaults)
cp ENV_EXAMPLE.txt .env

# Start all services
docker-compose up -d

# Wait 30-60 seconds for services to initialize...
```

**That's it!** 🎊

---

## 🌐 Access Your ERP

Open your browser and go to:

**Frontend Application:**
```
http://localhost:5173
```

**Default Login:**
```
Email: admin@example.com
Password: admin123
```

> ⚠️ **Important:** Change the default password after first login!

---

## 📊 API Documentation

Access interactive API documentation:

- **Auth API:** http://localhost:8001/docs
- **Inventory API:** http://localhost:8002/docs
- **Sales API:** http://localhost:8003/docs

---

## 🎯 What You Get

Your ERP system comes with **demo data** pre-loaded:

### 👥 Users (10+)
- 1 Super Admin
- 2 Admins
- 3 Managers
- 5 Employees
- Multiple test accounts

### 📦 Inventory (50+)
- 50+ Sample products
- 10 Categories
- 3 Warehouses
- Stock transactions

### 💰 Sales (30+)
- 20+ Customers
- 30+ Orders
- 15+ Invoices
- Payment records

---

## 🔐 Demo Credentials

### Super Admin
```
Email: admin@example.com
Password: admin123
```

### Manager
```
Email: manager@example.com
Password: manager123
```

### Employee
```
Email: employee@example.com
Password: employee123
```

> **🔒 Security:** These are demo accounts. Change passwords or delete them in production!

---

## 💳 Test Stripe Payments

Create a test order and process payment with:

**Test Card:**
```
Card Number: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
ZIP: 12345
```

**More test cards:**
- **3D Secure:** 4000 0025 0000 3155
- **Declined:** 4000 0000 0000 9995

---

## 🛠️ Common Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

### Restart Services
```bash
docker-compose restart
```

### Check Status
```bash
docker-compose ps
```

### Reset Everything
```bash
docker-compose down -v
docker-compose up -d
```

---

## 🎨 Customize Your ERP

### 1. Change Company Name

Edit `.env` file:
```env
APP_NAME="Your Company Name"
COMPANY_NAME="Your Company Name"
```

### 2. Configure Stripe

Add your Stripe keys to `.env`:
```env
STRIPE_PUBLISHABLE_KEY=REDACTED
STRIPE_SECRET_KEY=REDACTED
```

### 3. Set up Email

Configure SMTP in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=REDACTED
```

### 4. Customize Branding

- Logo: Replace `erp-frontend/public/logo.png`
- Favicon: Replace `erp-frontend/public/favicon.ico`
- Colors: Edit `erp-frontend/tailwind.config.js`

---

## 🚨 Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
docker info

# Check port availability
lsof -i :5173
lsof -i :8001
lsof -i :8002
lsof -i :8003

# Restart everything
docker-compose down
docker-compose up -d
```

### Cannot Login

```bash
# Reload demo data
docker-compose exec auth-service python scripts/seed_demo_data.py

# Or create admin manually
docker-compose exec auth-service python scripts/create_admin.py
```

### Frontend Shows Blank Page

```bash
# Clear browser cache
# Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)

# Rebuild frontend
docker-compose restart frontend-dev
```

### Database Connection Error

```bash
# Restart MongoDB
docker-compose restart mongodb

# Wait 10 seconds
sleep 10

# Restart other services
docker-compose restart auth-service inventory-service sales-service
```

---

## 📚 Next Steps

### For Users
1. ✅ **Login** to your ERP
2. ✅ **Explore** the dashboard
3. ✅ **Read** the [User Manual](USER_MANUAL.md)
4. ✅ **Change** default passwords
5. ✅ **Add** your real data

### For Administrators
1. ✅ **Configure** environment variables
2. ✅ **Set up** Stripe payments
3. ✅ **Configure** email notifications
4. ✅ **Customize** branding
5. ✅ **Add** team members

### For Developers
1. ✅ **Read** the [Developer Guide](DEVELOPER_GUIDE.md)
2. ✅ **Explore** the API documentation
3. ✅ **Customize** features
4. ✅ **Add** integrations
5. ✅ **Deploy** to production

---

## 🌟 Features to Try

### 1. User Management
- Go to **Dashboard → Users**
- Create new users
- Assign roles and permissions
- View audit logs
- Manage sessions

### 2. Inventory Management
- Go to **Dashboard → Inventory → Products**
- Add products
- Create categories
- Manage warehouses
- Adjust stock levels
- Transfer inventory

### 3. Sales Management
- Go to **Dashboard → Sales → Customers**
- Add customers
- Create orders
- Process payments with Stripe
- Generate invoices
- Track order status

### 4. Dashboard Analytics
- View real-time statistics
- Check sales charts
- Monitor inventory levels
- See recent activity

---

## 💡 Pro Tips

### 1. Use Keyboard Shortcuts
- `Ctrl/Cmd + K` - Quick search (coming soon)
- `Esc` - Close modals
- `Tab` - Navigate forms

### 2. Bulk Operations
- Select multiple items with checkboxes
- Perform bulk actions
- Export data

### 3. Advanced Filters
- Use search to find anything
- Apply multiple filters
- Save filter presets (coming soon)

### 4. Mobile Access
- Fully responsive design
- Works on tablets
- Works on phones

---

## 📞 Need Help?

### Documentation
- 📖 [User Manual](USER_MANUAL.md) - How to use the system
- 💻 [Developer Guide](DEVELOPER_GUIDE.md) - Technical details
- 🚀 [Deployment Guide](DEPLOYMENT.md) - Production setup
- ❓ [Installation Guide](INSTALLATION.md) - Detailed install help

### Support
- 📧 **Email:** support@yourdomain.com
- 💬 **Live Chat:** [Support Portal]
- 🎫 **Tickets:** [Ticket System]
- 📚 **Knowledge Base:** [Help Center]

### Community
- 💡 **Feature Requests:** [GitHub]
- 🐛 **Bug Reports:** [GitHub Issues]
- 💬 **Discussions:** [Community Forum]

---

## 🎉 Success!

You're now ready to use your ERP system!

### What's Working:
✅ User authentication & management  
✅ Inventory tracking & management  
✅ Sales orders & invoices  
✅ Payment processing (Stripe)  
✅ Dashboard & analytics  
✅ Audit logs & security  

### Optional Setup:
⏭️ Configure email notifications  
⏭️ Set up production database  
⏭️ Configure SSL/HTTPS  
⏭️ Set up backups  
⏭️ Deploy to production  

---

## 🔄 Keeping Up to Date

### Check for Updates
```bash
# Pull latest version
docker-compose pull

# Restart with updates
docker-compose up -d
```

### Subscribe to Updates
- 🔔 Enable notifications on CodeCanyon
- 📧 Subscribe to newsletter
- 🐦 Follow on Twitter: [@yourhandle]

---

## ⭐ Enjoying the ERP?

If you find this system helpful:

1. ⭐ **Rate it** 5 stars on CodeCanyon
2. 💬 **Leave a review** sharing your experience
3. 🔄 **Recommend** it to colleagues
4. 📢 **Share** your success story

Your feedback helps us improve and helps other buyers!

---

## 📝 Quick Reference

### Default Ports
- Frontend: `5173`
- Auth API: `8001`
- Inventory API: `8002`
- Sales API: `8003`
- MongoDB: `27017`
- Redis: `6379`

### Important Files
- `.env` - Configuration
- `docker-compose.yml` - Services
- `INSTALLATION.md` - Full install guide
- `USER_MANUAL.md` - User documentation

### Useful Scripts
- `./scripts/generate-secrets.sh` - Generate secure secrets
- `./scripts/setup-demo-data.sh` - Load demo data
- `./scripts/backup.sh` - Backup database

---

**Happy managing!** 🚀

---

<div align="center">

**Made with ❤️ for your business**

[Documentation](README.md) · [Support](#need-help) · [Updates](CHANGELOG.md)

© 2025 Your Company. All rights reserved.

</div>

