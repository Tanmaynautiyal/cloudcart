from typing import Optional, List, Callable
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.token import RevokedToken

# OAuth2 scheme for Swagger UI Authorization and Bearer header parsing
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login-form",
    auto_error=False,
)


def get_raw_token(token: Optional[str] = Depends(oauth2_scheme)) -> str:
    """Extracts raw Bearer token from request Authorization header."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Bearer token missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token


def get_token_payload(
    token: str = Depends(get_raw_token),
    db: Session = Depends(get_db),
) -> dict:
    """
    Decodes the JWT access token and verifies:
    1. Signature and expiration validity.
    2. Token purpose type ('access').
    3. Token revocation status in the revoked_tokens store.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(token)
    if not payload:
        raise credentials_exception

    # Enforce token type: must be access token, not refresh token
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Access token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if the token JTI was revoked (e.g. via logout)
    jti = payload.get("jti")
    if jti:
        is_revoked = db.query(RevokedToken).filter(RevokedToken.jti == jti).first()
        if is_revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked or logged out. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    return payload


def get_current_user(
    payload: dict = Depends(get_token_payload),
    db: Session = Depends(get_db),
) -> User:
    """
    Fetches the authenticated User model from the database using the token subject.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_id = payload.get("sub")
    if not user_id:
        raise credentials_exception

    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
    except (ValueError, TypeError):
        raise credentials_exception

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensures that the authenticated user account is active.
    Returns HTTP 403 Forbidden if account has been deactivated.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Please contact customer support.",
        )
    return current_user


def require_roles(*allowed_roles: str) -> Callable[[User], User]:
    """
    Role-Based Access Control (RBAC) dependency factory.
    Verifies that the authenticated user holds at least one of the permitted roles.
    Admins (is_admin=True or role='ADMIN') automatically pass.
    Non-authorized users receive HTTP 403 Forbidden.
    """
    normalized_allowed = [r.upper() for r in allowed_roles]

    def role_verifier(current_user: User = Depends(get_current_active_user)) -> User:
        user_role = (current_user.role or UserRole.CUSTOMER.value).upper()
        if user_role in normalized_allowed or current_user.is_admin:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: administrative permissions required. Allowed roles: {normalized_allowed}",
        )

    return role_verifier


# Reusable specific role dependencies
get_current_admin_user = require_roles(UserRole.ADMIN.value, "ADMIN", "admin")
get_current_merchant_user = require_roles(UserRole.MERCHANT.value, UserRole.SELLER.value, UserRole.ADMIN.value, "MERCHANT", "SELLER", "ADMIN")
get_current_seller_user = get_current_merchant_user
get_current_customer_user = require_roles(
    UserRole.CUSTOMER.value, UserRole.MERCHANT.value, UserRole.SELLER.value, UserRole.ADMIN.value,
    "CUSTOMER", "MERCHANT", "SELLER", "ADMIN"
)
