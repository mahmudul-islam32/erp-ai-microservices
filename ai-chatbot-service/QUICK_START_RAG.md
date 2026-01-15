# Quick Start: RAG with Docker

Get RAG up and running in 5 minutes!

## Step 1: Set Your OpenAI API Key

Create or edit `.env` file in the project root:

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
ENABLE_RAG=true
```

## Step 2: Start Docker Services

```bash
# Start all services (or rebuild if needed)
docker-compose up -d --build ai-chatbot-service

# Check logs to verify RAG is enabled
docker logs erp-ai-chatbot-service | grep -i rag
```

## Step 3: Get Your Auth Token

Login to get a JWT token (use your frontend or API):

```bash
# Example: Login via auth service
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "password": "your-password"}'

# Save the token from response
TOKEN="your-jwt-token-here"
```

## Step 4: Ingest Sample Data (Optional)

```bash
# Using the provided script
python ai-chatbot-service/scripts/ingest_sample_data.py --token $TOKEN

# Or manually ingest a document
curl -X POST http://localhost:8008/api/v1/ai-chatbot/knowledge-base/ingest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your document content here...",
    "source": "my_docs",
    "tags": ["important"]
  }'
```

## Step 5: Test RAG

Chat with the bot - it will automatically use RAG:

```bash
# Create conversation
CONV_ID=$(curl -X POST http://localhost:8008/api/v1/ai-chatbot/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.id')

# Send message
curl -X POST http://localhost:8008/api/v1/ai-chatbot/conversations/$CONV_ID/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What information do you have in your knowledge base?",
    "role": "user"
  }'
```

## That's It!

RAG is now working! The chatbot will:
- ✅ Automatically retrieve relevant information from your knowledge base
- ✅ Combine it with ERP data
- ✅ Generate enhanced, context-aware responses

## Need More Help?

- 📖 Full guide: See [RAG_SETUP_GUIDE.md](./RAG_SETUP_GUIDE.md)
- 🔍 API docs: http://localhost:8008/docs
- 📊 Check stats: `curl http://localhost:8008/api/v1/ai-chatbot/knowledge-base/stats -H "Authorization: Bearer $TOKEN"`

## Troubleshooting

**RAG not working?**
```bash
# Check if enabled
docker logs erp-ai-chatbot-service | grep -i "enable_rag"

# Check embedding provider
docker logs erp-ai-chatbot-service | grep -i "embedding"
```

**No API key?** Use sentence-transformers (open-source, free):
```bash
# In .env or docker-compose.yml
RAG_EMBEDDING_PROVIDER=sentence_transformer
RAG_EMBEDDING_MODEL=all-MiniLM-L6-v2
# No OPENAI_API_KEY needed
```

