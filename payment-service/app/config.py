from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Environment
    environment: str = "development"
    
    # Database
    mongodb_url: str = Field(..., env="MONGODB_URL")
    database_name: str = "payment_db"
    
    # Service
    service_name: str = "payment-service"
    service_port: int = 8009
    service_host: str = "0.0.0.0"
    
    # External Services
    auth_service_url: str = "http://auth-service:8001"
    sales_service_url: str = "http://sales-service:8003"
    
    # JWT Settings (for auth verification)
    secret_key: str = "your-super-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    
    # Stripe Payment Gateway Settings
    stripe_secret_key: str = Field(..., env="STRIPE_SECRET_KEY")
    stripe_publishable_key: str = Field(..., env="STRIPE_PUBLISHABLE_KEY")
    stripe_webhook_secret: str = Field(..., env="STRIPE_WEBHOOK_SECRET")
    stripe_api_version: str = "2023-10-16"
    stripe_currency: str = "usd"
    
    @field_validator('stripe_secret_key')
    @classmethod
    def validate_stripe_secret_key(cls, v: str) -> str:
        """Validate Stripe secret key format"""
        if not v:
            raise ValueError("STRIPE_SECRET_KEY is required")
        
        # Strip whitespace
        v = v.strip()
        
        # Check if it starts with sk_test_ or sk_live_
        if not (v.startswith('sk_test_') or v.startswith('sk_live_')):
            raise ValueError("STRIPE_SECRET_KEY must start with 'sk_test_' or 'sk_live_'")
        
        # Warn about placeholder values but don't fail
        if 'your_secret_key_here' in v.lower() or 'your_key' in v.lower() or 'placeholder' in v.lower():
            import warnings
            warnings.warn(
                "STRIPE_SECRET_KEY appears to be a placeholder. Please replace it with your actual Stripe secret key from https://dashboard.stripe.com/apikeys",
                UserWarning,
                stacklevel=2,
            )
        
        # Warn about short keys but don't fail (allows service to start)
        if len(v) < 50:
            import warnings
            warnings.warn(
                f"STRIPE_SECRET_KEY appears to be invalid (too short: {len(v)} chars). "
                f"Valid keys are typically 100+ characters. "
                f"Get your key from: https://dashboard.stripe.com/apikeys",
                UserWarning,
                stacklevel=2,
            )
        
        return v
    
    @field_validator('stripe_publishable_key')
    @classmethod
    def validate_stripe_publishable_key(cls, v: str) -> str:
        """Validate Stripe publishable key format"""
        if not v:
            raise ValueError("STRIPE_PUBLISHABLE_KEY is required")
        
        # Strip whitespace
        v = v.strip()
        
        # Check if it starts with pk_test_ or pk_live_
        if not (v.startswith('pk_test_') or v.startswith('pk_live_')):
            raise ValueError("STRIPE_PUBLISHABLE_KEY must start with 'pk_test_' or 'pk_live_'")
        
        # Warn about placeholder values but don't fail
        if 'your_publishable_key_here' in v.lower() or 'your_key' in v.lower() or 'placeholder' in v.lower():
            import warnings
            warnings.warn(
                "STRIPE_PUBLISHABLE_KEY appears to be a placeholder. Please replace it with your actual Stripe publishable key from https://dashboard.stripe.com/apikeys",
                UserWarning,
                stacklevel=2,
            )
        
        # Warn about short keys but don't fail (allows service to start)
        if len(v) < 50:
            import warnings
            warnings.warn(
                f"STRIPE_PUBLISHABLE_KEY appears to be invalid (too short: {len(v)} chars). "
                f"Valid keys are typically 100+ characters. "
                f"Get your key from: https://dashboard.stripe.com/apikeys",
                UserWarning,
                stacklevel=2,
            )
        
        return v
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"


settings = Settings()

