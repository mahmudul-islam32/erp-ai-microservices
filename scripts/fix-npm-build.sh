#!/bin/bash

# Quick Fix for GitHub Actions NPM Error

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔧 Fixing GitHub Actions NPM Build Error${NC}"
echo "=========================================="
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

echo -e "${YELLOW}1. Regenerating package-lock.json...${NC}"
cd erp-frontend
npm install --package-lock-only --legacy-peer-deps
cd ..

echo ""
echo -e "${YELLOW}2. Testing Docker build locally...${NC}"
docker build \
  --build-arg VITE_AUTH_SERVICE_URL=http://localhost:8001 \
  --build-arg VITE_INVENTORY_SERVICE_URL=http://localhost:8002 \
  --build-arg VITE_SALES_SERVICE_URL=http://localhost:8003 \
  -t test-frontend-build \
  ./erp-frontend

echo ""
echo -e "${GREEN}✅ Local build successful!${NC}"
echo ""

echo -e "${YELLOW}3. Staging changes...${NC}"
git add erp-frontend/Dockerfile
git add erp-frontend/package-lock.json
git add FIX_GITHUB_ACTIONS_NPM_ERROR.md

echo ""
echo -e "${YELLOW}4. Committing changes...${NC}"
git commit -m "Fix: GitHub Actions npm ci error

- Updated Dockerfile to use npm install --legacy-peer-deps
- Regenerated package-lock.json
- Added fallback build commands
- Tested build locally successfully"

echo ""
echo -e "${GREEN}✅ Changes committed!${NC}"
echo ""

echo -e "${YELLOW}Ready to push?${NC}"
read -p "Push to GitHub now? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}5. Pushing to GitHub...${NC}"
    git push origin main
    
    echo ""
    echo -e "${GREEN}🎉 Pushed successfully!${NC}"
    echo ""
    echo "Watch deployment at:"
    echo "https://github.com/mahmudul-islam32/erp-ai-microservices/actions"
else
    echo ""
    echo "Push manually when ready:"
    echo "  git push origin main"
fi

echo ""
echo -e "${GREEN}✅ Fix applied!${NC}"

