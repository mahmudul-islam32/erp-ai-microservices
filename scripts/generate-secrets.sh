#!/bin/bash

# ============================================
# Secret Generation Script for ERP System
# ============================================
# This script generates secure random secrets for your ERP system
# Usage: ./scripts/generate-secrets.sh

set -e

echo "🔐 Generating Secure Secrets for ERP System"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

echo "${BLUE}Generating secrets...${NC}"
echo ""

# Generate JWT Secret (64 characters)
echo "${GREEN}JWT Secret Key (64 characters):${NC}"
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")
echo "$JWT_SECRET"
echo ""

# Generate MongoDB Password
echo "${GREEN}MongoDB Password (24 characters):${NC}"
MONGO_PASS=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")
echo "$MONGO_PASS"
echo ""

# Generate Redis Password
echo "${GREEN}Redis Password (24 characters):${NC}"
REDIS_PASS=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")
echo "$REDIS_PASS"
echo ""

# Generate Session Secret
echo "${GREEN}Session Secret (32 characters):${NC}"
SESSION_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
echo "$SESSION_SECRET"
echo ""

# Generate Cookie Secret
echo "${GREEN}Cookie Secret (32 characters):${NC}"
COOKIE_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
echo "$COOKIE_SECRET"
echo ""

echo "============================================"
echo "${YELLOW}⚠️  IMPORTANT SECURITY NOTES:${NC}"
echo "1. Copy these secrets to your .env file"
echo "2. NEVER commit .env to version control"
echo "3. Keep these secrets safe and private"
echo "4. Generate new secrets for each environment"
echo "5. Rotate secrets every 90 days"
echo ""

# Ask if user wants to save to file
read -p "Do you want to save these secrets to a file? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    SECRETS_FILE="secrets-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$SECRETS_FILE" << EOF
# Generated Secrets - $(date)
# ⚠️  KEEP THIS FILE SECURE - DO NOT SHARE!

JWT_SECRET_KEY=$JWT_SECRET
MONGO_INITDB_ROOT_PASSWORD=$MONGO_PASS
REDIS_PASSWORD=$REDIS_PASS
SESSION_SECRET=$SESSION_SECRET
COOKIE_SECRET=$COOKIE_SECRET

# Copy these values to your .env file
# Then DELETE this file securely: shred -u $SECRETS_FILE
EOF

    echo "${GREEN}✅ Secrets saved to: $SECRETS_FILE${NC}"
    echo "${YELLOW}⚠️  Remember to delete this file after copying to .env${NC}"
    echo "   Use: shred -u $SECRETS_FILE"
else
    echo "${BLUE}💡 Secrets not saved to file${NC}"
    echo "   Copy them from above to your .env file"
fi

echo ""
echo "============================================"
echo "${GREEN}✅ Secret generation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Copy the secrets to your .env file"
echo "2. Replace the placeholder values in .env"
echo "3. Save and close .env"
echo "4. Run: chmod 600 .env (to secure the file)"
echo "5. Start your application"
echo ""
echo "For more help, see INSTALLATION.md"
echo "============================================"

