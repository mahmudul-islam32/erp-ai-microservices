# GitHub Actions CI/CD Deployment Setup

## Overview
This document explains how to set up and use the GitHub Actions CI/CD pipeline for deploying the ERP microservices application to AWS EC2.

## Prerequisites

1. **AWS Infrastructure**: EC2 instance provisioned via Terraform
2. **GitHub Repository**: Code pushed to GitHub
3. **GitHub Container Registry**: Enabled (automatic with GitHub)

## Required GitHub Secrets

Configure these secrets in your GitHub repository (Settings > Secrets and variables > Actions):

### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `EC2_HOST` | Public IP or hostname of EC2 instance | `54.123.45.67` |
| `EC2_SSH_KEY` | Private SSH key to access EC2 | `-----BEGIN RSA PRIVATE KEY-----\n...` |

`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are only used by the Terraform jobs, so they are needed only if you run Terraform from the workflow.

### Optional Secrets (for enhanced functionality)

| Secret Name | Description | Default |
|-------------|-------------|---------|
| `EC2_USER` | SSH username on the instance | `ubuntu` |
| `VITE_AUTH_SERVICE_URL` | Frontend auth service URL | `http://localhost:8001` |
| `VITE_INVENTORY_SERVICE_URL` | Frontend inventory service URL | `http://localhost:8002` |
| `VITE_SALES_SERVICE_URL` | Frontend sales service URL | `http://localhost:8003` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key | (empty) |

## Workflow Jobs

### 1. Terraform Plan/Apply (Optional)
- **Plan trigger**: Manual workflow dispatch, or a push whose head commit message contains `[terraform]`
- **Plan steps**: `terraform init`, `terraform validate` and `terraform plan`
- **Apply trigger**: Only runs on a manual dispatch with an `apply_terraform` input set to `true`. The workflow does not declare that input yet, so the apply job does not run today; apply the infrastructure locally with `cd terraform && terraform apply`
- **Outputs**: The apply job reads the EC2 IP from `terraform output` (`elastic_ip`, falling back to `instance_public_ip`)

### 2. Build and Push
- **Trigger**: Every push to main/master branch, and every manual run
- **Purpose**: Build Docker images and push to GitHub Container Registry
- **Image names**: `ghcr.io/mahmudul-islam32/erp-<service>`, tagged `<branch>-<short sha>` and, on the default branch, `latest`
- **Services Built**:
  - auth-service
  - inventory-service
  - sales-service
  - frontend (React app)

### 3. Deploy
- **Trigger**: After a successful build, when the run is on main or master
- **Purpose**: Deploy containers to EC2 instance
- **Host**: The IP from a committed `terraform/terraform.tfstate` if one exists, otherwise the `EC2_HOST` secret
- **Steps**:
  1. Copy docker-compose.prod.yml to `~/erp/docker-compose.yml` on EC2
  2. Load `~/erp/.env` if it exists
  3. Login to GitHub Container Registry on EC2
  4. Pull latest images
  5. Stop old containers (`docker compose down`)
  6. Start new containers (`docker compose up -d`)
  7. Wait 45 seconds, then poll the auth service's `/health` on port 8001 up to 5 times
  8. Print the last 20 log lines and prune images older than 24 hours

The health check only covers the auth service and does not fail the job, so check the printed container status and logs after each run.

## CI Checks

A separate workflow, `.github/workflows/ci.yml`, runs on every pull request into main and every push to main. A newer run on the same branch cancels the older one. It has four jobs:

| Job | What it does |
|-----|--------------|
| Secret scan | Runs Gitleaks over the full git history |
| Auth service tests | Installs `auth-service/requirements-dev.txt` on Python 3.11 and runs `pytest` |
| Python lint | Runs `ruff check .` with Ruff 0.1.14 |
| Frontend typecheck and build | Runs `npm ci`, `npm run typecheck` and `npm run build` in `erp-frontend` on Node 20 |

The frontend job also runs `npm run lint`, but only as advice: lint errors do not fail the job yet.

## Deployment Process

### Initial Setup

1. **Set up GitHub Secrets**:
   ```bash
   # Add all required secrets in GitHub repository settings
   ```

2. **Run Terraform (if not done)**:
   - Run it locally: `cd terraform && terraform apply`
   - A push with `[terraform]` in the commit message only runs `terraform plan`

3. **Configure EC2 Environment** (optional):
   SSH into your EC2 instance and create `.env` file:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   mkdir -p ~/erp
   nano ~/erp/.env
   ```

   Add environment variables:
   ```bash
   # MongoDB Configuration
   MONGODB_USERNAME=admin
   MONGODB_PASSWORD=<generate-a-strong-password>
   
   # JWT Configuration
   JWT_SECRET_KEY=<python3 -c "import secrets; print(secrets.token_urlsafe(64))">
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7
   
   # Stripe Configuration (if using)
   STRIPE_SECRET_KEY=sk_live_xxx
   STRIPE_PUBLISHABLE_KEY=pk_live_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   
   # Application Configuration
   ENVIRONMENT=production
   LOG_LEVEL=INFO
   NODE_ENV=production
   ```

### Automatic Deployment

1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Monitor deployment**:
   - Go to GitHub Actions tab
   - Watch the workflow execution
   - Check deployment logs

### Manual Deployment

1. Go to Actions tab in GitHub
2. Select "Deploy ERP Microservices to AWS EC2"
3. Click "Run workflow"
4. Select the branch (the workflow has no other inputs)
5. Click "Run workflow"

A manual run also starts the Terraform plan job. The deploy job only runs when the selected branch is main or master.

## Troubleshooting

### Error: "pull: command not found"
**Fixed in latest version**. This error occurred due to improper variable expansion in bash heredoc. The fix uses `eval` with proper quoting.

### Error: "EC2 host not found"
- Ensure `EC2_HOST` secret is set in GitHub
- Or run Terraform to provision infrastructure

### Error: "Permission denied (publickey)"
- Verify `EC2_SSH_KEY` secret contains the complete private key
- Ensure the key format includes headers: `-----BEGIN RSA PRIVATE KEY-----`
- Check that the key corresponds to the EC2 instance's allowed keys

### Docker Permission Issues
The workflow automatically:
- Adds ubuntu user to docker group
- Sets proper permissions on ~/.docker
- Falls back to sudo if needed

### Service Health Check Failures
- Check logs: `docker compose logs <service-name>`
- Verify .env variables are set correctly
- Ensure all dependent services are running
- Check network connectivity between containers

## Manual Deployment Alternative

If CI/CD fails, you can deploy manually:

```bash
# On your local machine
export EC2_HOST=your-ec2-ip
export SSH_KEY=~/.ssh/your-key.pem

./scripts/deploy.sh
```

## Monitoring Deployment

### Check Running Containers
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
cd ~/erp
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs

# Specific service
docker compose logs auth-service

# Follow logs
docker compose logs -f
```

### Health Checks
```bash
curl http://your-ec2-ip:8001/health  # Auth Service
curl http://your-ec2-ip:8002/health  # Inventory Service
curl http://your-ec2-ip:8003/health  # Sales Service
curl http://your-ec2-ip:8080         # Frontend
```

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use GitHub Secrets** for all sensitive data
3. **Rotate credentials regularly**
4. **Use strong passwords** for MongoDB and JWT
5. **Enable HTTPS** with SSL/TLS certificates (use Let's Encrypt)
6. **Restrict SSH access** to specific IP addresses in AWS Security Groups
7. **Keep Docker images updated** regularly

## Cost Optimization

1. **Image Cleanup**: Workflow automatically prunes images older than 24h
2. **Stop unused services**: Scale down when not needed
3. **Use spot instances**: Consider AWS spot instances for dev/staging
4. **Monitor resources**: Set up AWS CloudWatch alarms

## Next Steps

1. Set up SSL/TLS with Let's Encrypt
2. Configure domain name and DNS
3. Set up monitoring with Prometheus/Grafana
4. Implement log aggregation
5. Add staging environment
6. Set up automated backups for MongoDB

## Support

For issues or questions:
- Check GitHub Actions logs
- Review EC2 logs: `/var/log/cloud-init-output.log`
- Check application logs: `docker compose logs`
- Review this documentation
