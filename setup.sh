#!/bin/bash

# ============================================
# ERP System - Interactive Setup Wizard
# ============================================
# Beautiful terminal-based installation wizard
# No dependencies needed - works everywhere!

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Unicode symbols
CHECK="✓"
CROSS="✗"
ARROW="→"
STAR="★"

# Clear screen and show header
clear
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${CYAN}     ERP SYSTEM - SETUP WIZARD${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Welcome! This wizard will guide you through the installation.${NC}"
echo -e "${BLUE}Expected time: 5-10 minutes${NC}"
echo ""
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"
echo ""

# Press any key to continue
read -p "Press ENTER to start installation..." -r
echo ""

# ============================================
# STEP 1: CHECK REQUIREMENTS
# ============================================

clear
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"
echo -e "${BOLD}STEP 1/6: Checking System Requirements${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"
echo ""

requirements_passed=true

# Check Docker
echo -n "Checking Docker... "
if command -v docker &> /dev/null; then
    docker_version=$(docker --version | awk '{print $3}' | sed 's/,//')
    echo -e "${GREEN}${CHECK} Installed (${docker_version})${NC}"
else
    echo -e "${RED}${CROSS} Not found${NC}"
    requirements_passed=false
fi

# Check Docker Compose
echo -n "Checking Docker Compose... "
if command -v docker-compose &> /dev/null; then
    compose_version=$(docker-compose --version | awk '{print $4}' | sed 's/,//')
    echo -e "${GREEN}${CHECK} Installed (${compose_version})${NC}"
else
    echo -e "${RED}${CROSS} Not found${NC}"
    requirements_passed=false
fi

# Check Docker is running
echo -n "Checking Docker Daemon... "
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}${CHECK} Running${NC}"
else
    echo -e "${RED}${CROSS} Not running${NC}"
    requirements_passed=false
fi

# Check disk space
echo -n "Checking Disk Space... "
if command -v df &> /dev/null; then
    available_gb=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$available_gb" -ge 10 ]; then
        echo -e "${GREEN}${CHECK} ${available_gb}GB available${NC}"
    else
        echo -e "${YELLOW}${CROSS} Only ${available_gb}GB (10GB recommended)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Cannot check${NC}"
fi

# Check ports
echo -n "Checking Required Ports... "
ports_available=true
for port in 5173 8001 8002 8003 27017 6379; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠ Port $port in use${NC}"
        ports_available=false
        break
    fi
done
if [ "$ports_available" = true ]; then
    echo -e "${GREEN}${CHECK} All ports available${NC}"
fi

echo ""

if [ "$requirements_passed" = false ]; then
    echo -e "${RED}${CROSS} Requirements check failed!${NC}"
    echo -e "${YELLOW}Please install missing components and try again.${NC}"
    echo ""
    echo "Installation guides:"
    echo "  Docker: https://docs.docker.com/get-docker/"
    exit 1
else
    echo -e "${GREEN}${CHECK} All requirements met!${NC}"
fi

echo ""
read -p "Press ENTER to continue..." -r
echo ""

# ============================================
# STEP 2: CONFIGURATION
# ============================================

clear
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"
echo -e "${BOLD}STEP 2/6: System Configuration${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"
echo ""

# App Name
echo -e "${CYAN}${ARROW} Application Name${NC} (default: ERP System)"
read -p "Enter name or press ENTER for default: " app_name
app_name=${app_name:-"ERP System"}
echo -e "${GREEN}Set to: $app_name${NC}"
echo ""

# Company Name
echo -e "${CYAN}${ARROW} Company Name${NC} (optional)"
read -p "Enter your company name: " company_name
if [ -n "$company_name" ]; then
    echo -e "${GREEN}Set to: $company_name${NC}"
fi
echo ""

# Timezone
echo -e "${CYAN}${ARROW} Timezone${NC}"
echo "1) America/New_York (EST)"
echo "2) America/Los_Angeles (PST)"
echo "3) Europe/London (GMT)"
echo "4) Asia/Tokyo (JST)"
echo "5) Keep default (America/New_York)"
read -p "Choose (1-5): " tz_choice
case $tz_choice in
    1) timezone="America/New_York" ;;
    2) timezone="America/Los_Angeles" ;;
    3) timezone="Europe/London" ;;
    4) timezone="Asia/Tokyo" ;;
    *) timezone="America/New_York" ;;
esac
echo -e "${GREEN}Set to: $timezone${NC}"
echo ""

# Currency
echo -e "${CYAN}${ARROW} Currency${NC}"
echo "1) USD - US Dollar (\$)"
echo "2) EUR - Euro (€)"
echo "3) GBP - British Pound (£)"
read -p "Choose (1-3): " currency_choice
case $currency_choice in
    1) currency="USD" ;;
    2) currency="EUR" ;;
    3) currency="GBP" ;;
    *) currency="USD" ;;
esac
echo -e "${GREEN}Set to: $currency${NC}"
echo ""

# Demo Data
echo -e "${CYAN}${ARROW} Load demo data for testing?${NC}"
read -p "Load demo data? (Y/n): " load_demo
if [[ $load_demo =~ ^[Nn]$ ]]; then
    demo_data=false
    echo -e "${YELLOW}Demo data will NOT be loaded${NC}"
else
    demo_data=true
    echo -e "${GREEN}Demo data will be loaded${NC}"
fi

echo ""
read -p "Press ENTER to continue..." -r
echo ""

# ============================================
# STEP 3: ADMIN ACCOUNT
# ============================================

clear
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"
echo -e "${BOLD}STEP 3/6: Create Admin Account${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"
echo ""

# Admin Email
while true; do
    echo -e "${CYAN}${ARROW} Admin Email Address${NC}"
    read -p "Email: " admin_email
    if [[ "$admin_email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        echo -e "${GREEN}${CHECK} Valid email${NC}"
        break
    else
        echo -e "${RED}${CROSS} Invalid email format. Please try again.${NC}"
    fi
done
echo ""

# Admin Password
while true; do
    echo -e "${CYAN}${ARROW} Admin Password${NC} (min 8 characters)"
    read -s -p "Password: " admin_password
    echo ""
    if [ ${#admin_password} -ge 8 ]; then
        read -s -p "Confirm Password: " admin_password_confirm
        echo ""
        if [ "$admin_password" = "$admin_password_confirm" ]; then
            echo -e "${GREEN}${CHECK} Password set${NC}"
            break
        else
            echo -e "${RED}${CROSS} Passwords don't match. Try again.${NC}"
        fi
    else
        echo -e "${RED}${CROSS} Password must be at least 8 characters${NC}"
    fi
done
echo ""

# Admin Name
echo -e "${CYAN}${ARROW} Your Name${NC}"
read -p "First Name: " admin_first
read -p "Last Name: " admin_last
echo -e "${GREEN}${CHECK} Name set to: $admin_first $admin_last${NC}"
echo ""

read -p "Press ENTER to start installation..." -r
echo ""

# ============================================
# STEP 4: CREATE CONFIGURATION
# ============================================

clear
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"
echo -e "${BOLD}STEP 4/6: Creating Configuration${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"
echo ""

# Create .env file
echo -n "Creating .env file... "
if [ -f ".env" ]; then
    cp .env .env.backup
    echo -e "${YELLOW}(backed up existing)${NC}"
fi

cp .env.example .env
echo -e "${GREEN}${CHECK}${NC}"

# Generate secrets
echo -n "Generating secure secrets... "
if command -v python3 &> /dev/null; then
    JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")
    MONGO_PASS=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")
    REDIS_PASS=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")
    
    # Update .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|JWT_SECRET_KEY=.*|JWT_SECRET_KEY=$JWT_SECRET|" .env
        sed -i '' "s|MONGO_INITDB_ROOT_PASSWORD=.*|MONGO_INITDB_ROOT_PASSWORD=$MONGO_PASS|" .env
        sed -i '' "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASS|" .env
        sed -i '' "s|APP_NAME=.*|APP_NAME=\"$app_name\"|" .env
        sed -i '' "s|COMPANY_NAME=.*|COMPANY_NAME=\"$company_name\"|" .env
        sed -i '' "s|TZ=.*|TZ=$timezone|" .env
        sed -i '' "s|CURRENCY_CODE=.*|CURRENCY_CODE=$currency|" .env
        sed -i '' "s|LOAD_DEMO_DATA=.*|LOAD_DEMO_DATA=$demo_data|" .env
    else
        sed -i "s|JWT_SECRET_KEY=.*|JWT_SECRET_KEY=$JWT_SECRET|" .env
        sed -i "s|MONGO_INITDB_ROOT_PASSWORD=.*|MONGO_INITDB_ROOT_PASSWORD=$MONGO_PASS|" .env
        sed -i "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASS|" .env
        sed -i "s|APP_NAME=.*|APP_NAME=\"$app_name\"|" .env
        sed -i "s|COMPANY_NAME=.*|COMPANY_NAME=\"$company_name\"|" .env
        sed -i "s|TZ=.*|TZ=$timezone|" .env
        sed -i "s|CURRENCY_CODE=.*|CURRENCY_CODE=$currency|" .env
        sed -i "s|LOAD_DEMO_DATA=.*|LOAD_DEMO_DATA=$demo_data|" .env
    fi
    
    echo -e "${GREEN}${CHECK}${NC}"
else
    echo -e "${YELLOW}⚠ Python not found, using defaults${NC}"
fi

echo ""
read -p "Press ENTER to continue..." -r
echo ""

# ============================================
# STEP 5: START SERVICES
# ============================================

clear
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"
echo -e "${BOLD}STEP 5/6: Starting Services${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"
echo ""

echo -e "${BLUE}This may take a few minutes...${NC}"
echo ""

# Pull images
echo -n "${CYAN}[1/3]${NC} Pulling Docker images... "
docker-compose pull > /dev/null 2>&1 && echo -e "${GREEN}${CHECK}${NC}" || echo -e "${YELLOW}⚠ Will build locally${NC}"

# Start containers
echo -n "${CYAN}[2/3]${NC} Starting containers... "
docker-compose up -d > /dev/null 2>&1 && echo -e "${GREEN}${CHECK}${NC}" || {
    echo -e "${RED}${CROSS} Failed${NC}"
    exit 1
}

# Wait for services
echo -e "${CYAN}[3/3]${NC} Waiting for services to initialize..."
echo -e "  ${BLUE}This takes about 90 seconds...${NC}"
echo -n "  "
for i in {1..90}; do
    echo -n "."
    sleep 1
done
echo -e " ${GREEN}${CHECK}${NC}"

echo ""
echo -e "${GREEN}${CHECK} All services should be ready now${NC}"
echo ""

read -p "Press ENTER to continue..." -r
echo ""

# ============================================
# STEP 6: CREATE ADMIN USER & DEMO DATA
# ============================================

clear
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"
echo -e "${BOLD}STEP 6/6: Finalizing Setup${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════${NC}"
echo ""

# Wait a bit more for auth service to be fully ready
echo -e "${CYAN}Ensuring auth service is ready...${NC}"
sleep 5

echo -e "${CYAN}Creating admin user...${NC}"
echo ""

# Create admin with retries
MAX_RETRIES=3
RETRY_COUNT=0
ADMIN_CREATED=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    ADMIN_RESULT=$(docker-compose exec -T auth-service python -c '
import asyncio
import sys
sys.path.insert(0, "/app")

async def create_admin():
    try:
        from app.database.connection import connect_to_mongo, get_database
        from app.services.user_service import UserService
        from app.models.user import UserCreate, UserRole
        
        # Connect to database first
        await connect_to_mongo()
        
        # Get database
        db = get_database()
        
        if db is None:
            print("ERROR: Database connection failed")
            sys.exit(1)
        
        # UserService does NOT take parameters
        user_service = UserService()
        
        # Check if user exists
        existing = await db.users.find_one({"email": "'"$admin_email"'"})
        if existing:
            print("User already exists - OK")
            sys.exit(0)
        
        # Create admin using UserCreate model
        user_data = UserCreate(
            email="'"$admin_email"'",
            password="'"$admin_password"'",
            first_name="'"$admin_first"'",
            last_name="'"$admin_last"'",
            role=UserRole.SUPER_ADMIN
        )
        
        result = await user_service.create_user(user_data)
        
        if result:
            print("Admin created successfully!")
            print(f"Email: {result.email}")
            sys.exit(0)
        else:
            print("ERROR: Failed to create user")
            sys.exit(1)
            
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

asyncio.run(create_admin())
' 2>&1)

    if echo "$ADMIN_RESULT" | grep -qi "successfully\|already exists"; then
        echo -e "  ${GREEN}${CHECK} Admin user: $admin_email${NC}"
        ADMIN_CREATED=true
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo -e "  ${YELLOW}Retry $RETRY_COUNT/$MAX_RETRIES...${NC}"
            sleep 10
        fi
    fi
done

if [ "$ADMIN_CREATED" = false ]; then
    echo -e "  ${RED}${CROSS} Could not create admin user${NC}"
    echo -e "  ${BLUE}Error: $ADMIN_RESULT${NC}"
    echo -e "  ${YELLOW}You can create admin later manually${NC}"
fi

echo ""

# Load demo data if requested
if [ "$demo_data" = true ]; then
    echo -e "${CYAN}Loading demo data for all services...${NC}"
    echo ""
    
    # 1. Auth Service Demo Data
    echo -e "${BLUE}📝 Auth Service Demo Data${NC}"
    if [ -f "auth-service/scripts/seed_demo_data.py" ]; then
        AUTH_DEMO=$(docker-compose exec -T auth-service python scripts/seed_demo_data.py 2>&1)
        
        if echo "$AUTH_DEMO" | grep -qi "SUCCESS\|seeding complete"; then
            echo -e "  ${GREEN}${CHECK} Auth demo data loaded!${NC}"
            echo -e "  ${BLUE}  • 12 demo users${NC}"
            echo -e "  ${BLUE}  • 50 audit logs${NC}"
            echo -e "  ${BLUE}  • 10 active sessions${NC}"
        else
            echo -e "  ${YELLOW}⚠ Auth demo data had issues${NC}"
            echo "$AUTH_DEMO" | tail -3
        fi
    else
        echo -e "  ${YELLOW}⚠ Auth seed script not found${NC}"
    fi
    
    echo ""
    
    # 2. Inventory Service Demo Data
    echo -e "${BLUE}📦 Inventory Service Demo Data${NC}"
    INV_DEMO=$(docker-compose exec -T inventory-service npm run seed 2>&1)
    
    if echo "$INV_DEMO" | grep -qi "seeded\|successfully\|complete"; then
        echo -e "  ${GREEN}${CHECK} Inventory demo data loaded!${NC}"
        echo -e "  ${BLUE}  • Categories & Suppliers${NC}"
        echo -e "  ${BLUE}  • 50+ products${NC}"
        echo -e "  ${BLUE}  • Warehouses & Stock${NC}"
    else
        echo -e "  ${YELLOW}⚠ Inventory demo data had issues${NC}"
        echo "$INV_DEMO" | tail -3
    fi
    
    echo ""
    
    # 3. Sales Service Demo Data
    echo -e "${BLUE}💰 Sales Service Demo Data${NC}"
    if [ -f "sales-service/scripts/seed_demo_data.py" ]; then
        SALES_DEMO=$(docker-compose exec -T sales-service python scripts/seed_demo_data.py 2>&1)
        
        if echo "$SALES_DEMO" | grep -qi "SUCCESS\|seeding complete"; then
            echo -e "  ${GREEN}${CHECK} Sales demo data loaded!${NC}"
            echo -e "  ${BLUE}  • 5 demo customers${NC}"
            echo -e "  ${BLUE}  • 50 sales orders${NC}"
            echo -e "  ${BLUE}  • 15 invoices${NC}"
            echo -e "  ${BLUE}  • 8 payments${NC}"
            echo -e "  ${BLUE}  • $196K+ total order value${NC}"
        else
            echo -e "  ${YELLOW}⚠ Sales demo data had issues:${NC}"
            echo "$SALES_DEMO" | grep -i "error\|failed" | tail -5 || echo "$SALES_DEMO" | tail -3
        fi
    else
        echo -e "  ${YELLOW}⚠ Sales seed script not found${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}${CHECK} All demo data loading complete!${NC}"
fi

echo ""
echo -e "${GREEN}${CHECK} Installation complete!${NC}"
echo ""

read -p "Press ENTER to see your credentials..." -r
echo ""

# ============================================
# SUCCESS SCREEN
# ============================================

clear
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}     🎉 INSTALLATION COMPLETE! 🎉${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""

echo -e "${BOLD}Your ERP System is ready to use!${NC}"
echo ""

echo -e "${PURPLE}═══ ACCESS INFORMATION ═══${NC}"
echo ""
echo -e "${CYAN}${ARROW} Frontend URL:${NC}"
echo -e "  ${BOLD}http://localhost:8080${NC}"
echo ""
echo -e "${CYAN}${ARROW} Login Credentials:${NC}"
echo -e "  Email:    ${BOLD}$admin_email${NC}"
echo -e "  Password: ${BOLD}[as entered above]${NC}"
echo ""
echo -e "${RED}${STAR} IMPORTANT: Change your password after first login!${NC}"
echo ""

echo -e "${PURPLE}═══ API DOCUMENTATION ═══${NC}"
echo ""
echo -e "  Auth API:      http://localhost:8001/docs"
echo -e "  Inventory API: http://localhost:8002/docs"
echo -e "  Sales API:     http://localhost:8003/docs"
echo ""

echo -e "${PURPLE}═══ USEFUL COMMANDS ═══${NC}"
echo ""
echo -e "  View logs:       ${CYAN}docker-compose logs -f${NC}"
echo -e "  Stop services:   ${CYAN}docker-compose down${NC}"
echo -e "  Restart:         ${CYAN}docker-compose restart${NC}"
echo ""

echo -e "${PURPLE}═══ DOCUMENTATION ═══${NC}"
echo ""
echo -e "  User Manual:     ${CYAN}docs/USER_MANUAL.md${NC}"
echo -e "  Quick Start:     ${CYAN}docs/QUICK_START.md${NC}"
echo -e "  Interactive:     ${CYAN}documentation/index.html${NC}"
echo ""

echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""

# Ask to open browser
if command -v open &> /dev/null; then
    read -p "Open ERP in browser now? (Y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo -e "${GREEN}Opening browser...${NC}"
        open http://localhost:8080
    fi
elif command -v xdg-open &> /dev/null; then
    read -p "Open ERP in browser now? (Y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        echo -e "${GREEN}Opening browser...${NC}"
        xdg-open http://localhost:8080
    fi
fi

echo ""
echo -e "${BOLD}${GREEN}Thank you for choosing our ERP System!${NC}"
echo -e "${BLUE}Enjoy managing your business! 🚀${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""

