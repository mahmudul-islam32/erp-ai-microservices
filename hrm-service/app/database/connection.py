from motor.motor_asyncio import AsyncIOMotorClient
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# Global database connection
database = None
client = None


async def connect_to_mongo():
    """Create database connection"""
    global database, client
    try:
        client = AsyncIOMotorClient(settings.mongodb_url)
        database = client[settings.database_name]
        
        # Test the connection
        await client.admin.command('ping')
        logger.info(f"Connected to MongoDB for {settings.service_name}")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close database connection"""
    global client
    if client:
        client.close()
        logger.info(f"Disconnected from MongoDB for {settings.service_name}")


async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # Employee indexes
        await database.employees.create_index("employee_id", unique=True)
        await database.employees.create_index("email", unique=True)
        await database.employees.create_index("department")
        await database.employees.create_index("position")
        await database.employees.create_index("status")
        
        # Payroll indexes
        await database.payrolls.create_index("employee_id")
        await database.payrolls.create_index("pay_period_start")
        await database.payrolls.create_index("pay_period_end")
        await database.payrolls.create_index([("employee_id", 1), ("pay_period_start", 1)], unique=True)
        
        # Attendance indexes
        await database.attendance.create_index("employee_id")
        await database.attendance.create_index("date")
        await database.attendance.create_index([("employee_id", 1), ("date", 1)], unique=True)
        
        # Leave indexes
        await database.leaves.create_index("employee_id")
        await database.leaves.create_index("start_date")
        await database.leaves.create_index("end_date")
        await database.leaves.create_index("status")
        await database.leaves.create_index("leave_type")
        
        # Performance review indexes
        await database.performance_reviews.create_index("employee_id")
        await database.performance_reviews.create_index("review_period_start")
        await database.performance_reviews.create_index("reviewer_id")
        
        # Recruitment indexes
        await database.job_postings.create_index("status")
        await database.job_postings.create_index("department")
        await database.job_postings.create_index("created_at")
        await database.applications.create_index("job_posting_id")
        await database.applications.create_index("applicant_email")
        await database.applications.create_index("status")
        
        # Training indexes
        await database.trainings.create_index("status")
        await database.trainings.create_index("category")
        await database.trainings.create_index("start_date")
        await database.employee_trainings.create_index("employee_id")
        await database.employee_trainings.create_index("training_id")
        await database.employee_trainings.create_index("status")
        
        # Benefits indexes
        await database.benefits.create_index("employee_id")
        await database.benefits.create_index("benefit_type")
        await database.benefits.create_index("status")
        
        # Analytics indexes
        await database.hr_analytics.create_index("metric_type")
        await database.hr_analytics.create_index("period_start")
        await database.hr_analytics.create_index("period_end")
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Failed to create indexes: {e}")


def get_database():
    """Get database instance"""
    return database


def get_client():
    """Get MongoDB client instance"""
    return client
