from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ReviewBase(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5, description="Star rating from 1 to 5")
    title: Optional[str] = None
    comment: str


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None


class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    is_verified_purchase: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
