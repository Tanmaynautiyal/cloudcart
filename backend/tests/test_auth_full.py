"""
Comprehensive Integration Test Suite for CloudCart Authentication, PostgreSQL Persistence & RBAC.
Covers:
1. User registration & email normalization
2. User login with email/password
3. Secure password hashing using bcrypt (verified in DB)
4. JWT access tokens (claims, signature, expiration, tamper detection)
5. JWT refresh tokens (token rotation & replay prevention)
6. Current-user dependency (/auth/me & missing token handling)
7. Logout and token invalidation strategy (JTI blacklisting in DB)
8. Role-based access control (Admin vs Customer on protected endpoints)
9. Swagger UI OAuth2 Password Form flow
"""

import jwt
import bcrypt
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.db.session import SessionLocal, engine
from app.db.init_db import init_db
from app.models.user import User, UserRole
from app.models.token import RevokedToken
from app.core.config import settings
from app.core.security import decode_token

# Initialize database schema & seed initial accounts on PostgreSQL
init_db()
client = TestClient(app)


def test_1_user_registration_and_email_normalization():
    """Verify registration succeeds and normalizes email (trimmed, lowercase)."""
    db: Session = SessionLocal()
    try:
        # Clean up any existing user from prior runs
        test_email = "alex.rivera@cloudcart.com"
        existing = db.query(User).filter(User.email == test_email).first()
        if existing:
            db.delete(existing)
            db.commit()
    finally:
        db.close()

    payload = {
        "email": "   Alex.Rivera@CloudCart.COM   ",
        "username": "alex_rivera",
        "full_name": "Alex Rivera",
        "phone": "+1-555-0188",
        "password": "SecurePassword2026!",
        "confirm_password": "SecurePassword2026!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["email"] == "alex.rivera@cloudcart.com"
    assert data["username"] == "alex_rivera"
    assert data["role"] == "CUSTOMER"
    assert data["is_admin"] is False


def test_2_duplicate_registration_returns_409():
    """Duplicate registration with identical or different-case email returns HTTP 409 Conflict."""
    payload = {
        "email": "ALEX.RIVERA@cloudcart.com",
        "username": "alex_rivera_dup",
        "password": "SecurePassword2026!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409, f"Expected 409, got {response.status_code}: {response.text}"
    assert "already exists" in response.json()["detail"].lower()


def test_3_password_security_validation():
    """Passwords not meeting complexity standards return HTTP 422 Unprocessable Entity."""
    cases = [
        ("short1!", "at least 8 characters"),
        ("lowercaseonly1!", "uppercase letter"),
        ("UPPERCASEONLY1!", "lowercase letter"),
        ("NoDigitsHere!", "digit"),
        ("NoSpecialChar123", "special character"),
    ]
    for bad_pwd, err_snippet in cases:
        payload = {
            "email": f"bad_{bad_pwd[:5]}@test.com",
            "username": f"user_{bad_pwd[:5]}",
            "password": bad_pwd,
        }
        res = client.post("/api/v1/auth/register", json=payload)
        assert res.status_code == 422, f"Expected 422 for password '{bad_pwd}', got {res.status_code}"


def test_4_bcrypt_password_hashing_in_database():
    """Verify passwords in PostgreSQL are strictly hashed with bcrypt ($2b$) and never in plain text."""
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "alex.rivera@cloudcart.com").first()
        assert user is not None
        # Password must start with bcrypt identifier
        assert user.hashed_password.startswith("$2b$") or user.hashed_password.startswith("$2a$")
        # Plain text must NOT be stored
        assert "SecurePassword2026!" not in user.hashed_password
        # Verify with native bcrypt
        valid = bcrypt.checkpw("SecurePassword2026!".encode("utf-8"), user.hashed_password.encode("utf-8"))
        assert valid is True
    finally:
        db.close()


def test_5_login_validation_and_jwt_tokens():
    """Valid login issues access and refresh tokens; invalid returns 401."""
    # 1. Invalid credentials -> 401
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": "alex.rivera@cloudcart.com", "password": "WrongPassword!"},
    )
    assert bad_login.status_code == 401
    assert "WWW-Authenticate" in bad_login.headers

    # 2. Non-existent user -> 401
    non_existent = client.post(
        "/api/v1/auth/login",
        json={"email": "ghost@cloudcart.com", "password": "SecurePassword2026!"},
    )
    assert non_existent.status_code == 401

    # 3. Successful login with normalized email
    good_login = client.post(
        "/api/v1/auth/login",
        json={"email": "   ALEX.RIVERA@CLOUDCART.COM   ", "password": "SecurePassword2026!"},
    )
    assert good_login.status_code == 200
    token_data = good_login.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["token_type"].lower() == "bearer"
    assert token_data["user"]["email"] == "alex.rivera@cloudcart.com"

    # Verify access token JWT claims
    access_claims = decode_token(token_data["access_token"])
    assert access_claims is not None
    assert access_claims["type"] == "access"
    assert access_claims["sub"] == str(token_data["user"]["id"])
    assert access_claims["role"] == "CUSTOMER"
    assert "jti" in access_claims

    # Verify refresh token JWT claims
    refresh_claims = decode_token(token_data["refresh_token"])
    assert refresh_claims is not None
    assert refresh_claims["type"] == "refresh"
    assert refresh_claims["sub"] == str(token_data["user"]["id"])


def test_6_current_user_dependency():
    """Current user dependency (/auth/me) validates Bearer header."""
    # Login to obtain access token
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "alex.rivera@cloudcart.com", "password": "SecurePassword2026!"},
    )
    access_token = login_res.json()["access_token"]

    # 1. With valid token -> 200 OK
    valid_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert valid_res.status_code == 200
    assert valid_res.json()["email"] == "alex.rivera@cloudcart.com"

    # 2. Missing authorization header -> 401 Unauthorized
    missing_res = client.get("/api/v1/auth/me")
    assert missing_res.status_code == 401

    # 3. Tampered token -> 401 Unauthorized
    tampered_token = access_token[:-6] + "xxxxxx"
    tampered_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tampered_token}"})
    assert tampered_res.status_code == 401


def test_7_refresh_token_rotation_and_replay_prevention():
    """Refresh endpoint issues new token pair and revokes the old refresh token."""
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "alex.rivera@cloudcart.com", "password": "SecurePassword2026!"},
    )
    tokens = login_res.json()
    first_refresh = tokens["refresh_token"]

    # Refresh
    rotate_res = client.post("/api/v1/auth/refresh", json={"refresh_token": first_refresh})
    assert rotate_res.status_code == 200
    rotated_tokens = rotate_res.json()
    assert rotated_tokens["access_token"] != tokens["access_token"]
    assert rotated_tokens["refresh_token"] != first_refresh

    # Attempt replay with old refresh token -> must fail with 401
    replay_res = client.post("/api/v1/auth/refresh", json={"refresh_token": first_refresh})
    assert replay_res.status_code == 401


def test_8_logout_and_token_invalidation():
    """Logout records JTI in revoked_tokens table in PostgreSQL and prevents reuse."""
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "alex.rivera@cloudcart.com", "password": "SecurePassword2026!"},
    )
    tokens = login_res.json()
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    # Decode JTI
    claims = decode_token(access_token)
    access_jti = claims["jti"]

    # Logout
    logout_res = client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token},
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_res.status_code == 200
    assert logout_res.json()["success"] is True

    # Verify JTI stored in PostgreSQL revoked_tokens table
    db: Session = SessionLocal()
    try:
        revoked = db.query(RevokedToken).filter(RevokedToken.jti == access_jti).first()
        assert revoked is not None
        assert revoked.token_type == "access"
    finally:
        db.close()

    # Attempting to call /auth/me with revoked token -> 401 Unauthorized
    revoked_call = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert revoked_call.status_code == 401
    assert "revoked" in revoked_call.json()["detail"].lower()


def test_9_role_based_access_control_admin_protection():
    """Admin operations are strictly protected against CUSTOMER users (403 Forbidden)."""
    # 1. Customer token
    cust_res = client.post(
        "/api/v1/auth/login",
        json={"email": "alex.rivera@cloudcart.com", "password": "SecurePassword2026!"},
    )
    cust_header = {"Authorization": f"Bearer {cust_res.json()['access_token']}"}

    # Customer tries to access admin-only user list -> 403 Forbidden
    cust_user_list = client.get("/api/v1/users/", headers=cust_header)
    assert cust_user_list.status_code == 403, f"Expected 403, got {cust_user_list.status_code}"

    # Customer tries to create a category -> 403 Forbidden
    cust_cat_create = client.post(
        "/api/v1/categories/",
        json={"name": "Hacked Category", "slug": "hacked-category"},
        headers=cust_header,
    )
    assert cust_cat_create.status_code == 403

    # Customer tries to create a product -> 403 Forbidden
    cust_prod_create = client.post(
        "/api/v1/products/",
        json={
            "name": "Illegal Hardware SKU",
            "slug": "illegal-hardware-sku",
            "price": 99.99,
            "category_id": 1,
            "stock": 10,
        },
        headers=cust_header,
    )
    assert cust_prod_create.status_code == 403

    # 2. Admin token
    admin_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@cloudcart.com", "password": "Admin123!"},
    )
    assert admin_res.status_code == 200
    admin_header = {"Authorization": f"Bearer {admin_res.json()['access_token']}"}

    # Admin accessing admin-only user list -> 200 OK
    admin_user_list = client.get("/api/v1/users/", headers=admin_header)
    assert admin_user_list.status_code == 200
    assert len(admin_user_list.json()) >= 1


def test_10_swagger_oauth2_form_authentication():
    """Swagger UI Authorize modal endpoint (/api/v1/auth/login-form) accepts form data."""
    res = client.post(
        "/api/v1/auth/login-form",
        data={"username": "admin@cloudcart.com", "password": "Admin123!"},
    )
    assert res.status_code == 200
    token_data = res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["user"]["role"] == "ADMIN"


if __name__ == "__main__":
    print("=" * 70)
    print("RUNNING CLOUDCART FULL POSTGRESQL AUTHENTICATION & RBAC TEST SUITE")
    print("=" * 70)
    test_1_user_registration_and_email_normalization()
    print("✓ Test 1: User Registration & Email Normalization passed")
    test_2_duplicate_registration_returns_409()
    print("✓ Test 2: Duplicate Registration (409 Conflict) passed")
    test_3_password_security_validation()
    print("✓ Test 3: Password Complexity (422) passed")
    test_4_bcrypt_password_hashing_in_database()
    print("✓ Test 4: Bcrypt Hashing Verified in PostgreSQL passed")
    test_5_login_validation_and_jwt_tokens()
    print("✓ Test 5: Login & JWT Access/Refresh Claims passed")
    test_6_current_user_dependency()
    print("✓ Test 6: Current User Dependency & Tamper Protection passed")
    test_7_refresh_token_rotation_and_replay_prevention()
    print("✓ Test 7: Refresh Token Rotation & Replay Prevention passed")
    test_8_logout_and_token_invalidation()
    print("✓ Test 8: Logout & JTI Token Revocation Store passed")
    test_9_role_based_access_control_admin_protection()
    print("✓ Test 9: Role-Based Access Control & Admin Endpoint Protection (403) passed")
    test_10_swagger_oauth2_form_authentication()
    print("✓ Test 10: Swagger OAuth2 Password Form Support passed")
    print("=" * 70)
    print("ALL 10 TESTS PASSED WITH 100% SUCCESS ON POSTGRESQL!")
    print("=" * 70)
