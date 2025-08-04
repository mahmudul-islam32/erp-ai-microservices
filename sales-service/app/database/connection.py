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
        
        # Customers collection indexes
        customers_collection = db.customers
        await customers_collection.create_index("email", unique=True)
        await customers_collection.create_index("phone")
        await customers_collection.create_index("customer_code", unique=True)
        await customers_collection.create_index("status")
        await customers_collection.create_index("created_at")
        
        # Products collection indexes
        products_collection = db.products
        await products_collection.create_index("sku", unique=True)
        await products_collection.create_index("name")
        await products_collection.create_index("category")
        await products_collection.create_index("status")
        await products_collection.create_index("price")
        
        # Sales Orders collection indexes
        orders_collection = db.sales_orders
        await orders_collection.create_index("order_number", unique=True)
        await orders_collection.create_index("customer_id")
        await orders_collection.create_index("status")
        await orders_collection.create_index("order_date")
        await orders_collection.create_index("total_amount")
        await orders_collection.create_index("sales_rep_id")
        await orders_collection.create_index([("status", 1), ("order_date", -1)])
        
        # Quotes collection indexes
        quotes_collection = db.quotes
        await quotes_collection.create_index("quote_number", unique=True)
        await quotes_collection.create_index("customer_id")
        await quotes_collection.create_index("status")
        await quotes_collection.create_index("created_at")
        await quotes_collection.create_index("valid_until")
        await quotes_collection.create_index("sales_rep_id")
        
        # Invoices collection indexes
        invoices_collection = db.invoices
        await invoices_collection.create_index("invoice_number", unique=True)
        await invoices_collection.create_index("order_id")
        await invoices_collection.create_index("customer_id")
        await invoices_collection.create_index("status")
        await invoices_collection.create_index("invoice_date")
        await invoices_collection.create_index("due_date")
        await invoices_collection.create_index("total_amount")
        
        # Payments collection indexes
        payments_collection = db.payments
        await payments_collection.create_index("payment_reference", unique=True)
        await payments_collection.create_index("invoice_id")
        await payments_collection.create_index("customer_id")
        await payments_collection.create_index("payment_date")
        await payments_collection.create_index("status")
        await payments_collection.create_index("payment_method")
        
        # Sales Reports collection indexes
        reports_collection = db.sales_reports
        await reports_collection.create_index("report_date")
        await reports_collection.create_index("sales_rep_id")
        await reports_collection.create_index("period_type")
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Failed to create indexes: {e}")


def get_database():
    """Get database instance"""
    return database.database
