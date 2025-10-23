// Seed Finance Demo Data - Run with: mongosh -u admin -p password123 --authenticationDatabase admin erp_finance seed-finance-data.js

print('🌱 Seeding Finance Demo Data...');

// Use the finance database
db = db.getSiblingDB('erp_finance');

// 1. Clear existing data
print('🗑️  Clearing existing data...');
db.accounts.deleteMany({});
db.journal_entries.deleteMany({});
db.customer_invoices.deleteMany({});
db.vendor_invoices.deleteMany({});
db.currencies.deleteMany({});
db.bank_accounts.deleteMany({});

// 2. Seed Chart of Accounts
print('📊 Seeding Chart of Accounts...');

const accounts = [
    // Assets
    {account_code: "1000", account_name: "Assets", account_type: "asset", normal_balance: "debit", parent_account: null, balance: 75000.00, is_active: true},
    {account_code: "1100", account_name: "Current Assets", account_type: "asset", normal_balance: "debit", parent_account: "1000", balance: 55000.00, is_active: true},
    {account_code: "1110", account_name: "Cash", account_type: "asset", normal_balance: "debit", parent_account: "1100", balance: 25000.00, is_active: true},
    {account_code: "1120", account_name: "Bank Accounts", account_type: "asset", normal_balance: "debit", parent_account: "1100", balance: 20000.00, is_active: true},
    {account_code: "1130", account_name: "Accounts Receivable", account_type: "asset", normal_balance: "debit", parent_account: "1100", balance: 5000.00, is_active: true},
    {account_code: "1140", account_name: "Inventory", account_type: "asset", normal_balance: "debit", parent_account: "1100", balance: 15000.00, is_active: true},
    {account_code: "1200", account_name: "Fixed Assets", account_type: "asset", normal_balance: "debit", parent_account: "1000", balance: 20000.00, is_active: true},
    
    // Liabilities
    {account_code: "2000", account_name: "Liabilities", account_type: "liability", normal_balance: "credit", parent_account: null, balance: 25000.00, is_active: true},
    {account_code: "2100", account_name: "Current Liabilities", account_type: "liability", normal_balance: "credit", parent_account: "2000", balance: 25000.00, is_active: true},
    {account_code: "2110", account_name: "Accounts Payable", account_type: "liability", normal_balance: "credit", parent_account: "2100", balance: 6000.00, is_active: true},
    {account_code: "2120", account_name: "Sales Tax Payable", account_type: "liability", normal_balance: "credit", parent_account: "2100", balance: 2000.00, is_active: true},
    {account_code: "2130", account_name: "Payroll Liabilities", account_type: "liability", normal_balance: "credit", parent_account: "2100", balance: 17000.00, is_active: true},
    
    // Equity
    {account_code: "3000", account_name: "Equity", account_type: "equity", normal_balance: "credit", parent_account: null, balance: 50000.00, is_active: true},
    {account_code: "3100", account_name: "Owner's Equity", account_type: "equity", normal_balance: "credit", parent_account: "3000", balance: 40000.00, is_active: true},
    {account_code: "3200", account_name: "Retained Earnings", account_type: "equity", normal_balance: "credit", parent_account: "3000", balance: 10000.00, is_active: true},
    
    // Revenue
    {account_code: "4000", account_name: "Revenue", account_type: "revenue", normal_balance: "credit", parent_account: null, balance: 85000.00, is_active: true},
    {account_code: "4100", account_name: "Sales Revenue", account_type: "revenue", normal_balance: "credit", parent_account: "4000", balance: 75000.00, is_active: true},
    {account_code: "4200", account_name: "Service Revenue", account_type: "revenue", normal_balance: "credit", parent_account: "4000", balance: 10000.00, is_active: true},
    
    // Expenses
    {account_code: "5000", account_name: "Expenses", account_type: "expense", normal_balance: "debit", parent_account: null, balance: 58000.00, is_active: true},
    {account_code: "5100", account_name: "Cost of Goods Sold", account_type: "expense", normal_balance: "debit", parent_account: "5000", balance: 35000.00, is_active: true},
    {account_code: "5200", account_name: "Operating Expenses", account_type: "expense", normal_balance: "debit", parent_account: "5000", balance: 23000.00, is_active: true},
    {account_code: "5210", account_name: "Salaries Expense", account_type: "expense", normal_balance: "debit", parent_account: "5200", balance: 15000.00, is_active: true},
    {account_code: "5220", account_name: "Rent Expense", account_type: "expense", normal_balance: "debit", parent_account: "5200", balance: 5000.00, is_active: true},
    {account_code: "5230", account_name: "Utilities Expense", account_type: "expense", normal_balance: "debit", parent_account: "5200", balance: 3000.00, is_active: true},
];

accounts.forEach(account => {
    account.created_at = new Date();
    account.updated_at = new Date();
    db.accounts.insertOne(account);
});

print(`  ✅ Created ${accounts.length} accounts`);

// 3. Seed Journal Entries
print('📝 Seeding Journal Entries...');

const journalEntries = [
    {
        entry_number: "JE-2024-000001",
        entry_date: new Date("2024-01-15"),
        description: "Cash sale to customer",
        reference: "SALE-001",
        total_debit: 5000.00,
        total_credit: 5000.00,
        status: "posted",
        line_items: [
            {account_id: "1120", account_code: "1120", account_name: "Bank Accounts", debit_amount: 5000.00, credit_amount: 0.00, description: "Cash received"},
            {account_id: "4100", account_code: "4100", account_name: "Sales Revenue", debit_amount: 0.00, credit_amount: 5000.00, description: "Revenue from sale"}
        ],
        created_by: "demo_user",
        created_at: new Date("2024-01-15"),
        updated_at: new Date("2024-01-15"),
        posted_at: new Date("2024-01-15"),
        posted_by: "demo_user"
    },
    {
        entry_number: "JE-2024-000002",
        entry_date: new Date("2024-02-01"),
        description: "Monthly rent payment",
        reference: "RENT-FEB",
        total_debit: 5000.00,
        total_credit: 5000.00,
        status: "posted",
        line_items: [
            {account_id: "5220", account_code: "5220", account_name: "Rent Expense", debit_amount: 5000.00, credit_amount: 0.00, description: "February rent"},
            {account_id: "1120", account_code: "1120", account_name: "Bank Accounts", debit_amount: 0.00, credit_amount: 5000.00, description: "Payment for rent"}
        ],
        created_by: "demo_user",
        created_at: new Date("2024-02-01"),
        updated_at: new Date("2024-02-01"),
        posted_at: new Date("2024-02-01"),
        posted_by: "demo_user"
    },
    {
        entry_number: "JE-2024-000003",
        entry_date: new Date("2024-03-15"),
        description: "Purchase of inventory",
        reference: "PO-001",
        total_debit: 15000.00,
        total_credit: 15000.00,
        status: "posted",
        line_items: [
            {account_id: "1140", account_code: "1140", account_name: "Inventory", debit_amount: 15000.00, credit_amount: 0.00, description: "Inventory purchased"},
            {account_id: "2110", account_code: "2110", account_name: "Accounts Payable", debit_amount: 0.00, credit_amount: 15000.00, description: "Amount owed to supplier"}
        ],
        created_by: "demo_user",
        created_at: new Date("2024-03-15"),
        updated_at: new Date("2024-03-15"),
        posted_at: new Date("2024-03-15"),
        posted_by: "demo_user"
    }
];

journalEntries.forEach(entry => {
    db.journal_entries.insertOne(entry);
});

print(`  ✅ Created ${journalEntries.length} journal entries`);

// 4. Seed Customer Invoices
print('📄 Seeding Customer Invoices...');

const customerInvoices = [
    {
        invoice_number: "INV-2024-001",
        customer_id: "CUST-001",
        customer_name: "Acme Corporation",
        invoice_date: new Date(Date.now() - 30*24*60*60*1000),
        due_date: new Date(),
        line_items: [
            {description: "Product A - Premium Package", quantity: 10, unit_price: 500.00, total_amount: 5000.00, account_id: "4100", account_code: "4100", tax_amount: 0.00}
        ],
        subtotal: 5000.00,
        tax_amount: 0.00,
        total_amount: 5000.00,
        paid_amount: 5000.00,
        balance_due: 0.00,
        status: "paid",
        payment_history: [
            {payment_date: new Date(Date.now() - 5*24*60*60*1000).toISOString().split('T')[0], amount: 5000.00, payment_method: "Bank Transfer", recorded_by: "demo_user", recorded_at: new Date()}
        ],
        created_by: "demo_user",
        created_at: new Date(Date.now() - 30*24*60*60*1000),
        updated_at: new Date(),
        sent_at: new Date(Date.now() - 28*24*60*60*1000)
    },
    {
        invoice_number: "INV-2024-002",
        customer_id: "CUST-002",
        customer_name: "Tech Solutions Inc",
        invoice_date: new Date(Date.now() - 15*24*60*60*1000),
        due_date: new Date(Date.now() + 15*24*60*60*1000),
        line_items: [
            {description: "Consulting Services", quantity: 20, unit_price: 150.00, total_amount: 3000.00, account_id: "4200", account_code: "4200", tax_amount: 0.00}
        ],
        subtotal: 3000.00,
        tax_amount: 0.00,
        total_amount: 3000.00,
        paid_amount: 0.00,
        balance_due: 3000.00,
        status: "sent",
        payment_history: [],
        created_by: "demo_user",
        created_at: new Date(Date.now() - 15*24*60*60*1000),
        updated_at: new Date(),
        sent_at: new Date(Date.now() - 14*24*60*60*1000)
    },
    {
        invoice_number: "INV-2024-003",
        customer_id: "CUST-003",
        customer_name: "Global Enterprises",
        invoice_date: new Date(Date.now() - 45*24*60*60*1000),
        due_date: new Date(Date.now() - 15*24*60*60*1000),
        line_items: [
            {description: "Product B - Standard Package", quantity: 5, unit_price: 800.00, total_amount: 4000.00, account_id: "4100", account_code: "4100", tax_amount: 0.00}
        ],
        subtotal: 4000.00,
        tax_amount: 0.00,
        total_amount: 4000.00,
        paid_amount: 2000.00,
        balance_due: 2000.00,
        status: "partial",
        payment_history: [
            {payment_date: new Date(Date.now() - 20*24*60*60*1000).toISOString().split('T')[0], amount: 2000.00, payment_method: "Credit Card", recorded_by: "demo_user", recorded_at: new Date(Date.now() - 20*24*60*60*1000)}
        ],
        created_by: "demo_user",
        created_at: new Date(Date.now() - 45*24*60*60*1000),
        updated_at: new Date(),
        sent_at: new Date(Date.now() - 44*24*60*60*1000)
    }
];

customerInvoices.forEach(invoice => {
    db.customer_invoices.insertOne(invoice);
});

print(`  ✅ Created ${customerInvoices.length} customer invoices`);

// 5. Seed Vendor Invoices
print('📋 Seeding Vendor Invoices...');

const vendorInvoices = [
    {
        invoice_number: "VINV-2024-001",
        vendor_id: "VEND-001",
        vendor_name: "Office Supplies Co",
        invoice_date: new Date(Date.now() - 20*24*60*60*1000),
        due_date: new Date(Date.now() + 10*24*60*60*1000),
        line_items: [
            {description: "Office supplies - Monthly", quantity: 1, unit_price: 2500.00, total_amount: 2500.00, account_id: "5200", account_code: "5200", tax_amount: 0.00}
        ],
        subtotal: 2500.00,
        tax_amount: 0.00,
        total_amount: 2500.00,
        paid_amount: 0.00,
        balance_due: 2500.00,
        status: "pending",
        payment_history: [],
        attachments: [],
        created_by: "demo_user",
        created_at: new Date(Date.now() - 20*24*60*60*1000),
        updated_at: new Date()
    },
    {
        invoice_number: "VINV-2024-002",
        vendor_id: "VEND-002",
        vendor_name: "Equipment Rental LLC",
        invoice_date: new Date(Date.now() - 10*24*60*60*1000),
        due_date: new Date(Date.now() + 20*24*60*60*1000),
        line_items: [
            {description: "Equipment rental - Q4", quantity: 1, unit_price: 3500.00, total_amount: 3500.00, account_id: "5200", account_code: "5200", tax_amount: 0.00}
        ],
        subtotal: 3500.00,
        tax_amount: 0.00,
        total_amount: 3500.00,
        paid_amount: 0.00,
        balance_due: 3500.00,
        status: "pending",
        payment_history: [],
        attachments: [],
        created_by: "demo_user",
        created_at: new Date(Date.now() - 10*24*60*60*1000),
        updated_at: new Date()
    }
];

vendorInvoices.forEach(invoice => {
    db.vendor_invoices.insertOne(invoice);
});

print(`  ✅ Created ${vendorInvoices.length} vendor invoices`);

// 6. Seed Currencies
print('💱 Seeding Currencies...');

const currencies = [
    {code: "USD", name: "US Dollar", symbol: "$", is_active: true, created_at: new Date(), updated_at: new Date()},
    {code: "EUR", name: "Euro", symbol: "€", is_active: true, created_at: new Date(), updated_at: new Date()},
    {code: "GBP", name: "British Pound", symbol: "£", is_active: true, created_at: new Date(), updated_at: new Date()},
    {code: "JPY", name: "Japanese Yen", symbol: "¥", is_active: true, created_at: new Date(), updated_at: new Date()},
    {code: "CAD", name: "Canadian Dollar", symbol: "C$", is_active: true, created_at: new Date(), updated_at: new Date()},
    {code: "AUD", name: "Australian Dollar", symbol: "A$", is_active: true, created_at: new Date(), updated_at: new Date()},
    {code: "INR", name: "Indian Rupee", symbol: "₹", is_active: true, created_at: new Date(), updated_at: new Date()},
];

currencies.forEach(currency => {
    db.currencies.insertOne(currency);
});

print(`  ✅ Created ${currencies.length} currencies`);

// 7. Seed Bank Accounts
print('🏦 Seeding Bank Accounts...');

const bankAccounts = [
    {
        account_name: "Main Business Checking",
        bank_name: "Chase Bank",
        account_number: "****1234",
        routing_number: "021000021",
        account_type: "checking",
        currency: "USD",
        opening_balance: 15000.00,
        current_balance: 20000.00,
        is_active: true,
        gl_account_id: "1120",
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        account_name: "Business Savings",
        bank_name: "Bank of America",
        account_number: "****5678",
        routing_number: "026009593",
        account_type: "savings",
        currency: "USD",
        opening_balance: 50000.00,
        current_balance: 50000.00,
        is_active: true,
        gl_account_id: "1120",
        created_at: new Date(),
        updated_at: new Date()
    }
];

bankAccounts.forEach(account => {
    db.bank_accounts.insertOne(account);
});

print(`  ✅ Created ${bankAccounts.length} bank accounts`);

// Summary
print('\n✅ Demo data seeded successfully!');
print('\n📊 Summary:');
print(`  - Accounts: ${accounts.length}`);
print(`  - Journal Entries: ${journalEntries.length}`);
print(`  - Customer Invoices: ${customerInvoices.length}`);
print(`  - Vendor Invoices: ${vendorInvoices.length}`);
print(`  - Currencies: ${currencies.length}`);
print(`  - Bank Accounts: ${bankAccounts.length}`);
print('\n🎉 Finance module is ready to use!');

