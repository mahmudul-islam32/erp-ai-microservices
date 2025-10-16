# ✅ Production Deployment Checklist

Use this checklist to ensure a smooth production deployment.

## 🎯 Pre-Deployment

### AWS EC2 Setup
- [ ] Launch EC2 instance (t3.medium or higher)
- [ ] Configure Security Groups (ports 22, 80, 443, 8001-8003, 8080)
- [ ] Allocate and associate Elastic IP
- [ ] Generate or import SSH key pair
- [ ] Save SSH key securely (you'll need it for GitHub Secrets)

### Server Setup
- [ ] SSH into EC2 instance
- [ ] Install Docker and Docker Compose
- [ ] Add user to docker group
- [ ] Configure UFW firewall
- [ ] Create `~/erp` directory

### Environment Configuration
- [ ] Copy `env.production.example` to EC2 `~/erp/.env`
- [ ] Generate JWT secret: `openssl rand -base64 64`
- [ ] Set `MONGODB_PASSWORD` (strong password)
- [ ] Set `JWT_SECRET_KEY` (from openssl)
- [ ] Configure Stripe keys (if using payments)
- [ ] Update `IMAGE_PREFIX` with your GitHub username

### GitHub Repository Setup
- [ ] Fork or clone repository
- [ ] Update `.github/workflows/deploy.yml` if needed
- [ ] Add GitHub Secrets:
  - [ ] `EC2_SSH_KEY` (private key content)
  - [ ] `EC2_HOST` (EC2 public IP)
  - [ ] `EC2_USER` (usually "ubuntu")
  - [ ] `VITE_AUTH_SERVICE_URL` (http://YOUR_IP:8001)
  - [ ] `VITE_INVENTORY_SERVICE_URL` (http://YOUR_IP:8002)
  - [ ] `VITE_SALES_SERVICE_URL` (http://YOUR_IP:8003)
  - [ ] `STRIPE_PUBLISHABLE_KEY` (optional)

## 🚀 Deployment

### GitHub Actions (Automated)
- [ ] Push code to `main` or `master` branch
- [ ] Monitor GitHub Actions workflow
- [ ] Check for build errors
- [ ] Verify all services are green

### Manual Verification on EC2
- [ ] SSH into EC2
- [ ] Check container status: `docker compose ps`
- [ ] Verify all containers are running
- [ ] Check logs: `docker compose logs`

## 🔧 Post-Deployment

### Application Setup
- [ ] Create admin user (see DEPLOYMENT.md)
- [ ] Change default admin password
- [ ] Load demo data (optional)
- [ ] Test login functionality

### Service Health Checks
- [ ] Auth service: `curl http://localhost:8001/health`
- [ ] Inventory service: `curl http://localhost:8002/health`
- [ ] Sales service: `curl http://localhost:8003/health`
- [ ] Frontend: `curl http://localhost:8080`

### Browser Testing
- [ ] Access frontend: `http://YOUR_EC2_IP:8080`
- [ ] Test login with admin credentials
- [ ] Navigate through all modules:
  - [ ] Dashboard
  - [ ] Inventory (Products, Categories, Stock)
  - [ ] Sales (Orders, Customers, Invoices)
  - [ ] User Management
- [ ] Test API endpoints: `http://YOUR_EC2_IP:8001/docs`

### Security Configuration
- [ ] Change all default passwords
- [ ] Verify MongoDB password is strong
- [ ] Verify JWT secret is secure
- [ ] Check firewall rules (UFW status)
- [ ] Review Security Group settings
- [ ] Disable mongo-express in production

## 🌐 Optional - Domain & SSL

### Domain Setup (Optional)
- [ ] Point domain DNS to EC2 Elastic IP
- [ ] Wait for DNS propagation (can take 24-48 hours)
- [ ] Test domain resolution: `ping your-domain.com`

### SSL Certificate (Recommended)
- [ ] Install Nginx: `sudo apt install nginx`
- [ ] Configure Nginx reverse proxy
- [ ] Install Certbot: `sudo apt install certbot python3-certbot-nginx`
- [ ] Get SSL certificate: `sudo certbot --nginx -d your-domain.com`
- [ ] Test HTTPS: `https://your-domain.com`
- [ ] Set up auto-renewal: `sudo certbot renew --dry-run`

## 📊 Monitoring & Backups

### Monitoring Setup
- [ ] Set up CloudWatch logs (AWS)
- [ ] Configure Docker log rotation
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure error alerting

### Backup Configuration
- [ ] Test MongoDB backup script
- [ ] Schedule daily backups (cron job)
- [ ] Verify backup restoration process
- [ ] Store backups in separate location (S3)

## 🎉 Go Live

### Final Checks
- [ ] All services are healthy
- [ ] Admin account created and tested
- [ ] Default passwords changed
- [ ] SSL certificate active (if applicable)
- [ ] Backups configured and tested
- [ ] Monitoring configured
- [ ] Documentation updated with production URLs

### Communication
- [ ] Notify team of deployment
- [ ] Share production URLs
- [ ] Share admin credentials securely
- [ ] Document any issues encountered
- [ ] Update project status

---

## 📝 Common Commands Reference

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f

# Restart a service
docker compose restart auth-service

# Pull and update images
docker compose pull && docker compose up -d

# Check disk space
df -h

# Clean Docker
docker system prune -af

# Backup MongoDB
docker compose exec mongodb mongodump --out=/backup

# Monitor resources
docker stats
```

---

## 🆘 Troubleshooting

If something goes wrong:

1. **Check logs first**: `docker compose logs`
2. **Verify .env file**: Make sure all required variables are set
3. **Check container health**: `docker compose ps`
4. **Review security groups**: Ensure ports are open
5. **Test connectivity**: `curl http://localhost:PORT/health`
6. **Restart services**: `docker compose restart`
7. **Check GitHub Actions logs**: Review build/deployment errors
8. **Verify SSH key**: Make sure EC2_SSH_KEY secret is correct

---

## 📞 Support

- 📖 Full Guide: [DEPLOYMENT.md](docs/DEPLOYMENT.md)
- 🚀 Quick Start: [QUICK_START.md](docs/QUICK_START.md)
- 📚 User Manual: [USER_MANUAL.md](docs/USER_MANUAL.md)

---

**Status:** Ready for Production ✅

