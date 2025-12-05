from typing import Optional
import logging
from app.config import settings
from app.services.llm_providers import (
    OpenAIProvider,
    HuggingFaceProvider,
    LLMProvider
)

logger = logging.getLogger(__name__)


class LLMProviderFactory:
    """Factory for creating LLM providers"""
    
    @staticmethod
    def create_provider(
        provider_name: Optional[str] = None,
        model: Optional[str] = None,
        **kwargs
    ) -> Optional[LLMProvider]:
        """
        Create an LLM provider based on configuration
        
        Args:
            provider_name: Name of the provider (openai, huggingface, fallback)
            model: Model name to use (provider-specific)
            **kwargs: Additional provider-specific arguments
        
        Returns:
            LLMProvider instance or None if fallback should be used
        """
        # Use configured provider if not specified
        if not provider_name:
            provider_name = settings.default_llm_provider
        
        # Use configured model if not specified
        if not model:
            model = kwargs.get('model') or settings.default_llm_model
        
        provider_name = provider_name.lower()
        
        try:
            if provider_name == "openai":
                if not settings.openai_api_key:
                    logger.warning("OpenAI provider requested but API key not configured")
                    return None
                
                return OpenAIProvider(
                    api_key=settings.openai_api_key,
                    model=model or settings.openai_model,
                    temperature=kwargs.get('temperature', settings.openai_temperature),
                    max_tokens=kwargs.get('max_tokens', settings.openai_max_tokens)
                )
            
            elif provider_name == "huggingface":
                if not settings.huggingface_api_key:
                    logger.warning("Hugging Face provider requested but API key not configured")
                    return None
                
                return HuggingFaceProvider(
                    api_key=settings.huggingface_api_key,
                    model=model or settings.huggingface_model,
                    temperature=kwargs.get('temperature', settings.openai_temperature),
                    max_tokens=kwargs.get('max_tokens', settings.openai_max_tokens),
                    base_url=kwargs.get('base_url', settings.huggingface_base_url)
                )
            
            elif provider_name == "fallback":
                return None  # Use fallback mode
            
            else:
                logger.warning(f"Unknown provider: {provider_name}, using fallback")
                return None
                
        except Exception as e:
            logger.error(f"Error creating provider {provider_name}: {e}", exc_info=True)
            return None
    
    @staticmethod
    def get_available_providers() -> list:
        """Get list of available providers based on configuration"""
        providers = []
        
        if settings.openai_api_key:
            providers.append({
                "name": "openai",
                "display_name": "OpenAI",
                "models": [
                    "gpt-4o-mini",
                    "gpt-4o",
                    "gpt-3.5-turbo",
                    "gpt-4",
                    "gpt-4-turbo-preview"
                ]
            })
        
        if settings.huggingface_api_key:
            providers.append({
                "name": "huggingface",
                "display_name": "Hugging Face",
                "models": [
                    "microsoft/DialoGPT-medium",
                    "microsoft/DialoGPT-large",
                    "facebook/blenderbot-400M-distill",
                    "google/flan-t5-large"
                ]
            })
        
        providers.append({
            "name": "fallback",
            "display_name": "Fallback (Rule-based)",
            "models": [],
            "note": "No API required, uses rule-based responses"
        })
        
        return providers

