import random
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.order import Order, OrderItem
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.payment import Payment
from app.schemas.order import OrderCreate, OrderStatus


class OrderService:
    @staticmethod
    def create_order(db: Session, user_id: int, order_in: OrderCreate) -> Order:
        """
        Creates a new customer order from their shopping cart items within an ACID transaction.
        - Validates product availability and live warehouse stock.
        - Locks product inventory rows using pessimistic locking (with_for_update) to prevent overselling.
        - Computes all unit prices, subtotals, taxes, and shipping on the backend (zero trust in client numbers).
        - Safely reduces inventory stock.
        - Clears user's cart on completion.
        """
        cart = db.query(Cart).filter(Cart.user_id == user_id).first()
        if not cart:
            cart = Cart(user_id=user_id)
            db.add(cart)
            db.flush()

        cart_items = (
            db.query(CartItem)
            .options(joinedload(CartItem.product))
            .filter(CartItem.cart_id == cart.id)
            .all()
        )

        # If user's cart in DB is empty, check if items were provided in the order payload
        if not cart_items or len(cart_items) == 0:
            if order_in.items and len(order_in.items) > 0:
                for client_item in order_in.items:
                    p_id = None
                    qty = 1
                    if isinstance(client_item, dict):
                        p_info = client_item.get("product")
                        if isinstance(p_info, dict):
                            p_id = p_info.get("rawId") or p_info.get("id") or p_info.get("slug")
                        if not p_id:
                            p_id = client_item.get("product_id") or client_item.get("productId") or client_item.get("id")
                        qty = client_item.get("quantity", 1)
                    elif hasattr(client_item, "product_id"):
                        p_id = getattr(client_item, "product_id")
                        qty = getattr(client_item, "quantity", 1)

                    prod = None
                    if p_id is not None:
                        try:
                            p_num = int(p_id)
                            prod = db.query(Product).filter(Product.id == p_num).first()
                        except (ValueError, TypeError):
                            p_str = str(p_id)
                            if p_str.startswith("prod-") and p_str[5:].isdigit():
                                prod = db.query(Product).filter(Product.id == int(p_str[5:])).first()
                            else:
                                prod = db.query(Product).filter(Product.slug == p_str).first()

                    if prod:
                        db.add(CartItem(cart_id=cart.id, product_id=prod.id, quantity=max(1, int(qty))))
                db.flush()
                # Re-query cart_items
                cart_items = (
                    db.query(CartItem)
                    .options(joinedload(CartItem.product))
                    .filter(CartItem.cart_id == cart.id)
                    .all()
                )

        if not cart_items or len(cart_items) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your cart is empty. Please add products before placing an order.",
            )

        try:
            subtotal_amount = Decimal("0.00")
            order_items_to_create = []

            # Process and validate each cart item within the transaction
            for item in cart_items:
                # Lock the product row for update to prevent concurrent race condition overselling
                product = (
                    db.query(Product)
                    .filter(Product.id == item.product_id)
                    .with_for_update()
                    .first()
                )

                if not product or not product.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Product '{product.name if product else item.product_id}' is no longer active or available for purchase.",
                    )

                if product.stock < item.quantity:
                    if product.stock > 0:
                        item.quantity = product.stock
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Product '{product.name}' is currently out of stock.",
                        )

                # Authoritative backend pricing
                unit_price = Decimal(str(product.price)).quantize(Decimal("0.01"))
                item_subtotal = (unit_price * item.quantity).quantize(Decimal("0.01"))
                subtotal_amount += item_subtotal

                # Safely reduce inventory stock
                product.stock -= item.quantity

                order_items_to_create.append(
                    OrderItem(
                        product_id=product.id,
                        product_name=product.name,
                        product_sku=f"SKU-{product.slug[:12].upper()}",
                        quantity=item.quantity,
                        unit_price=unit_price,
                        subtotal=item_subtotal,
                    )
                )

            # Backend calculation of tax, shipping, and grand total
            tax_amount = (subtotal_amount * Decimal("0.085")).quantize(Decimal("0.01"))
            shipping_amount = Decimal("0.00") if subtotal_amount >= Decimal("50.00") else Decimal("9.99")
            discount_amount = Decimal("0.00")
            total_amount = subtotal_amount + tax_amount + shipping_amount - discount_amount

            # Generate unique reference identifiers
            order_number = f"ORD-{random.randint(10000, 99999)}"
            tracking_number = f"TRK-{random.randint(1000000, 9999999)}US"

            # Create Order
            order = Order(
                order_number=order_number,
                user_id=user_id,
                subtotal_amount=subtotal_amount,
                tax_amount=tax_amount,
                shipping_amount=shipping_amount,
                discount_amount=discount_amount,
                total_amount=total_amount,
                status=OrderStatus.CONFIRMED.value,
                shipping_address_id=order_in.shipping_address_id,
                shipping_address_text=order_in.shipping_address,
                payment_method=order_in.payment_method or "Credit Card",
                tracking_number=tracking_number,
                items=order_items_to_create,
            )
            db.add(order)
            db.flush()

            # Record simulated Payment transaction
            payment = Payment(
                order_id=order.id,
                user_id=user_id,
                payment_method=order.payment_method,
                transaction_id=f"TXN-{random.randint(10000000, 99999999)}",
                amount=total_amount,
                currency="USD",
                status="COMPLETED",
                payment_gateway="CloudCart Direct Payment Gateway",
            )
            db.add(payment)

            # Clear cart items after successful order creation
            db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()

            # Commit the atomic transaction
            db.commit()
            db.refresh(order)
            return order

        except HTTPException:
            db.rollback()
            raise
        except Exception as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An unexpected error occurred while placing your order: {str(exc)}",
            )

    @staticmethod
    def get_user_orders(db: Session, user_id: int) -> List[Order]:
        """
        Retrieves all past orders strictly for the authenticated customer.
        Prevents customers from viewing other users' order history.
        """
        return (
            db.query(Order)
            .options(
                joinedload(Order.items).joinedload(OrderItem.product),
                joinedload(Order.user),
            )
            .filter(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .all()
        )

    @staticmethod
    def get_order_by_id(db: Session, order_id: int, user_id: Optional[int] = None) -> Optional[Order]:
        """
        Retrieves an individual order.
        If user_id is provided, guarantees the order belongs to that customer.
        If user_id is None (admin access), allows viewing any order.
        """
        query = db.query(Order).options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.user),
        )
        if user_id is not None:
            query = query.filter(Order.id == order_id, Order.user_id == user_id)
        else:
            query = query.filter(Order.id == order_id)
        return query.first()

    @staticmethod
    def get_all_orders(
        db: Session, skip: int = 0, limit: int = 50, status_filter: Optional[str] = None
    ) -> Tuple[List[Order], int]:
        """
        Retrieves all orders across all customers (Admin only), with optional status filtering.
        """
        query = db.query(Order).options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.user),
        )
        if status_filter and status_filter.lower() != "all":
            query = query.filter(Order.status.ilike(status_filter.strip()))
        total = query.count()
        orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
        return orders, total

    @staticmethod
    def update_order_status(db: Session, order_id: int, new_status: OrderStatus) -> Order:
        """
        Updates fulfillment status for an order (Admin only).
        If an order is CANCELLED, restores inventory stock to warehouse catalog.
        """
        order = (
            db.query(Order)
            .options(joinedload(Order.items).joinedload(OrderItem.product))
            .filter(Order.id == order_id)
            .first()
        )
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with ID {order_id} not found.",
            )

        status_value = new_status.value if hasattr(new_status, "value") else str(new_status).upper()

        # If transitioning to CANCELLED from a non-cancelled status, restore stock
        if status_value == OrderStatus.CANCELLED.value and order.status != OrderStatus.CANCELLED.value:
            for item in order.items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product.stock += item.quantity

        order.status = status_value
        db.commit()
        db.refresh(order)
        return order


order_service = OrderService()
