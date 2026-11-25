from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Category name (unique)")
    slug: Optional[str] = Field(None, max_length=120, description="URL-friendly slug (auto-generated if omitted)")
    description: Optional[str] = Field(None, description="Category details and department overview")
    image_url: Optional[str] = Field(None, max_length=500, description="Cover image or icon URL")
    is_active: bool = Field(True, description="Whether the category is active and visible to customers")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Category name cannot be empty or whitespace.")
        return v


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    slug: Optional[str] = Field(None, max_length=120)
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Category name cannot be empty.")
            return v
        return v


class CategoryResponse(CategoryBase):
    id: int
    slug: str
    product_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
