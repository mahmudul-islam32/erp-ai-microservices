# RAG Fix Summary

## Issues Found

1. **Similarity Threshold Too High**: Threshold was 0.7, but refund policy document has similarity score 0.535
2. **RAG Context Not Prominent**: RAG context was only in the base prompt, not as a separate system message like ERP context

## Fixes Applied

### 1. Lowered Similarity Threshold
- Changed from 0.7 to 0.5 in `docker-compose.yml` and `app/config.py`
- This allows documents with similarity scores of 0.5+ to be retrieved
- **Note**: If you have a `.env` file with `RAG_SIMILARITY_THRESHOLD=0.7`, update it or remove it

### 2. Added RAG Context as Separate System Message
- RAG context is now added as a separate system message (like ERP context)
- Makes it more explicit and prominent to the LLM
- Includes clear instructions to use the knowledge base information

## Testing

After applying fixes, test with:
- "What's your refund policy?"
- "How do I get a refund?"
- "What's the return policy?"

The chatbot should now:
1. Find the refund policy document (threshold 0.5 allows score 0.535)
2. Include it as a prominent system message
3. Use it to answer the question

## If Threshold Still Shows 0.7

Check for:
1. `.env` file with `RAG_SIMILARITY_THRESHOLD=0.7` - update or remove
2. Environment variable set in your shell - unset it
3. Rebuild the container: `docker-compose up -d --build ai-chatbot-service`

## Manual Override (Temporary)

To test with a lower threshold immediately, you can set it in your `.env` file:
```
RAG_SIMILARITY_THRESHOLD=0.5
```

Then recreate the container:
```bash
docker-compose up -d --force-recreate ai-chatbot-service
```

