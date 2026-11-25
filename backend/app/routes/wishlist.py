from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.wishlist import Wishlist
from app.models.product import Product
from app.models.user import User
from app.schemas.wishlist import WishlistCreate, WishlistResponse
from app.schemas.common import MessageResponse
from app.routes.deps import get_current_active_user

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


@router.get("/", response_model=List[WishlistResponse])
def get_user_wishlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get all saved wishlist items for the authenticated user.
    """
    return (
        db.query(Wishlist)
        .options(joinedload(Wishlist.product))
        .filter(Wishlist.user_id == current_user.id)
        .order_by(Wishlist.created_at.desc())
        .all()
    )


@router.post("/", response_model=WishlistResponse, status_code=status.HTTP_201_CREATED)
def add_to_wishlist(
    wishlist_in: WishlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Add a product to the authenticated user's wishlist.
    """
    product = (
        db.query(Product)
        .filter(Product.id == wishlist_in.product_id, Product.is_active == True)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or inactive.",
        )

    existing = (
        db.query(Wishlist)
        .options(joinedload(Wishlist.product))
        .filter(
            Wishlist.user_id == current_user.id,
            Wishlist.product_id == wishlist_in.product_id,
        )
        .first()
    )
    if existing:
        return existing

    item = Wishlist(user_id=current_user.id, product_id=wishlist_in.product_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    item.product = product
    return item


@router.delete("/{product_id}", response_model=MessageResponse)
def remove_from_wishlist(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Remove a product from the user's wishlist.
    """
    item = (
        db.query(Wishlist)
        .filter(
            Wishlist.user_id == current_user.id,
            Wishlist.product_id == product_id,
        )
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found in your wishlist.",
        )
    db.delete(item)
    db.commit()
    return MessageResponse(message="Product removed from wishlist.")
