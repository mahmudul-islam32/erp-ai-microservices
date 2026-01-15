# How to Check if RAG is Working

Quick guide to verify RAG functionality in your Docker setup.

## Quick Check Commands

### 1. Check if Service is Running

```bash
docker ps | grep ai-chatbot
```

Should show `erp-ai-chatbot-service` in the list.

### 2. Check Service Logs for RAG

```bash
# Check if RAG is enabled
docker logs erp-ai-chatbot-service 2>&1 | grep -i "rag\|embedding"

# Check for errors
docker logs erp-ai-chatbot-service --tail 100 | grep -i "error\|exception"
```

Look for:
- ✓ No errors about embedding service
- ✓ RAG service initialized (if logs show this)

### 3. Check Configuration

```bash
# Check environment variables
docker exec erp-ai-chatbot-service env | grep -i "RAG\|EMBEDDING"
```

Should show:
- `ENABLE_RAG=true`
- `RAG_EMBEDDING_PROVIDER=openai` (or `sentence_transformer`)
- `RAG_EMBEDDING_MODEL=text-embedding-3-small` (or your configured model)

### 4. Test with API (Requires Auth Token)

First, get a JWT token by logging in:

```bash
# Login to get token
TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@erp.com", "password": "admin123"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"
```

Then test RAG endpoints:

```bash
# Check knowledge base stats
curl -X GET http://localhost:8008/api/v1/ai-chatbot/knowledge-base/stats \
  -H "Authorization: Bearer $TOKEN"

# Test search (even with empty knowledge base, should work)
curl -X GET "http://localhost:8008/api/v1/ai-chatbot/knowledge-base/search?query=test&limit=1" \
  -H "Authorization: Bearer $TOKEN"

# Test ingestion
curl -X POST http://localhost:8008/api/v1/ai-chatbot/knowledge-base/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a test document for RAG.",
    "source": "test",
    "tags": ["test"]
  }'
```

### 5. Use the Test Script

We've created a test script for you:

```bash
# Get token first
TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@erp.com", "password": "admin123"}' \
  | jq -r '.access_token')

# Run test script
python ai-chatbot-service/scripts/test_rag.py --token $TOKEN
```

## Expected Results

### ✅ RAG is Working If:

1. Service logs show no embedding errors
2. Knowledge base stats endpoint returns successfully (even with 0 chunks)
3. Search endpoint works (returns empty list if no documents)
4. Ingestion endpoint creates documents successfully

### ❌ Common Issues:

1. **"RAG is not enabled" error:**
   - Check `ENABLE_RAG=true` in docker-compose.yml
   - Restart service: `docker-compose restart ai-chatbot-service`

2. **Embedding generation errors:**
   - **OpenAI**: Check `OPENAI_API_KEY` is set and valid
   - **Sentence Transformers**: First run downloads models (wait 2-5 minutes)

3. **401/403 Authentication errors:**
   - Get a valid JWT token
   - Check token is not expired

4. **500 Server errors:**
   - Check service logs: `docker logs erp-ai-chatbot-service --tail 100`
   - Verify MongoDB connection
   - Check embedding provider configuration

## Verification Checklist

- [ ] Service is running (`docker ps`)
- [ ] No errors in logs
- [ ] `ENABLE_RAG=true` is set
- [ ] Embedding provider is configured (OpenAI API key OR sentence-transformers)
- [ ] Knowledge base stats endpoint works
- [ ] Search endpoint works
- [ ] Can ingest a test document
- [ ] Ingested document appears in search results

## Need Help?

1. **Check logs:**
   ```bash
   docker logs erp-ai-chatbot-service --tail 200
   ```

2. **Check API docs:**
   Open http://localhost:8008/docs in your browser

3. **Check configuration:**
   ```bash
   docker exec erp-ai-chatbot-service cat /app/.env 2>/dev/null || \
   docker exec erp-ai-chatbot-service env | grep RAG
   ```

4. **Restart service:**
   ```bash
   docker-compose restart ai-chatbot-service
   ```

