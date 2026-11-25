from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.category import CategoryResponse


class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200, description="Product title or hardware model")
    slug: Optional[str] = Field(None, max_length=220, description="URL slug (auto-generated from name if omitted)")
    description: str = Field(
        default="Official hardware specifications and details.",
        description="Detailed product description and specifications"
    )
    price: Decimal = Field(..., gt=0, description="Product price in USD (must be > 0)")
    original_price: Optional[Decimal] = Field(None, gt=0, description="Manufacturer MSRP or strike-through price")
    brand: Optional[str] = Field(None, max_length=100, description="Brand or manufacturer name")
    badge: Optional[str] = Field(None, max_length=50, description="Marketing badge (e.g. 'HOT', 'NEW', 'SALE')")
    stock: int = Field(0, ge=0, description="Available inventory count (must be >= 0)")
    image_url: Optional[str] = Field(None, max_length=500, description="Primary product image URL")
    category_id: int = Field(..., gt=0, description="Foreign key reference to Category ID")
    is_active: bool = Field(True, description="Whether product is active and purchasable")
    is_featured: bool = Field(False, description="Whether to feature product on homepage")
    rating: Decimal = Field(Decimal("4.50"), ge=0, le=5, description="Customer review rating (0.0 to 5.0)")
    reviews_count: int = Field(0, ge=0, description="Total verified customer reviews count")
    merchant_id: Optional[int] = Field(None, description="Seller / Merchant user ID")
    store_name: Optional[str] = Field(None, max_length=200, description="Storefront brand name")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Product name cannot be empty or whitespace.")
        return v

    @field_validator("description", mode="before")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> str:
        if v is None or not str(v).strip():
            return "Official hardware specifications and details."
        return str(v).strip()

    @field_validator("stock")
    @classmethod
    def validate_stock(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Invalid stock quantity: stock cannot be negative.")
        return v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    slug: Optional[str] = Field(None, max_length=220)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)
    original_price: Optional[Decimal] = Field(None, gt=0)
    brand: Optional[str] = None
    badge: Optional[str] = None
    stock: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = None
    category_id: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    rating: Optional[Decimal] = Field(None, ge=0, le=5)
    reviews_count: Optional[int] = Field(None, ge=0)
    merchant_id: Optional[int] = None
    store_name: Optional[str] = None

    @field_validator("description", mode="before")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not str(v).strip():
            return "Official hardware specifications and details."
        return str(v).strip()

    @field_validator("stock")
    @classmethod
    def validate_stock(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("Invalid stock quantity: stock cannot be negative.")
        return v


class StockUpdate(BaseModel):
    """
    Schema for dedicated inventory and stock management operations.
    Supports either setting an absolute stock value or applying a delta adjustment.
    """
    stock: Optional[int] = Field(None, ge=0, description="Set absolute stock quantity (must be >= 0)")
    adjustment: Optional[int] = Field(None, description="Delta adjustment: positive to add inventory, negative to deduct")
    stock_delta: Optional[int] = Field(None, description="Alias for adjustment")

    @property
    def effective_adjustment(self) -> Optional[int]:
        return self.adjustment if self.adjustment is not None else self.stock_delta

    @field_validator("stock")
    @classmethod
    def validate_stock(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("Invalid stock quantity: stock cannot be negative.")
        return v


class ProductResponse(ProductBase):
    id: int
    slug: str
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    size: int
    pages: int


class ImageUploadResponse(BaseModel):
    image_url: str
    filename: str
    message: str


class MultipleImageUploadResponse(BaseModel):
    image_urls: List[str]
    filenames: List[str]
    count: int
    message: str
