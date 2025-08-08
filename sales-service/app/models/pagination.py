from pydantic import BaseModel
from typing import Generic, TypeVar, List

T = TypeVar('T')

class PaginationResponse(BaseModel, Generic[T]):
    """Generic pagination response model"""
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int
    
    class Config:
        arbitrary_types_allowed = True
