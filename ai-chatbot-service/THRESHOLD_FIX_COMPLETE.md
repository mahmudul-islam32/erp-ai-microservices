# Threshold Fix - Complete

## Problem
The RAG similarity threshold was set to 0.7, but the refund policy document has a similarity score of 0.535, which is below 0.7, so it was being filtered out.

## Solution
Changed the threshold from 0.7 to 0.5 in `docker-compose.yml` (hardcoded to 0.5 instead of using environment variable).

## What Changed
- `docker-compose.yml`: Changed `RAG_SIMILARITY_THRESHOLD: ${RAG_SIMILARITY_THRESHOLD:-0.5}` to `RAG_SIMILARITY_THRESHOLD: 0.5`
- This forces the threshold to 0.5, overriding any environment variable

## Test Now
After the container recreates, try asking:
- "What's your refund policy?"
- "How do I get a refund?"

The chatbot should now find and use the refund policy document.

