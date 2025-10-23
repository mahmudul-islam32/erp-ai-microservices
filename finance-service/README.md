# Finance Service - ERP System

A comprehensive Financial Management & Accounting microservice built with FastAPI and MongoDB for the ERP AI Microservices system.

## 🌟 Features

### Core Financial Management
- **Chart of Accounts** - Complete account hierarchy management
- **General Ledger** - Double-entry bookkeeping system
- **Journal Entries** - Full journal entry lifecycle with posting and reversals
- **Accounts Payable (AP)** - Vendor invoice and payment management
- **Accounts Receivable (AR)** - Customer invoice and payment tracking
- **Bank Management** - Bank account and transaction management
- **Multi-Currency** - Support for multiple currencies with exchange rates

### Financial Reporting
- **Profit & Loss Statement** - Income statement generation
- **Balance Sheet** - Assets, liabilities, and equity reporting
- **Trial Balance** - Account balance verification
- **General Ledger Report** - Detailed transaction history
- **Aging Reports** - AR and AP aging analysis

### Advanced Features
- **Double-Entry Validation** - Automatic balancing validation
- **Account Hierarchies** - Nested account structures
- **Cost Center Tracking** - Department-wise expense tracking
- **Payment History** - Complete payment audit trail
- **Automated Journal Entries** - Auto-posting from invoices

## 🏗️ Architecture

### Technology Stack
- **Framework**: FastAPI
- **Database**: MongoDB with Motor async driver
- **Authentication**: JWT token validation (Auth Service integration)
- **Validation**: Pydantic models

### Database Collections
```
- accounts              # Chart of accounts
- journal_entries       # Journal entries and line items
- vendor_invoices       # Accounts payable
- customer_invoices     # Accounts receivable
- bank_accounts        # Bank account management
- bank_transactions    # Bank transactions
- currencies           # Currency master data
- currency_rates       # Exchange rates
- financial_reports    # Generated reports
```

## 📊 API Endpoints

### Chart of Accounts
- `POST /api/v1/accounts` - Create account
- `GET /api/v1/accounts` - List accounts
- `GET /api/v1/accounts/hierarchy` - Get account hierarchy
- `GET /api/v1/accounts/{id}` - Get account details
- `PUT /api/v1/accounts/{id}` - Update account
- `DELETE /api/v1/accounts/{id}` - Delete account

### Journal Entries
- `POST /api/v1/journal-entries` - Create journal entry
- `GET /api/v1/journal-entries` - List journal entries
- `GET /api/v1/journal-entries/{id}` - Get journal entry
- `POST /api/v1/journal-entries/{id}/post` - Post journal entry
- `POST /api/v1/journal-entries/{id}/reverse` - Reverse journal entry
- `GET /api/v1/journal-entries/ledger/general` - General ledger report

### Invoices (AP/AR)
- `POST /api/v1/invoices/vendor` - Create vendor invoice
- `GET /api/v1/invoices/vendor` - List vendor invoices
- `POST /api/v1/invoices/vendor/{id}/pay` - Pay vendor invoice
- `POST /api/v1/invoices/customer` - Create customer invoice
- `GET /api/v1/invoices/customer` - List customer invoices
- `POST /api/v1/invoices/customer/{id}/payment` - Record customer payment
- `GET /api/v1/invoices/aging/{type}` - Get aging report

### Financial Reports
- `GET /api/v1/reports/profit-loss` - Profit & Loss statement
- `GET /api/v1/reports/balance-sheet` - Balance Sheet
- `GET /api/v1/reports/trial-balance` - Trial Balance

### Bank Management
- `POST /api/v1/banks/accounts` - Create bank account
- `GET /api/v1/banks/accounts` - List bank accounts
- `POST /api/v1/banks/transactions` - Create bank transaction
- `GET /api/v1/banks/transactions` - List bank transactions

### Multi-Currency
- `POST /api/v1/currencies` - Create currency
- `GET /api/v1/currencies` - List currencies
- `POST /api/v1/currencies/rates` - Create exchange rate
- `GET /api/v1/currencies/convert` - Convert currency

## 🚀 Quick Start

### Development
```bash
cd finance-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8006 --reload
```

### Docker
```bash
docker-compose up finance-service
```

## 🔐 Security & Permissions

### Required Permissions
- `finance:read` - View financial data
- `finance:create` - Create transactions
- `finance:update` - Update transactions
- `finance:admin` - Full financial access

### Role-Based Access
- **Admin/Super Admin**: Full access to all financial features
- **Manager**: Create and view financial records
- **Employee**: View-only access to financial reports

## 📈 Business Logic

### Double-Entry Bookkeeping
All financial transactions follow double-entry bookkeeping principles:
- Every transaction has at least 2 line items
- Total debits must equal total credits
- Journal entries must be balanced before posting

### Account Types & Normal Balances
- **Assets**: Normal balance = Debit
- **Liabilities**: Normal balance = Credit
- **Equity**: Normal balance = Credit
- **Revenue**: Normal balance = Credit
- **Expenses**: Normal balance = Debit

### Invoice Workflow
1. **Draft** → Invoice created
2. **Sent/Pending** → Invoice sent to customer/vendor
3. **Partial** → Partial payment received
4. **Paid** → Fully paid
5. **Overdue** → Past due date

## 🧪 Default Chart of Accounts

The system includes a default chart of accounts:

### Assets (1000)
- Current Assets (1100)
  - Cash (1110)
  - Bank Accounts (1120)
  - Accounts Receivable (1130)
  - Inventory (1140)

### Liabilities (2000)
- Current Liabilities (2100)
  - Accounts Payable (2110)
  - Sales Tax Payable (2120)

### Equity (3000)
- Owner's Equity (3100)
- Retained Earnings (3200)

### Revenue (4000)
- Sales Revenue (4100)
- Service Revenue (4200)

### Expenses (5000)
- Cost of Goods Sold (5100)
- Operating Expenses (5200)
  - Salaries Expense (5210)
  - Rent Expense (5220)
  - Utilities Expense (5230)

## 📝 Environment Variables

```bash
# Service Configuration
SERVICE_PORT=8006
MONGODB_URL=mongodb://admin:password123@mongodb:27017/erp_finance?authSource=admin
DATABASE_NAME=erp_finance

# External Services
AUTH_SERVICE_URL=http://auth-service:8001
NOTIFICATION_SERVICE_URL=http://notification-service:8004

# JWT Settings
SECRET_KEY=your-secret-key
ALGORITHM=HS256

# Financial Settings
DEFAULT_CURRENCY=USD
FISCAL_YEAR_START_MONTH=1
```

## 📚 API Documentation

- **Swagger UI**: http://localhost:8006/docs
- **ReDoc**: http://localhost:8006/redoc

## 🔧 Integration

### With Sales Service
- Automatically create customer invoices from sales orders
- Record payments and update AR
- Link sales transactions to revenue accounts

### With Inventory Service
- Create journal entries for inventory movements
- Track inventory costs (COGS)
- Update inventory valuation

### With Auth Service
- User authentication and authorization
- Permission-based access control
- Audit trail tracking

## 🎯 Future Enhancements

- Budget planning and tracking
- Cash flow forecasting
- Automated bank reconciliation
- Tax calculation and reporting
- Multi-company support
- Advanced financial analytics
- Export to accounting software
- Audit compliance features

## 📄 License

Part of the ERP AI Microservices system.

