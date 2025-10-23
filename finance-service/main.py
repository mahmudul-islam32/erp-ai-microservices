from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.api.v1 import accounts, journal_entries, invoices, reports, banks, currencies
import logging

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup
    logger.info(f"Starting {settings.service_name} v{settings.service_version}")
    await connect_to_mongo()
    logger.info(f"{settings.service_name} started successfully")
    
    yield
    
    # Shutdown
    await close_mongo_connection()
    logger.info(f"{settings.service_name} shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Finance Service API",
    description="Financial Management & Accounting microservice for ERP system",
    version=settings.service_version,
    lifespan=lifespan,
    redirect_slashes=True  # Handle trailing slashes gracefully
)

# Configure CORS - Must be before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:3000",
        "*"  # Allow all origins in development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Include routers
app.include_router(accounts.router, prefix="/api/v1")
app.include_router(journal_entries.router, prefix="/api/v1")
app.include_router(invoices.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(banks.router, prefix="/api/v1")
app.include_router(currencies.router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.service_name,
        "version": settings.service_version
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.service_name,
        "version": settings.service_version,
        "description": "Financial Management & Accounting Service",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.service_host,
        port=settings.service_port,
        reload=settings.environment == "development"
    )

