from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import uvicorn

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.api.v1 import (
    customers_router, 
    products_router, 
    sales_orders_router, 
    quotes_router, 
    invoices_router,
    analytics_router,
    reports_router
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting Sales Service...")
    
    # Connect to MongoDB
    await connect_to_mongo()
    logger.info("Connected to MongoDB")
    
    yield
    
    # Cleanup
    logger.info("Shutting down Sales Service...")
    await close_mongo_connection()


# Create FastAPI application
app = FastAPI(
    title="ERP Sales Service",
    description="Sales and Order Management microservice for ERP system",
    version="1.0.0",
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url="/redoc" if settings.environment == "development" else None,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware for production
if settings.environment == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"]  # Configure properly for production
    )


# Global exception handler
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)}
    )


@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "Resource not found"}
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.service_name}


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "ERP Sales Service API",
        "version": "1.0.0",
        "docs": "/docs" if settings.environment == "development" else "disabled",
        "status": "running"
    }


# Include API routers
app.include_router(customers_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(sales_orders_router, prefix="/api/v1")
app.include_router(quotes_router, prefix="/api/v1")
app.include_router(invoices_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.service_host,
        port=settings.service_port,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower()
    )
