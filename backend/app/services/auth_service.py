from typing import Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.models.cart import Cart
from app.models.token import RevokedToken
from app.schemas.user import UserRegister, UserCreate, UserResponse
from app.schemas.auth import Token
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.utils.logger import get_logger

logger = get_logger("cloudcart.auth_service")


class AuthService:
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """
        Validates user credentials against stored bcrypt hash.
        Supports lookup by normalized email or username.
        """
        normalized_email = email.strip().lower()
        user = (
            db.query(User)
            .filter((User.email == normalized_email) | (User.username == normalized_email))
            .first()
        )
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    def register_user(db: Session, user_in: UserRegister) -> User:
        """
        Registers a new customer account with strict uniqueness checks.
        Returns HTTP 409 Conflict if email or username is already taken.
        """
        normalized_email = user_in.email.strip().lower()

        # Check for duplicate email -> 409 Conflict
        existing_email = db.query(User).filter(User.email == normalized_email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists. Please sign in instead.",
            )

        # Derive username if not explicitly supplied
        username = user_in.username
        if not username:
            base_username = normalized_email.split("@")[0]
            candidate = base_username
            counter = 1
            while db.query(User).filter(User.username == candidate).first():
                candidate = f"{base_username}_{counter}"
                counter += 1
            username = candidate
        else:
            username = username.strip().lower()
            # Check for duplicate username -> 409 Conflict
            if db.query(User).filter(User.username == username).first():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"The username '{username}' is already taken. Please choose another.",
                )

        # Check password confirmation if provided
        confirm = user_in.confirm_password or user_in.confirmPassword
        if confirm and user_in.password != confirm:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Passwords do not match. Please verify your password confirmation.",
            )

        # Assign full name from either field
        full_name = user_in.full_name or user_in.name

        # Determine role (allow SELLER registration, restrict ADMIN to internal UserCreate)
        role = UserRole.CUSTOMER.value
        is_admin = False
        if hasattr(user_in, "role") and user_in.role:
            req_role = user_in.role.value if hasattr(user_in.role, "value") else str(user_in.role).upper()
            if req_role in (UserRole.SELLER.value, UserRole.MERCHANT.value, "MERCHANT", "SELLER"):
                role = UserRole.MERCHANT.value
            elif req_role == UserRole.ADMIN.value and isinstance(user_in, UserCreate):
                role = UserRole.ADMIN.value
                is_admin = bool(user_in.is_admin)

        store_name = getattr(user_in, "store_name", None) or getattr(user_in, "storeName", None)

        # Create new user record with bcrypt password hash
        new_user = User(
            email=normalized_email,
            username=username,
            full_name=full_name,
            store_name=store_name,
            phone=user_in.phone,
            hashed_password=get_password_hash(user_in.password),
            role=role,
            is_admin=is_admin,
            is_active=True,
        )
        db.add(new_user)
        db.flush()

        # Initialize an empty shopping cart for the user
        user_cart = Cart(user_id=new_user.id)
        db.add(user_cart)

        db.commit()
        db.refresh(new_user)
        logger.info(f"Registered new user id={new_user.id} email={new_user.email} role={new_user.role}")
        return new_user

    @staticmethod
    def create_user_tokens(db: Session, user: User) -> Token:
        """
        Issues a pair of JWT access and refresh tokens for an authenticated user.
        """
        access_token, _, expires_in = create_access_token(
            subject=user.id,
            role=user.role or "CUSTOMER",
            email=user.email,
        )
        refresh_token, _, _ = create_refresh_token(subject=user.id)

        user_response = UserResponse.model_validate(user)
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=expires_in,
            user=user_response,
        )

    @staticmethod
    def refresh_access_tokens(db: Session, refresh_token_str: str) -> Token:
        """
        Validates the refresh token, performs token rotation by revoking the old
        refresh token, and issues a fresh pair of access and refresh tokens.
        """
        payload = decode_token(refresh_token_str)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type provided. A refresh token is required.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        old_jti = payload.get("jti")
        if old_jti:
            is_revoked = db.query(RevokedToken).filter(RevokedToken.jti == old_jti).first()
            if is_revoked:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Refresh token has been revoked or already rotated.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token subject payload.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account associated with this token no longer exists.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated. Access denied.",
            )

        # Invalidate the old refresh token (refresh token rotation)
        if old_jti:
            exp_ts = payload.get("exp")
            expires_at = (
                datetime.fromtimestamp(exp_ts, tz=timezone.utc)
                if exp_ts
                else datetime.now(timezone.utc) + timedelta(days=7)
            )
            db.add(
                RevokedToken(
                    jti=old_jti,
                    token_type="refresh",
                    user_id=user.id,
                    expires_at=expires_at,
                )
            )
            db.commit()

        # Issue fresh token pair
        return AuthService.create_user_tokens(db=db, user=user)

    @staticmethod
    def revoke_token(
        db: Session,
        token_str: str,
        user_id: Optional[int] = None,
    ) -> bool:
        """
        Parses a JWT and inserts its unique JTI into the revoked_tokens blacklist table.
        """
        payload = decode_token(token_str)
        if not payload:
            return False

        jti = payload.get("jti")
        if not jti:
            return False

        # Idempotent check
        if db.query(RevokedToken).filter(RevokedToken.jti == jti).first():
            return True

        exp_ts = payload.get("exp")
        expires_at = (
            datetime.fromtimestamp(exp_ts, tz=timezone.utc)
            if exp_ts
            else datetime.now(timezone.utc) + timedelta(hours=1)
        )
        token_type = payload.get("type", "access")
        uid = user_id or (int(payload.get("sub")) if payload.get("sub") else None)

        revoked = RevokedToken(
            jti=jti,
            token_type=token_type,
            user_id=uid,
            expires_at=expires_at,
        )
        db.add(revoked)
        db.commit()
        logger.info(f"Revoked token jti={jti} type={token_type} for user_id={uid}")
        return True

    @staticmethod
    def logout(
        db: Session,
        access_token: str,
        refresh_token: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> None:
        """
        Performs secure user logout by blacklisting the active access token and refresh token.
        """
        AuthService.revoke_token(db=db, token_str=access_token, user_id=user_id)
        if refresh_token:
            AuthService.revoke_token(db=db, token_str=refresh_token, user_id=user_id)


auth_service = AuthService()
