#!/bin/bash

# GitHub Secrets Setup Script
# This script helps you set up GitHub secrets for CI/CD deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}GitHub Actions Secrets Setup Guide${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}This script will guide you through setting up GitHub secrets.${NC}"
echo -e "${YELLOW}You'll need to add these secrets manually in GitHub.${NC}"
echo ""
echo -e "Go to: ${GREEN}https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions${NC}"
echo ""

# Function to display secret info
show_secret() {
    local name=$1
    local description=$2
    local example=$3
    local required=$4
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Secret Name:${NC} ${YELLOW}$name${NC}"
    echo -e "${BLUE}Description:${NC} $description"
    if [ "$required" = "true" ]; then
        echo -e "${BLUE}Required:${NC} ${RED}YES${NC}"
    else
        echo -e "${BLUE}Required:${NC} ${YELLOW}Optional${NC}"
    fi
    if [ -n "$example" ]; then
        echo -e "${BLUE}Example:${NC} $example"
    fi
    echo ""
}

echo -e "${GREEN}Required Secrets:${NC}"
echo ""

show_secret "AWS_ACCESS_KEY_ID" \
    "AWS access key ID for Terraform to manage infrastructure" \
    "AKIAIOSFODNN7EXAMPLE" \
    "true"

show_secret "AWS_SECRET_ACCESS_KEY" \
    "AWS secret access key for Terraform" \
    "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" \
    "true"

show_secret "EC2_HOST" \
    "Public IP address or hostname of your EC2 instance" \
    "54.123.45.67 or ec2-54-123-45-67.compute-1.amazonaws.com" \
    "true"

show_secret "EC2_SSH_KEY" \
    "Private SSH key to access EC2 (entire .pem file content)" \
    "-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----" \
    "true"

show_secret "EC2_USER" \
    "SSH username for EC2 instance" \
    "ubuntu (for Ubuntu AMI) or ec2-user (for Amazon Linux)" \
    "true"

echo ""
echo -e "${GREEN}Optional Secrets (for production features):${NC}"
echo ""

show_secret "VITE_AUTH_SERVICE_URL" \
    "Public URL for auth service (used by frontend)" \
    "https://your-domain.com/auth or http://your-ec2-ip:8001" \
    "false"

show_secret "VITE_INVENTORY_SERVICE_URL" \
    "Public URL for inventory service" \
    "https://your-domain.com/inventory or http://your-ec2-ip:8002" \
    "false"

show_secret "VITE_SALES_SERVICE_URL" \
    "Public URL for sales service" \
    "https://your-domain.com/sales or http://your-ec2-ip:8003" \
    "false"

show_secret "STRIPE_PUBLISHABLE_KEY" \
    "Stripe publishable key for payment processing" \
    "pk_live_51xxxxx or pk_test_51xxxxx" \
    "false"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}How to add secrets:${NC}"
echo "1. Go to your GitHub repository"
echo "2. Click 'Settings' tab"
echo "3. Click 'Secrets and variables' > 'Actions'"
echo "4. Click 'New repository secret'"
echo "5. Enter the secret name and value"
echo "6. Click 'Add secret'"
echo ""

echo -e "${YELLOW}Special instructions for EC2_SSH_KEY:${NC}"
echo "1. Open your .pem file: ${GREEN}cat ~/.ssh/your-key.pem${NC}"
echo "2. Copy the ENTIRE content including:"
echo "   ${BLUE}-----BEGIN RSA PRIVATE KEY-----${NC}"
echo "   ${BLUE}(all the encoded content)${NC}"
echo "   ${BLUE}-----END RSA PRIVATE KEY-----${NC}"
echo "3. Paste it as the secret value in GitHub"
echo ""

echo -e "${YELLOW}To get your EC2 IP address:${NC}"
echo "From Terraform output:"
echo "  ${GREEN}cd terraform && terraform output elastic_ip${NC}"
echo "Or from AWS Console:"
echo "  ${GREEN}EC2 Dashboard > Instances > Select instance > Public IPv4 address${NC}"
echo ""

echo -e "${YELLOW}To create AWS access keys:${NC}"
echo "1. Go to AWS Console"
echo "2. Click your username > Security Credentials"
echo "3. Scroll to 'Access keys'"
echo "4. Click 'Create access key'"
echo "5. Download and save the credentials"
echo "6. Add them to GitHub secrets"
echo ""

echo -e "${GREEN}✅ Setup Instructions Complete!${NC}"
echo ""
echo -e "${YELLOW}After adding all secrets, push to main branch to trigger deployment:${NC}"
echo "  ${GREEN}git add .${NC}"
echo "  ${GREEN}git commit -m 'Update deployment configuration'${NC}"
echo "  ${GREEN}git push origin main${NC}"
echo ""
echo -e "${YELLOW}Monitor deployment at:${NC}"
echo "  ${GREEN}https://github.com/YOUR_USERNAME/YOUR_REPO/actions${NC}"
echo ""
