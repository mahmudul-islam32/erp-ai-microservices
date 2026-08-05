from abc import ABC, abstractmethod
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    """Base class for LLM providers"""
    
    def __init__(self, model: str, temperature: float = 0.7, max_tokens: int = 1000):
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
    
    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        **kwargs
    ) -> Tuple[str, Dict]:
        """
        Generate a response from the LLM
        
        Args:
            messages: List of message dicts with 'role' and 'content' keys
            **kwargs: Additional provider-specific arguments
        
        Returns:
            Tuple of (response_text, metadata_dict)
        """
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if the provider is available/configured"""
        pass
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """Get the name of the provider"""
        pass

