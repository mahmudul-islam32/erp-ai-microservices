from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Environment
    environment: str = "development"
    service_name: str = "finance-service"
    service_version: str = "1.0.0"
    
    # Database
    mongodb_url: str = "mongodb://admin:password123@mongodb:27017/erp_finance?authSource=admin"
    database_name: str = "erp_finance"
    
    # Service Configuration
    service_port: int = 8006
    service_host: str = "0.0.0.0"
    
    # External Services
    auth_service_url: str = "http://auth-service:8001"
    notification_service_url: str = "http://notification-service:8004"
    sales_service_url: str = "http://sales-service:8003"
    inventory_service_url: str = "http://inventory-service:8002"
    
    # JWT Settings
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Financial Settings
    default_currency: str = "USD"
    fiscal_year_start_month: int = 1  # January
    decimal_places: int = 2
    
    # Currency API (for exchange rates)
    currency_api_key: Optional[str] = None
    currency_api_url: str = "https://api.exchangerate-api.com/v4/latest"
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"


settings = Settings()

