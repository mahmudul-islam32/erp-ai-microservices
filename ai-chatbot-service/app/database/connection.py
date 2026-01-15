from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Global database connection
_database: AsyncIOMotorDatabase = None
_client: AsyncIOMotorClient = None


async def connect_to_mongo():
    """Connect to MongoDB"""
    global _database, _client
    
    try:
        _client = AsyncIOMotorClient(settings.mongodb_url)
        _database = _client[settings.database_name]
        
        # Test connection
        await _client.admin.command('ping')
        logger.info(f"Connected to MongoDB: {settings.database_name}")
        
        # Create indexes
        await _create_indexes()
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close MongoDB connection"""
    global _client
    
    if _client:
        _client.close()
        logger.info("MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    if _database is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return _database


async def _create_indexes():
    """Create database indexes"""
    db = get_database()
    
    try:
        # Conversation indexes
        await db.conversations.create_index("user_id")
        await db.conversations.create_index("created_at")
        await db.conversations.create_index([("user_id", 1), ("created_at", -1)])
        
        # Message indexes
        await db.messages.create_index("conversation_id")
        await db.messages.create_index("created_at")
        await db.messages.create_index([("conversation_id", 1), ("created_at", 1)])
        
        # Knowledge base indexes
        await db.knowledge_base.create_index("source_id")
        await db.knowledge_base.create_index("source")
        await db.knowledge_base.create_index("user_id")
        await db.knowledge_base.create_index("tags")
        await db.knowledge_base.create_index([("source_id", 1), ("chunk_index", 1)])
        
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.warning(f"Error creating indexes: {e}")

