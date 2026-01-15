# RAG Setup Guide for Docker

This guide will help you set up and use RAG (Retrieval-Augmented Generation) with the AI Chatbot Service in Docker.

## Prerequisites

1. Docker and Docker Compose installed
2. OpenAI API key (recommended) OR sentence-transformers (open-source alternative)
3. MongoDB connection (configured in docker-compose.yml)

## Quick Start

### 1. Configure Environment Variables

The RAG configuration is already added to `docker-compose.yml`. You can customize it by setting environment variables in your `.env` file or directly in docker-compose.yml:

```bash
# .env file (create in project root if not exists)
ENABLE_RAG=true
RAG_EMBEDDING_PROVIDER=openai  # or "sentence_transformer" for open-source
RAG_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_API_KEY=your-openai-api-key-here
RAG_TOP_K=5
RAG_SIMILARITY_THRESHOLD=0.7
```

### 2. Start the Services

```bash
# Build and start all services
docker-compose up -d

# Or rebuild if you made changes
docker-compose up -d --build ai-chatbot-service
```

### 3. Verify RAG is Enabled

Check the logs to confirm RAG is enabled:

```bash
docker logs erp-ai-chatbot-service | grep -i rag
```

## Configuration Options

### Embedding Providers

#### Option 1: OpenAI Embeddings (Recommended)
- **Pros**: High quality, fast, cost-effective
- **Cons**: Requires API key and credits
- **Models**: `text-embedding-3-small`, `text-embedding-3-large`, `text-embedding-ada-002`

```bash
RAG_EMBEDDING_PROVIDER=openai
RAG_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_API_KEY=sk-your-key-here
```

#### Option 2: Sentence Transformers (Open-Source)
- **Pros**: Free, no API key needed, runs locally
- **Cons**: Slower, requires more memory, lower quality than OpenAI
- **Models**: `all-MiniLM-L6-v2` (recommended), `all-mpnet-base-v2`

```bash
RAG_EMBEDDING_PROVIDER=sentence_transformer
RAG_EMBEDDING_MODEL=all-MiniLM-L6-v2
# No API key needed
```

**Note**: Sentence transformers will be downloaded on first use (may take a few minutes).

### RAG Parameters

- `RAG_TOP_K`: Number of similar chunks to retrieve (default: 5)
- `RAG_SIMILARITY_THRESHOLD`: Minimum similarity score 0-1 (default: 0.7)
- `RAG_CHUNK_SIZE`: Characters per chunk (default: 1000)
- `RAG_CHUNK_OVERLAP`: Overlap between chunks (default: 200)

## Using RAG

### 1. Ingest Documents into Knowledge Base

#### Using curl:

```bash
# Get your auth token first (login to get JWT token)
TOKEN="your-jwt-token-here"

# Ingest a document
curl -X POST http://localhost:8008/api/v1/ai-chatbot/knowledge-base/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your document content here. This can be documentation, manuals, FAQs, or any text you want the chatbot to use.",
    "source": "user_upload",
    "metadata": {
      "title": "My Document Title",
      "category": "documentation"
    },
    "tags": ["important", "reference", "docs"]
  }'
```

#### Using Python script:

Create `ingest_document.py`:

```python
import requests
import json

# Configuration
BASE_URL = "http://localhost:8008"
TOKEN = "your-jwt-token-here"

# Document to ingest
document = {
    "content": """
    Your document content here.
    This can be long documentation, FAQs, manuals, etc.
    """,
    "source": "user_upload",
    "metadata": {
        "title": "Document Title",
        "category": "documentation"
    },
    "tags": ["docs", "reference"]
}

# Ingest document
response = requests.post(
    f"{BASE_URL}/api/v1/ai-chatbot/knowledge-base/ingest",
    headers={
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    },
    json=document
)

print(json.dumps(response.json(), indent=2))
```

### 2. Search Knowledge Base

```bash
curl -X GET "http://localhost:8008/api/v1/ai-chatbot/knowledge-base/search?query=your%20search%20query&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Chat with RAG-Enhanced Responses

The chatbot automatically uses RAG when processing messages. Simply chat as usual:

```bash
# Create a conversation and send a message
curl -X POST http://localhost:8008/api/v1/ai-chatbot/conversations/{conversation_id}/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What information do you have about my documents?",
    "role": "user"
  }'
```

The chatbot will:
1. Retrieve relevant chunks from the knowledge base
2. Include them in the context
3. Generate responses using both ERP data and knowledge base information

## Managing Knowledge Base

### Get Statistics

```bash
curl -X GET http://localhost:8008/api/v1/ai-chatbot/knowledge-base/stats \
  -H "Authorization: Bearer $TOKEN"
```

### Get Document Chunks

```bash
curl -X GET http://localhost:8008/api/v1/ai-chatbot/knowledge-base/document/{source_id} \
  -H "Authorization: Bearer $TOKEN"
```

### Delete a Document

```bash
curl -X DELETE http://localhost:8008/api/v1/ai-chatbot/knowledge-base/document/{source_id} \
  -H "Authorization: Bearer $TOKEN"
```

## Example: Ingesting Multiple Documents

```bash
# Document 1: Company Policies
curl -X POST http://localhost:8008/api/v1/ai-chatbot/knowledge-base/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Company Policies: Employees must follow all safety protocols...",
    "source": "company_policies",
    "tags": ["policies", "hr"]
  }'

# Document 2: Product Documentation
curl -X POST http://localhost:8008/api/v1/ai-chatbot/knowledge-base/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Product Documentation: Our product features include...",
    "source": "product_docs",
    "tags": ["documentation", "products"]
  }'
```

## Troubleshooting

### RAG Not Working

1. **Check if RAG is enabled:**
   ```bash
   docker logs erp-ai-chatbot-service | grep -i "RAG"
   ```

2. **Check embedding provider:**
   - For OpenAI: Ensure `OPENAI_API_KEY` is set
   - For sentence-transformers: First run may take time to download models

3. **Check MongoDB connection:**
   ```bash
   docker logs erp-ai-chatbot-service | grep -i "mongodb"
   ```

### Embeddings Not Generating

- **OpenAI**: Check API key is valid and has credits
- **Sentence Transformers**: Check logs for model download progress

### No Results from Search

- Lower the `RAG_SIMILARITY_THRESHOLD` (e.g., 0.5)
- Ensure documents are ingested (check stats endpoint)
- Try different query phrasing

## Performance Tips

1. **Chunk Size**: Larger chunks (1500-2000) work better for detailed documents, smaller (500-800) for FAQs
2. **Top K**: Increase `RAG_TOP_K` for more context (but slower responses)
3. **Embedding Model**: `text-embedding-3-small` is fast and cost-effective for most use cases
4. **Batch Ingestion**: For multiple documents, ingest them in batches

## Disabling RAG

To disable RAG temporarily:

```bash
# In docker-compose.yml or .env
ENABLE_RAG=false
```

Then restart the service:
```bash
docker-compose restart ai-chatbot-service
```

## Next Steps

1. Ingest your documentation, FAQs, or knowledge base
2. Test queries to see how RAG enhances responses
3. Adjust parameters based on your use case
4. Monitor performance and costs (if using OpenAI)

## Support

For issues or questions, check:
- Service logs: `docker logs erp-ai-chatbot-service`
- API documentation: `http://localhost:8008/docs`
- README.md for general service documentation

