# Fix: Customer and Product Names Showing as "Unknown"

## ✅ Problem Identified

When displaying sales summary, customer and product names were showing as "Unknown" even though:
- ✅ Database contains customer names ("test test", "gh doe")
- ✅ Database contains product names ("Laptop")
- ✅ Analytics service returns the data correctly

## 🔍 Root Cause

The analytics service returns data in a **nested structure** from MongoDB aggregation:
```json
{
  "_id": {
    "customer_id": "69264bc174606d31fe9b8089",
    "customer_name": "test test"
  },
  "revenue": 49.68
}
```

The formatting code was looking for `customer.get('customer_name')` directly, but the name is nested under `customer['_id']['customer_name']`.

## 🔧 Fix Applied

**File:** `ai-chatbot-service/app/services/erp_data_service.py`

Updated the `format_data_for_context` method to properly extract names from the nested `_id` structure:

```python
# For customers
if '_id' in customer and isinstance(customer['_id'], dict):
    customer_name = customer['_id'].get('customer_name', customer['_id'].get('name', 'Unknown'))
else:
    customer_name = customer.get('name', customer.get('customer_name', customer.get('_id', {}).get('customer_name', 'Unknown')))

# For products  
if '_id' in product and isinstance(product['_id'], dict):
    product_name = product['_id'].get('product_name', product['_id'].get('name', 'Unknown'))
else:
    product_name = product.get('name', product.get('product_name', product.get('_id', {}).get('product_name', 'Unknown')))
```

## 📊 Expected Results

**Before:**
- Top Products: 1. Unknown: $99.36
- Top Customers: 1. Unknown: $49.68

**After:**
- Top Products: 1. Laptop: $99.36
- Top Customers: 1. test test: $49.68

## 🧪 Test It

Ask the AI assistant:
- "Show me sales for november"
- "What are my top customers?"
- "Show me top products"

The customer and product names should now display correctly!

