from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Environment
    environment: str = "development"
    
    # Database
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "erp_notifications"
    
    # Service
    service_name: str = "notification-service"
    service_port: int = 8004
    service_host: str = "0.0.0.0"
    
    # JWT Settings (for auth verification)
    secret_key: str = "your-super-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    
    # External Services
    auth_service_url: str = "http://auth-service:8001"
    
    # Redis (for pub/sub)
    redis_url: str = "redis://localhost:6379"
    
    # WebSocket Settings
    websocket_heartbeat_interval: int = 30  # seconds
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"


settings = Settings()

