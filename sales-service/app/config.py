from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Environment
    environment: str = "development"
    
    # Database
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "sales_db"
    
    # Service
    service_name: str = "sales-service"
    service_port: int = 8003
    service_host: str = "0.0.0.0"
    
    # External Services
    auth_service_url: str = "http://auth-service:8001"  # Use service name for Docker
    inventory_service_url: str = "http://inventory-service:8002"  # Use service name for Docker
    
    # JWT Settings (for auth verification)
    secret_key: str = "your-super-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    
    # Redis (for caching and background tasks)
    redis_url: str = "redis://localhost:6379"
    
    # Email Settings
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    
    # Business Settings
    default_tax_rate: float = 0.15  # 15% default tax
    default_discount_limit: float = 0.20  # 20% max discount
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"


settings = Settings()
