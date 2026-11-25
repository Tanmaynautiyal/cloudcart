from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.cart import (
    CartResponse,
    CartItemCreate,
    CartItemUpdate,
)
from app.services.cart_service import cart_service
from app.routes.deps import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])


@router.get("/", response_model=CartResponse)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get the authenticated user's active shopping cart.
    """
    return cart_service.get_user_cart(db=db, user_id=current_user.id)


@router.post("/items", response_model=CartResponse)
def add_to_cart(
    item_in: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Add a product item to the user's shopping cart.
    """
    return cart_service.add_item(
        db=db,
        user_id=current_user.id,
        product_id=item_in.product_id,
        quantity=item_in.quantity,
    )


@router.put("/items/{item_id}", response_model=CartResponse)
def update_cart_item(
    item_id: int,
    item_in: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update quantity of a specific cart item.
    """
    return cart_service.update_item_quantity(
        db=db,
        user_id=current_user.id,
        item_id=item_id,
        quantity=item_in.quantity,
    )


@router.delete("/items/{item_id}", response_model=CartResponse)
def remove_from_cart(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Remove an item from the user's shopping cart.
    """
    return cart_service.remove_item(
        db=db,
        user_id=current_user.id,
        item_id=item_id,
    )


@router.delete("/clear", response_model=CartResponse)
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Clear all items from the shopping cart.
    """
    return cart_service.clear_cart(db=db, user_id=current_user.id)
