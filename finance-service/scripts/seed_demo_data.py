import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, date, timedelta
from bson import ObjectId

# Database configuration
# Use mongodb service name when running in Docker, localhost when running locally
import os
MONGODB_HOST = os.getenv("MONGODB_HOST", "mongodb")  # Default to service name for Docker
MONGODB_URL = f"mongodb://admin:password123@{MONGODB_HOST}:27017/erp_finance?authSource=admin"
DATABASE_NAME = "erp_finance"


async def seed_demo_data():
    """Seed demo financial data"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("🌱 Seeding Finance Demo Data...")
    
    # 1. Seed Chart of Accounts
    print("📊 Seeding Chart of Accounts...")
    
    # Clear existing accounts
    await db.accounts.delete_many({})
    
    default_accounts = [
        # Assets
        {"account_code": "1000", "account_name": "Assets", "account_type": "asset", "normal_balance": "debit", "parent_account": None, "balance": 75000.00},
        {"account_code": "1100", "account_name": "Current Assets", "account_type": "asset", "normal_balance": "debit", "parent_account": "1000", "balance": 55000.00},
        {"account_code": "1110", "account_name": "Cash", "account_type": "asset", "normal_balance": "debit", "parent_account": "1100", "balance": 25000.00},
        {"account_code": "1120", "account_name": "Bank Accounts", "account_type": "asset", "normal_balance": "debit", "parent_account": "1100", "balance": 20000.00},
        {"account_code": "1130", "account_name": "Accounts Receivable", "account_type": "asset", "normal_balance": "debit", "parent_account": "1100", "balance": 10000.00},
        {"account_code": "1140", "account_name": "Inventory", "account_type": "asset", "normal_balance": "debit", "parent_account": "1100", "balance": 15000.00},
        {"account_code": "1200", "account_name": "Fixed Assets", "account_type": "asset", "normal_balance": "debit", "parent_account": "1000", "balance": 20000.00},
        
        # Liabilities
        {"account_code": "2000", "account_name": "Liabilities", "account_type": "liability", "normal_balance": "credit", "parent_account": None, "balance": 25000.00},
        {"account_code": "2100", "account_name": "Current Liabilities", "account_type": "liability", "normal_balance": "credit", "parent_account": "2000", "balance": 25000.00},
        {"account_code": "2110", "account_name": "Accounts Payable", "account_type": "liability", "normal_balance": "credit", "parent_account": "2100", "balance": 15000.00},
        {"account_code": "2120", "account_name": "Sales Tax Payable", "account_type": "liability", "normal_balance": "credit", "parent_account": "2100", "balance": 2000.00},
        {"account_code": "2130", "account_name": "Payroll Liabilities", "account_type": "liability", "normal_balance": "credit", "parent_account": "2100", "balance": 8000.00},
        
        # Equity
        {"account_code": "3000", "account_name": "Equity", "account_type": "equity", "normal_balance": "credit", "parent_account": None, "balance": 50000.00},
        {"account_code": "3100", "account_name": "Owner's Equity", "account_type": "equity", "normal_balance": "credit", "parent_account": "3000", "balance": 40000.00},
        {"account_code": "3200", "account_name": "Retained Earnings", "account_type": "equity", "normal_balance": "credit", "parent_account": "3000", "balance": 10000.00},
        
        # Revenue
        {"account_code": "4000", "account_name": "Revenue", "account_type": "revenue", "normal_balance": "credit", "parent_account": None, "balance": 85000.00},
        {"account_code": "4100", "account_name": "Sales Revenue", "account_type": "revenue", "normal_balance": "credit", "parent_account": "4000", "balance": 75000.00},
        {"account_code": "4200", "account_name": "Service Revenue", "account_type": "revenue", "normal_balance": "credit", "parent_account": "4000", "balance": 10000.00},
        
        # Expenses
        {"account_code": "5000", "account_name": "Expenses", "account_type": "expense", "normal_balance": "debit", "parent_account": None, "balance": 58000.00},
        {"account_code": "5100", "account_name": "Cost of Goods Sold", "account_type": "expense", "normal_balance": "debit", "parent_account": "5000", "balance": 35000.00},
        {"account_code": "5200", "account_name": "Operating Expenses", "account_type": "expense", "normal_balance": "debit", "parent_account": "5000", "balance": 23000.00},
        {"account_code": "5210", "account_name": "Salaries Expense", "account_type": "expense", "normal_balance": "debit", "parent_account": "5200", "balance": 15000.00},
        {"account_code": "5220", "account_name": "Rent Expense", "account_type": "expense", "normal_balance": "debit", "parent_account": "5200", "balance": 5000.00},
        {"account_code": "5230", "account_name": "Utilities Expense", "account_type": "expense", "normal_balance": "debit", "parent_account": "5200", "balance": 3000.00},
    ]
    
    for account_data in default_accounts:
        account_doc = {
            **account_data,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.accounts.insert_one(account_doc)
    
    print(f"  ✅ Created {len(default_accounts)} accounts")
    
    # 2. Seed Journal Entries
    print("📝 Seeding Journal Entries...")
    
    await db.journal_entries.delete_many({})
    
    demo_user_id = "demo_user_001"
    
    journal_entries = [
        {
            "entry_number": "JE-2024-000001",
            "entry_date": datetime(2024, 1, 15),
            "description": "Cash sale to customer",
            "reference": "SALE-001",
            "total_debit": 5000.00,
            "total_credit": 5000.00,
            "status": "posted",
            "line_items": [
                {
                    "account_id": "1120",
                    "account_code": "1120",
                    "account_name": "Bank Accounts",
                    "debit_amount": 5000.00,
                    "credit_amount": 0.00,
                    "description": "Cash received from sale"
                },
                {
                    "account_id": "4100",
                    "account_code": "4100",
                    "account_name": "Sales Revenue",
                    "debit_amount": 0.00,
                    "credit_amount": 5000.00,
                    "description": "Revenue from sale"
                }
            ],
            "created_by": demo_user_id,
            "created_at": datetime(2024, 1, 15),
            "updated_at": datetime(2024, 1, 15),
            "posted_at": datetime(2024, 1, 15),
            "posted_by": demo_user_id
        },
        {
            "entry_number": "JE-2024-000002",
            "entry_date": datetime(2024, 2, 1),
            "description": "Monthly rent payment",
            "reference": "RENT-FEB",
            "total_debit": 5000.00,
            "total_credit": 5000.00,
            "status": "posted",
            "line_items": [
                {
                    "account_id": "5220",
                    "account_code": "5220",
                    "account_name": "Rent Expense",
                    "debit_amount": 5000.00,
                    "credit_amount": 0.00,
                    "description": "February rent"
                },
                {
                    "account_id": "1120",
                    "account_code": "1120",
                    "account_name": "Bank Accounts",
                    "debit_amount": 0.00,
                    "credit_amount": 5000.00,
                    "description": "Payment for rent"
                }
            ],
            "created_by": demo_user_id,
            "created_at": datetime(2024, 2, 1),
            "updated_at": datetime(2024, 2, 1),
            "posted_at": datetime(2024, 2, 1),
            "posted_by": demo_user_id
        },
        {
            "entry_number": "JE-2024-000003",
            "entry_date": datetime(2024, 3, 15),
            "description": "Purchase of inventory",
            "reference": "PO-001",
            "total_debit": 15000.00,
            "total_credit": 15000.00,
            "status": "posted",
            "line_items": [
                {
                    "account_id": "1140",
                    "account_code": "1140",
                    "account_name": "Inventory",
                    "debit_amount": 15000.00,
                    "credit_amount": 0.00,
                    "description": "Inventory purchased"
                },
                {
                    "account_id": "2110",
                    "account_code": "2110",
                    "account_name": "Accounts Payable",
                    "debit_amount": 0.00,
                    "credit_amount": 15000.00,
                    "description": "Amount owed to supplier"
                }
            ],
            "created_by": demo_user_id,
            "created_at": datetime(2024, 3, 15),
            "updated_at": datetime(2024, 3, 15),
            "posted_at": datetime(2024, 3, 15),
            "posted_by": demo_user_id
        },
        {
            "entry_number": "JE-2024-000004",
            "entry_date": datetime.combine(date.today() - timedelta(days=5), datetime.min.time()),
            "description": "Payment received from customer",
            "reference": "INV-2024-001",
            "total_debit": 10000.00,
            "total_credit": 10000.00,
            "status": "posted",
            "line_items": [
                {
                    "account_id": "1120",
                    "account_code": "1120",
                    "account_name": "Bank Accounts",
                    "debit_amount": 10000.00,
                    "credit_amount": 0.00,
                    "description": "Customer payment received"
                },
                {
                    "account_id": "1130",
                    "account_code": "1130",
                    "account_name": "Accounts Receivable",
                    "debit_amount": 0.00,
                    "credit_amount": 10000.00,
                    "description": "AR collection"
                }
            ],
            "created_by": demo_user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "posted_at": datetime.utcnow(),
            "posted_by": demo_user_id
        },
        {
            "entry_number": "JE-2024-000005",
            "entry_date": datetime.combine(date.today() - timedelta(days=1), datetime.min.time()),
            "description": "Employee salary payment",
            "reference": "PAY-OCT",
            "total_debit": 15000.00,
            "total_credit": 15000.00,
            "status": "posted",
            "line_items": [
                {
                    "account_id": "5210",
                    "account_code": "5210",
                    "account_name": "Salaries Expense",
                    "debit_amount": 15000.00,
                    "credit_amount": 0.00,
                    "description": "October salaries"
                },
                {
                    "account_id": "1120",
                    "account_code": "1120",
                    "account_name": "Bank Accounts",
                    "debit_amount": 0.00,
                    "credit_amount": 15000.00,
                    "description": "Salary payments"
                }
            ],
            "created_by": demo_user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "posted_at": datetime.utcnow(),
            "posted_by": demo_user_id
        }
    ]
    
    for entry in journal_entries:
        await db.journal_entries.insert_one(entry)
    
    print(f"  ✅ Created {len(journal_entries)} journal entries")
    
    # 3. Seed Customer Invoices
    print("📄 Seeding Customer Invoices...")
    
    await db.customer_invoices.delete_many({})
    
    customer_invoices = [
        {
            "invoice_number": "INV-2024-001",
            "customer_id": "CUST-001",
            "customer_name": "Acme Corporation",
            "invoice_date": datetime.combine(date.today() - timedelta(days=30), datetime.min.time()),
            "due_date": datetime.combine(date.today() - timedelta(days=0), datetime.min.time()),
            "sales_order_id": None,
            "line_items": [
                {
                    "description": "Product A - Premium Package",
                    "quantity": 10,
                    "unit_price": 500.00,
                    "total_amount": 5000.00,
                    "account_id": "4100",
                    "account_code": "4100",
                    "tax_amount": 0.00
                }
            ],
            "subtotal": 5000.00,
            "tax_amount": 0.00,
            "total_amount": 5000.00,
            "paid_amount": 5000.00,
            "balance_due": 0.00,
            "status": "paid",
            "payment_history": [
                {
                    "payment_date": str(date.today() - timedelta(days=5)),
                    "amount": 5000.00,
                    "payment_method": "Bank Transfer",
                    "recorded_by": demo_user_id,
                    "recorded_at": datetime.utcnow()
                }
            ],
            "created_by": demo_user_id,
            "created_at": datetime.utcnow() - timedelta(days=30),
            "updated_at": datetime.utcnow(),
            "sent_at": datetime.utcnow() - timedelta(days=28)
        },
        {
            "invoice_number": "INV-2024-002",
            "customer_id": "CUST-002",
            "customer_name": "Tech Solutions Inc",
            "invoice_date": datetime.combine(date.today() - timedelta(days=15), datetime.min.time()),
            "due_date": datetime.combine(date.today() + timedelta(days=15), datetime.min.time()),
            "sales_order_id": None,
            "line_items": [
                {
                    "description": "Consulting Services",
                    "quantity": 20,
                    "unit_price": 150.00,
                    "total_amount": 3000.00,
                    "account_id": "4200",
                    "account_code": "4200",
                    "tax_amount": 0.00
                }
            ],
            "subtotal": 3000.00,
            "tax_amount": 0.00,
            "total_amount": 3000.00,
            "paid_amount": 0.00,
            "balance_due": 3000.00,
            "status": "sent",
            "payment_history": [],
            "created_by": demo_user_id,
            "created_at": datetime.utcnow() - timedelta(days=15),
            "updated_at": datetime.utcnow(),
            "sent_at": datetime.utcnow() - timedelta(days=14)
        },
        {
            "invoice_number": "INV-2024-003",
            "customer_id": "CUST-003",
            "customer_name": "Global Enterprises",
            "invoice_date": datetime.combine(date.today() - timedelta(days=45), datetime.min.time()),
            "due_date": datetime.combine(date.today() - timedelta(days=15), datetime.min.time()),
            "sales_order_id": None,
            "line_items": [
                {
                    "description": "Product B - Standard Package",
                    "quantity": 5,
                    "unit_price": 800.00,
                    "total_amount": 4000.00,
                    "account_id": "4100",
                    "account_code": "4100",
                    "tax_amount": 0.00
                }
            ],
            "subtotal": 4000.00,
            "tax_amount": 0.00,
            "total_amount": 4000.00,
            "paid_amount": 2000.00,
            "balance_due": 2000.00,
            "status": "partial",
            "payment_history": [
                {
                    "payment_date": str(date.today() - timedelta(days=20)),
                    "amount": 2000.00,
                    "payment_method": "Credit Card",
                    "recorded_by": demo_user_id,
                    "recorded_at": datetime.utcnow() - timedelta(days=20)
                }
            ],
            "created_by": demo_user_id,
            "created_at": datetime.utcnow() - timedelta(days=45),
            "updated_at": datetime.utcnow(),
            "sent_at": datetime.utcnow() - timedelta(days=44)
        }
    ]
    
    for invoice in customer_invoices:
        await db.customer_invoices.insert_one(invoice)
    
    print(f"  ✅ Created {len(customer_invoices)} customer invoices")
    
    # 4. Seed Vendor Invoices
    print("📋 Seeding Vendor Invoices...")
    
    await db.vendor_invoices.delete_many({})
    
    vendor_invoices = [
        {
            "invoice_number": "VINV-2024-001",
            "vendor_id": "VEND-001",
            "vendor_name": "Office Supplies Co",
            "invoice_date": datetime.combine(date.today() - timedelta(days=20), datetime.min.time()),
            "due_date": datetime.combine(date.today() + timedelta(days=10), datetime.min.time()),
            "line_items": [
                {
                    "description": "Office supplies - Monthly",
                    "quantity": 1,
                    "unit_price": 2500.00,
                    "total_amount": 2500.00,
                    "account_id": "5200",
                    "account_code": "5200",
                    "tax_amount": 0.00
                }
            ],
            "subtotal": 2500.00,
            "tax_amount": 0.00,
            "total_amount": 2500.00,
            "paid_amount": 0.00,
            "balance_due": 2500.00,
            "status": "pending",
            "payment_history": [],
            "attachments": [],
            "created_by": demo_user_id,
            "created_at": datetime.utcnow() - timedelta(days=20),
            "updated_at": datetime.utcnow()
        },
        {
            "invoice_number": "VINV-2024-002",
            "vendor_id": "VEND-002",
            "vendor_name": "Equipment Rental LLC",
            "invoice_date": datetime.combine(date.today() - timedelta(days=10), datetime.min.time()),
            "due_date": datetime.combine(date.today() + timedelta(days=20), datetime.min.time()),
            "line_items": [
                {
                    "description": "Equipment rental - Q4",
                    "quantity": 1,
                    "unit_price": 3500.00,
                    "total_amount": 3500.00,
                    "account_id": "5200",
                    "account_code": "5200",
                    "tax_amount": 0.00
                }
            ],
            "subtotal": 3500.00,
            "tax_amount": 0.00,
            "total_amount": 3500.00,
            "paid_amount": 0.00,
            "balance_due": 3500.00,
            "status": "pending",
            "payment_history": [],
            "attachments": [],
            "created_by": demo_user_id,
            "created_at": datetime.utcnow() - timedelta(days=10),
            "updated_at": datetime.utcnow()
        }
    ]
    
    for invoice in vendor_invoices:
        await db.vendor_invoices.insert_one(invoice)
    
    print(f"  ✅ Created {len(vendor_invoices)} vendor invoices")
    
    # 5. Seed Currencies
    print("💱 Seeding Currencies...")
    
    await db.currencies.delete_many({})
    
    currencies = [
        {"code": "USD", "name": "US Dollar", "symbol": "$", "is_active": True},
        {"code": "EUR", "name": "Euro", "symbol": "€", "is_active": True},
        {"code": "GBP", "name": "British Pound", "symbol": "£", "is_active": True},
        {"code": "JPY", "name": "Japanese Yen", "symbol": "¥", "is_active": True},
        {"code": "CAD", "name": "Canadian Dollar", "symbol": "C$", "is_active": True},
        {"code": "AUD", "name": "Australian Dollar", "symbol": "A$", "is_active": True},
        {"code": "CHF", "name": "Swiss Franc", "symbol": "CHF", "is_active": True},
        {"code": "CNY", "name": "Chinese Yuan", "symbol": "¥", "is_active": True},
        {"code": "INR", "name": "Indian Rupee", "symbol": "₹", "is_active": True},
    ]
    
    for currency_data in currencies:
        currency_doc = {
            **currency_data,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.currencies.insert_one(currency_doc)
    
    print(f"  ✅ Created {len(currencies)} currencies")
    
    # 6. Seed Bank Accounts
    print("🏦 Seeding Bank Accounts...")
    
    await db.bank_accounts.delete_many({})
    
    bank_accounts = [
        {
            "account_name": "Main Business Checking",
            "bank_name": "Chase Bank",
            "account_number": "****1234",
            "routing_number": "021000021",
            "account_type": "checking",
            "currency": "USD",
            "opening_balance": 15000.00,
            "current_balance": 20000.00,
            "is_active": True,
            "gl_account_id": "1120",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "account_name": "Business Savings",
            "bank_name": "Bank of America",
            "account_number": "****5678",
            "routing_number": "026009593",
            "account_type": "savings",
            "currency": "USD",
            "opening_balance": 50000.00,
            "current_balance": 50000.00,
            "is_active": True,
            "gl_account_id": "1120",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    for bank_account in bank_accounts:
        await db.bank_accounts.insert_one(bank_account)
    
    print(f"  ✅ Created {len(bank_accounts)} bank accounts")
    
    print("\n✅ Demo data seeded successfully!")
    print("\n📊 Summary:")
    print(f"  - Accounts: {len(default_accounts)}")
    print(f"  - Journal Entries: {len(journal_entries)}")
    print(f"  - Customer Invoices: {len(customer_invoices)}")
    print(f"  - Vendor Invoices: {len(vendor_invoices)}")
    print(f"  - Currencies: {len(currencies)}")
    print(f"  - Bank Accounts: {len(bank_accounts)}")
    print("\n🎉 Finance module is ready to use!")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_demo_data())

