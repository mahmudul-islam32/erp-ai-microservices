# 🚀 Finance Module Quick Start Guide

## Get Started with Financial Management in 5 Minutes!

### **Step 1: Start the Finance Service**

```bash
# Navigate to project root
cd /Users/mohammadmahmudulislam/Desktop/erp-ai-microservices

# Start the finance service (and dependencies)
docker-compose up -d finance-service

# Check if it's running
curl http://localhost:8006/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Finance Service",
  "version": "1.0.0"
}
```

### **Step 2: Get Your Auth Token**

```bash
# Login to get token
curl -X POST "http://localhost:8001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Copy the `access_token` from the response. Use it in the commands below.

### **Step 3: Seed Default Data**

```bash
# Replace YOUR_TOKEN with your actual token

# 1. Seed default chart of accounts
curl -X POST "http://localhost:8006/api/v1/accounts/seed-defaults" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Seed default currencies
curl -X POST "http://localhost:8006/api/v1/currencies/seed-defaults" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Step 4: View Your Chart of Accounts**

```bash
# List all accounts
curl "http://localhost:8006/api/v1/accounts" \
  -H "Authorization: Bearer YOUR_TOKEN"

# View account hierarchy
curl "http://localhost:8006/api/v1/accounts/hierarchy" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Step 5: Create Your First Journal Entry**

Let's record a cash sale of $1,000:

```bash
curl -X POST "http://localhost:8006/api/v1/journal-entries" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entry_date": "2024-10-20",
    "description": "Cash sale to customer",
    "reference": "SALE-001",
    "line_items": [
      {
        "account_id": "1120",
        "account_code": "1120",
        "account_name": "Bank Accounts",
        "debit_amount": 1000.00,
        "credit_amount": 0.00,
        "description": "Cash received from sale"
      },
      {
        "account_id": "4100",
        "account_code": "4100",
        "account_name": "Sales Revenue",
        "debit_amount": 0.00,
        "credit_amount": 1000.00,
        "description": "Revenue from sale"
      }
    ]
  }'
```

Copy the entry `_id` from the response for the next step.

### **Step 6: Post the Journal Entry**

```bash
# Replace ENTRY_ID with the _id from previous step
curl -X POST "http://localhost:8006/api/v1/journal-entries/ENTRY_ID/post" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

This posts the entry and updates account balances!

### **Step 7: Generate Your First Financial Report**

```bash
# Profit & Loss Statement
curl "http://localhost:8006/api/v1/reports/profit-loss?period_start=2024-01-01&period_end=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Balance Sheet
curl "http://localhost:8006/api/v1/reports/balance-sheet?as_of_date=2024-10-20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Trial Balance
curl "http://localhost:8006/api/v1/reports/trial-balance?as_of_date=2024-10-20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Step 8: Create a Customer Invoice**

```bash
curl -X POST "http://localhost:8006/api/v1/invoices/customer" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST-001",
    "customer_name": "John Doe",
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-10-20",
    "due_date": "2024-11-20",
    "line_items": [
      {
        "description": "Product A",
        "quantity": 2,
        "unit_price": 500.00,
        "total_amount": 1000.00,
        "account_id": "4100",
        "account_code": "4100",
        "tax_amount": 0.00
      }
    ],
    "subtotal": 1000.00,
    "tax_amount": 0.00,
    "total_amount": 1000.00
  }'
```

### **Step 9: Record Customer Payment**

```bash
# Replace INVOICE_ID with the _id from previous step
curl -X POST "http://localhost:8006/api/v1/invoices/customer/INVOICE_ID/payment" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_amount": 1000.00,
    "payment_date": "2024-10-25",
    "payment_method": "Bank Transfer"
  }'
```

This automatically creates a journal entry and updates AR!

### **Step 10: View Aging Report**

```bash
# Customer aging report (AR)
curl "http://localhost:8006/api/v1/invoices/aging/customer" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Vendor aging report (AP)
curl "http://localhost:8006/api/v1/invoices/aging/vendor" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎉 Congratulations!

You've just:
- ✅ Set up the finance service
- ✅ Created a chart of accounts
- ✅ Recorded journal entries
- ✅ Posted transactions
- ✅ Generated financial reports
- ✅ Created invoices
- ✅ Recorded payments
- ✅ Viewed aging reports

## 🌐 Explore the API

Open your browser and visit:
- **Interactive API Docs**: http://localhost:8006/docs
- **Alternative Docs**: http://localhost:8006/redoc

You can test all endpoints directly from the browser!

---

## 📖 Common Tasks

### Create a Bank Account
```bash
curl -X POST "http://localhost:8006/api/v1/banks/accounts" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_name": "Main Business Account",
    "bank_name": "Bank of America",
    "account_number": "1234567890",
    "account_type": "checking",
    "currency": "USD",
    "opening_balance": 10000.00,
    "gl_account_id": "1120"
  }'
```

### Add a Currency Exchange Rate
```bash
curl -X POST "http://localhost:8006/api/v1/currencies/rates" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "base_currency": "USD",
    "target_currency": "EUR",
    "exchange_rate": 0.92,
    "rate_date": "2024-10-20"
  }'
```

### Convert Currency
```bash
curl "http://localhost:8006/api/v1/currencies/convert?amount=1000&from_currency=USD&to_currency=EUR" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create a Vendor Invoice
```bash
curl -X POST "http://localhost:8006/api/v1/invoices/vendor" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_id": "VEND-001",
    "vendor_name": "ABC Supplier",
    "invoice_number": "VINV-2024-001",
    "invoice_date": "2024-10-20",
    "due_date": "2024-11-20",
    "line_items": [
      {
        "description": "Office Supplies",
        "quantity": 1,
        "unit_price": 500.00,
        "total_amount": 500.00,
        "account_id": "5200",
        "account_code": "5200",
        "tax_amount": 0.00
      }
    ],
    "subtotal": 500.00,
    "tax_amount": 0.00,
    "total_amount": 500.00
  }'
```

### Pay Vendor Invoice
```bash
curl -X POST "http://localhost:8006/api/v1/invoices/vendor/INVOICE_ID/pay" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_amount": 500.00,
    "payment_date": "2024-10-25",
    "payment_method": "Check"
  }'
```

---

## 🔍 Troubleshooting

### Service Not Starting?
```bash
# Check logs
docker-compose logs finance-service

# Restart service
docker-compose restart finance-service
```

### Database Connection Issues?
```bash
# Make sure MongoDB is running
docker-compose ps mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Authentication Errors?
Make sure your token is valid and not expired. Login again to get a fresh token.

---

## 📚 Next Steps

1. **Explore the API Documentation**: http://localhost:8006/docs
2. **Read the Full README**: `finance-service/README.md`
3. **Integration Guide**: `FINANCE_MODULE_IMPLEMENTATION.md`
4. **Build the Frontend**: Create React components for finance pages

---

**Happy Accounting! 💰**

