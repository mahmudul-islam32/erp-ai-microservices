#!/usr/bin/env python3
"""
Master script to seed all services with demo data
This script runs all seed scripts in the correct order
"""

import os
import sys
import subprocess
from pathlib import Path

# Try to load .env file (optional dependency)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # If python-dotenv is not installed, try to manually load .env
    env_file = Path(__file__).parent.parent / ".env"
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

# Colors for terminal output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

def print_colored(message, color=Colors.NC):
    """Print colored message"""
    print(f"{color}{message}{Colors.NC}")

def check_env_vars():
    """Check if required environment variables are set"""
    required_vars = ['MONGODB_ATLAS_HOST', 'MONGODB_ATLAS_USER', 'MONGODB_ATLAS_PASSWORD']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print_colored("❌ Error: Missing required MongoDB Atlas environment variables!", Colors.RED)
        print("Please set in .env file:")
        for var in missing_vars:
            print(f"  {var}")
        return False
    
    return True

def build_mongodb_url():
    """Build MongoDB Atlas connection URL"""
    host = os.getenv('MONGODB_ATLAS_HOST')
    user = os.getenv('MONGODB_ATLAS_USER')
    password = os.getenv('MONGODB_ATLAS_PASSWORD')
    
    return f"mongodb+srv://{user}:{password}@{host}/?retryWrites=true&w=majority&appName=Cluster0"

def run_python_seed(script_path, service_name, description, database_name=None):
    """Run a Python seed script"""
    print_colored(f"📦 Seeding {service_name}...", Colors.YELLOW)
    print("-----------------------------------")
    
    if not os.path.exists(script_path):
        print_colored(f"   ⚠️  Script not found: {script_path}", Colors.RED)
        return False
    
    # Set environment variables
    env = os.environ.copy()
    env['MONGODB_URL'] = build_mongodb_url()
    if database_name:
        env['DATABASE_NAME'] = database_name
    
    try:
        subprocess.run(
            [sys.executable, script_path],
            env=env,
            cwd=Path(script_path).parent.parent,
            check=True,
            capture_output=False
        )
        print_colored(f"   ✅ {description} seeded successfully", Colors.GREEN)
        print()
        return True
    except subprocess.CalledProcessError:
        print_colored(f"   ❌ Failed to seed {description}", Colors.RED)
        print()
        return False

def run_inventory_seed():
    """Run inventory service seed (TypeScript/NestJS)"""
    print_colored("📦 Seeding inventory-service...", Colors.YELLOW)
    print("-----------------------------------")
    
    inventory_dir = Path(__file__).parent.parent / "inventory-service"
    
    if not inventory_dir.exists():
        print_colored("   ⚠️  Inventory service directory not found", Colors.RED)
        return False
    
    # Check if node_modules exists
    node_modules = inventory_dir / "node_modules"
    if not node_modules.exists():
        print_colored("   Installing dependencies...", Colors.YELLOW)
        try:
            subprocess.run(
                ["npm", "install"],
                cwd=inventory_dir,
                check=True,
                capture_output=True
            )
        except subprocess.CalledProcessError:
            print_colored("   ❌ Failed to install dependencies", Colors.RED)
            return False
    
    # Set MongoDB URI for inventory service
    env = os.environ.copy()
    env['MONGODB_URI'] = build_mongodb_url()
    
    seed_script = inventory_dir / "src" / "database" / "seed.ts"
    
    if not seed_script.exists():
        print_colored(f"   ⚠️  Seed script not found: {seed_script}", Colors.RED)
        return False
    
    try:
        # Run using ts-node
        subprocess.run(
            ["npx", "ts-node", str(seed_script)],
            cwd=inventory_dir,
            env=env,
            check=True,
            capture_output=False
        )
        print_colored("   ✅ Inventory service seeded successfully", Colors.GREEN)
        print()
        return True
    except subprocess.CalledProcessError:
        print_colored("   ❌ Failed to seed inventory service", Colors.RED)
        print()
        return False

def main():
    """Main function to seed all services"""
    print_colored("🌱 Starting seed process for all services...", Colors.BLUE)
    print_colored("===========================================", Colors.BLUE)
    print()
    
    # Check environment variables
    if not check_env_vars():
        sys.exit(1)
    
    # Track failures
    failed_services = []
    
    # Get project root directory
    project_root = Path(__file__).parent.parent
    
    # 1. Seed Auth Service (must be first - creates users)
    auth_script = project_root / "auth-service" / "scripts" / "seed_demo_data.py"
    if not run_python_seed(str(auth_script), "auth", "Auth Service (Users, Roles, Sessions)", "erp_auth"):
        failed_services.append("auth")
    
    # 2. Seed Inventory Service
    if not run_inventory_seed():
        failed_services.append("inventory")
    
    # 3. Seed Sales Service (depends on auth and inventory)
    sales_script = project_root / "sales-service" / "scripts" / "seed_demo_data.py"
    if not run_python_seed(str(sales_script), "sales", "Sales Service (Customers, Orders)", "erp_sales"):
        failed_services.append("sales")
    
    # Seed Sales Invoices (if separate script exists)
    sales_invoices_script = project_root / "sales-service" / "scripts" / "seed_invoices.py"
    if sales_invoices_script.exists():
        if not run_python_seed(str(sales_invoices_script), "sales", "Sales Service (Invoices)", "erp_sales"):
            failed_services.append("sales-invoices")
    
    # 4. Seed Finance Service
    finance_script = project_root / "finance-service" / "scripts" / "seed_demo_data.py"
    if not run_python_seed(str(finance_script), "finance", "Finance Service (Accounts, Journal Entries, Invoices)", "erp_finance"):
        failed_services.append("finance")
    
    # 5. Seed HRM Service
    hrm_script = project_root / "hrm-service" / "scripts" / "seed_demo_data.py"
    if not run_python_seed(str(hrm_script), "hrm", "HRM Service (Employees, Payroll, Attendance)", "erp_hrm"):
        failed_services.append("hrm")
    
    # Summary
    print_colored("===========================================", Colors.BLUE)
    print_colored("📊 Seeding Summary", Colors.BLUE)
    print_colored("===========================================", Colors.BLUE)
    
    if not failed_services:
        print_colored("✅ All services seeded successfully!", Colors.GREEN)
        print()
        print_colored("🎉 Your ERP system is ready with demo data!", Colors.GREEN)
        print()
        print_colored("📋 Test Credentials:", Colors.YELLOW)
        print("   Super Admin: admin@example.com / admin123")
        print("   Manager: manager@example.com / manager123")
        print("   Employee: employee@example.com / employee123")
        print()
        sys.exit(0)
    else:
        print_colored("❌ Some services failed to seed:", Colors.RED)
        for service in failed_services:
            print_colored(f"   - {service}", Colors.RED)
        print()
        print_colored("⚠️  Please check the errors above and try again", Colors.YELLOW)
        sys.exit(1)

if __name__ == "__main__":
    main()

