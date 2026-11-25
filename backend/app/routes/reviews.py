from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.review import Review
from app.models.product import Product
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse
from app.schemas.common import MessageResponse
from app.routes.deps import get_current_active_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("/product/{product_id}", response_model=List[ReviewResponse])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    """
    Get customer reviews for a specific product.
    """
    return (
        db.query(Review)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review_in: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Submit a product review and rating.
    """
    product = db.query(Product).filter(Product.id == review_in.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    existing = (
        db.query(Review)
        .filter(
            Review.user_id == current_user.id,
            Review.product_id == review_in.product_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted a review for this product.",
        )

    review = Review(
        user_id=current_user.id,
        is_verified_purchase=True,
        **review_in.model_dump(),
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # Recalculate average rating on product
    avg_rating, count = (
        db.query(func.avg(Review.rating), func.count(Review.id))
        .filter(Review.product_id == product.id)
        .first()
    )
    if avg_rating is not None:
        product.rating = Decimal(str(round(avg_rating, 2)))
        product.reviews_count = count
        db.commit()

    return review


@router.delete("/{review_id}", response_model=MessageResponse)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete a review written by the authenticated user.
    """
    review = (
        db.query(Review)
        .filter(Review.id == review_id, Review.user_id == current_user.id)
        .first()
    )
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found.",
        )
    product_id = review.product_id
    db.delete(review)
    db.commit()

    # Recalculate average rating
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        avg_rating, count = (
            db.query(func.avg(Review.rating), func.count(Review.id))
            .filter(Review.product_id == product.id)
            .first()
        )
        product.rating = Decimal(str(round(avg_rating or 4.5, 2)))
        product.reviews_count = count or 0
        db.commit()

    return MessageResponse(message="Review deleted successfully.")
