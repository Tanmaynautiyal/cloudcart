from typing import List, Optional
from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.routes.deps import get_current_active_user, get_current_admin_user
from app.models.user import User
from app.schemas.payment import (
    PaymentResponse,
    PaymentProcessRequest,
    PaymentWebhookPayload,
    PaymentWebhookResponse,
)
from app.services.payment_service import payment_service

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post(
    "/process",
    response_model=PaymentResponse,
    status_code=status.HTTP_200_OK,
    summary="Process customer payment for an order",
    description="Submits payment for an order, charges simulated gateway, and marks order as CONFIRMED.",
)
def process_payment(
    payment_in: PaymentProcessRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return payment_service.process_customer_payment(
        db=db, user=current_user, payment_req=payment_in
    )


@router.post(
    "/webhook",
    response_model=PaymentWebhookResponse,
    status_code=status.HTTP_200_OK,
    summary="Payment gateway webhook listener",
    description="Receives webhook events (payment.succeeded, payment.failed, payment.refunded) with idempotency and stock handling.",
)
async def payment_webhook(
    request: Request,
    payload: PaymentWebhookPayload,
    db: Session = Depends(get_db),
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
):
    raw_body = await request.body()
    # Check signature if provided in payload or header
    sig = payload.signature or x_signature
    if sig:
        payload.signature = sig
    return payment_service.handle_webhook_event(
        db=db, payload=payload, raw_body=raw_body if sig else None
    )


@router.get(
    "/order/{order_id}",
    response_model=List[PaymentResponse],
    summary="Get payment history for an order",
)
def get_order_payments(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return payment_service.get_order_payments(db=db, order_id=order_id, user=current_user)


@router.get(
    "/admin/all",
    response_model=List[PaymentResponse],
    summary="Super Admin: View all platform payments",
)
def get_all_payments_admin(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    return payment_service.get_all_payments_admin(db=db, skip=skip, limit=limit)
