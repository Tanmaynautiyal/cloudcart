import enum
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict, Field, AliasChoices
from app.schemas.product import ProductResponse
from app.schemas.user import UserResponse


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PROCESSING = "PROCESSING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class OrderCreate(BaseModel):
    shipping_address: str = Field(
        ...,
        min_length=3,
        description="Full delivery address (street, city, state, postal code)",
        validation_alias=AliasChoices("shipping_address", "shippingAddress", "address"),
    )
    shipping_address_id: Optional[int] = Field(
        None,
        description="Optional Address book ID",
        validation_alias=AliasChoices("shipping_address_id", "shippingAddressId"),
    )
    payment_method: Optional[str] = Field(
        "Credit Card",
        description="Selected payment method",
        validation_alias=AliasChoices("payment_method", "paymentMethod"),
    )
    items: Optional[List[Any]] = Field(None, description="Client cart items if direct checkout")
    total: Optional[Decimal] = None
    customer_name: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("customer_name", "customerName"),
    )
    customer: Optional[Any] = None

    model_config = ConfigDict(populate_by_name=True)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus = Field(
        ...,
        description="Fulfillment status: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED",
    )


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: Optional[str] = None
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    product: Optional[ProductResponse] = None

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int
    order_number: str
    user_id: int
    subtotal_amount: Decimal
    tax_amount: Decimal
    shipping_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    status: str
    shipping_address_text: str
    shipping_address: Optional[str] = None
    tracking_number: Optional[str] = None
    payment_method: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    page: int
    size: int
    pages: int
