from typing import List
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating text embeddings"""
    
    def __init__(self):
        self.embedding_model = settings.rag_embedding_model
        self.embedding_provider = settings.rag_embedding_provider
        self._openai_client = None
        self._sentence_transformer_model = None
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text
        
        Args:
            text: Text to embed
            
        Returns:
            List of floats representing the embedding vector
        """
        if self.embedding_provider == "openai":
            return await self._generate_openai_embedding(text)
        elif self.embedding_provider == "sentence_transformer":
            return await self._generate_sentence_transformer_embedding(text)
        else:
            raise ValueError(f"Unsupported embedding provider: {self.embedding_provider}")
    
    async def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts (more efficient)
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        if self.embedding_provider == "openai":
            return await self._generate_openai_embeddings_batch(texts)
        elif self.embedding_provider == "sentence_transformer":
            return await self._generate_sentence_transformer_embeddings_batch(texts)
        else:
            raise ValueError(f"Unsupported embedding provider: {self.embedding_provider}")
    
    async def _generate_openai_embedding(self, text: str) -> List[float]:
        """Generate embedding using OpenAI API"""
        try:
            from openai import AsyncOpenAI
            
            if not settings.openai_api_key:
                raise ValueError("OpenAI API key not configured for embeddings")
            
            if not self._openai_client:
                self._openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
            
            response = await self._openai_client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            
            return response.data[0].embedding
            
        except Exception as e:
            logger.error(f"Error generating OpenAI embedding: {e}", exc_info=True)
            raise
    
    async def _generate_openai_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts using OpenAI API"""
        try:
            from openai import AsyncOpenAI
            
            if not settings.openai_api_key:
                raise ValueError("OpenAI API key not configured for embeddings")
            
            if not self._openai_client:
                self._openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
            
            response = await self._openai_client.embeddings.create(
                model=self.embedding_model,
                input=texts
            )
            
            return [item.embedding for item in response.data]
            
        except Exception as e:
            logger.error(f"Error generating OpenAI embeddings batch: {e}", exc_info=True)
            raise
    
    def _generate_sentence_transformer_embedding(self, text: str) -> List[float]:
        """Generate embedding using sentence-transformers (synchronous)"""
        try:
            from sentence_transformers import SentenceTransformer
            
            if not self._sentence_transformer_model:
                logger.info(f"Loading sentence transformer model: {self.embedding_model}")
                self._sentence_transformer_model = SentenceTransformer(self.embedding_model)
            
            embedding = self._sentence_transformer_model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
            
        except Exception as e:
            logger.error(f"Error generating sentence transformer embedding: {e}", exc_info=True)
            raise
    
    async def _generate_sentence_transformer_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts using sentence-transformers"""
        import asyncio
        
        # Run in executor to avoid blocking
        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(
            None,
            self._generate_sentence_transformer_embeddings_sync,
            texts
        )
        return embeddings
    
    def _generate_sentence_transformer_embeddings_sync(self, texts: List[str]) -> List[List[float]]:
        """Synchronous method for batch embeddings"""
        try:
            from sentence_transformers import SentenceTransformer
            
            if not self._sentence_transformer_model:
                logger.info(f"Loading sentence transformer model: {self.embedding_model}")
                self._sentence_transformer_model = SentenceTransformer(self.embedding_model)
            
            embeddings = self._sentence_transformer_model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
            
        except Exception as e:
            logger.error(f"Error generating sentence transformer embeddings: {e}", exc_info=True)
            raise

