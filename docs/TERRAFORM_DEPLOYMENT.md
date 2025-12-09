# 🚀 Terraform Infrastructure as Code Deployment Guide

This guide covers deploying the ERP Microservices application to AWS EC2 using Terraform for infrastructure management and GitHub Actions for CI/CD.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Terraform Configuration](#terraform-configuration)
5. [Deploying Infrastructure](#deploying-infrastructure)
6. [GitHub Actions Integration](#github-actions-integration)
7. [Application Deployment](#application-deployment)
8. [Managing Infrastructure](#managing-infrastructure)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Overview

This setup uses **Terraform** to manage AWS infrastructure as code, providing:

- ✅ **Infrastructure as Code (IaC)**: Version-controlled infrastructure
- ✅ **Reproducible Deployments**: Consistent infrastructure across environments
- ✅ **Automated Provisioning**: EC2 instances, security groups, and networking
- ✅ **State Management**: Track infrastructure changes
- ✅ **CI/CD Integration**: Automated deployments via GitHub Actions

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Actions                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Build &    │  │  Terraform   │  │   Deploy     │  │
│  │   Push       │→ │  Apply       │→ │   App        │  │
│  │   Images     │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    AWS EC2 Instance                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Docker Containers (via docker-compose)          │  │
│  │  • MongoDB • Redis • Auth • Inventory • Sales   │  │
│  │  • Frontend (React)                              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Before starting, ensure you have:

- ✅ **AWS Account** with appropriate permissions
- ✅ **Terraform** installed (v1.0+) on your local machine
- ✅ **AWS CLI** configured with credentials
- ✅ **GitHub Account** with repository access
- ✅ **SSH Key Pair** for EC2 access (or create one via Terraform)
- ✅ **Domain Name** (optional, for custom domain)

### Install Terraform

**macOS:**
```bash
brew install terraform
```

**Linux:**
```bash
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

**Windows:**
Download from [terraform.io/downloads](https://www.terraform.io/downloads) and add to PATH.

**Verify installation:**
```bash
terraform version
```

### Configure AWS CLI

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter default region (e.g., us-east-1)
# Enter default output format (json)
```

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-username/erp-ai-microservices.git
cd erp-ai-microservices
```

### 2. Configure Terraform Variables

Copy the example variables file and customize it:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
aws_region = "us-east-1"
project_name = "erp-microservices"
environment = "production"

# EC2 Instance Configuration
instance_type = "t3.medium"  # t2.micro for free tier
volume_size   = 30

# Key Pair Configuration
create_key_pair = false  # Set to true if creating new key pair
key_pair_name   = "erp-ec2-key"

# Security Configuration
# Get your IP: curl ifconfig.me
allowed_ssh_cidr_blocks = ["YOUR_IP_ADDRESS/32"]

# Network Configuration
allocate_elastic_ip = true
```

### 3. Get Your Public IP Address

```bash
curl ifconfig.me
# Use this IP in allowed_ssh_cidr_blocks (e.g., "203.0.113.0/32")
```

### 4. Create or Import SSH Key Pair

**Option A: Use Existing Key Pair**

If you already have an AWS key pair:

1. Ensure the key pair exists in AWS Console
2. Set `create_key_pair = false` in `terraform.tfvars`
3. Set `key_pair_name` to your existing key pair name

**Option B: Create New Key Pair via Terraform**

1. Generate SSH key pair locally:
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/erp-ec2-key
```

2. Get public key:
```bash
cat ~/.ssh/erp-ec2-key.pub
```

3. Update `terraform.tfvars`:
```hcl
create_key_pair = true
key_pair_name   = "erp-ec2-key"
public_key      = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC... your-public-key"
```

---

## Terraform Configuration

### Directory Structure

```
terraform/
├── main.tf              # Main infrastructure resources
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── terraform.tfvars     # Variable values (not in git)
├── terraform.tfvars.example  # Example variables
└── .gitignore          # Ignore sensitive files
```

### Key Resources

The Terraform configuration creates:

1. **Security Group**: Firewall rules for EC2
2. **IAM Role**: Permissions for EC2 instance
3. **EC2 Instance**: Ubuntu 22.04 LTS server
4. **Elastic IP**: Static IP address (optional)
5. **Key Pair**: SSH access (optional)

### Customization

You can customize the infrastructure by editing:

- **`variables.tf`**: Add new variables
- **`main.tf`**: Modify resources
- **`terraform.tfvars`**: Change values without editing code

---

## Deploying Infrastructure

### Step 1: Initialize Terraform

```bash
cd terraform
terraform init
```

This downloads the AWS provider and initializes the backend.

### Step 2: Validate Configuration

```bash
terraform validate
```

### Step 3: Plan Deployment

Preview what Terraform will create:

```bash
terraform plan
```

Review the plan carefully. It should show:
- 1 EC2 instance
- 1 Security Group
- 1 IAM Role
- 1 Elastic IP (if enabled)

### Step 4: Apply Configuration

Create the infrastructure:

```bash
terraform apply
```

Type `yes` when prompted. This will:
- Create security group
- Launch EC2 instance
- Allocate Elastic IP (if enabled)
- Configure IAM role

**Expected time**: 2-5 minutes

### Step 5: Get Output Values

After deployment, get connection details:

```bash
terraform output
```

Save these values:
- `instance_public_ip` or `elastic_ip`: EC2 IP address
- `ssh_command`: Command to SSH into instance
- `frontend_url`: Frontend application URL

### Step 6: Verify Infrastructure

Check AWS Console:
1. Go to **EC2** → **Instances**
2. Verify instance is running
3. Check **Security Groups** for firewall rules
4. Check **Elastic IPs** (if enabled)

---

## GitHub Actions Integration

### 1. Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

#### Required Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `EC2_SSH_KEY` | Private SSH key content | `REDACTED-PRIVATE-KEY
```

Paste this entire content as the `EC2_SSH_KEY` secret.

### 3. Workflow Overview

The GitHub Actions workflow has three jobs:

1. **terraform-plan**: Plans infrastructure changes (manual trigger)
2. **terraform-apply**: Applies infrastructure changes (manual trigger)
3. **build-and-push**: Builds and pushes Docker images
4. **deploy**: Deploys application to EC2

### 4. Manual Infrastructure Deployment

To deploy infrastructure via GitHub Actions:

1. Go to **Actions** tab
2. Select **Deploy ERP Microservices to AWS EC2**
3. Click **Run workflow**
4. Check **Apply Terraform** if you want to apply changes
5. Click **Run workflow**

---

## Application Deployment

### Automatic Deployment

The application automatically deploys when you push to `main` or `master`:

```bash
git add .
git commit -m "Update application"
git push origin main
```

GitHub Actions will:
1. Build Docker images
2. Push to GitHub Container Registry
3. Deploy to EC2 instance

### Manual Deployment

If you need to deploy manually:

```bash
# SSH into EC2
ssh -i ~/.ssh/erp-ec2-key.pem ubuntu@YOUR_EC2_IP

# Navigate to app directory
cd ~/erp

# Pull latest images
docker compose pull

# Restart services
docker compose down
docker compose up -d

# Check status
docker compose ps
```

### Environment Variables

Create `.env` file on EC2:

```bash
ssh -i ~/.ssh/erp-ec2-key.pem ubuntu@YOUR_EC2_IP
cd ~/erp
nano .env
```

Add these variables:

```env
# MongoDB
MONGODB_USERNAME=admin
MONGODB_PASSWORD=REDACTED

# JWT
JWT_SECRET_KEY=REDACTED
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

## Managing Infrastructure

### View Current State

```bash
cd terraform
terraform show
```

### Update Infrastructure

1. Modify `terraform.tfvars` or `main.tf`
2. Plan changes:
```bash
terraform plan
```
3. Apply changes:
```bash
terraform apply
```

### Scale Instance

Update `instance_type` in `terraform.tfvars`:

```hcl
instance_type = "t3.large"  # Upgrade from t3.medium
```

Then apply:
```bash
terraform apply
```

**Note**: This will recreate the instance. Ensure you have backups!

### Destroy Infrastructure

⚠️ **Warning**: This will delete all infrastructure!

```bash
terraform destroy
```

Type `yes` when prompted.

### Import Existing Resources

If you have existing EC2 infrastructure:

```bash
terraform import aws_instance.erp_server i-1234567890abcdef0
```

---

## Troubleshooting

### Terraform Errors

**Error: "No valid credential sources found"**

```bash
# Configure AWS credentials
aws configure
# Or set environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
```

**Error: "Key pair not found"**

- Ensure key pair exists in AWS Console
- Or set `create_key_pair = true` to create new one

**Error: "Insufficient permissions"**

- Ensure IAM user has `AmazonEC2FullAccess` policy
- Or create custom policy with required permissions

### EC2 Connection Issues

**Cannot SSH into instance:**

```bash
# Check security group allows SSH from your IP
# Verify key pair is correct
ssh -v -i ~/.ssh/erp-ec2-key.pem ubuntu@YOUR_EC2_IP
```

**Services not accessible:**

- Check security group rules
- Verify ports are open (80, 443, 8001, 8002, 8003, 8080)
- Check EC2 instance status in AWS Console

### Deployment Issues

**Docker images not pulling:**

- Verify GitHub Container Registry access
- Check `GITHUB_TOKEN` secret is set
- Ensure images were built successfully

**Application not starting:**

```bash
# SSH into EC2
ssh -i ~/.ssh/erp-ec2-key.pem ubuntu@YOUR_EC2_IP

# Check logs
cd ~/erp
docker compose logs

# Check container status
docker compose ps
```

---

## Best Practices

### 1. State Management

**Use Remote State (Recommended):**

Update `main.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "erp-microservices/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

### 2. Security

- ✅ **Restrict SSH Access**: Use your IP in `allowed_ssh_cidr_blocks`
- ✅ **Use Strong Passwords**: For MongoDB and JWT secrets
- ✅ **Enable Encryption**: EBS volumes are encrypted by default
- ✅ **Regular Updates**: Keep Terraform and AWS provider updated
- ✅ **Secrets Management**: Use AWS Secrets Manager for sensitive data

### 3. Cost Optimization

- Use `t2.micro` for development (free tier)
- Use `t3.medium` for production
- Enable Elastic IP only if needed
- Monitor AWS costs regularly

### 4. Backup Strategy

- Regular database backups
- Terraform state backups (if using S3 backend)
- Document infrastructure changes

### 5. Monitoring

- Set up CloudWatch alarms
- Monitor EC2 instance metrics
- Track application logs
- Set up health checks

---

## Quick Reference

### Common Commands

```bash
# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan changes
terraform plan

# Apply changes
terraform apply

# Destroy infrastructure
terraform destroy

# Show outputs
terraform output

# Show state
terraform show

# Format code
terraform fmt

# Refresh state
terraform refresh
```

### Important Files

- `terraform/main.tf`: Infrastructure resources
- `terraform/variables.tf`: Input variables
- `terraform/outputs.tf`: Output values
- `terraform/terraform.tfvars`: Your configuration (not in git)
- `.github/workflows/deploy.yml`: CI/CD workflow

### Support

For issues or questions:
- Check [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- Review [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)
- Open an issue in the repository

---

## Next Steps

1. ✅ Deploy infrastructure with Terraform
2. ✅ Configure GitHub Secrets
3. ✅ Set up environment variables on EC2
4. ✅ Deploy application via GitHub Actions
5. ✅ Configure domain and SSL (optional)
6. ✅ Set up monitoring and alerts
7. ✅ Create backup strategy

---

**Happy Deploying! 🚀**
