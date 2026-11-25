from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.auth import (
    Token,
    LoginRequest,
    RefreshTokenRequest,
    LogoutRequest,
    AuthStatusResponse,
)
from app.schemas.user import UserRegister, UserResponse
from app.services.auth_service import auth_service
from app.routes.deps import get_current_active_user, get_raw_token
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer account",
    description=(
        "Creates a new customer account with bcrypt password hashing and email normalization. "
        "Enforces minimum 8-character password security with upper, lower, digit, and special characters. "
        "Returns HTTP 409 Conflict if email or username is already taken."
    ),
)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new customer or merchant seller account with automatic token issuance.
    """
    user = auth_service.register_user(db=db, user_in=user_in)
    tokens = auth_service.create_user_tokens(db=db, user=user)
    user_dict = UserResponse.model_validate(user).model_dump()
    user_dict["access_token"] = tokens.access_token
    user_dict["token_type"] = tokens.token_type
    return UserResponse(**user_dict)


@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="Log in with email and password",
    description=(
        "Authenticates a user using email and password JSON payload. "
        "Returns both an access token (short-lived) and a refresh token (7-day lifespan). "
        "Returns HTTP 401 Unauthorized on invalid credentials."
    ),
)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user via JSON credentials and issue JWT access and refresh tokens.
    """
    user = auth_service.authenticate_user(
        db=db, email=login_data.email, password=login_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if getattr(user, "is_blocked", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been blocked by platform administration for policy violations.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact customer support.",
        )

    return auth_service.create_user_tokens(db=db, user=user)


@router.post(
    "/login-form",
    response_model=Token,
    include_in_schema=False,
)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Swagger UI OAuth2 Password Form endpoint for the 'Authorize' modal.
    """
    user = auth_service.authenticate_user(
        db=db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if getattr(user, "is_blocked", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been blocked by platform administration for policy violations.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact customer support.",
        )

    return auth_service.create_user_tokens(db=db, user=user)


@router.post(
    "/refresh",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token using refresh token",
    description=(
        "Exchanges a valid JWT refresh token for a fresh access token and a new rotated refresh token. "
        "The previous refresh token is immediately invalidated (token rotation security)."
    ),
)
def refresh_token(
    refresh_in: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    """
    Rotate and issue a new pair of access and refresh tokens.
    """
    return auth_service.refresh_access_tokens(
        db=db, refresh_token_str=refresh_in.refresh_token
    )


@router.post(
    "/logout",
    response_model=AuthStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Log out and invalidate tokens",
    description=(
        "Invalidates the current JWT access token by recording its JTI in the database blacklist. "
        "If a refresh_token is provided in the request body, it is also invalidated immediately."
    ),
)
def logout(
    logout_in: Optional[LogoutRequest] = None,
    raw_token: str = Depends(get_raw_token),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Invalidate active access and refresh tokens.
    """
    refresh_token_str = logout_in.refresh_token if logout_in else None
    auth_service.logout(
        db=db,
        access_token=raw_token,
        refresh_token=refresh_token_str,
        user_id=current_user.id,
    )
    return AuthStatusResponse(
        success=True,
        message="Successfully logged out. Tokens have been invalidated.",
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
    description="Returns profile information for the Bearer-authenticated user.",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve current logged-in user profile with role information.
    """
    return current_user
