from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId


class KnowledgeChunkBase(BaseModel):
    """Base model for knowledge base chunks"""
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    source: Optional[str] = None  # Source of the document (e.g., "erp_manual", "sales_data", "user_upload")
    source_id: Optional[str] = None  # ID in the source system
    chunk_index: int = 0  # Index of chunk in document
    tags: List[str] = Field(default_factory=list)
    user_id: Optional[str] = None  # User who uploaded/created this chunk


class KnowledgeChunkCreate(KnowledgeChunkBase):
    """Model for creating a knowledge chunk"""
    pass


class KnowledgeChunkInDB(KnowledgeChunkBase):
    """Model for knowledge chunk in database"""
    id: str = Field(alias="_id")
    embedding: Optional[List[float]] = None  # Vector embedding
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class KnowledgeChunkResponse(BaseModel):
    """Response model for knowledge chunks"""
    id: str
    content: str
    metadata: Dict[str, Any]
    source: Optional[str]
    source_id: Optional[str]
    chunk_index: int
    tags: List[str]
    score: Optional[float] = None  # Similarity score from search
    created_at: datetime
    updated_at: datetime


class DocumentIngestRequest(BaseModel):
    """Request model for ingesting documents"""
    content: str
    source: str = "user_upload"
    source_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    chunk_size: int = 1000  # Characters per chunk
    chunk_overlap: int = 200  # Overlap between chunks


class DocumentIngestResponse(BaseModel):
    """Response model for document ingestion"""
    document_id: str
    chunks_created: int
    message: str

