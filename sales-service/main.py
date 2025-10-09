from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import logging
import uvicorn

from app.config import settings
from app.database.connection import connect_to_mongo, close_mongo_connection
from app.api.v1 import (
    customers_router,
    inventory_products_router,
    sales_orders_router,
    quotes_router,
    invoices_router,
    payments_router,
    analytics_router,
    reports_router,
    # pos_router  # Removed - using sales orders as POS
)# Configure logging
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
    docs_url="/docs",  # Always enable docs
    redoc_url="/redoc",  # Always enable redoc
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
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


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors with detailed logging"""
    logger.error(f"❌ Validation error on {request.method} {request.url}")
    logger.error(f"❌ Validation errors: {exc.errors()}")
    
    # Try to get request body, but handle client disconnect gracefully
    try:
        body = await request.body()
        logger.error(f"❌ Request body: {body}")
    except Exception as e:
        logger.error(f"❌ Could not read request body: {e}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": exc.errors()
        }
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


# Debug auth endpoint
@app.get("/debug/auth")
async def debug_auth(request):
    """Debug endpoint to check authentication"""
    from app.api.dependencies import get_token_from_request
    from app.services.external_services import auth_service
    
    try:
        token = await get_token_from_request(request)
        if not token:
            return {"error": "No token provided", "headers": dict(request.headers)}
        
        user_data = await auth_service.verify_token(token)
        if not user_data:
            return {"error": "Token verification failed", "token_preview": token[:20] + "..."}
            
        return {
            "success": True,
            "user": {
                "id": user_data.get("id"),
                "email": user_data.get("email"),
                "role": user_data.get("role"),
                "permissions": user_data.get("permissions"),
                "status": user_data.get("status")
            }
        }
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}


# Include API routers
app.include_router(customers_router, prefix="/api/v1")
app.include_router(inventory_products_router, prefix="/api/v1")
app.include_router(sales_orders_router, prefix="/api/v1")
app.include_router(quotes_router, prefix="/api/v1")
app.include_router(invoices_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
# app.include_router(pos_router, prefix="/api/v1")  # Removed - using sales orders as POS


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.service_host,
        port=settings.service_port,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower()
    )
