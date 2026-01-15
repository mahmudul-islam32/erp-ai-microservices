# RAG Similarity Threshold Fix

## Problem

The chatbot wasn't finding documents even though they were ingested. The refund policy document exists with a similarity score of 0.535, but the threshold was set to 0.7, so it was being filtered out.

## Solution

**Lowered the similarity threshold from 0.7 to 0.5**

This is more appropriate for semantic search. Scores around 0.5-0.6 are actually quite good for semantic similarity.

## What Changed

1. **docker-compose.yml**: Changed `RAG_SIMILARITY_THRESHOLD` from 0.7 to 0.5
2. **app/config.py**: Changed default threshold from 0.7 to 0.5

## Similarity Score Guidelines

- **0.8-1.0**: Very similar (almost identical)
- **0.6-0.8**: Similar (good match)
- **0.4-0.6**: Somewhat similar (acceptable match) ← **Our new range**
- **0.2-0.4**: Different but related
- **0.0-0.2**: Not similar

For RAG, a threshold of **0.5** is a good balance:
- Catches relevant documents
- Filters out completely unrelated content
- Works well with OpenAI embeddings

## Testing

After restart, the chatbot should now find the refund policy document when asked about refunds.

Test it:
- Ask: "What's your refund policy?"
- Ask: "How do I get a refund?"
- Ask: "What's the return policy?"

## If You Need to Adjust Further

You can adjust the threshold in docker-compose.yml:

```yaml
RAG_SIMILARITY_THRESHOLD: 0.4  # Lower = more results (but less precise)
RAG_SIMILARITY_THRESHOLD: 0.6  # Higher = fewer results (but more precise)
```

**Recommended**: 0.5 is a good default for most use cases.

