# How the AI Assistant Works with Your ERP

## 🔄 Complete Data Flow Explanation

### Overview
The AI Assistant accesses your ERP data through a secure API integration, fetches real data, and uses OpenAI to generate intelligent responses based on that data.

---

## 📊 Step-by-Step Flow

### 1. **User Asks a Question** (Frontend)
```
User: "Show me sales report"
   ↓
Frontend sends message to AI Chatbot Service
```

### 2. **AI Chatbot Service Receives Request**
```
Location: ai-chatbot-service/app/api/v1/chatbot.py
Endpoint: POST /conversations/{conversation_id}/messages
```

**What happens:**
- Receives user message
- Extracts user's authentication token
- Analyzes the query type (sales, inventory, finance, etc.)

### 3. **NLP Analysis** (Query Classification)
```
Location: ai-chatbot-service/app/utils/nlp_utils.py
Function: classify_query_type()

Example: "sales report" → QueryType.SALES
```

**Keywords detected:**
- "sales", "revenue", "order", "customer" → SALES
- "inventory", "stock", "product" → INVENTORY
- "finance", "accounting" → FINANCE
- "employee", "payroll" → HRM

### 4. **Fetch ERP Data** (If Needed)
```
Location: ai-chatbot-service/app/services/chatbot_service.py
Function: process_user_message()
```

**For Sales Queries:**
1. System detects it's a sales query
2. Calls `ERPDataService.get_sales_summary()`
3. Makes HTTP request to Sales Service:

```python
GET http://sales-service:8003/api/v1/analytics/dashboard
Headers: Authorization: Bearer {user_token}
Params: start_date=2025-12-01&end_date=2025-12-04
```

### 5. **Sales Service Returns Data**
```
Location: sales-service/app/api/v1/analytics.py
Endpoint: GET /api/v1/analytics/dashboard
```

**What the Sales Service does:**
- Queries MongoDB for orders in the date range
- Calculates metrics:
  - Total revenue
  - Total orders
  - Total customers
  - Average order value
  - Growth rates
  - Top products
  - Top customers

**Response Format:**
```json
{
  "summary": {
    "total_revenue": 15000.50,
    "total_orders": 45,
    "total_customers": 30,
    "avg_order_value": 333.34,
    "revenue_growth": 15.5,
    "orders_growth": 10.2
  },
  "top_products": [...],
  "top_customers": [...],
  "period": {
    "start_date": "2025-12-01",
    "end_date": "2025-12-04"
  }
}
```

### 6. **Format Data for AI**
```
Location: ai-chatbot-service/app/services/erp_data_service.py
Function: format_data_for_context()
```

**Converts JSON to readable text:**
```
📊 Sales Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Total Revenue: $15,000.50
📦 Total Orders: 45
💵 Average Order Value: $333.34
👥 Total Customers: 30
📈 Revenue Growth: 15.5%
📈 Orders Growth: 10.2%

📅 Period: 2025-12-01 to 2025-12-04
```

### 7. **Send to OpenAI** (With ERP Data)
```
Location: ai-chatbot-service/app/services/nlp_service.py
Function: generate_response()
```

**Message Structure:**
```python
messages = [
    {
        "role": "system",
        "content": "You are an AI assistant for an ERP system. 
                   Use the provided ERP data to answer questions..."
    },
    {
        "role": "system",
        "content": "CRITICAL: You have been provided with ACTUAL ERP data below.
                   You MUST use this real data to answer the user's question directly.
                   
                   📊 Sales Summary:
                   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                   💰 Total Revenue: $15,000.50
                   📦 Total Orders: 45
                   ..."
    },
    {
        "role": "user",
        "content": "Show me sales report"
    }
]
```

### 8. **OpenAI Generates Response**
OpenAI uses the provided ERP data to generate a natural language response:

```
"Based on the sales data, here's your sales report:

📊 Sales Report for December 1-4, 2025

Your total revenue for this period is $15,000.50 from 45 orders.
You served 30 customers with an average order value of $333.34.

Growth Metrics:
- Revenue has grown by 15.5% compared to the previous period
- Orders have increased by 10.2%

[Additional insights based on the data...]"
```

### 9. **Response Returns to User**
```
OpenAI Response → AI Chatbot Service → Frontend → User sees answer
```

---

## 🔐 Security & Authentication

### How Authentication Works:

1. **User logs in** → Gets JWT token
2. **Token stored** in browser localStorage
3. **Every request includes token:**
   ```
   Authorization: Bearer {token}
   ```
4. **AI Chatbot Service forwards token** to Sales Service
5. **Sales Service validates token** → Returns data only if authorized

### Data Access:
- ✅ AI Assistant uses YOUR authentication token
- ✅ Only accesses data YOU have permission to see
- ✅ No direct database access - goes through services
- ✅ Secure API-to-API communication

---

## 🗄️ Database Access Pattern

```
AI Assistant
    ↓ (HTTP request with JWT token)
Sales Service API
    ↓ (validates token)
MongoDB Database
    ↓ (queries orders collection)
Returns Data
    ↓
AI Assistant formats and uses it
```

**Key Point:** The AI Assistant does NOT directly access the database. It goes through your ERP services (Sales Service, Inventory Service, etc.) which handle security, validation, and data access control.

---

## 📋 Why You're Seeing "No Sales Data"

### Current Situation:
Your logs show:
```
Sales data received: {
    'total_revenue': 0.0,
    'total_orders': 0,
    'total_customers': 0,
    ...
}
```

**This means:**
1. ✅ The Sales Service API is working correctly
2. ✅ The AI Assistant is successfully calling it
3. ✅ Authentication is working
4. ❌ **But there's no actual sales data in your database**

### Possible Reasons:
1. **No orders created yet** - You haven't created any sales orders in the system
2. **Orders exist but outside date range** - Orders might be from a different period
3. **Database is empty** - New system with no data yet

### How to Check:
1. Go to your Sales module in the ERP
2. Check if you have any orders
3. Check the order dates

### How to Fix:
1. **Create test orders** through the Sales module
2. **Use realistic dates** (within the queried period)
3. **Re-query** the AI Assistant

---

## 🔍 Complete Technical Flow Diagram

```
┌─────────────┐
│   User      │
│ "Show sales"│
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Frontend (React)                   │
│  - Sends message                    │
│  - Includes auth token              │
└──────┬──────────────────────────────┘
       │
       ▼ HTTP POST
┌─────────────────────────────────────┐
│  AI Chatbot Service                 │
│  (Port 8008)                        │
│                                     │
│  1. Receives message                │
│  2. Extracts token                  │
│  3. Analyzes query type             │
│  4. Detects: SALES                  │
└──────┬──────────────────────────────┘
       │
       ▼ Calls ERPDataService
┌─────────────────────────────────────┐
│  ERP Data Service                   │
│                                     │
│  GET /api/v1/analytics/dashboard    │
│  Headers: Authorization: Bearer     │
│  Params: start_date, end_date       │
└──────┬──────────────────────────────┘
       │
       ▼ HTTP Request
┌─────────────────────────────────────┐
│  Sales Service                      │
│  (Port 8003)                        │
│                                     │
│  1. Validates JWT token             │
│  2. Queries MongoDB                 │
│  3. Calculates metrics              │
│  4. Returns JSON data               │
└──────┬──────────────────────────────┘
       │
       ▼ JSON Response
┌─────────────────────────────────────┐
│  MongoDB Database                   │
│  Collection: orders                 │
│                                     │
│  Queries orders by date range       │
│  Returns: [] or [order1, order2...] │
└─────────────────────────────────────┘
       │
       ▼ Data flows back up
┌─────────────────────────────────────┐
│  AI Chatbot Service                 │
│                                     │
│  1. Receives sales data             │
│  2. Formats it for display          │
│  3. Includes in OpenAI prompt       │
│  4. Sends to OpenAI API             │
└──────┬──────────────────────────────┘
       │
       ▼ HTTP Request with data
┌─────────────────────────────────────┐
│  OpenAI API                         │
│                                     │
│  1. Receives ERP data               │
│  2. Uses it to answer question      │
│  3. Generates natural response      │
└──────┬──────────────────────────────┘
       │
       ▼ Response
┌─────────────────────────────────────┐
│  AI Chatbot Service                 │
│                                     │
│  Returns formatted response         │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Frontend                           │
│  Displays response to user          │
└─────────────────────────────────────┘
```

---

## 🛠️ Key Components

### 1. **ERPDataService**
- **Location:** `ai-chatbot-service/app/services/erp_data_service.py`
- **Purpose:** Fetches data from ERP services
- **Methods:**
  - `get_sales_summary()` - Gets sales analytics
  - `get_inventory_summary()` - Gets inventory data
  - `format_data_for_context()` - Formats data for AI/display

### 2. **NLP Service**
- **Location:** `ai-chatbot-service/app/services/nlp_service.py`
- **Purpose:** Handles AI response generation
- **Flow:**
  1. Classifies query type
  2. Receives ERP data
  3. Formats data into prompt
  4. Sends to OpenAI
  5. Returns response

### 3. **Sales Service Analytics**
- **Location:** `sales-service/app/api/v1/analytics.py`
- **Endpoint:** `GET /api/v1/analytics/dashboard`
- **What it does:**
  - Queries orders from MongoDB
  - Calculates metrics
  - Returns formatted JSON

---

## 🔍 Debugging: Why No Sales Data?

### Check 1: Do you have orders?
```bash
# Check MongoDB for orders
docker exec -it erp-mongodb mongosh -u admin -p password123 --authenticationDatabase admin
use erp_sales
db.orders.find().count()
```

### Check 2: Check Sales Service logs
```bash
docker logs erp-sales-service --tail 50 | grep -i order
```

### Check 3: Test Sales API directly
```bash
# Get your auth token first, then:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8003/api/v1/analytics/dashboard?start_date=2025-01-01&end_date=2025-12-31
```

---

## 💡 How to Add Test Data

### Option 1: Through ERP Frontend
1. Go to Sales module
2. Create a new order
3. Set order date to current date
4. Complete the order

### Option 2: Direct Database (for testing)
```bash
docker exec -it erp-mongodb mongosh -u admin -p password123 --authenticationDatabase admin

use erp_sales

db.orders.insertOne({
  order_number: "ORD-001",
  customer_id: "test-customer",
  total_amount: 1000.00,
  status: "completed",
  order_date: new Date("2025-12-04"),
  items: [
    {
      product_id: "prod-1",
      quantity: 2,
      price: 500.00
    }
  ]
})
```

---

## 📝 Summary

**How AI Accesses Your Data:**
1. ✅ Uses YOUR authentication token
2. ✅ Calls YOUR ERP services (Sales, Inventory, etc.)
3. ✅ Services query YOUR database
4. ✅ Data is formatted and sent to OpenAI
5. ✅ OpenAI uses the data to generate responses

**Why You See "No Sales Data":**
- The system is working correctly ✅
- But your database has no sales orders yet ❌
- Create some orders and try again!

**Security:**
- AI Assistant doesn't access database directly
- All access goes through your services
- Uses your authentication
- Respects your permissions

---

## 🧪 Test the Flow

1. **Create a test order** in your ERP
2. **Ask AI:** "Show me sales report"
3. **Check logs:** See the data flow in action
4. **Verify:** AI should show your actual sales data

