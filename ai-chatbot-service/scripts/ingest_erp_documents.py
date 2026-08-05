#!/usr/bin/env python3
"""
Script to ingest recommended ERP documents into the knowledge base.

This script includes common ERP documents that improve chatbot responses.

Usage:
    python scripts/ingest_erp_documents.py --token YOUR_JWT_TOKEN

Or set environment variable:
    export JWT_TOKEN=your-token-here
    python scripts/ingest_erp_documents.py
"""

import argparse
import os
import sys
import requests


def get_token_from_args_or_env(args_token, env_var="JWT_TOKEN"):
    """Get JWT token from args or environment variable"""
    return args_token or os.getenv(env_var)


def ingest_document(base_url, token, doc_data):
    """Ingest a single document"""
    try:
        response = requests.post(
            f"{base_url}/api/v1/ai-chatbot/knowledge-base/ingest",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json=doc_data,
            timeout=60
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"  ✗ Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"    Response: {e.response.text}")
        return None


def get_erp_documents():
    """Get recommended ERP documents to ingest"""
    return [
        {
            "content": """Company Refund Policy

CUSTOMERS CAN REQUEST REFUNDS within 30 days of purchase for most products.

Refund Process:
1. Contact customer service at support@company.com or call 1-800-SUPPORT
2. Provide your order number and reason for refund
3. Customer service will process your request
4. Refunds are processed within 5-7 business days
5. Original payment method will be credited

Refund Windows:
- Standard Products: 30 days from purchase date
- Digital Products: 14 days from purchase date
- Custom Orders: Case-by-case basis, contact support
- Sale Items: Store credit only (no cash refunds)

Required Information:
- Order number
- Purchase date
- Reason for refund
- Original payment method

Exceptions:
- Items damaged by customer: Not eligible
- Used items: Case-by-case basis
- Perishable items: No refunds after delivery

Contact Support:
- Email: support@company.com
- Phone: 1-800-SUPPORT
- Hours: Monday-Friday, 9 AM - 5 PM EST""",
            "source": "company_policies",
            "metadata": {
                "title": "Refund Policy",
                "category": "Customer Service",
                "department": "Customer Service",
                "type": "Policy"
            },
            "tags": ["policy", "refunds", "customer-service", "returns"]
        },
        {
            "content": """Sales Order Creation Process

HOW TO CREATE A SALES ORDER in the ERP system:

Step 1: Navigate to Sales Module
- Click on "Sales" in the main menu
- Select "Orders" from the dropdown
- Click "New Order" button

Step 2: Select Customer
- Search for existing customer by name, email, or ID
- If customer doesn't exist, click "Create New Customer"
- Fill in customer information (name, email, address, phone)

Step 3: Add Products to Order
- Click "Add Product" button
- Search product catalog by name or SKU
- Select product and enter quantity
- System automatically calculates:
  * Unit price
  * Line total
  * Taxes
  * Discounts (if applicable)

Step 4: Apply Discounts (Optional)
- Click on order line item
- Select discount type (percentage or fixed amount)
- Enter discount value
- System recalculates totals

Step 5: Review Order Details
- Verify customer information
- Check product quantities and prices
- Review shipping address
- Confirm payment method

Step 6: Submit Order
- Click "Submit Order" button
- System performs validations:
  * Inventory availability
  * Customer credit limit
  * Payment method validity

Step 7: Order Processing
After submission, the system automatically:
- Reserves inventory
- Generates invoice
- Sends confirmation email to customer
- Updates sales reports
- Creates fulfillment task

Tips:
- Always verify customer information before submitting
- Check inventory levels before adding products
- Review payment terms with customer
- Save draft orders for later completion""",
            "source": "system_guides",
            "metadata": {
                "title": "Sales Order Creation Guide",
                "category": "Sales",
                "section": "User Guide",
                "type": "Procedure"
            },
            "tags": ["sales", "orders", "process", "how-to", "guide", "workflow"]
        },
        {
            "content": """Inventory Management Basics

INVENTORY MANAGEMENT in the ERP system helps you track products, stock levels, and warehouses.

Key Features:
- Real-time stock tracking
- Multi-warehouse support
- Low stock alerts
- Stock movement history
- Product categorization

Viewing Inventory:
1. Navigate to Inventory > Products
2. View all products with current stock levels
3. Filter by category, warehouse, or stock status
4. Search by product name or SKU

Checking Stock Levels:
- Green indicator: Stock above minimum threshold
- Yellow indicator: Stock below recommended level
- Red indicator: Stock below minimum threshold (low stock alert)

Adding Products:
1. Go to Inventory > Products > Add Product
2. Enter product information:
   - Product name
   - SKU (Stock Keeping Unit)
   - Description
   - Category
   - Unit price
   - Initial stock quantity
   - Warehouse location
3. Save product

Updating Stock:
- Manual adjustment: Inventory > Adjustments > New Adjustment
- Receive stock: Inventory > Receiving > New Receipt
- Transfer between warehouses: Inventory > Transfers > New Transfer

Low Stock Alerts:
- System automatically alerts when stock falls below minimum
- Alerts appear in dashboard
- Email notifications sent to inventory manager
- Configure minimum stock levels in product settings

Stock Reports:
- Current stock levels
- Stock movement history
- Reorder recommendations
- Warehouse utilization""",
            "source": "system_guides",
            "metadata": {
                "title": "Inventory Management Guide",
                "category": "Inventory",
                "section": "User Guide",
                "type": "Guide"
            },
            "tags": ["inventory", "stock", "warehouse", "products", "guide"]
        },
        {
            "content": """Customer Service Procedures

CUSTOMER SERVICE STANDARD PROCEDURES for handling inquiries and issues.

Customer Inquiry Types:
1. Order Status Inquiries
2. Product Information Requests
3. Technical Support
4. Billing Questions
5. Return/Refund Requests

Order Status Inquiries:
- Access order in Sales > Orders
- Check order status (Pending, Processing, Shipped, Delivered)
- Provide customer with:
  * Current status
  * Tracking number (if shipped)
  * Estimated delivery date
  * Order details summary

Product Information Requests:
- Search product catalog
- Provide:
  * Product specifications
  * Pricing information
  * Availability
  * Compatibility information
- Direct to product documentation if needed

Technical Support:
- Gather issue details from customer
- Check known issues database
- Escalate if needed
- Follow up within 24 hours

Billing Questions:
- Access customer invoices in Finance > Invoices
- Review payment history
- Explain charges
- Process refunds if applicable

Response Time Standards:
- Email inquiries: Within 4 business hours
- Phone calls: Answer immediately
- Chat support: Within 2 minutes
- Complex issues: Initial response within 24 hours

Escalation Process:
1. Level 1: Customer Service Representative
2. Level 2: Senior Representative or Supervisor
3. Level 3: Department Manager
4. Level 4: Executive Team

Documentation Requirements:
- Log all customer interactions
- Document issue resolution
- Update customer records
- Follow up to ensure satisfaction""",
            "source": "procedures",
            "metadata": {
                "title": "Customer Service Procedures",
                "category": "Customer Service",
                "department": "Customer Service",
                "type": "Procedure"
            },
            "tags": ["customer-service", "procedures", "support", "guidelines"]
        },
        {
            "content": """Financial Reporting Guide

FINANCIAL REPORTS in the ERP system provide insights into business performance.

Available Reports:
1. Revenue Reports
2. Expense Reports
3. Profit & Loss Statements
4. Cash Flow Reports
5. Balance Sheets
6. Tax Reports

Revenue Reports:
- Track income by period (daily, weekly, monthly, yearly)
- Break down by:
  * Product category
  * Customer
  * Sales channel
  * Geographic region
- Compare periods (month-over-month, year-over-year)

Expense Reports:
- Categorize expenses (operational, administrative, marketing)
- Track by department
- Monitor budget vs actual
- Identify spending trends

Profit & Loss (P&L) Statements:
- Comprehensive income statement
- Revenue minus expenses
- Net profit calculation
- Available for any date range
- Export to PDF or Excel

Cash Flow Reports:
- Track cash inflows and outflows
- Operating activities
- Investing activities
- Financing activities
- Cash balance trends

Generating Reports:
1. Navigate to Finance > Reports
2. Select report type
3. Choose date range
4. Apply filters (optional)
5. Generate report
6. Export if needed (PDF, Excel, CSV)

Report Schedule:
- Daily: Cash flow, sales summary
- Weekly: Revenue, expense summary
- Monthly: P&L, balance sheet, comprehensive analysis
- Yearly: Annual financial statements

Access Permissions:
- Financial reports require appropriate permissions
- Contact finance department for access
- Reports are auditable and tracked""",
            "source": "system_guides",
            "metadata": {
                "title": "Financial Reporting Guide",
                "category": "Finance",
                "section": "User Guide",
                "type": "Guide"
            },
            "tags": ["finance", "reports", "accounting", "analytics", "guide"]
        },
        {
            "content": """HR Leave Management

EMPLOYEE LEAVE MANAGEMENT process and policies.

Leave Types:
- Vacation/Annual Leave
- Sick Leave
- Personal Leave
- Maternity/Paternity Leave
- Bereavement Leave
- Unpaid Leave

Requesting Leave:
1. Login to ERP system
2. Navigate to HR > Leave Requests
3. Click "Request Leave"
4. Select leave type
5. Enter start and end dates
6. Provide reason (if required)
7. Submit request

Approval Process:
- Request sent to manager
- Manager reviews and approves/rejects
- Employee notified of decision
- Calendar updated automatically
- Payroll system updated (if paid leave)

Leave Balances:
- View available leave balance
- Check leave history
- See upcoming approved leaves
- Track leave usage

Leave Policies:
- Vacation: Accrues monthly, maximum carryover
- Sick Leave: Available immediately, doctor's note may be required
- Personal Leave: Limited days per year
- Maternity/Paternity: As per company policy and legal requirements

Common Questions:
Q: How do I check my leave balance?
A: Go to HR > My Leave > Balance

Q: Can I cancel a leave request?
A: Yes, if not yet approved. Go to HR > Leave Requests > Cancel

Q: What if my manager doesn't respond?
A: System sends reminders. Contact HR if no response after 3 days.

Q: Can I split leave days?
A: Yes, create multiple requests for different periods.

Contact HR:
- Email: hr@company.com
- Phone: Extension 123
- Office: HR Department, 2nd Floor""",
            "source": "hr_policies",
            "metadata": {
                "title": "Leave Management Guide",
                "category": "HR",
                "department": "Human Resources",
                "type": "Policy & Procedure"
            },
            "tags": ["hr", "leave", "vacation", "policies", "employee"]
        }
    ]


def main():
    parser = argparse.ArgumentParser(description="Ingest recommended ERP documents")
    parser.add_argument("--token", default=None, help="JWT authentication token")
    parser.add_argument("--base-url", default=os.getenv("CHATBOT_BASE_URL", "http://localhost:8008"),
                       help="Base URL of the chatbot service")
    parser.add_argument("--skip-existing", action="store_true",
                       help="Skip if documents already exist (not implemented)")
    
    args = parser.parse_args()
    
    token = get_token_from_args_or_env(args.token)
    if not token:
        print("Error: JWT token is required. Set --token or JWT_TOKEN environment variable")
        sys.exit(1)
    
    base_url = args.base_url.rstrip('/')
    
    print("=" * 60)
    print("ERP Documents Ingestion")
    print("=" * 60)
    print()
    print("This script will ingest recommended ERP documents:")
    print("  - Company Policies")
    print("  - System Guides")
    print("  - Procedures")
    print("  - HR Policies")
    print()
    
    documents = get_erp_documents()
    print(f"Ingesting {len(documents)} documents...\n")
    
    successful = 0
    failed = 0
    
    for i, doc in enumerate(documents, 1):
        title = doc['metadata'].get('title', 'Unknown')
        print(f"[{i}/{len(documents)}] {title}...", end=" ")
        
        result = ingest_document(base_url, token, doc)
        
        if result:
            chunks = result.get('chunks_created', 0)
            print(f"✓ {chunks} chunks created")
            successful += 1
        else:
            print("✗ Failed")
            failed += 1
    
    print()
    print("=" * 60)
    print("Ingestion Complete")
    print("=" * 60)
    print(f"✓ Successfully ingested: {successful}/{len(documents)}")
    if failed > 0:
        print(f"✗ Failed: {failed}/{len(documents)}")
    print()
    
    # Get updated stats
    try:
        response = requests.get(
            f"{base_url}/api/v1/ai-chatbot/knowledge-base/stats",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        if response.status_code == 200:
            stats = response.json()
            print("Knowledge Base Statistics:")
            print(f"  Total chunks: {stats.get('total_chunks', 0)}")
            print(f"  Unique documents: {stats.get('unique_documents', 0)}")
    except Exception:
        pass
    
    print()
    print("Next steps:")
    print("1. Test the chatbot with questions about policies, processes, etc.")
    print("2. Search the knowledge base to verify documents are accessible")
    print("3. Add more documents specific to your business")


if __name__ == "__main__":
    main()

