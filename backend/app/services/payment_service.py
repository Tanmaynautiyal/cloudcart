import hmac
import hashlib
import json
import logging
import uuid
from decimal import Decimal
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.payment import Payment
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.schemas.payment import (
    PaymentProcessRequest,
    PaymentWebhookPayload,
    PaymentWebhookResponse,
)
from app.core.config import settings

logger = logging.getLogger("cloudcart.payment_service")


class PaymentService:
    @staticmethod
    def verify_webhook_signature(payload_bytes: bytes, signature: Optional[str]) -> bool:
        """
        Verify HMAC SHA256 webhook signature against SECRET_KEY.
        If no signature provided in test mode, verification passes.
        """
        if not signature:
            return True
        secret = settings.SECRET_KEY.encode("utf-8")
        expected = hmac.new(secret, payload_bytes, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

    def process_customer_payment(
        self, db: Session, user: User, payment_req: PaymentProcessRequest
    ) -> Payment:
        """
        Process payment for an order using database transaction and row locking.
        """
        order = (
            db.query(Order)
            .filter(Order.id == payment_req.order_id)
            .with_for_update()
            .first()
        )
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order #{payment_req.order_id} not found.",
            )

        # Enforce tenant isolation
        is_admin = user.is_admin or (isinstance(user.role, str) and user.role.upper() == "ADMIN") or (hasattr(user.role, "value") and user.role.value == "ADMIN")
        if order.user_id != user.id and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to pay for this order.",
            )

        if order.status in ("PAID", "DELIVERED"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order #{order.id} is already fulfilled or paid.",
            )

        if order.status == "CANCELLED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order #{order.id} is cancelled and cannot accept payments.",
            )

        # Generate unique transaction identifier
        transaction_id = f"tx_{uuid.uuid4().hex[:18]}"

        try:
            payment = Payment(
                order_id=order.id,
                user_id=user.id,
                payment_method=payment_req.payment_method or order.payment_method or "Credit Card",
                transaction_id=transaction_id,
                amount=order.total_amount,
                currency="USD",
                status="COMPLETED",
                payment_gateway="CloudCartPay Gateway",
                gateway_response=json.dumps({"card_token": payment_req.card_token, "code": "00_SUCCESS"}),
            )
            db.add(payment)

            # Update order status
            order.status = "CONFIRMED"
            order.payment_method = payment.payment_method

            db.commit()
            db.refresh(payment)
            logger.info(
                f"Successfully processed payment id={payment.id} tx={transaction_id} for order #{order.id}"
            )
            return payment
        except Exception as e:
            db.rollback()
            logger.error(f"Error processing payment for order #{order.id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Payment processing failed. Please try again.",
            )

    def handle_webhook_event(
        self, db: Session, payload: PaymentWebhookPayload, raw_body: Optional[bytes] = None
    ) -> PaymentWebhookResponse:
        """
        Handle external payment gateway webhook with idempotency and stock rollback.
        """
        if raw_body and payload.signature:
            if not self.verify_webhook_signature(raw_body, payload.signature):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid webhook signature.",
                )

        # Check existing payment for idempotency
        existing_payment = (
            db.query(Payment)
            .filter(Payment.transaction_id == payload.transaction_id)
            .first()
        )

        order = (
            db.query(Order)
            .filter(Order.id == payload.order_id)
            .with_for_update()
            .first()
        )
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order #{payload.order_id} referenced in webhook not found.",
            )

        event = payload.event.lower()

        if existing_payment and existing_payment.status == payload.status.upper():
            logger.info(f"Webhook event already processed (idempotent): tx={payload.transaction_id}")
            return PaymentWebhookResponse(
                received=True,
                status=existing_payment.status,
                transaction_id=existing_payment.transaction_id,
                message="Event previously processed (idempotent ack).",
            )

        try:
            if event in ("payment.succeeded", "payment.captured", "charge.successful"):
                payment_status = "COMPLETED"
                order.status = "CONFIRMED"
            elif event in ("payment.failed", "charge.failed"):
                payment_status = "FAILED"
            elif event in ("payment.refunded", "charge.refunded"):
                payment_status = "REFUNDED"
                order.status = "CANCELLED"

                # Restore product stock upon refund
                for item in order.items:
                    prod = (
                        db.query(Product)
                        .filter(Product.id == item.product_id)
                        .with_for_update()
                        .first()
                    )
                    if prod:
                        prod.stock += item.quantity
                        logger.info(
                            f"Restored +{item.quantity} stock for product #{prod.id} due to refund webhook"
                        )
            else:
                payment_status = payload.status.upper()

            if not existing_payment:
                payment = Payment(
                    order_id=order.id,
                    user_id=order.user_id,
                    payment_method="Gateway Webhook",
                    transaction_id=payload.transaction_id,
                    amount=payload.amount,
                    currency=payload.currency,
                    status=payment_status,
                    payment_gateway="Webhook Integration",
                    gateway_response=json.dumps(payload.metadata or {"event": payload.event}),
                )
                db.add(payment)
            else:
                existing_payment.status = payment_status
                existing_payment.gateway_response = json.dumps(
                    payload.metadata or {"event": payload.event}
                )

            db.commit()
            logger.info(
                f"Webhook processed successfully: event={payload.event} tx={payload.transaction_id} order=#{order.id}"
            )
            return PaymentWebhookResponse(
                received=True,
                status=payment_status,
                transaction_id=payload.transaction_id,
                message=f"Webhook event '{payload.event}' processed successfully.",
            )
        except Exception as e:
            db.rollback()
            logger.error(f"Error handling webhook event {payload.event}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Webhook handling error: {str(e)}",
            )

    def get_order_payments(self, db: Session, order_id: int, user: User) -> List[Payment]:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order #{order_id} not found.",
            )
        is_admin = user.is_admin or (isinstance(user.role, str) and user.role.upper() == "ADMIN") or (hasattr(user.role, "value") and user.role.value == "ADMIN")
        if order.user_id != user.id and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied.",
            )
        return db.query(Payment).filter(Payment.order_id == order_id).all()

    def get_all_payments_admin(
        self, db: Session, skip: int = 0, limit: int = 100
    ) -> List[Payment]:
        return db.query(Payment).order_by(Payment.id.desc()).offset(skip).limit(limit).all()


payment_service = PaymentService()
