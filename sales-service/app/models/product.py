from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from decimal import Decimal


class ProductStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DISCONTINUED = "discontinued"
    OUT_OF_STOCK = "out_of_stock"


class ProductType(str, Enum):
    PRODUCT = "product"
    SERVICE = "service"
    BUNDLE = "bundle"


class UnitOfMeasure(str, Enum):
    PIECE = "piece"
    KG = "kg"
    GRAM = "gram"
    LITER = "liter"
    METER = "meter"
    HOUR = "hour"
    BOX = "box"
    PACK = "pack"


# Product Models
class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    sku: str = Field(..., min_length=1, max_length=50)
    category: str
    product_type: ProductType = ProductType.PRODUCT
    unit_of_measure: UnitOfMeasure = UnitOfMeasure.PIECE
    unit_price: float = Field(..., gt=0)
    cost_price: Optional[float] = Field(None, ge=0)
    weight: Optional[float] = Field(None, ge=0)
    dimensions: Optional[Dict[str, float]] = None  # {"length": 0, "width": 0, "height": 0}
    tax_rate: Optional[float] = Field(None, ge=0, le=1)
    min_stock_level: Optional[int] = Field(None, ge=0)
    max_stock_level: Optional[int] = Field(None, ge=0)
    reorder_point: Optional[int] = Field(None, ge=0)
    warranty_period: Optional[int] = Field(None, ge=0)  # in days
    manufacturer: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    tags: List[str] = []
    images: List[str] = []  # URLs to product images
    specifications: Optional[Dict[str, Any]] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = None
    product_type: Optional[ProductType] = None
    unit_of_measure: Optional[UnitOfMeasure] = None
    unit_price: Optional[float] = Field(None, gt=0)
    cost_price: Optional[float] = Field(None, ge=0)
    weight: Optional[float] = Field(None, ge=0)
    dimensions: Optional[Dict[str, float]] = None
    tax_rate: Optional[float] = Field(None, ge=0, le=1)
    min_stock_level: Optional[int] = Field(None, ge=0)
    max_stock_level: Optional[int] = Field(None, ge=0)
    reorder_point: Optional[int] = Field(None, ge=0)
    warranty_period: Optional[int] = Field(None, ge=0)
    manufacturer: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    tags: Optional[List[str]] = None
    images: Optional[List[str]] = None
    specifications: Optional[Dict[str, Any]] = None
    status: Optional[ProductStatus] = None


class ProductResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    description: Optional[str] = None
    sku: str
    category: str
    product_type: ProductType
    unit_of_measure: UnitOfMeasure
    unit_price: float
    cost_price: Optional[float] = None
    weight: Optional[float] = None
    dimensions: Optional[Dict[str, float]] = None
    tax_rate: Optional[float] = None
    current_stock: int = 0
    min_stock_level: Optional[int] = None
    max_stock_level: Optional[int] = None
    reorder_point: Optional[int] = None
    warranty_period: Optional[int] = None
    manufacturer: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    tags: List[str] = []
    images: List[str] = []
    specifications: Optional[Dict[str, Any]] = None
    status: ProductStatus
    total_sold: int = 0
    total_revenue: float = 0.0
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class ProductInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    description: Optional[str] = None
    sku: str
    category: str
    product_type: ProductType
    unit_of_measure: UnitOfMeasure
    unit_price: float
    cost_price: Optional[float] = None
    weight: Optional[float] = None
    dimensions: Optional[Dict[str, float]] = None
    tax_rate: Optional[float] = None
    current_stock: int = 0
    min_stock_level: Optional[int] = None
    max_stock_level: Optional[int] = None
    reorder_point: Optional[int] = None
    warranty_period: Optional[int] = None
    manufacturer: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    tags: List[str] = []
    images: List[str] = []
    specifications: Optional[Dict[str, Any]] = None
    status: ProductStatus = ProductStatus.ACTIVE
    total_sold: int = 0
    total_revenue: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
