import math
from typing import Generic, List, TypeVar
from pydantic import BaseModel, Field, ConfigDict

T = TypeVar("T")


class PageParams(BaseModel):
    """Reusable query parameters for pagination."""
    page: int = Field(1, ge=1, description="Page number starting from 1")
    size: int = Field(12, ge=1, le=100, description="Number of items per page")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response schema."""
    model_config = ConfigDict(from_attributes=True)

    items: List[T]
    total: int
    page: int
    size: int
    pages: int

    @classmethod
    def create(cls, items: List[T], total: int, page: int, size: int):
        pages = math.ceil(total / size) if size > 0 else 1
        return cls(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages,
        )
