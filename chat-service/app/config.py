from pydantic import Field
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Service
    service_name: str = "Chat Service"
    service_version: str = "1.0.0"
    service_port: int = 8005
    environment: str = "development"
    
    # Database
    mongodb_url: str = Field(..., env="MONGODB_URL")
    database_name: str = "erp_chat"
    
    # Auth Service
    auth_service_url: str = "http://auth-service:8001"
    jwt_secret_key: str = "your-super-secret-key-change-this-in-production"
    jwt_algorithm: str = "HS256"
    
    # CORS
    cors_origins: list = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

