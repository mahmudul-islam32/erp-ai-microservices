from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Service Configuration
    service_name: str = "HRM Service"
    service_version: str = "1.0.0"
    service_host: str = "0.0.0.0"
    service_port: int = 8007
    
    # Environment
    environment: str = "development"
    log_level: str = "INFO"
    debug: bool = True
    
    # Database Configuration
    mongodb_url: str = "mongodb://admin:password123@mongodb:27017/erp_hrm?authSource=admin"
    database_name: str = "erp_hrm"
    
    # External Services
    auth_service_url: str = "http://auth-service:8001"
    notification_service_url: str = "http://notification-service:8004"
    
    # JWT Configuration
    secret_key: str = "your-super-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    
    # HRM Specific Settings
    default_currency: str = "USD"
    default_timezone: str = "UTC"
    max_leave_days_per_year: int = 30
    default_working_hours_per_day: float = 8.0
    overtime_threshold_hours: float = 40.0
    overtime_multiplier: float = 1.5
    
    # Tax Configuration
    default_tax_rate: float = 0.20
    social_security_rate: float = 0.062
    medicare_rate: float = 0.0145
    
    # Performance Review Settings
    review_period_months: int = 12
    rating_scale_max: int = 5
    
    # Recruitment Settings
    application_expiry_days: int = 30
    interview_slots_per_day: int = 8
    
    # Training Settings
    certification_validity_years: int = 2
    mandatory_training_hours: int = 40
    
    # Benefits Settings
    health_insurance_contribution: float = 0.20
    retirement_match_percentage: float = 0.05
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
