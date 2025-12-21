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
from app.api.v1 import payments

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting Payment Service...")
    
    # Connect to MongoDB
    await connect_to_mongo()
    logger.info("Connected to MongoDB")
    
    yield
    
    # Cleanup
    logger.info("Shutting down Payment Service...")
    await close_mongo_connection()


# Create FastAPI application
app = FastAPI(
    title="ERP Payment Service",
    description="Payment processing microservice for ERP system with Stripe integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware for production
if settings.environment == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"]
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
        "message": "ERP Payment Service API",
        "version": "1.0.0",
        "docs": "/docs" if settings.environment == "development" else "disabled",
        "status": "running"
    }


# Include API routers
app.include_router(payments.router, prefix="/api/v1")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.service_host,
        port=settings.service_port,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower()
    )

