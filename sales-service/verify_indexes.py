#!/usr/bin/env python3
"""Verify payment indexes"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings


async def verify():
    try:
        client = AsyncIOMotorClient(settings.mongodb_url)
        db = client[settings.database_name]
        payments_collection = db.payments
        
        print("📋 Payment Collection Indexes:")
        indexes = await payments_collection.list_indexes().to_list(length=None)
        for idx in indexes:
            name = idx['name']
            unique = idx.get('unique', False)
            sparse = idx.get('sparse', False)
            print(f"  • {name}: unique={unique}, sparse={sparse}")
        
        client.close()
        print("\n✅ Indexes verified!")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(verify())

