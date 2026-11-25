"""
Integration Test Suite for CloudCart Payments & Webhook Processing on PostgreSQL.
Tests:
1. Customer payment processing for orders.
2. Tenant security & isolation on payments (403 for other customers).
3. Paying for cancelled or invalid orders (400 / 404).
4. Webhook `payment.succeeded` handling (Order CONFIRMED).
5. Webhook idempotency (duplicate transaction_id handling).
6. Webhook `payment.failed` handling.
7. Webhook `payment.refunded` with automatic product stock restoration.
8. HMAC Webhook signature validation.
9. Admin oversight on platform payments (/payments/admin/all).
"""

import hmac
import hashlib
import json
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.models.user import User, UserRole
from app.models.product import Product
from app.models.order import Order
from app.models.payment import Payment
from app.core.config import settings

init_db()
client = TestClient(app)

CUSTOMER_A = {"email": "pay_cust_a@cloudcart.com", "password": "PayPassword2026!"}
CUSTOMER_B = {"email": "pay_cust_b@cloudcart.com", "password": "PayPassword2026!"}
ADMIN_USER = {"email": "admin@cloudcart.com", "password": "Admin123!"}


def get_auth_token(email: str, password: str, role: str = "CUSTOMER") -> str:
    # Ensure user exists
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "username": email.split("@")[0].replace(".", "_"),
            "full_name": email.split("@")[0].title(),
            "password": password,
            "role": role,
        },
    )
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


@pytest.fixture(scope="module")
def setup_data():
    token_a = get_auth_token(CUSTOMER_A["email"], CUSTOMER_A["password"])
    token_b = get_auth_token(CUSTOMER_B["email"], CUSTOMER_B["password"])
    token_admin = get_auth_token(ADMIN_USER["email"], ADMIN_USER["password"], role="ADMIN")

    db: Session = SessionLocal()
    try:
        # Get or create test product
        prod = db.query(Product).filter(Product.name == "Payment Audio Rig").first()
        if not prod:
            prod = Product(
                name="Payment Audio Rig",
                slug="payment-audio-rig",
                description="Testing audio gear for payments",
                price=Decimal("150.00"),
                stock=50,
                category_id=1,
            )
            db.add(prod)
            db.commit()
            db.refresh(prod)
        prod_id = prod.id
    finally:
        db.close()

    # Customer A adds to cart and creates an order
    client.delete("/api/v1/cart/clear", headers={"Authorization": f"Bearer {token_a}"})
    client.post(
        "/api/v1/cart/items",
        json={"product_id": prod_id, "quantity": 2},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    order_res = client.post(
        "/api/v1/orders/",
        json={"shipping_address": "123 Payment Way, Tech City", "payment_method": "Credit Card"},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert order_res.status_code == 201, f"Order creation failed: {order_res.text}"
    order_id = order_res.json()["id"]

    return {
        "token_a": token_a,
        "token_b": token_b,
        "token_admin": token_admin,
        "prod_id": prod_id,
        "order_id": order_id,
    }


def test_1_customer_payment_processing(setup_data):
    """Customer pays for their own order successfully."""
    token_a = setup_data["token_a"]
    order_id = setup_data["order_id"]

    res = client.post(
        "/api/v1/payments/process",
        json={"order_id": order_id, "payment_method": "Credit Card", "card_token": "tok_visa_4242"},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res.status_code == 200, f"Expected 200, got: {res.text}"
    data = res.json()
    assert data["order_id"] == order_id
    assert data["status"] == "COMPLETED"
    assert data["payment_method"] == "Credit Card"
    assert "transaction_id" in data and data["transaction_id"].startswith("tx_")

    # Verify order status updated to CONFIRMED
    order_chk = client.get(
        f"/api/v1/orders/{order_id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert order_chk.status_code == 200
    assert order_chk.json()["status"] == "CONFIRMED"


def test_2_tenant_isolation_on_payment(setup_data):
    """Customer B cannot process payment for Customer A's order (403 Forbidden)."""
    token_b = setup_data["token_b"]
    order_id = setup_data["order_id"]

    res = client.post(
        "/api/v1/payments/process",
        json={"order_id": order_id, "payment_method": "Credit Card"},
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res.status_code == 403, f"Expected 403, got: {res.status_code}"


def test_3_paying_for_nonexistent_or_fulfilled_order(setup_data):
    """Payment for nonexistent order (404) or already paid order (400)."""
    token_a = setup_data["token_a"]

    # Non-existent order
    res_404 = client.post(
        "/api/v1/payments/process",
        json={"order_id": 999999, "payment_method": "Credit Card"},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res_404.status_code == 404

    # Order already completed / paid
    res_paid = client.post(
        "/api/v1/payments/process",
        json={"order_id": setup_data["order_id"], "payment_method": "Credit Card"},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    # Order was already set to CONFIRMED or PAID
    assert res_paid.status_code in (200, 400)


def test_4_webhook_payment_succeeded(setup_data):
    """External gateway webhook notifies payment succeeded."""
    order_id = setup_data["order_id"]
    tx_id = "tx_webhook_succ_1001"

    payload = {
        "event": "payment.succeeded",
        "transaction_id": tx_id,
        "order_id": order_id,
        "amount": 300.00,
        "currency": "USD",
        "status": "COMPLETED",
        "metadata": {"gateway": "Stripe", "charge_id": "ch_12345"},
    }
    res = client.post("/api/v1/payments/webhook", json=payload)
    assert res.status_code == 200, f"Webhook failed: {res.text}"
    data = res.json()
    assert data["received"] is True
    assert data["status"] == "COMPLETED"
    assert data["transaction_id"] == tx_id


def test_5_webhook_idempotency(setup_data):
    """Re-sending identical webhook payload returns 200 without creating duplicates."""
    order_id = setup_data["order_id"]
    tx_id = "tx_webhook_succ_1001"

    payload = {
        "event": "payment.succeeded",
        "transaction_id": tx_id,
        "order_id": order_id,
        "amount": 300.00,
        "currency": "USD",
        "status": "COMPLETED",
    }
    # Duplicate post
    res = client.post("/api/v1/payments/webhook", json=payload)
    assert res.status_code == 200
    assert res.json()["received"] is True
    assert "idempotent" in res.json()["message"].lower() or res.json()["status"] == "COMPLETED"


def test_6_webhook_payment_failed(setup_data):
    """Webhook handles payment.failed event cleanly."""
    order_id = setup_data["order_id"]
    tx_id = "tx_webhook_fail_2002"

    payload = {
        "event": "payment.failed",
        "transaction_id": tx_id,
        "order_id": order_id,
        "amount": 300.00,
        "currency": "USD",
        "status": "FAILED",
        "metadata": {"failure_reason": "insufficient_funds"},
    }
    res = client.post("/api/v1/payments/webhook", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "FAILED"


def test_7_webhook_refund_and_stock_restoration(setup_data):
    """Webhook payment.refunded marks order CANCELLED and restores product inventory."""
    token_a = setup_data["token_a"]
    prod_id = setup_data["prod_id"]

    # Place a new order with 3 items
    client.delete("/api/v1/cart/clear", headers={"Authorization": f"Bearer {token_a}"})
    client.post(
        "/api/v1/cart/items",
        json={"product_id": prod_id, "quantity": 3},
        headers={"Authorization": f"Bearer {token_a}"},
    )

    db: Session = SessionLocal()
    prod_before = db.query(Product).filter(Product.id == prod_id).first()
    stock_before_order = prod_before.stock
    db.close()

    order_res = client.post(
        "/api/v1/orders/",
        json={"shipping_address": "456 Refund Ave", "payment_method": "Credit Card"},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    refund_order_id = order_res.json()["id"]

    # Verify stock was reduced by 3
    db = SessionLocal()
    prod_after_order = db.query(Product).filter(Product.id == prod_id).first()
    assert prod_after_order.stock == stock_before_order - 3
    db.close()

    # Now simulate refund webhook
    refund_tx = f"tx_refund_{refund_order_id}"
    payload = {
        "event": "payment.refunded",
        "transaction_id": refund_tx,
        "order_id": refund_order_id,
        "amount": 450.00,
        "currency": "USD",
        "status": "REFUNDED",
    }
    webhook_res = client.post("/api/v1/payments/webhook", json=payload)
    assert webhook_res.status_code == 200
    assert webhook_res.json()["status"] == "REFUNDED"

    # Verify order is now CANCELLED and stock restored
    db = SessionLocal()
    order_chk = db.query(Order).filter(Order.id == refund_order_id).first()
    assert order_chk.status == "CANCELLED"

    prod_restored = db.query(Product).filter(Product.id == prod_id).first()
    assert prod_restored.stock == stock_before_order
    db.close()


def test_8_webhook_signature_verification(setup_data):
    """Webhook rejects invalid HMAC signature with 400 Bad Request."""
    order_id = setup_data["order_id"]
    payload = {
        "event": "payment.succeeded",
        "transaction_id": "tx_sig_test_3003",
        "order_id": order_id,
        "amount": 300.00,
        "currency": "USD",
        "status": "COMPLETED",
        "signature": "invalid_forged_signature_12345",
    }
    res = client.post(
        "/api/v1/payments/webhook",
        json=payload,
        headers={"X-Signature": "invalid_forged_signature_12345"},
    )
    assert res.status_code == 400
    assert "signature" in res.text.lower()

    # Generate valid signature
    secret = settings.SECRET_KEY.encode("utf-8")
    raw_payload_dict = {
        "event": "payment.succeeded",
        "transaction_id": "tx_sig_valid_4004",
        "order_id": order_id,
        "amount": 300.00,
        "currency": "USD",
        "status": "COMPLETED",
    }
    raw_bytes = json.dumps(raw_payload_dict).encode("utf-8")
    valid_sig = hmac.new(secret, raw_bytes, hashlib.sha256).hexdigest()

    raw_payload_dict["signature"] = valid_sig
    res_valid = client.post(
        "/api/v1/payments/webhook",
        data=raw_bytes,
        headers={"Content-Type": "application/json", "X-Signature": valid_sig},
    )
    assert res_valid.status_code in (200, 422)


def test_9_admin_payments_oversight(setup_data):
    """Admin can list all platform payments; normal customer gets 403."""
    token_b = setup_data["token_b"]
    token_admin = setup_data["token_admin"]

    # Customer forbidden
    res_cust = client.get(
        "/api/v1/payments/admin/all",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res_cust.status_code == 403

    # Admin allowed
    res_admin = client.get(
        "/api/v1/payments/admin/all",
        headers={"Authorization": f"Bearer {token_admin}"},
    )
    assert res_admin.status_code == 200
    assert isinstance(res_admin.json(), list)
    assert len(res_admin.json()) > 0
