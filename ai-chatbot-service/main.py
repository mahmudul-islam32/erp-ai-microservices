from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.api.v1 import chatbot

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting AI Chatbot Service...")
    await connect_to_mongo()
    logger.info("Connected to MongoDB")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Chatbot Service...")
    await close_mongo_connection()
    logger.info("MongoDB connection closed")


# Create FastAPI app
app = FastAPI(
    title=settings.service_name,
    version=settings.service_version,
    description="Intelligent AI Chatbot service with NLP and deep learning for ERP system",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chatbot.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.service_name,
        "version": settings.service_version,
        "status": "running",
        "features": [
            "NLP-powered conversations",
            "Deep learning integration",
            "ERP data integration",
            "Context-aware responses",
            "Multi-turn conversations"
        ]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.service_port,
        reload=True
    )

