# Terraform Infrastructure for ERP Microservices

This directory contains Terraform configuration files to provision AWS EC2 infrastructure for the ERP Microservices application.

## Quick Start

### 1. Prerequisites

- Terraform >= 1.0 installed
- AWS CLI configured with credentials
- AWS account with EC2 permissions

### 2. Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 3. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review what will be created
terraform plan

# Create infrastructure
terraform apply
```

### 4. Get Connection Details

```bash
terraform output
```

## Files

- `main.tf` - Main infrastructure resources (EC2, Security Groups, IAM)
- `variables.tf` - Input variable definitions
- `outputs.tf` - Output values (IPs, URLs, etc.)
- `terraform.tfvars.example` - Example configuration file
- `.gitignore` - Ignored files (state, secrets, etc.)

## Resources Created

- **EC2 Instance**: Ubuntu 22.04 LTS server
- **Security Group**: Firewall rules for services
- **IAM Role**: Permissions for EC2 instance
- **Elastic IP**: Static IP address (optional)
- **Key Pair**: SSH access (optional)

## Important Notes

- ⚠️ `terraform.tfvars` is git-ignored (contains sensitive data)
- ⚠️ Never commit `.tfstate` files
- ✅ Always review `terraform plan` before applying
- ✅ Use remote state backend for production

## Documentation

For detailed instructions, see [TERRAFORM_DEPLOYMENT.md](../docs/TERRAFORM_DEPLOYMENT.md)

## Support

For issues or questions, check the main documentation or open an issue.
