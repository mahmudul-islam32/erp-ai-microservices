#!/usr/bin/env python3
"""
Script to ingest sample documents into the knowledge base for testing RAG.

Usage:
    python scripts/ingest_sample_data.py --base-url http://localhost:8008 --token YOUR_JWT_TOKEN

Or set environment variables:
    export CHATBOT_BASE_URL=http://localhost:8008
    export JWT_TOKEN=your-token-here
    python scripts/ingest_sample_data.py
"""

import argparse
import os
import sys
import requests
from typing import Optional


def ingest_document(
    base_url: str,
    token: str,
    content: str,
    source: str = "sample_data",
    metadata: Optional[dict] = None,
    tags: Optional[list] = None
) -> dict:
    """Ingest a document into the knowledge base"""
    url = f"{base_url}/api/v1/ai-chatbot/knowledge-base/ingest"
    
    payload = {
        "content": content,
        "source": source,
        "metadata": metadata or {},
        "tags": tags or []
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error ingesting document: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        raise


def main():
    parser = argparse.ArgumentParser(description="Ingest sample documents into RAG knowledge base")
    parser.add_argument("--base-url", default=os.getenv("CHATBOT_BASE_URL", "http://localhost:8008"),
                       help="Base URL of the chatbot service")
    parser.add_argument("--token", default=os.getenv("JWT_TOKEN"),
                       help="JWT authentication token")
    parser.add_argument("--skip-sample", action="store_true",
                       help="Skip ingesting sample data, only test connection")
    
    args = parser.parse_args()
    
    if not args.token:
        print("Error: JWT token is required. Set --token or JWT_TOKEN environment variable")
        sys.exit(1)
    
    base_url = args.base_url.rstrip('/')
    
    # Test connection
    try:
        stats_url = f"{base_url}/api/v1/ai-chatbot/knowledge-base/stats"
        headers = {"Authorization": f"Bearer {args.token}"}
        response = requests.get(stats_url, headers=headers)
        response.raise_for_status()
        stats = response.json()
        print("✓ Connected to chatbot service")
        print(f"  Current knowledge base: {stats.get('total_chunks', 0)} chunks, {stats.get('unique_documents', 0)} documents\n")
    except requests.exceptions.RequestException as e:
        print(f"✗ Error connecting to service: {e}")
        if "401" in str(e) or "403" in str(e):
            print("  Authentication failed. Check your JWT token.")
        sys.exit(1)
    
    if args.skip_sample:
        print("Skipping sample data ingestion (--skip-sample flag)")
        return
    
    # Sample documents to ingest
    sample_documents = [
        {
            "content": """
            ERP System Overview
            
            Our Enterprise Resource Planning (ERP) system is a comprehensive business management 
            solution that integrates various business processes and functions into a unified system.
            
            Key Features:
            - Sales Management: Track orders, customers, and revenue
            - Inventory Management: Monitor stock levels and products
            - Finance Management: Handle accounting and financial reports
            - Human Resources: Manage employees, payroll, and attendance
            
            The system provides real-time insights and analytics to help make informed business decisions.
            """,
            "source": "system_overview",
            "metadata": {"title": "ERP System Overview", "category": "documentation"},
            "tags": ["system", "overview", "documentation"]
        },
        {
            "content": """
            Sales Process Guide
            
            The sales process in our ERP system follows these steps:
            
            1. Create a Sales Order: Enter customer details and order items
            2. Check Inventory: System verifies product availability
            3. Process Payment: Integration with payment gateways
            4. Fulfill Order: Generate invoices and shipping documents
            5. Track Delivery: Monitor order status and delivery
            
            Sales orders can be tracked in real-time, and customers receive notifications 
            at each stage of the process.
            """,
            "source": "sales_guide",
            "metadata": {"title": "Sales Process Guide", "category": "guide"},
            "tags": ["sales", "process", "guide"]
        },
        {
            "content": """
            Inventory Management FAQ
            
            Q: How do I check stock levels?
            A: Navigate to the Inventory module and view the Products page. Stock levels 
               are displayed for each product with real-time updates.
            
            Q: What happens when stock is low?
            A: The system automatically sends notifications when products fall below 
               the minimum stock threshold.
            
            Q: Can I track products by warehouse?
            A: Yes, the system supports multiple warehouses. You can view stock levels 
               per warehouse and transfer items between warehouses.
            
            Q: How do I add new products?
            A: Go to Products > Add New Product, fill in the product details including 
               name, SKU, price, and initial stock level.
            """,
            "source": "inventory_faq",
            "metadata": {"title": "Inventory Management FAQ", "category": "faq"},
            "tags": ["inventory", "faq", "help"]
        },
        {
            "content": """
            Financial Reporting
            
            The Finance module provides comprehensive financial reporting capabilities:
            
            - Revenue Reports: Track income by period, product, or customer
            - Expense Reports: Monitor and categorize expenses
            - Profit & Loss: View P&L statements for any period
            - Cash Flow: Analyze cash flow patterns and trends
            - Balance Sheets: Generate balance sheets with real-time data
            
            All reports can be exported to PDF or Excel format and can be scheduled 
            for automatic generation.
            """,
            "source": "finance_reports",
            "metadata": {"title": "Financial Reporting", "category": "documentation"},
            "tags": ["finance", "reports", "analytics"]
        }
    ]
    
    print(f"Ingesting {len(sample_documents)} sample documents...\n")
    
    ingested_count = 0
    for i, doc in enumerate(sample_documents, 1):
        try:
            print(f"[{i}/{len(sample_documents)}] Ingesting: {doc['metadata']['title']}...", end=" ")
            result = ingest_document(
                base_url=base_url,
                token=args.token,
                content=doc["content"].strip(),
                source=doc["source"],
                metadata=doc["metadata"],
                tags=doc["tags"]
            )
            chunks_created = result.get("chunks_created", 0)
            print(f"✓ Created {chunks_created} chunks")
            ingested_count += 1
        except Exception as e:
            print(f"✗ Failed: {e}")
    
    print(f"\n✓ Successfully ingested {ingested_count}/{len(sample_documents)} documents")
    
    # Get updated stats
    try:
        response = requests.get(f"{base_url}/api/v1/ai-chatbot/knowledge-base/stats", headers=headers)
        stats = response.json()
        print("\nKnowledge Base Statistics:")
        print(f"  Total chunks: {stats.get('total_chunks', 0)}")
        print(f"  Unique documents: {stats.get('unique_documents', 0)}")
    except Exception:
        pass
    
    print("\nYou can now test RAG by asking the chatbot questions about:")
    print("  - ERP system features")
    print("  - Sales process")
    print("  - Inventory management")
    print("  - Financial reporting")


if __name__ == "__main__":
    main()

