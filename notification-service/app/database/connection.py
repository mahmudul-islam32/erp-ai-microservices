from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# Global MongoDB client and database
mongo_client: AsyncIOMotorClient = None
database: AsyncIOMotorDatabase = None


async def connect_to_mongo():
    """Connect to MongoDB"""
    global mongo_client, database
    
    try:
        logger.info(f"Connecting to MongoDB at {settings.mongodb_url}")
        mongo_client = AsyncIOMotorClient(
            settings.mongodb_url,
            serverSelectionTimeoutMS=5000
        )
        
        # Verify connection
        await mongo_client.admin.command('ping')
        
        database = mongo_client[settings.database_name]
        
        # Create indexes
        await create_indexes()
        
        logger.info(f"Successfully connected to MongoDB database: {settings.database_name}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close MongoDB connection"""
    global mongo_client
    
    if mongo_client:
        mongo_client.close()
        logger.info("MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    return database


async def create_indexes():
    """Create database indexes"""
    try:
        # Notifications collection indexes
        await database.notifications.create_index("user_id")
        await database.notifications.create_index("created_at")
        await database.notifications.create_index([("user_id", 1), ("is_read", 1)])
        await database.notifications.create_index([("user_id", 1), ("created_at", -1)])
        
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")

