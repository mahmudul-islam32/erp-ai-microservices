from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Environment
    environment: str = "development"
    
    # Database
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "erp_auth"
    
    # JWT Settings
    secret_key: str = "your-super-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # Service
    service_name: str = "auth-service"
    service_port: int = 8001
    service_host: str = "0.0.0.0"
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"


settings = Settings()
