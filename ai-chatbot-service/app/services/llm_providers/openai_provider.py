from typing import List, Dict, Optional, Tuple
import logging
from app.services.llm_providers.base import LLMProvider

logger = logging.getLogger(__name__)


class OpenAIProvider(LLMProvider):
    """OpenAI GPT provider"""
    
    def __init__(self, api_key: str, model: str = "gpt-3.5-turbo", temperature: float = 0.7, max_tokens: int = 1000):
        super().__init__(model, temperature, max_tokens)
        self.api_key = api_key
    
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        **kwargs
    ) -> Tuple[str, Dict]:
        """Generate response using OpenAI API"""
        try:
            from openai import AsyncOpenAI
            
            if not self.api_key:
                raise ValueError("OpenAI API key not configured")
            
            client = AsyncOpenAI(api_key=self.api_key)
            
            response = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                **kwargs
            )
            
            content = response.choices[0].message.content
            metadata = {
                "provider": "openai",
                "model": self.model,
                "tokens_used": response.usage.total_tokens if response.usage else None,
                "prompt_tokens": response.usage.prompt_tokens if response.usage else None,
                "completion_tokens": response.usage.completion_tokens if response.usage else None,
            }
            
            return content, metadata
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}", exc_info=True)
            raise
    
    def is_available(self) -> bool:
        """Check if OpenAI is available"""
        return bool(self.api_key)
    
    def get_provider_name(self) -> str:
        return "openai"

