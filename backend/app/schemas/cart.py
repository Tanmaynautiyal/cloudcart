from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.product import ProductResponse


class CartItemBase(BaseModel):
    product_id: int = Field(..., gt=0, description="Product ID to add to cart")
    quantity: int = Field(1, ge=1, description="Quantity to add (must be >= 1)")


class CartItemCreate(CartItemBase):
    pass


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0, description="New quantity (0 or negative removes item from cart)")


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal = Decimal("0.00")
    subtotal: Decimal = Decimal("0.00")
    product: Optional[ProductResponse] = None

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    id: int
    user_id: int
    items: List[CartItemResponse] = []
    subtotal: Decimal = Decimal("0.00")
    total_amount: Decimal = Decimal("0.00")
    total: Decimal = Decimal("0.00")
    total_items: int = 0

    model_config = ConfigDict(from_attributes=True)
