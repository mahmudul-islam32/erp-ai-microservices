from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Global MongoDB client
mongo_client: AsyncIOMotorClient = None


async def connect_to_mongo():
    """Create database connection"""
    global mongo_client
    try:
        mongo_client = AsyncIOMotorClient(settings.mongodb_url)
        # Test the connection
        await mongo_client.admin.command('ping')
        logger.info(f"Connected to MongoDB: {settings.database_name}")
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close database connection"""
    global mongo_client
    if mongo_client:
        mongo_client.close()
        logger.info("Closed MongoDB connection")


def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    return mongo_client[settings.database_name]

