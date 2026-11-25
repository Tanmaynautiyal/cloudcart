from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserUpdate
from app.core.security import get_password_hash


class UserService:
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_multi(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def update(db: Session, user: User, user_in: UserUpdate) -> User:
        update_data = user_in.model_dump(exclude_unset=True)
        if "password" in update_data and update_data["password"]:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        for field, value in update_data.items():
            setattr(user, field, value)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def delete(db: Session, user: User) -> None:
        """
        Safely deletes a user or anonymizes/deactivates if financial order history exists.
        Prevents foreign key constraint violations while preserving order records.
        """
        from app.models.cart import Cart, CartItem
        from app.models.wishlist import Wishlist
        from app.models.address import Address
        from app.models.review import Review
        from app.models.order import Order
        from app.models.product import Product

        # 1. Clear cart
        cart = db.query(Cart).filter(Cart.user_id == user.id).first()
        if cart:
            db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
            db.delete(cart)

        # 2. Clear wishlist, reviews, addresses
        db.query(Wishlist).filter(Wishlist.user_id == user.id).delete()
        db.query(Review).filter(Review.user_id == user.id).delete()
        db.query(Address).filter(Address.user_id == user.id).delete()

        # 3. Check for linked customer orders
        has_orders = db.query(Order).filter(Order.user_id == user.id).count() > 0
        if has_orders:
            user.is_active = False
            user.is_blocked = True
            user.full_name = f"[Deleted User {user.id}]"
            user.phone = None
            db.add(user)
            db.commit()
            return

        # 4. If merchant, deactivate catalog items
        merchant_prods = db.query(Product).filter(Product.merchant_id == user.id).all()
        for p in merchant_prods:
            p.is_active = False
            p.merchant_id = None
            db.add(p)

        db.delete(user)
        db.commit()


user_service = UserService()
