from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.common import MessageResponse
from app.services.user_service import user_service
from app.routes.deps import get_current_active_user, get_current_admin_user
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=UserResponse)
def read_user_profile(current_user: User = Depends(get_current_active_user)):
    """
    Get current logged in user details.
    """
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_user_profile(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update profile details for the logged-in user.
    """
    return user_service.update(db=db, user=current_user, user_in=user_in)


@router.get("/", response_model=List[UserResponse])
def read_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """
    List all users (Admin only).
    """
    return user_service.get_multi(db=db, skip=skip, limit=limit)


@router.put("/{user_id}", response_model=UserResponse)
def update_user_by_admin(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """
    Update any user details or active status (Admin only).
    """
    user = user_service.get_by_id(db=db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )
    return user_service.update(db=db, user=user, user_in=user_in)


@router.delete("/{user_id}", response_model=MessageResponse)
def delete_user_by_admin(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
):
    """
    Delete a user account (Admin only).
    """
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own active administrator account.",
        )
    user = user_service.get_by_id(db=db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )
    user_service.delete(db=db, user=user)
    return MessageResponse(message=f"User account '{user.email}' processed successfully.")


@router.get("/{user_id}/activity")
def get_user_activity_dashboard(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """
    Get complete customer activity telemetry for Administrator Governance:
    Orders, spending, addresses, cart items, and registered store (if merchant).
    """
    user = user_service.get_by_id(db=db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )

    from app.models.order import Order
    from app.models.address import Address
    from app.models.cart import Cart
    from app.models.product import Product

    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    total_spent = sum(float(o.total_amount or 0) for o in orders)

    addresses = db.query(Address).filter(Address.user_id == user_id).all()

    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    cart_items_count = len(cart.items) if cart and cart.items else 0

    merchant_products_count = (
        db.query(Product).filter((Product.merchant_id == user_id) | (Product.store_name == user.store_name)).count()
        if user.is_merchant or user.is_seller else 0
    )

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.full_name or user.username,
            "username": user.username,
            "phone": user.phone,
            "store_name": user.store_name,
            "role": user.role,
            "is_active": user.is_active,
            "is_blocked": getattr(user, "is_blocked", False),
            "is_admin": user.is_admin,
            "is_seller": user.is_seller,
            "avatar_url": user.avatar_url,
            "created_at": user.created_at,
        },
        "metrics": {
            "total_orders": len(orders),
            "total_spent": total_spent,
            "cart_items_count": cart_items_count,
            "merchant_products_count": merchant_products_count,
        },
        "orders": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "total": float(o.total_amount or 0),
                "status": o.status,
                "created_at": o.created_at,
                "items_count": len(o.items) if o.items else 0,
            }
            for o in orders[:10]
        ],
        "addresses": [
            {
                "id": a.id,
                "full_name": a.full_name,
                "address_line1": a.address_line1,
                "city": a.city,
                "state": a.state,
                "postal_code": a.postal_code,
                "country": a.country,
                "is_default": a.is_default_shipping,
            }
            for a in addresses
        ],
    }
