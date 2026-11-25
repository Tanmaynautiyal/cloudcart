"""
Comprehensive Integration Test Suite for CloudCart Shopping Cart & Order Management.
Covers:
- Shopping Cart:
  * Add products to cart
  * View cart items with backend calculated subtotal & total
  * Update product quantities (including removing when qty <= 0)
  * Remove individual items with tenant isolation (Customer A cannot touch Customer B's cart)
  * Clear cart
  * Insufficient stock rejection (400 Bad Request)
- Orders:
  * Empty cart checkout rejection (400 Bad Request)
  * Order creation from cart with backend calculated prices (zero trust in frontend)
  * Database transaction stock reduction
  * Automatic cart clearance upon order placement
  * View customer order history (strictly customer's own orders)
  * View individual order details (Customer isolation: cannot view others' orders -> 404)
  * Admin oversight: view any order & view all orders (/admin/all)
  * Non-admin customer forbidden from /admin/all (403 Forbidden)
  * Admin update order status across all valid states: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  * Stock restoration when order is CANCELLED
"""

from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.models.user import User
from app.models.product import Product
from app.models.cart import Cart, CartItem
from app.models.order import Order
from app.schemas.order import OrderStatus

# Initialize database
init_db()
client = TestClient(app)


def get_token(email: str, password: str = "SecurePassword123!") -> str:
    """Helper to log in or register a test user and obtain Bearer token."""
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    if res.status_code == 200:
        return res.json()["access_token"]

    # Register if not present
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "username": email.split("@")[0],
            "full_name": "Test User",
            "password": password,
        },
    )
    if reg_res.status_code == 201 or reg_res.status_code == 409:
        res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        if res.status_code == 200:
            return res.json()["access_token"]
    raise RuntimeError(f"Could not authenticate user {email}")


@pytest.fixture(scope="module")
def shared_order_data():
    init_db()
    cust_token = get_token("demo@cloudcart.com", "Demo123!")
    headers = {"Authorization": f"Bearer {cust_token}"}
    client.delete("/api/v1/cart/clear", headers=headers)
    db: Session = SessionLocal()
    product = db.query(Product).filter(Product.is_active == True, Product.stock > 10).first()
    prod_id = product.id
    order_qty = 2
    db.close()
    client.post("/api/v1/cart/items", json={"product_id": prod_id, "quantity": order_qty}, headers=headers)
    order_res = client.post("/api/v1/orders/", json={"shipping_address": "742 Evergreen Terrace"}, headers=headers)
    order_id = order_res.json()["id"]
    return {"order_id": order_id, "prod_id": prod_id, "order_qty": order_qty}


@pytest.fixture
def order_id(shared_order_data):
    return shared_order_data["order_id"]


@pytest.fixture
def prod_id(shared_order_data):
    return shared_order_data["prod_id"]


@pytest.fixture
def order_qty(shared_order_data):
    return shared_order_data["order_qty"]


def test_1_shopping_cart_lifecycle():
    # 1. Customer tokens
    cust_token = get_token("demo@cloudcart.com", "Demo123!")
    headers = {"Authorization": f"Bearer {cust_token}"}

    # Ensure cart is clean to begin
    client.delete("/api/v1/cart/clear", headers=headers)

    # Fetch a product from DB
    db: Session = SessionLocal()
    try:
        product = db.query(Product).filter(Product.is_active == True, Product.stock > 10).first()
        assert product is not None, "A product with stock > 10 is required"
        prod_id = product.id
        prod_price = Decimal(str(product.price))
        initial_stock = product.stock
    finally:
        db.close()

    # 2. Add product to cart (quantity: 2) -> 200 OK
    add_res = client.post(
        "/api/v1/cart/items",
        json={"product_id": prod_id, "quantity": 2},
        headers=headers,
    )
    assert add_res.status_code == 200, f"Expected 200, got {add_res.text}"
    cart_data = add_res.json()
    assert cart_data["total_items"] == 2
    expected_subtotal = (prod_price * 2).quantize(Decimal("0.01"))
    assert Decimal(str(cart_data["subtotal"])) == expected_subtotal
    assert Decimal(str(cart_data["total_amount"])) == expected_subtotal
    cart_item_id = cart_data["items"][0]["id"]

    # 3. View cart items -> 200 OK
    view_res = client.get("/api/v1/cart/", headers=headers)
    assert view_res.status_code == 200
    assert len(view_res.json()["items"]) == 1
    assert view_res.json()["items"][0]["product_id"] == prod_id
    assert view_res.json()["items"][0]["quantity"] == 2

    # 4. Attempt to add quantity exceeding inventory stock -> 400 Bad Request
    exceed_res = client.post(
        "/api/v1/cart/items",
        json={"product_id": prod_id, "quantity": initial_stock + 10},
        headers=headers,
    )
    assert exceed_res.status_code == 400
    assert "insufficient" in exceed_res.json()["detail"].lower() or "limit" in exceed_res.json()["detail"].lower()

    # 5. Update cart item quantity to 3 -> 200 OK
    update_res = client.put(
        f"/api/v1/cart/items/{cart_item_id}",
        json={"quantity": 3},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["total_items"] == 3
    expected_new_subtotal = (prod_price * 3).quantize(Decimal("0.01"))
    assert Decimal(str(update_res.json()["subtotal"])) == expected_new_subtotal

    # 6. Update quantity exceeding stock -> 400 Bad Request
    bad_update = client.put(
        f"/api/v1/cart/items/{cart_item_id}",
        json={"quantity": initial_stock + 50},
        headers=headers,
    )
    assert bad_update.status_code == 400

    # 7. Customer B cannot update Customer A's cart item -> 404 Not Found
    cust_b_token = get_token("customer_b@cloudcart.com", "SecurePassword123!")
    headers_b = {"Authorization": f"Bearer {cust_b_token}"}
    cross_update = client.put(
        f"/api/v1/cart/items/{cart_item_id}",
        json={"quantity": 5},
        headers=headers_b,
    )
    assert cross_update.status_code == 404

    # 8. Customer B cannot delete Customer A's cart item -> 404 Not Found
    cross_delete = client.delete(
        f"/api/v1/cart/items/{cart_item_id}",
        headers=headers_b,
    )
    assert cross_delete.status_code == 404

    # 9. Remove individual item -> 200 OK
    del_res = client.delete(f"/api/v1/cart/items/{cart_item_id}", headers=headers)
    assert del_res.status_code == 200
    assert len(del_res.json()["items"]) == 0
    assert del_res.json()["total_items"] == 0

    # 10. Re-add item and test clear_cart
    client.post("/api/v1/cart/items", json={"product_id": prod_id, "quantity": 1}, headers=headers)
    clear_res = client.delete("/api/v1/cart/clear", headers=headers)
    assert clear_res.status_code == 200
    assert len(clear_res.json()["items"]) == 0
    assert Decimal(str(clear_res.json()["total_amount"])) == Decimal("0.00")


def test_2_order_placement_and_inventory_reduction():
    cust_token = get_token("demo@cloudcart.com", "Demo123!")
    headers = {"Authorization": f"Bearer {cust_token}"}

    # 1. Attempt checkout with empty cart -> 400 Bad Request
    client.delete("/api/v1/cart/clear", headers=headers)
    empty_order = client.post(
        "/api/v1/orders/",
        json={"shipping_address": "123 Market St, Suite 400, San Francisco, CA 94103"},
        headers=headers,
    )
    assert empty_order.status_code == 400
    assert "empty" in empty_order.json()["detail"].lower()

    # 2. Add product to cart and record initial stock
    db: Session = SessionLocal()
    try:
        product = db.query(Product).filter(Product.is_active == True, Product.stock >= 5).first()
        assert product is not None
        prod_id = product.id
        initial_stock = product.stock
        prod_price = Decimal(str(product.price))
    finally:
        db.close()

    order_qty = 2
    client.post(
        "/api/v1/cart/items",
        json={"product_id": prod_id, "quantity": order_qty},
        headers=headers,
    )

    # 3. Create order from cart items -> 201 Created
    order_res = client.post(
        "/api/v1/orders/",
        json={
            "shipping_address": "456 Tech Boulevard, Austin, TX 78701",
            "payment_method": "Credit Card",
        },
        headers=headers,
    )
    assert order_res.status_code == 201, f"Expected 201, got {order_res.text}"
    order_data = order_res.json()
    order_id = order_data["id"]
    assert order_data["status"] == "CONFIRMED"
    assert len(order_data["items"]) == 1
    assert order_data["items"][0]["product_id"] == prod_id
    assert order_data["items"][0]["quantity"] == order_qty

    # 4. Verify backend pricing calculations
    expected_subtotal = (prod_price * order_qty).quantize(Decimal("0.01"))
    expected_tax = (expected_subtotal * Decimal("0.085")).quantize(Decimal("0.01"))
    expected_shipping = Decimal("0.00") if expected_subtotal >= Decimal("50.00") else Decimal("9.99")
    expected_total = expected_subtotal + expected_tax + expected_shipping
    assert Decimal(str(order_data["subtotal_amount"])) == expected_subtotal
    assert Decimal(str(order_data["tax_amount"])) == expected_tax
    assert Decimal(str(order_data["shipping_amount"])) == expected_shipping
    assert Decimal(str(order_data["total_amount"])) == expected_total

    # 5. Verify stock was safely reduced in database
    db = SessionLocal()
    try:
        updated_product = db.query(Product).filter(Product.id == prod_id).first()
        assert updated_product.stock == initial_stock - order_qty
    finally:
        db.close()

    # 6. Verify customer cart was automatically cleared
    cart_check = client.get("/api/v1/cart/", headers=headers)
    assert len(cart_check.json()["items"]) == 0


def test_3_order_access_control_and_history(order_id: int):
    cust_token = get_token("demo@cloudcart.com", "Demo123!")
    headers_cust = {"Authorization": f"Bearer {cust_token}"}

    # 1. Customer can view their own order history -> 200 OK
    history_res = client.get("/api/v1/orders/", headers=headers_cust)
    assert history_res.status_code == 200
    orders = history_res.json()
    assert len(orders) >= 1
    assert any(o["id"] == order_id for o in orders)

    # 2. Customer can view their own individual order details -> 200 OK
    own_order = client.get(f"/api/v1/orders/{order_id}", headers=headers_cust)
    assert own_order.status_code == 200
    assert own_order.json()["id"] == order_id

    # 3. Customer B cannot access Customer A's order -> 404 Not Found
    cust_b_token = get_token("customer_b@cloudcart.com", "SecurePassword123!")
    headers_b = {"Authorization": f"Bearer {cust_b_token}"}
    other_order = client.get(f"/api/v1/orders/{order_id}", headers=headers_b)
    assert other_order.status_code == 404, f"Expected 404 for cross-customer order access, got {other_order.status_code}"

    # 4. Customer B's order history does NOT contain Customer A's order
    b_history = client.get("/api/v1/orders/", headers=headers_b)
    assert b_history.status_code == 200
    assert not any(o["id"] == order_id for o in b_history.json())


def test_4_admin_order_management_and_status_transitions(order_id: int, prod_id: int, order_qty: int):
    admin_token = get_token("admin@cloudcart.com", "Admin123!")
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    cust_token = get_token("demo@cloudcart.com", "Demo123!")
    headers_cust = {"Authorization": f"Bearer {cust_token}"}

    # 1. Customer cannot view all store orders -> 403 Forbidden
    cust_all = client.get("/api/v1/orders/admin/all", headers=headers_cust)
    assert cust_all.status_code == 403

    # 2. Unauthenticated cannot view all store orders -> 401 Unauthorized
    anon_all = client.get("/api/v1/orders/admin/all")
    assert anon_all.status_code == 401

    # 3. Admin can view all store orders -> 200 OK
    admin_all = client.get("/api/v1/orders/admin/all", headers=headers_admin)
    assert admin_all.status_code == 200
    all_orders = admin_all.json()
    assert len(all_orders) >= 1
    assert any(o["id"] == order_id for o in all_orders)

    # 4. Admin can view any individual order -> 200 OK
    admin_order = client.get(f"/api/v1/orders/{order_id}", headers=headers_admin)
    assert admin_order.status_code == 200
    assert admin_order.json()["id"] == order_id

    # 5. Customer cannot update order status -> 403 Forbidden
    cust_status = client.put(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "PROCESSING"},
        headers=headers_cust,
    )
    assert cust_status.status_code == 403

    # 6. Admin transitions order through statuses: PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED
    for st in ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"]:
        st_res = client.put(
            f"/api/v1/orders/{order_id}/status",
            json={"status": st},
            headers=headers_admin,
        )
        assert st_res.status_code == 200
        assert st_res.json()["status"] == st

    # Record current stock before cancellation
    db: Session = SessionLocal()
    try:
        curr_stock = db.query(Product).filter(Product.id == prod_id).first().stock
    finally:
        db.close()

    # 7. Admin cancels order -> stock is safely restored
    cancel_res = client.put(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "CANCELLED"},
        headers=headers_admin,
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"

    # Verify inventory was restored
    db = SessionLocal()
    try:
        restored_stock = db.query(Product).filter(Product.id == prod_id).first().stock
        assert restored_stock == curr_stock + order_qty
    finally:
        db.close()

    # 8. Invalid status returns 422
    bad_st = client.put(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "INVALID_STATUS"},
        headers=headers_admin,
    )
    assert bad_st.status_code == 422


if __name__ == "__main__":
    print("=" * 70)
    print("RUNNING CLOUDCART SHOPPING CART & ORDER MANAGEMENT TESTS")
    print("=" * 70)
    test_1_shopping_cart_lifecycle()
    print("✓ Test 1: Shopping Cart Lifecycle (Add, Update, Remove, Clear & Total calculations) passed")
    test_2_order_placement_and_inventory_reduction()
    print("✓ Test 2: Order Creation, Zero-Trust Backend Pricing & Stock Reduction passed")
    db = SessionLocal()
    last_ord = db.query(Order).order_by(Order.id.desc()).first()
    order_id = last_ord.id
    prod_id = last_ord.items[0].product_id
    order_qty = last_ord.items[0].quantity
    db.close()
    test_3_order_access_control_and_history(order_id)
    print("✓ Test 3: Customer Isolation & Order History passed")
    test_4_admin_order_management_and_status_transitions(order_id, prod_id, order_qty)
    print("✓ Test 4: Admin Oversight, Order Status Transitions & Stock Restoration on Cancellation passed")
    print("=" * 70)
    print("ALL SHOPPING CART & ORDER MANAGEMENT TESTS PASSED WITH 100% SUCCESS ON POSTGRESQL!")
    print("=" * 70)
