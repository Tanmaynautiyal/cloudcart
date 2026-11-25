from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.order import OrderResponse, OrderCreate, OrderStatusUpdate
from app.services.order_service import order_service
from app.routes.deps import get_current_active_user, get_current_admin_user, get_current_merchant_user
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.product import Product

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Checkout cart and place an order",
    description=(
        "Converts the authenticated customer's current shopping cart into a placed order. "
        "Validates product availability and live stock. "
        "Calculates all prices, subtotals, taxes, and shipping authoritatively on the backend. "
        "Deducts warehouse inventory inside an ACID transaction and clears the cart."
    ),
)
def checkout_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Checkout current customer shopping cart into an order."""
    return order_service.create_order(
        db=db, user_id=current_user.id, order_in=order_in
    )


@router.get(
    "/",
    response_model=List[OrderResponse],
    summary="View customer order history",
    description=(
        "Retrieves past order history for the authenticated customer. "
        "Customers can strictly access only their own orders."
    ),
)
def get_user_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve order history for authenticated customer."""
    return order_service.get_user_orders(db=db, user_id=current_user.id)


@router.get(
    "/merchant/my-orders",
    response_model=List[OrderResponse],
    summary="View orders containing merchant products",
    description="Returns all platform customer orders that include items supplied by the authenticated seller.",
)
def get_merchant_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_merchant_user),
):
    """Retrieve orders containing products belonging to the merchant."""
    if current_user.is_administrator:
        orders, _ = order_service.get_all_orders(db=db, skip=0, limit=100)
        return orders

    # Get distinct orders where at least one item belongs to current merchant
    store_condition = (Product.merchant_id == current_user.id)
    if current_user.store_name:
        store_condition = store_condition | (Product.store_name == current_user.store_name)

    orders = (
        db.query(Order)
        .join(OrderItem, Order.id == OrderItem.order_id)
        .join(Product, OrderItem.product_id == Product.id)
        .filter(store_condition)
        .distinct()
        .order_by(Order.created_at.desc())
        .all()
    )
    return orders


@router.get(
    "/admin/all",
    response_model=List[OrderResponse],
    summary="View all store orders (Admin only)",
    description=(
        "Restricted to administrators. Retrieves orders across all store customers, "
        "with optional status filtering (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED) "
        "and pagination."
    ),
)
def get_all_orders_admin(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=500, description="Items per page"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """List all store orders across all users (Admin only)."""
    skip = (page - 1) * size
    orders, _ = order_service.get_all_orders(
        db=db, skip=skip, limit=size, status_filter=status_filter
    )
    return orders


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="View individual order details",
    description=(
        "Retrieves detailed line items and pricing for a specific order. "
        "Customers can only access their own orders (returns 404 for orders belonging to others). "
        "Admins can inspect any order across the platform."
    ),
)
def get_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve individual order details."""
    user_id = None if (current_user.is_admin or current_user.role == "ADMIN") else current_user.id
    order = order_service.get_order_by_id(db=db, order_id=order_id, user_id=user_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found.",
        )
    return order


@router.put(
    "/{order_id}/status",
    response_model=OrderResponse,
    summary="Update order fulfillment status (Admin and Merchant)",
    description=(
        "Restricted to administrators and merchants. Updates the status of an order. "
        "Valid statuses: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED. "
        "Cancelling an order automatically restores inventory stock to the warehouse catalog."
    ),
)
@router.patch(
    "/{order_id}/status",
    response_model=OrderResponse,
    include_in_schema=False,
)
def update_order_status(
    order_id: int,
    status_in: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_merchant_user),
):
    """Update order status (Admin and Merchant)."""
    return order_service.update_order_status(
        db=db, order_id=order_id, new_status=status_in.status
    )


class OrderTrackingUpdate(BaseModel):
    tracking_number: str


@router.patch(
    "/{order_id}/tracking",
    response_model=OrderResponse,
    summary="Update courier tracking number (Admin and Merchant)",
)
def update_order_tracking(
    order_id: int,
    tracking_in: OrderTrackingUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_merchant_user),
):
    """Update order logistics tracking number."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found.",
        )
    order.tracking_number = tracking_in.tracking_number
    db.commit()
    db.refresh(order)
    return order
