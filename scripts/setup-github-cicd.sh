#!/bin/bash

# GitHub CI/CD Setup Script
# This script helps you set up automated deployment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 GitHub CI/CD Setup for ERP Microservices${NC}"
echo "=============================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${YELLOW}Initializing Git repository...${NC}"
    git init
    git branch -M main
fi

# Check if remote exists
if ! git remote get-url origin &> /dev/null; then
    echo -e "${YELLOW}📝 Enter your GitHub repository URL:${NC}"
    echo "   Example: https://github.com/mahmudul-islam32/erp-ai-microservices.git"
    read -p "Repository URL: " repo_url
    git remote add origin "$repo_url"
    echo -e "${GREEN}✅ Remote added${NC}"
else
    echo -e "${GREEN}✅ Git remote already configured${NC}"
fi

# Add all files
echo -e "${YELLOW}📦 Adding files to git...${NC}"
git add .

# Commit
echo -e "${YELLOW}💾 Creating commit...${NC}"
read -p "Commit message (default: 'Setup CI/CD deployment'): " commit_msg
commit_msg=${commit_msg:-"Setup CI/CD deployment"}
git commit -m "$commit_msg" || echo "No changes to commit"

# Push
echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
git push -u origin main

echo ""
echo -e "${GREEN}✅ Code pushed to GitHub!${NC}"
echo ""

# Instructions for GitHub Secrets
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 Next: Configure GitHub Secrets${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Go to: https://github.com/mahmudul-islam32/erp-ai-microservices/settings/secrets/actions"
echo ""
echo "Click 'New repository secret' and add these:"
echo ""
echo -e "${GREEN}Required Secrets:${NC}"
echo "┌─────────────────────────────┬─────────────────────────────────────┐"
echo "│ Secret Name                 │ Value                               │"
echo "├─────────────────────────────┼─────────────────────────────────────┤"
echo "│ EC2_HOST                    │ Your EC2 public IP                  │"
echo "│ EC2_USER                    │ ubuntu                              │"
echo "│ EC2_SSH_KEY                 │ Content of your .pem file           │"
echo "│ MONGODB_URL                 │ MongoDB connection string           │"
echo "│ JWT_SECRET_KEY              │ Your JWT secret (32+ chars)         │"
echo "│ STRIPE_SECRET_KEY           │ Your Stripe secret key              │"
echo "│ STRIPE_PUBLISHABLE_KEY      │ Your Stripe public key              │"
echo "│ VITE_AUTH_SERVICE_URL       │ http://YOUR_EC2_IP:8001             │"
echo "│ VITE_INVENTORY_SERVICE_URL  │ http://YOUR_EC2_IP:8002             │"
echo "│ VITE_SALES_SERVICE_URL      │ http://YOUR_EC2_IP:8003             │"
echo "└─────────────────────────────┴─────────────────────────────────────┘"
echo ""

# Save secrets template
echo -e "${YELLOW}💾 Saving secrets template...${NC}"
cat > github-secrets-template.txt << 'EOF'
# GitHub Secrets Configuration
# Copy these values to: https://github.com/mahmudul-islam32/erp-ai-microservices/settings/secrets/actions

EC2_HOST=your-ec2-public-ip
EC2_USER=ubuntu
EC2_SSH_KEY=paste-entire-pem-file-content-here
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET_KEY=your-32-character-secret-key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
VITE_AUTH_SERVICE_URL=http://YOUR_EC2_IP:8001
VITE_INVENTORY_SERVICE_URL=http://YOUR_EC2_IP:8002
VITE_SALES_SERVICE_URL=http://YOUR_EC2_IP:8003
EOF

echo -e "${GREEN}✅ Template saved to: github-secrets-template.txt${NC}"
echo ""

# EC2 SSH Key helper
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🔑 Copy EC2 SSH Key${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "To copy your EC2 SSH key for the EC2_SSH_KEY secret:"
echo ""
echo -e "${GREEN}On Mac:${NC}"
echo "  cat ~/Downloads/your-key.pem | pbcopy"
echo ""
echo -e "${GREEN}On Linux:${NC}"
echo "  cat ~/Downloads/your-key.pem"
echo "  (then copy manually)"
echo ""
echo -e "${GREEN}On Windows:${NC}"
echo "  type C:\\path\\to\\your-key.pem"
echo "  (then copy manually)"
echo ""

# Test workflow
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🧪 After Configuring Secrets${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. Make a test change:"
echo "   echo '# Test CI/CD' >> README.md"
echo "   git add ."
echo "   git commit -m 'Test automated deployment'"
echo "   git push origin main"
echo ""
echo "2. Watch deployment:"
echo "   https://github.com/mahmudul-islam32/erp-ai-microservices/actions"
echo ""
echo "3. Check your EC2:"
echo "   ssh -i your-key.pem ubuntu@YOUR_EC2_IP"
echo "   docker compose ps"
echo ""

echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Once GitHub Secrets are configured, every push to main will:"
echo "  ✅ Build Docker images"
echo "  ✅ Push to GitHub Container Registry"
echo "  ✅ Deploy to EC2 automatically"
echo "  ✅ Run health checks"
echo ""
echo -e "${YELLOW}📚 Next steps:${NC}"
echo "1. Configure GitHub Secrets (link above)"
echo "2. Make a test change and push"
echo "3. Watch it deploy automatically!"
echo ""

