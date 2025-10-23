from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    database: AsyncIOMotorDatabase = None

db = Database()


async def connect_to_mongo():
    """Connect to MongoDB"""
    try:
        logger.info(f"Connecting to MongoDB: {settings.mongodb_url}")
        db.client = AsyncIOMotorClient(settings.mongodb_url)
        db.database = db.client[settings.database_name]
        
        # Test connection
        await db.client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB: {settings.database_name}")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close MongoDB connection"""
    try:
        if db.client:
            db.client.close()
            logger.info("MongoDB connection closed")
    except Exception as e:
        logger.error(f"Error closing MongoDB connection: {e}")


def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    return db.database


async def create_indexes():
    """Create database indexes for performance"""
    try:
        database = get_database()
        
        # Messages collection indexes
        messages_collection = database.messages
        await messages_collection.create_index("conversation_id")
        await messages_collection.create_index("sender_id")
        await messages_collection.create_index([("created_at", -1)])
        await messages_collection.create_index([("conversation_id", 1), ("created_at", -1)])
        
        # Conversations collection indexes
        conversations_collection = database.conversations
        await conversations_collection.create_index("participant_ids")
        await conversations_collection.create_index("created_by")
        await conversations_collection.create_index([("last_message_at", -1)])
        await conversations_collection.create_index([("participant_ids", 1), ("last_message_at", -1)])
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")

