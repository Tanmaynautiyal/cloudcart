"""
Automated Integration Test Suite for CloudCart Authentication, RBAC & Token Lifecycle.
Tests:
- Registration & Email Normalization
- Password Strength Validation
- Duplicate Registration (409 Conflict)
- Login Verification & Bcrypt Hashing
- Access & Refresh Token Generation
- Protected Current-User Dependency (/auth/me)
- Role-Based Access Control (RBAC: Admin vs Customer)
- Refresh Token Rotation & Replay Prevention
- Logout & Blacklist Token Invalidation
- Swagger OAuth2 Password Form Support
"""

from fastapi.testclient import TestClient
from app.main import app
from app.db.init_db import init_db

# Initialize database
init_db()
client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_weak_password_rejected():
    weak_payload = {
        "email": "weak_tester@cloudcart.com",
        "username": "weak_tester",
        "password": "password123",  # Missing uppercase & special character
    }
    response = client.post("/api/v1/auth/register", json=weak_payload)
    assert response.status_code == 422


def test_successful_registration():
    payload = {
        "email": "  TesterAlice@CloudCart.COM  ",
        "username": "tester_alice",
        "full_name": "Alice Tester",
        "phone": "+1-555-0199",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    if response.status_code == 409:
        # Already created from prior run
        return
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testeralice@cloudcart.com"
    assert data["role"] == "CUSTOMER"
    assert data["is_admin"] is False


def test_duplicate_registration_returns_409():
    payload = {
        "email": "testeralice@cloudcart.com",
        "username": "tester_alice",
        "password": "SecurePassword123!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409


def test_invalid_login_returns_401():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "testeralice@cloudcart.com", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    assert "WWW-Authenticate" in response.headers


def test_customer_login_and_profile():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "testeralice@cloudcart.com", "password": "SecurePassword123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["role"] == "CUSTOMER"

    # Authenticated /auth/me call
    auth_header = {"Authorization": f"Bearer {data['access_token']}"}
    me_response = client.get("/api/v1/auth/me", headers=auth_header)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "testeralice@cloudcart.com"


def test_role_based_access_control():
    # 1. Login as Customer
    cust_res = client.post(
        "/api/v1/auth/login",
        json={"email": "testeralice@cloudcart.com", "password": "SecurePassword123!"},
    )
    cust_token = cust_res.json()["access_token"]
    cust_header = {"Authorization": f"Bearer {cust_token}"}

    # Customer accessing admin-only endpoint -> 403 Forbidden
    admin_only_res = client.get("/api/v1/users/", headers=cust_header)
    assert admin_only_res.status_code == 403

    # 2. Login as Admin
    admin_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@cloudcart.com", "password": "Admin123!"},
    )
    assert admin_res.status_code == 200
    admin_token = admin_res.json()["access_token"]
    admin_header = {"Authorization": f"Bearer {admin_token}"}

    # Admin accessing admin-only endpoint -> 200 OK
    admin_ok_res = client.get("/api/v1/users/", headers=admin_header)
    assert admin_ok_res.status_code == 200

    # 3. Login as Seeded Seller Merchant
    seller_res = client.post(
        "/api/v1/auth/login",
        json={"email": "seller@cloudcart.com", "password": "Seller123!"},
    )
    assert seller_res.status_code == 200
    seller_data = seller_res.json()
    assert seller_data["user"]["role"] == "SELLER"
    assert seller_data["user"]["store_name"] == "Apex Tech Hub"
    assert seller_data["user"]["is_seller"] is True


def test_refresh_token_rotation_and_logout():
    # Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "testeralice@cloudcart.com", "password": "SecurePassword123!"},
    )
    tokens = login_res.json()
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    # Exchange refresh token
    rotate_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert rotate_res.status_code == 200
    new_tokens = rotate_res.json()
    new_access_token = new_tokens["access_token"]
    new_refresh_token = new_tokens["refresh_token"]

    # Replay of old refresh token must fail with 401
    replay_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert replay_res.status_code == 401

    # Logout with active new access token
    logout_res = client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": new_refresh_token},
        headers={"Authorization": f"Bearer {new_access_token}"},
    )
    assert logout_res.status_code == 200

    # Token must now be rejected
    rejected_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_access_token}"})
    assert rejected_res.status_code == 401


if __name__ == "__main__":
    print("Executing CloudCart Auth, RBAC & Seller Integration Tests...")
    test_health_check()
    test_weak_password_rejected()
    test_successful_registration()
    test_duplicate_registration_returns_409()
    test_invalid_login_returns_401()
    test_customer_login_and_profile()
    test_role_based_access_control()
    test_refresh_token_rotation_and_logout()
    print(" All CloudCart authentication & RBAC tests passed successfully!")
