from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    # Service
    service_name: str = "AI Chatbot Service"
    service_version: str = "1.0.0"
    service_port: int = 8008
    environment: str = "development"
    
    # Database
    mongodb_url: str = "mongodb://admin:password123@mongodb:27017/erp_ai_chatbot?authSource=admin"
    database_name: str = "erp_ai_chatbot"
    
    # Auth Service
    auth_service_url: str = "http://auth-service:8001"
    jwt_secret_key: str = "your-super-secret-key-change-this-in-production"
    jwt_algorithm: str = "HS256"
    
    # External Services
    sales_service_url: str = "http://sales-service:8003"
    inventory_service_url: str = "http://inventory-service:8002"
    finance_service_url: str = "http://finance-service:8006"
    hrm_service_url: str = "http://hrm-service:8007"
    
    # AI/ML Configuration - Provider Selection
    default_llm_provider: str = "openai"  # Options: openai, huggingface, fallback
    default_llm_model: Optional[str] = None  # Uses provider default if None
    
    # OpenAI Configuration
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"  # Fast and cost-effective model
    openai_temperature: float = 0.7
    openai_max_tokens: int = 1000
    
    # Hugging Face Configuration
    huggingface_api_key: Optional[str] = None
    huggingface_model: str = "microsoft/DialoGPT-medium"
    huggingface_base_url: str = "https://api-inference.huggingface.co"
    
    # Chatbot Settings
    max_conversation_history: int = 20  # Number of previous messages to include in context
    context_window_size: int = 4096  # Max tokens for context
    enable_web_search: bool = False
    enable_code_generation: bool = True
    
    # CORS
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

