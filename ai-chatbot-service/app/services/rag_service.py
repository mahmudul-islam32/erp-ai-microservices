from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List, Optional, Dict, Tuple
import logging
import numpy as np
from math import sqrt

from app.models.knowledge_base import KnowledgeChunkCreate, KnowledgeChunkInDB, KnowledgeChunkResponse
from app.services.embedding_service import EmbeddingService
from app.config import settings

logger = logging.getLogger(__name__)


class RAGService:
    """Service for RAG (Retrieval-Augmented Generation) operations"""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.knowledge_base_collection = database.knowledge_base
        self.embedding_service = EmbeddingService()
    
    def _chunk_text(self, text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
        """
        Split text into chunks with overlap
        
        Args:
            text: Text to chunk
            chunk_size: Maximum characters per chunk
            chunk_overlap: Characters to overlap between chunks
            
        Returns:
            List of text chunks
        """
        if len(text) <= chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            
            # Try to break at sentence boundary (prefer period, newline, or space)
            if end < len(text):
                # Look for sentence break within last 20% of chunk
                lookback_start = max(start, end - chunk_size // 5)
                for i in range(end - 1, lookback_start - 1, -1):
                    if text[i] in '.!?\n':
                        end = i + 1
                        break
                    elif text[i] == ' ' and i < end - 50:
                        end = i + 1
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start forward, accounting for overlap
            start = end - chunk_overlap
            if start >= len(text):
                break
        
        return chunks
    
    async def ingest_document(
        self,
        content: str,
        source: str = "user_upload",
        source_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ) -> Tuple[str, int]:
        """
        Ingest a document into the knowledge base
        
        Args:
            content: Document content
            source: Source identifier
            source_id: ID in source system
            metadata: Additional metadata
            tags: Tags for the document
            user_id: User who uploaded the document
            chunk_size: Characters per chunk
            chunk_overlap: Overlap between chunks
            
        Returns:
            Tuple of (document_id, number_of_chunks_created)
        """
        try:
            # Chunk the document
            text_chunks = self._chunk_text(content, chunk_size, chunk_overlap)
            
            if not text_chunks:
                raise ValueError("No chunks created from document")
            
            logger.info(f"Ingesting document: {len(text_chunks)} chunks, source: {source}")
            
            # Generate embeddings for all chunks (batch processing)
            logger.info("Generating embeddings...")
            embeddings = await self.embedding_service.generate_embeddings_batch(text_chunks)
            
            # Create document ID (use source_id if provided, otherwise generate)
            document_id = source_id or str(ObjectId())
            now = datetime.utcnow()
            
            # Insert chunks
            chunks_to_insert = []
            for i, (chunk_text, embedding) in enumerate(zip(text_chunks, embeddings)):
                chunk_data = {
                    "content": chunk_text,
                    "metadata": metadata or {},
                    "source": source,
                    "source_id": document_id,
                    "chunk_index": i,
                    "tags": tags or [],
                    "user_id": user_id,
                    "embedding": embedding,
                    "created_at": now,
                    "updated_at": now
                }
                chunks_to_insert.append(chunk_data)
            
            if chunks_to_insert:
                await self.knowledge_base_collection.insert_many(chunks_to_insert)
                logger.info(f"Inserted {len(chunks_to_insert)} chunks into knowledge base")
            
            return document_id, len(chunks_to_insert)
            
        except Exception as e:
            logger.error(f"Error ingesting document: {e}", exc_info=True)
            raise
    
    async def search_similar_chunks(
        self,
        query: str,
        limit: int = 5,
        threshold: float = 0.7,
        source_filter: Optional[str] = None,
        tags_filter: Optional[List[str]] = None,
        user_id: Optional[str] = None
    ) -> List[KnowledgeChunkResponse]:
        """
        Search for similar chunks using semantic similarity
        
        Args:
            query: Search query
            limit: Maximum number of results
            threshold: Minimum similarity score (0-1)
            source_filter: Filter by source
            tags_filter: Filter by tags
            user_id: Filter by user_id
            
        Returns:
            List of similar chunks with scores
        """
        try:
            # Generate embedding for query
            query_embedding = await self.embedding_service.generate_embedding(query)
            
            # Build filter
            filter_query = {}
            if source_filter:
                filter_query["source"] = source_filter
            if user_id:
                filter_query["user_id"] = user_id
            if tags_filter:
                filter_query["tags"] = {"$in": tags_filter}
            
            # Get all chunks (or filtered chunks)
            # Note: For production, consider using MongoDB Atlas Vector Search or
            # a dedicated vector database for better performance
            cursor = self.knowledge_base_collection.find(filter_query)
            
            # Calculate cosine similarity for each chunk
            similar_chunks = []
            async for doc in cursor:
                if not doc.get("embedding"):
                    continue
                
                chunk_embedding = doc["embedding"]
                similarity = self._cosine_similarity(query_embedding, chunk_embedding)
                
                if similarity >= threshold:
                    similar_chunks.append((similarity, doc))
            
            # Sort by similarity (descending) and take top results
            similar_chunks.sort(key=lambda x: x[0], reverse=True)
            similar_chunks = similar_chunks[:limit]
            
            # Convert to response models
            results = []
            for score, doc in similar_chunks:
                doc["_id"] = str(doc["_id"])
                chunk = KnowledgeChunkInDB(**doc)
                result = KnowledgeChunkResponse(
                    id=chunk.id,
                    content=chunk.content,
                    metadata=chunk.metadata,
                    source=chunk.source,
                    source_id=chunk.source_id,
                    chunk_index=chunk.chunk_index,
                    tags=chunk.tags,
                    score=score,
                    created_at=chunk.created_at,
                    updated_at=chunk.updated_at
                )
                results.append(result)
            
            logger.info(f"Found {len(results)} similar chunks for query")
            return results
            
        except Exception as e:
            logger.error(f"Error searching similar chunks: {e}", exc_info=True)
            raise
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        try:
            vec1_array = np.array(vec1)
            vec2_array = np.array(vec2)
            
            dot_product = np.dot(vec1_array, vec2_array)
            norm1 = np.linalg.norm(vec1_array)
            norm2 = np.linalg.norm(vec2_array)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {e}")
            return 0.0
    
    async def delete_document(self, source_id: str, user_id: Optional[str] = None) -> int:
        """
        Delete all chunks for a document
        
        Args:
            source_id: Source ID of the document
            user_id: Optional user_id filter
            
        Returns:
            Number of chunks deleted
        """
        try:
            filter_query = {"source_id": source_id}
            if user_id:
                filter_query["user_id"] = user_id
            
            result = await self.knowledge_base_collection.delete_many(filter_query)
            logger.info(f"Deleted {result.deleted_count} chunks for document {source_id}")
            return result.deleted_count
            
        except Exception as e:
            logger.error(f"Error deleting document: {e}", exc_info=True)
            raise
    
    async def get_document_chunks(
        self,
        source_id: str,
        user_id: Optional[str] = None
    ) -> List[KnowledgeChunkResponse]:
        """Get all chunks for a document"""
        try:
            filter_query = {"source_id": source_id}
            if user_id:
                filter_query["user_id"] = user_id
            
            cursor = self.knowledge_base_collection.find(filter_query).sort("chunk_index", 1)
            
            chunks = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                chunk = KnowledgeChunkInDB(**doc)
                result = KnowledgeChunkResponse(
                    id=chunk.id,
                    content=chunk.content,
                    metadata=chunk.metadata,
                    source=chunk.source,
                    source_id=chunk.source_id,
                    chunk_index=chunk.chunk_index,
                    tags=chunk.tags,
                    created_at=chunk.created_at,
                    updated_at=chunk.updated_at
                )
                chunks.append(result)
            
            return chunks
            
        except Exception as e:
            logger.error(f"Error getting document chunks: {e}", exc_info=True)
            raise
    
    async def get_knowledge_base_stats(self, user_id: Optional[str] = None) -> Dict:
        """Get statistics about the knowledge base"""
        try:
            filter_query = {}
            if user_id:
                filter_query["user_id"] = user_id
            
            total_chunks = await self.knowledge_base_collection.count_documents(filter_query)
            
            # Get unique sources
            pipeline = [
                {"$match": filter_query} if filter_query else {"$match": {}},
                {"$group": {"_id": "$source_id", "count": {"$sum": 1}}},
                {"$count": "unique_documents"}
            ]
            result = await self.knowledge_base_collection.aggregate(pipeline).to_list(length=1)
            unique_documents = result[0]["unique_documents"] if result else 0
            
            return {
                "total_chunks": total_chunks,
                "unique_documents": unique_documents
            }
            
        except Exception as e:
            logger.error(f"Error getting knowledge base stats: {e}", exc_info=True)
            return {"total_chunks": 0, "unique_documents": 0}

