#!/usr/bin/env python3
"""
Script to test if RAG is working correctly.

Usage:
    python scripts/test_rag.py --base-url http://localhost:8008 --token YOUR_JWT_TOKEN

Or set environment variables:
    export CHATBOT_BASE_URL=http://localhost:8008
    export JWT_TOKEN=your-token-here
    python scripts/test_rag.py
"""

import argparse
import os
import sys
import requests
from typing import Optional


def check_service_health(base_url: str) -> bool:
    """Check if the service is running"""
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        return response.status_code == 200
    except Exception:
        return False


def get_knowledge_base_stats(base_url: str, token: str) -> Optional[dict]:
    """Get knowledge base statistics"""
    try:
        response = requests.get(
            f"{base_url}/api/v1/ai-chatbot/knowledge-base/stats",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        if response.status_code == 200:
            return response.json()
        else:
            print(f"  ✗ Error: {response.status_code} - {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"  ✗ Error: {e}")
        return None


def test_search(base_url: str, token: str) -> bool:
    """Test knowledge base search"""
    try:
        response = requests.get(
            f"{base_url}/api/v1/ai-chatbot/knowledge-base/search",
            headers={"Authorization": f"Bearer {token}"},
            params={"query": "test query", "limit": 1},
            timeout=10
        )
        return response.status_code == 200
    except Exception:
        return False


def test_ingest(base_url: str, token: str) -> bool:
    """Test document ingestion"""
    try:
        test_doc = {
            "content": "This is a test document to verify RAG functionality.",
            "source": "rag_test",
            "metadata": {"test": True},
            "tags": ["test"]
        }
        response = requests.post(
            f"{base_url}/api/v1/ai-chatbot/knowledge-base/ingest",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json=test_doc,
            timeout=30
        )
        return response.status_code == 201
    except Exception:
        return False


def main():
    parser = argparse.ArgumentParser(description="Test RAG functionality")
    parser.add_argument("--base-url", default=os.getenv("CHATBOT_BASE_URL", "http://localhost:8008"),
                       help="Base URL of the chatbot service")
    parser.add_argument("--token", default=os.getenv("JWT_TOKEN"),
                       help="JWT authentication token")
    parser.add_argument("--skip-ingest", action="store_true",
                       help="Skip ingestion test")
    
    args = parser.parse_args()
    
    base_url = args.base_url.rstrip('/')
    
    print("=" * 60)
    print("RAG Functionality Test")
    print("=" * 60)
    print()
    
    # Test 1: Service Health
    print("1. Checking service health...")
    if check_service_health(base_url):
        print("   ✓ Service is running")
    else:
        print("   ✗ Service is not accessible")
        print(f"   Make sure the service is running at {base_url}")
        sys.exit(1)
    print()
    
    if not args.token:
        print("⚠  No JWT token provided. Some tests will be skipped.")
        print("   To test RAG fully, provide a token with --token or set JWT_TOKEN env var")
        print()
        print("To get a token, login via:")
        print("  curl -X POST http://localhost:8001/api/v1/auth/login \\")
        print("    -H 'Content-Type: application/json' \\")
        print("    -d '{\"email\": \"admin@erp.com\", \"password\": \"admin123\"}'")
        sys.exit(0)
    
    # Test 2: Knowledge Base Stats
    print("2. Checking knowledge base statistics...")
    stats = get_knowledge_base_stats(base_url, args.token)
    if stats:
        print("   ✓ Knowledge base accessible")
        print(f"   - Total chunks: {stats.get('total_chunks', 0)}")
        print(f"   - Unique documents: {stats.get('unique_documents', 0)}")
    else:
        print("   ✗ Cannot access knowledge base")
        print("   This might indicate:")
        print("     - RAG is not enabled (check ENABLE_RAG env var)")
        print("     - Authentication failed (check token)")
        print("     - Service error (check logs)")
    print()
    
    # Test 3: Search functionality
    print("3. Testing search functionality...")
    if test_search(base_url, args.token):
        print("   ✓ Search endpoint is working")
    else:
        print("   ✗ Search endpoint failed")
    print()
    
    # Test 4: Ingestion (optional)
    if not args.skip_ingest:
        print("4. Testing document ingestion...")
        if test_ingest(base_url, args.token):
            print("   ✓ Document ingestion is working")
            print("   (A test document was created)")
        else:
            print("   ✗ Document ingestion failed")
            print("   Check logs for embedding generation errors")
        print()
    
    # Summary
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Check Docker logs: docker logs erp-ai-chatbot-service")
    print("2. Verify RAG config: Check ENABLE_RAG and embedding provider settings")
    print("3. Check API docs: http://localhost:8008/docs")
    print()
    
    if stats and stats.get('total_chunks', 0) > 0:
        print("✓ RAG appears to be configured and working!")
        print("  You have documents in your knowledge base.")
    else:
        print("⚠  RAG may need configuration:")
        print("  1. Ensure ENABLE_RAG=true in docker-compose.yml or .env")
        print("  2. Set OPENAI_API_KEY if using OpenAI embeddings")
        print("  3. Or set RAG_EMBEDDING_PROVIDER=sentence_transformer for free option")
        print("  4. Ingest some documents to test")


if __name__ == "__main__":
    main()

