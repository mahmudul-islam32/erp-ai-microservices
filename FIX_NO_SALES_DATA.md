# Fix: "No sales data found for this period"

## ❌ Problem

User getting "No sales data found for this period" even though orders exist.

## 🔍 Root Cause

1. **Missing Import**: `extract_entities` function was being called but not imported
   - Error: `NameError: name 'extract_entities' is not defined`
   - This caused the sales data fetching to fail completely

2. **Result**: The error handler caught the exception and returned empty context, which then showed "No sales data found"

## ✅ Fix Applied

**File**: `ai-chatbot-service/app/services/chatbot_service.py`

Added missing import:
```python
from app.utils.nlp_utils import classify_query_type, extract_entities
```

## 🧪 Testing

After restart, the service should:
1. ✅ Extract entities (order numbers, customer names) correctly
2. ✅ Fetch sales data successfully
3. ✅ Show actual orders when analytics returns zeros

