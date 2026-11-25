from decimal import Decimal
from typing import Dict, Any
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.cart import Cart, CartItem
from app.models.product import Product


class CartService:
    @staticmethod
    def get_or_create_cart(db: Session, user_id: int) -> Cart:
        """
        Retrieves the authenticated user's cart or creates one if it does not exist.
        Ensures strict multi-tenant isolation by scoping to user_id.
        """
        cart = (
            db.query(Cart)
            .options(joinedload(Cart.items).joinedload(CartItem.product))
            .filter(Cart.user_id == user_id)
            .first()
        )
        if not cart:
            cart = Cart(user_id=user_id)
            db.add(cart)
            db.commit()
            db.refresh(cart)
        return cart

    @staticmethod
    def format_cart_response(cart: Cart) -> Dict[str, Any]:
        """
        Calculates item subtotals, overall cart subtotal, and total amount on the backend.
        Never relies on client-provided prices or sums.
        """
        formatted_items = []
        subtotal_sum = Decimal("0.00")
        total_items = 0

        for item in cart.items:
            unit_price = Decimal(str(item.product.price)) if item.product else Decimal("0.00")
            item_subtotal = (unit_price * item.quantity).quantize(Decimal("0.01"))
            subtotal_sum += item_subtotal
            total_items += item.quantity
            formatted_items.append(
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "unit_price": unit_price.quantize(Decimal("0.01")),
                    "subtotal": item_subtotal,
                    "product": item.product,
                }
            )

        calculated_total = subtotal_sum.quantize(Decimal("0.01"))
        return {
            "id": cart.id,
            "user_id": cart.user_id,
            "items": formatted_items,
            "subtotal": calculated_total,
            "total_amount": calculated_total,
            "total": calculated_total,
            "total_items": total_items,
        }

    @classmethod
    def get_user_cart(cls, db: Session, user_id: int) -> Dict[str, Any]:
        """Returns the formatted cart for the authenticated user."""
        cart = cls.get_or_create_cart(db, user_id)
        return cls.format_cart_response(cart)

    @classmethod
    def add_item(
        cls, db: Session, user_id: int, product_id: int, quantity: int = 1
    ) -> Dict[str, Any]:
        """
        Adds a product to the user's cart after verifying product availability and inventory.
        """
        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be at least 1 unit.",
            )

        cart = cls.get_or_create_cart(db, user_id)

        # Validate product existence and active status
        product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found or is currently inactive.",
            )

        # Validate stock availability
        if product.stock < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory for '{product.name}'. Only {product.stock} units remaining in stock.",
            )

        # Check if item already exists in this user's cart
        cart_item = (
            db.query(CartItem)
            .filter(CartItem.cart_id == cart.id, CartItem.product_id == product_id)
            .first()
        )

        if cart_item:
            new_qty = cart_item.quantity + quantity
            if product.stock < new_qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot add {quantity} more unit(s). Total requested ({new_qty}) exceeds warehouse stock ({product.stock}).",
                )
            cart_item.quantity = new_qty
        else:
            cart_item = CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity)
            db.add(cart_item)

        db.commit()
        db.refresh(cart)
        return cls.format_cart_response(cart)

    @classmethod
    def update_item_quantity(
        cls, db: Session, user_id: int, item_id: int, quantity: int
    ) -> Dict[str, Any]:
        """
        Updates the quantity of an item in the user's cart.
        Ensures the item belongs strictly to this user's cart.
        If quantity <= 0, the item is removed.
        """
        cart = cls.get_or_create_cart(db, user_id)
        cart_item = (
            db.query(CartItem)
            .filter(CartItem.cart_id == cart.id)
            .filter((CartItem.id == item_id) | (CartItem.product_id == item_id))
            .first()
        )

        if not cart_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cart item with ID {item_id} not found in your cart.",
            )

        if quantity <= 0:
            db.delete(cart_item)
        else:
            product = db.query(Product).filter(Product.id == cart_item.product_id).first()
            if product and product.stock < quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Requested quantity ({quantity}) exceeds available stock ({product.stock}).",
                )
            cart_item.quantity = quantity

        db.commit()
        db.refresh(cart)
        return cls.format_cart_response(cart)

    @classmethod
    def remove_item(cls, db: Session, user_id: int, item_id: int) -> Dict[str, Any]:
        """
        Removes an individual item from the user's cart.
        Validates ownership so users cannot delete items from other users' carts.
        """
        cart = cls.get_or_create_cart(db, user_id)
        cart_item = (
            db.query(CartItem)
            .filter(CartItem.cart_id == cart.id)
            .filter((CartItem.id == item_id) | (CartItem.product_id == item_id))
            .first()
        )
        if not cart_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cart item with ID {item_id} not found in your cart.",
            )

        db.delete(cart_item)
        db.commit()
        db.refresh(cart)
        return cls.format_cart_response(cart)

    @classmethod
    def clear_cart(cls, db: Session, user_id: int) -> Dict[str, Any]:
        """
        Removes all items from the user's cart.
        """
        cart = cls.get_or_create_cart(db, user_id)
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        db.commit()
        db.refresh(cart)
        return cls.format_cart_response(cart)


cart_service = CartService()
