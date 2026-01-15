# Recommended Data for ERP Chatbot RAG

Guide on what data to ingest and how to do it for an optimal ERP chatbot experience.

## 📋 What Data to Ingest

### Priority 1: Essential Documents (Start Here)

#### 1. **Company Policies & Procedures**
- Employee handbook
- Code of conduct
- Security policies
- Data privacy policies
- Compliance guidelines

**Why**: Users frequently ask about policies, procedures, and rules.

**Example**:
```
"Company Refund Policy: Customers can request refunds within 30 days 
of purchase. Refunds are processed within 5-7 business days. 
Contact support@company.com for refund requests."
```

#### 2. **Product Documentation**
- Product catalogs
- Product specifications
- Feature descriptions
- Usage guides
- Product FAQs

**Why**: Helps answer product-related questions and sales inquiries.

**Example**:
```
"Product X Specifications:
- Dimensions: 10x8x5 inches
- Weight: 2.5 lbs
- Price: $299.99
- Features: [list features]
- Compatible with: [list compatibility]"
```

#### 3. **Business Processes & Workflows**
- Sales process documentation
- Order fulfillment workflows
- Inventory management procedures
- Payment processing steps
- Customer onboarding process

**Why**: Users need step-by-step guidance on business processes.

**Example**:
```
"Sales Order Process:
1. Create customer record
2. Add products to order
3. Calculate totals and taxes
4. Process payment
5. Generate invoice
6. Fulfill order
7. Update inventory
8. Send confirmation email"
```

#### 4. **ERP System Guides**
- User manuals
- Feature guides
- Navigation help
- Common tasks
- System FAQs

**Why**: Helps users learn and use the ERP system effectively.

**Example**:
```
"How to Create a Sales Order:
1. Navigate to Sales > Orders
2. Click 'New Order'
3. Select customer
4. Add line items
5. Review and submit"
```

### Priority 2: Business-Specific Data

#### 5. **Customer Service FAQs**
- Common customer questions
- Troubleshooting guides
- Support procedures
- Contact information

**Why**: Reduces support load and provides quick answers.

#### 6. **Financial Policies**
- Payment terms
- Credit policies
- Pricing rules
- Discount structures
- Tax information

**Why**: Critical for accurate financial information.

#### 7. **HR Policies**
- Leave policies
- Attendance rules
- Benefits information
- Performance review processes
- Training materials

**Why**: Employees frequently ask HR-related questions.

#### 8. **Industry-Specific Knowledge**
- Regulations (if applicable)
- Industry standards
- Best practices
- Compliance requirements

**Why**: Provides domain-specific expertise.

### Priority 3: Advanced Data

#### 9. **Historical Data Summaries**
- Sales trends
- Performance metrics
- Key insights
- Business intelligence summaries

**Why**: Helps provide context-aware insights.

#### 10. **Integration Guides**
- API documentation
- Third-party integrations
- Import/export procedures
- Data migration guides

**Why**: Technical users need integration information.

## 📝 Data Format Recommendations

### Best Practices for Content

1. **Clear and Structured**
   - Use headers and sections
   - Bullet points for lists
   - Numbered steps for procedures

2. **Concise but Complete**
   - Each chunk should be self-contained when possible
   - Include context in each section

3. **Use Natural Language**
   - Write as if explaining to someone
   - Include common terms and synonyms

4. **Include Examples**
   - Real-world examples help understanding
   - Use cases and scenarios

### Example Format:

```markdown
# Sales Order Process

## Overview
Creating a sales order involves multiple steps to ensure accuracy.

## Steps
1. **Customer Selection**: Choose existing customer or create new
2. **Product Selection**: Add products with quantities
3. **Pricing**: System calculates totals, taxes, and discounts
4. **Payment**: Process payment via integrated gateway
5. **Confirmation**: Generate invoice and send to customer

## Tips
- Always verify customer information
- Check inventory before confirming order
- Review payment terms
```

## 🚀 How to Ingest Data

### Method 1: Using the Sample Data Script (Quick Start)

The script includes sample ERP documentation:

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "m@gmail.com", "password": "Admin!234"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

# Run script
python3 ai-chatbot-service/scripts/ingest_sample_data.py --token $TOKEN
```

### Method 2: Manual API Ingestion (Recommended for Custom Data)

#### Single Document

```bash
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:8008/api/v1/ai-chatbot/knowledge-base/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your document content here...",
    "source": "company_policies",
    "metadata": {
      "title": "Refund Policy",
      "category": "Policies",
      "department": "Customer Service"
    },
    "tags": ["policy", "refunds", "customer-service"]
  }'
```

#### Multiple Documents (Using Script)

Create a file `ingest_erp_docs.py`:

```python
import requests
import json

BASE_URL = "http://localhost:8008"
TOKEN = "your-jwt-token-here"

documents = [
    {
        "content": """Company Refund Policy

Customers can request refunds within 30 days of purchase. 
To request a refund:
1. Contact customer service at support@company.com
2. Provide order number and reason
3. Refunds processed within 5-7 business days
4. Original payment method will be credited

Exceptions:
- Digital products: 14-day refund window
- Custom orders: Case-by-case basis
- Sale items: Store credit only""",
        "source": "company_policies",
        "metadata": {
            "title": "Refund Policy",
            "category": "Customer Service",
            "last_updated": "2025-01-01"
        },
        "tags": ["policy", "refunds", "customer-service"]
    },
    {
        "content": """Sales Order Creation Process

Step 1: Navigate to Sales > Orders > New Order

Step 2: Select Customer
- Search existing customers
- Or create new customer record

Step 3: Add Products
- Search product catalog
- Enter quantities
- System calculates totals

Step 4: Review & Submit
- Verify all information
- Apply discounts if applicable
- Submit order

The system will:
- Reserve inventory
- Generate invoice
- Send confirmation email
- Update sales reports""",
        "source": "system_guides",
        "metadata": {
            "title": "Sales Order Process",
            "category": "Sales",
            "section": "User Guide"
        },
        "tags": ["sales", "process", "how-to", "guide"]
    },
    # Add more documents...
]

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

for i, doc in enumerate(documents, 1):
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/ai-chatbot/knowledge-base/ingest",
            headers=headers,
            json=doc,
            timeout=60
        )
        response.raise_for_status()
        result = response.json()
        print(f"✓ [{i}/{len(documents)}] {doc['metadata']['title']}: {result.get('chunks_created', 0)} chunks")
    except Exception as e:
        print(f"✗ [{i}/{len(documents)}] {doc['metadata'].get('title', 'Unknown')}: Error - {e}")
```

Run it:
```bash
python3 ingest_erp_docs.py
```

### Method 3: Bulk Ingestion from Files

Create a script `ingest_from_files.py`:

```python
import requests
import json
import os

BASE_URL = "http://localhost:8008"
TOKEN = "your-jwt-token-here"
DOCS_DIR = "erp_documents"  # Directory containing .txt or .md files

def ingest_file(filepath, source, category, tags):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    filename = os.path.basename(filepath)
    
    response = requests.post(
        f"{BASE_URL}/api/v1/ai-chatbot/knowledge-base/ingest",
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json"
        },
        json={
            "content": content,
            "source": source,
            "metadata": {
                "title": filename,
                "category": category,
                "file": filename
            },
            "tags": tags
        },
        timeout=60
    )
    
    return response.json()

# Example usage
files_to_ingest = [
    ("policies/refund_policy.txt", "company_policies", "Policies", ["policy", "refunds"]),
    ("guides/sales_process.md", "system_guides", "Guides", ["sales", "process"]),
    # Add more files...
]

for filepath, source, category, tags in files_to_ingest:
    if os.path.exists(filepath):
        result = ingest_file(filepath, source, category, tags)
        print(f"✓ Ingested {filepath}: {result.get('chunks_created', 0)} chunks")
    else:
        print(f"✗ File not found: {filepath}")
```

## 📊 Recommended Ingestion Strategy

### Phase 1: Foundation (Week 1)
1. Company policies (refund, privacy, terms)
2. Basic system guides (how to create orders, invoices)
3. Common FAQs

**Goal**: Answer basic policy and process questions

### Phase 2: Business Processes (Week 2)
1. Complete workflow documentation
2. Department-specific procedures
3. Product documentation

**Goal**: Provide detailed process guidance

### Phase 3: Advanced Knowledge (Week 3+)
1. Advanced features
2. Integration guides
3. Business intelligence insights
4. Historical data summaries

**Goal**: Enable advanced use cases

## 🎯 Content Tips

### Do's ✅
- Use clear, descriptive titles
- Include context in each section
- Use consistent terminology
- Add examples and use cases
- Structure content with headers
- Include dates for time-sensitive info

### Don'ts ❌
- Don't use overly technical jargon (unless needed)
- Don't include outdated information
- Don't create very long documents (use chunking)
- Don't duplicate content (consolidate similar info)
- Don't forget to add relevant tags

## 📈 Monitoring and Improvement

### Check What's Working

```bash
# Get statistics
curl -X GET http://localhost:8008/api/v1/ai-chatbot/knowledge-base/stats \
  -H "Authorization: Bearer $TOKEN"

# Test searches
curl -X GET "http://localhost:8008/api/v1/ai-chatbot/knowledge-base/search?query=refund%20policy&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

### Analyze Chatbot Responses
- Monitor which questions get good answers
- Identify knowledge gaps
- Add documents for frequently asked but unanswered questions

### Update Regularly
- Update policies when they change
- Add new product documentation
- Refresh process guides
- Remove outdated information

## 🔄 Maintenance

### Regular Updates
1. **Monthly Review**: Check for outdated documents
2. **Quarterly Update**: Refresh policies and procedures
3. **As Needed**: Add new documentation immediately

### Best Practices
- Version your documents (include dates in metadata)
- Tag documents consistently
- Use meaningful source names
- Keep metadata organized

## 💡 Example Use Cases

### Use Case 1: Customer Service
**Data Needed**: Refund policies, product information, contact procedures
**Questions Answered**: "What's your refund policy?", "How do I return an item?"

### Use Case 2: Sales Team
**Data Needed**: Product specs, pricing, sales processes, customer guides
**Questions Answered**: "What are the product features?", "How do I create an order?"

### Use Case 3: HR Department
**Data Needed**: Leave policies, benefits, procedures, compliance
**Questions Answered**: "How many vacation days do I have?", "What's the leave request process?"

### Use Case 4: System Users
**Data Needed**: User guides, feature documentation, FAQs, workflows
**Questions Answered**: "How do I generate a report?", "Where do I find inventory data?"

