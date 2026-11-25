from typing import Optional
from pydantic import BaseModel


class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None


class PaginationMeta(BaseModel):
    total: int
    page: int
    size: int
    pages: int
