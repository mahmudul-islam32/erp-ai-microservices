from typing import List, Dict, Optional, Tuple
import logging
import httpx
from app.services.llm_providers.base import LLMProvider

logger = logging.getLogger(__name__)


class HuggingFaceProvider(LLMProvider):
    """Hugging Face Inference API provider"""
    
    def __init__(
        self,
        api_key: str,
        model: str = "microsoft/DialoGPT-medium",
        temperature: float = 0.7,
        max_tokens: int = 1000,
        base_url: str = "https://api-inference.huggingface.co"
    ):
        super().__init__(model, temperature, max_tokens)
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.timeout = 60.0
    
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        **kwargs
    ) -> Tuple[str, Dict]:
        """Generate response using Hugging Face Inference API"""
        try:
            # Format messages for the model
            prompt = self._format_messages_for_hf(messages)
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = f"{self.base_url}/models/{self.model}"
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "inputs": prompt,
                    "parameters": {
                        "temperature": self.temperature,
                        "max_new_tokens": self.max_tokens,
                        "return_full_text": False,
                    }
                }
                
                logger.info(f"Calling Hugging Face API: {url}")
                response = await client.post(url, json=payload, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Handle different response formats
                    if isinstance(data, list) and len(data) > 0:
                        if isinstance(data[0], dict) and "generated_text" in data[0]:
                            content = data[0]["generated_text"]
                        else:
                            content = str(data[0])
                    elif isinstance(data, dict) and "generated_text" in data:
                        content = data["generated_text"]
                    else:
                        content = str(data)
                    
                    metadata = {
                        "provider": "huggingface",
                        "model": self.model,
                        "tokens_used": None,  # HF API doesn't always return token usage
                    }
                    
                    return content, metadata
                elif response.status_code == 503:
                    # Model is loading
                    logger.warning(f"Model {self.model} is loading, please wait")
                    raise Exception("Model is loading, please try again in a few moments")
                else:
                    error_text = response.text
                    logger.error(f"Hugging Face API returned {response.status_code}: {error_text}")
                    raise Exception(f"Hugging Face API error: {response.status_code} - {error_text}")
                    
        except httpx.TimeoutException:
            logger.error(f"Timeout calling Hugging Face API")
            raise Exception("Hugging Face API timeout")
        except httpx.RequestError as e:
            logger.error(f"Request error calling Hugging Face API: {e}")
            raise Exception(f"Unable to connect to Hugging Face: {str(e)}")
        except Exception as e:
            logger.error(f"Hugging Face API error: {e}", exc_info=True)
            raise
    
    def _format_messages_for_hf(self, messages: List[Dict[str, str]]) -> str:
        """Convert messages to Hugging Face prompt format"""
        prompt_parts = []
        
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            if role == "system":
                prompt_parts.append(f"System: {content}")
            elif role == "user":
                prompt_parts.append(f"User: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}")
        
        prompt_parts.append("Assistant:")
        
        return "\n\n".join(prompt_parts)
    
    def is_available(self) -> bool:
        """Check if Hugging Face is available"""
        return bool(self.api_key)
    
    def get_provider_name(self) -> str:
        return "huggingface"

