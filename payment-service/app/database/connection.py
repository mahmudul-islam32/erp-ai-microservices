from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient = None
    database = None


database = Database()


async def connect_to_mongo():
    """Create database connection"""
    try:
        database.client = AsyncIOMotorClient(settings.mongodb_url)
        database.database = database.client[settings.database_name]
        
        # Test the connection
        await database.client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB: {settings.database_name}")
        
        # Create indexes
        await create_indexes()
        
    except ConnectionFailure as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close database connection"""
    if database.client:
        database.client.close()
        logger.info("Disconnected from MongoDB")


async def create_indexes():
    """Create database indexes for better performance"""
    try:
        db = database.database
        
        # Payment intents collection indexes
        payment_intents_collection = db.payment_intents
        await payment_intents_collection.create_index("payment_intent_id", unique=True)
        await payment_intents_collection.create_index("status")
        await payment_intents_collection.create_index("created_at")
        await payment_intents_collection.create_index("order_id")
        await payment_intents_collection.create_index("customer_id")
        
        # Webhook events collection indexes
        webhook_events_collection = db.webhook_events
        await webhook_events_collection.create_index("event_id", unique=True)
        await webhook_events_collection.create_index("event_type")
        await webhook_events_collection.create_index("payment_intent_id")
        await webhook_events_collection.create_index("created_at")
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Failed to create indexes: {e}")


def get_database():
    """Get database instance"""
    return database.database

