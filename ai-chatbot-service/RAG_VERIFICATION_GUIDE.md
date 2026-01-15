# RAG Verification & Usage Guide

Complete guide to verify RAG is working, ingest data, understand storage, and how it integrates with existing ERP data.

## 📋 Table of Contents

1. [How to Verify RAG is Working](#how-to-verify-rag-is-working)
2. [How to Ingest Data](#how-to-ingest-data)
3. [Where Data is Stored](#where-data-is-stored)
4. [How RAG Works with Previous Approach](#how-rag-works-with-previous-approach)

---

## 1. How to Verify RAG is Working

### Quick Verification Steps

#### Step 1: Check Configuration
```bash
# Check if RAG is enabled
docker exec erp-ai-chatbot-service env | grep ENABLE_RAG
# Should show: ENABLE_RAG=true

# Check embedding provider
docker exec erp-ai-chatbot-service env | grep RAG_EMBEDDING
# Should show your configured provider and model
```

#### Step 2: Check Service Logs
```bash
# Look for RAG activity
docker logs erp-ai-chatbot-service --tail 100 | grep -i "rag\|embedding"

# Look for errors
docker logs erp-ai-chatbot-service --tail 100 | grep -i "error\|exception"
```

Expected logs when RAG is working:
- `"Retrieving RAG context for query"`
- `"HTTP Request: POST https://api.openai.com/v1/embeddings"` (if using OpenAI)
- `"Found X similar chunks for query"`

#### Step 3: Test API Endpoints

Get your authentication token:
```bash
TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "m@gmail.com", "password": "Admin!234"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")
```

**Test Knowledge Base Stats:**
```bash
curl -X GET http://localhost:8008/api/v1/ai-chatbot/knowledge-base/stats \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
{
  "total_chunks": 0,  // or number of chunks if data ingested
  "unique_documents": 0  // or number of documents
}
```

**Test Document Ingestion:**
```bash
curl -X POST http://localhost:8008/api/v1/ai-chatbot/knowledge-base/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test document for RAG verification.",
    "source": "test",
    "tags": ["test"]
  }'
```

Expected response:
```json
{
  "document_id": "some-id",
  "chunks_created": 1,
  "message": "Document ingested successfully. Created 1 chunks."
}
```

#### Step 4: Test Search
```bash
curl -X GET "http://localhost:8008/api/v1/ai-chatbot/knowledge-base/search?query=test&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

#### Step 5: Use the Test Script

We've created a test script for you:
```bash
python3 ai-chatbot-service/scripts/test_rag.py --token $TOKEN
```

### ✅ RAG is Working If:

- ✅ Service logs show RAG retrieval messages
- ✅ Knowledge base stats endpoint returns successfully
- ✅ Document ingestion creates chunks successfully
- ✅ No embedding generation errors in logs
- ✅ Search endpoint works (may return empty if no matching documents)

---

## 2. How to Ingest Data

### Method 1: Using the API (Recommended)

#### Basic Ingestion

```bash
TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "m@gmail.com", "password": "Admin!234"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

curl -X POST http://localhost:8008/api/v1/ai-chatbot/knowledge-base/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your document content here. This can be documentation, FAQs, manuals, or any text you want the chatbot to use.",
    "source": "user_upload",
    "metadata": {
      "title": "Document Title",
      "category": "documentation"
    },
    "tags": ["important", "reference"]
  }'
```

#### With Custom Chunk Settings

```bash
curl -X POST http://localhost:8008/api/v1/ai-chatbot/knowledge-base/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Long document content...",
    "source": "manuals",
    "chunk_size": 1500,
    "chunk_overlap": 300,
    "tags": ["manual", "reference"]
  }'
```

### Method 2: Using the Sample Data Script

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "m@gmail.com", "password": "Admin!234"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

# Run the script
python3 ai-chatbot-service/scripts/ingest_sample_data.py --token $TOKEN
```

This script ingests sample ERP documentation to test RAG.

### Method 3: Using Python Script

Create a script `ingest_my_docs.py`:

```python
import requests
import json

BASE_URL = "http://localhost:8008"
TOKEN = "your-jwt-token-here"

# Your documents
documents = [
    {
        "content": "Company Policy: Employees must follow safety protocols...",
        "source": "company_policies",
        "metadata": {"title": "Safety Policy", "category": "HR"},
        "tags": ["policy", "safety", "hr"]
    },
    {
        "content": "Product Documentation: Our product features include...",
        "source": "product_docs",
        "metadata": {"title": "Product Guide", "category": "Sales"},
        "tags": ["documentation", "products"]
    }
]

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

for doc in documents:
    response = requests.post(
        f"{BASE_URL}/api/v1/ai-chatbot/knowledge-base/ingest",
        headers=headers,
        json=doc
    )
    result = response.json()
    print(f"Ingested: {doc['metadata']['title']} - {result.get('chunks_created', 0)} chunks")
```

### What Happens During Ingestion?

1. **Document Chunking**: Text is split into chunks (default: 1000 characters, 200 overlap)
2. **Embedding Generation**: Each chunk is converted to a vector embedding
3. **Storage**: Chunks with embeddings are stored in MongoDB
4. **Metadata**: Source, tags, and custom metadata are stored

---

## 3. Where Data is Stored

### Database: MongoDB

**Database Name**: `erp_ai_chatbot`  
**Collection Name**: `knowledge_base`

### Storage Location

- **In Docker**: MongoDB data is stored in Docker volumes or your configured MongoDB instance
- **Structure**: MongoDB document structure for each chunk:

```json
{
  "_id": "chunk_id",
  "content": "The actual text content of the chunk",
  "embedding": [0.123, -0.456, 0.789, ...],  // Vector embedding (1536 dimensions for OpenAI)
  "source": "user_upload",
  "source_id": "document_id",
  "chunk_index": 0,
  "metadata": {
    "title": "Document Title",
    "category": "docs"
  },
  "tags": ["important", "reference"],
  "user_id": "user_id",
  "created_at": "2026-01-13T13:26:04.231000",
  "updated_at": "2026-01-13T13:26:04.231000"
}
```

### Viewing Stored Data

**Option 1: Using MongoDB CLI**
```bash
# Connect to MongoDB (if using local MongoDB)
docker exec -it mongodb mongosh erp_ai_chatbot

# Or if using MongoDB Atlas, connect using connection string

# Query knowledge base
db.knowledge_base.find().pretty()
db.knowledge_base.countDocuments()
```

**Option 2: Using API**
```bash
# Get stats
curl -X GET http://localhost:8008/api/v1/ai-chatbot/knowledge-base/stats \
  -H "Authorization: Bearer $TOKEN"

# Get all chunks for a document
curl -X GET http://localhost:8008/api/v1/ai-chatbot/knowledge-base/document/{source_id} \
  -H "Authorization: Bearer $TOKEN"
```

### Data Isolation

- **User Isolation**: Each user's documents are isolated by `user_id`
- **Shared Knowledge Base**: All users can access the same knowledge base (if needed, can be filtered)
- **Source Tracking**: Documents are tracked by `source` and `source_id`

---

## 4. How RAG Works with Previous Approach

### 🤝 RAG + ERP Data: Working Together

The chatbot now uses **BOTH approaches simultaneously**:

```
User Query
    ↓
┌─────────────────────────────────────┐
│  1. Query Classification            │
│     - Classify query type           │
│     - Extract entities              │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  2. RAG Retrieval (NEW)             │
│     - Generate query embedding      │
│     - Search knowledge base         │
│     - Get relevant chunks           │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  3. ERP Data Fetching (EXISTING)    │
│     - Fetch real-time ERP data      │
│     - Format for context            │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  4. Context Building                │
│     - Combine RAG context           │
│     - Combine ERP data context      │
│     - Add conversation history      │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  5. LLM Generation                  │
│     - Generate response using       │
│       all available context         │
└─────────────────────────────────────┘
    ↓
Response with knowledge base + ERP data
```

### Code Flow

**In `chatbot_service.py`:**
```python
# 1. Fetch ERP data (existing approach)
erp_context = await self.erp_data_service.get_sales_summary(...)

# 2. Retrieve RAG context (new approach)
rag_context = ""
if settings.enable_rag and self.rag_service:
    similar_chunks = await self.rag_service.search_similar_chunks(...)
    rag_context = format_chunks(similar_chunks)

# 3. Combine both contexts
user_context = {
    "erp_context": erp_context,  # Existing
    "rag_context": rag_context    # New
}

# 4. Generate response with both
response = await nlp_service.generate_response(
    user_query=message_content,
    conversation_history=history,
    user_context=user_context  # Contains both!
)
```

**In `nlp_service.py`:**
```python
# Build prompt with BOTH contexts
context_prompt = build_context_prompt(
    user_query=user_query,
    query_type=query_type,
    entities=entities,
    conversation_history=conversation_history,
    erp_context=erp_context,      # From ERP services
    rag_context=rag_context        # From knowledge base
)
```

### Example Scenarios

#### Scenario 1: Sales Query
**User**: "What were my sales last month?"

**What happens:**
1. ✅ **ERP Data**: Fetches real-time sales data from Sales Service
2. ✅ **RAG**: Searches knowledge base for sales-related documentation/FAQs
3. ✅ **Combined**: LLM gets both real data + documentation context
4. ✅ **Response**: "Based on your data, sales were $50,000. According to our sales process documentation..."

#### Scenario 2: General Question
**User**: "How do I create a sales order?"

**What happens:**
1. ✅ **ERP Data**: May fetch order examples or structure
2. ✅ **RAG**: Retrieves relevant documentation about creating orders
3. ✅ **Combined**: LLM uses knowledge base documentation
4. ✅ **Response**: Step-by-step guide from documentation + current system context

#### Scenario 3: Policy Question
**User**: "What's our refund policy?"

**What happens:**
1. ✅ **ERP Data**: May fetch refund-related transactions
2. ✅ **RAG**: Retrieves policy documents from knowledge base
3. ✅ **Combined**: Policy info from RAG + actual refund data
4. ✅ **Response**: Policy details from knowledge base + relevant data

### Benefits of Combined Approach

1. **Real-time Data**: ERP integration provides current, live data
2. **Documentation**: RAG provides context from knowledge base
3. **Better Responses**: LLM has both data and documentation
4. **Flexible**: Works with or without knowledge base (RAG can be disabled)
5. **Backward Compatible**: Existing ERP data fetching still works

### Disabling RAG

If you want to use only the previous approach (ERP data only):

```bash
# In docker-compose.yml or .env
ENABLE_RAG=false
```

Then restart:
```bash
docker-compose restart ai-chatbot-service
```

The chatbot will continue working with ERP data only, just like before.

---

## Summary

✅ **RAG is Working**: Verified through API tests and logs  
✅ **Data Ingestion**: Multiple methods available (API, scripts, Python)  
✅ **Storage**: MongoDB collection `knowledge_base` in `erp_ai_chatbot` database  
✅ **Integration**: RAG works alongside existing ERP data fetching (both are used together)  

The chatbot now has the best of both worlds:
- **Real-time ERP data** from your services
- **Knowledge base context** from ingested documents
- **Combined responses** using both sources

