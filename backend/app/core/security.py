import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple, Union
import bcrypt
import jwt
from app.core.config import settings


# --- Password Hashing & Verification via Bcrypt ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a bcrypt-hashed password string.
    Returns True if valid, False otherwise.
    """
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        # Fallback check for pbkdf2 legacy hashes if present
        if hashed_password.startswith("pbkdf2_sha256$"):
            import hashlib, base64, hmac
            try:
                parts = hashed_password.split("$")
                if len(parts) == 4:
                    iterations = int(parts[1])
                    salt = base64.b64decode(parts[2].encode("ascii"))
                    expected_hash = base64.b64decode(parts[3].encode("ascii"))
                    derived = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations)
                    return hmac.compare_digest(derived, expected_hash)
            except Exception:
                return False
        return False


def get_password_hash(password: str) -> str:
    """
    Hash a password securely using bcrypt with work-factor salt.
    Never stores or logs plain-text passwords.
    """
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


# --- JWT Token Generation & Verification ---

def create_access_token(
    subject: Union[str, int],
    role: str = "CUSTOMER",
    email: Optional[str] = None,
    expires_delta: Optional[timedelta] = None,
) -> Tuple[str, str, int]:
    """
    Generates a signed JWT access token.
    Returns a tuple of (token_string, jti, expires_in_seconds).
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
        expires_in = int(expires_delta.total_seconds())
    else:
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        expire = now + timedelta(seconds=expires_in)

    jti = str(uuid.uuid4())
    payload: Dict[str, Any] = {
        "sub": str(subject),
        "email": email or "",
        "role": role,
        "type": "access",
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, jti, expires_in


def create_refresh_token(
    subject: Union[str, int],
    expires_delta: Optional[timedelta] = None,
) -> Tuple[str, str, int]:
    """
    Generates a signed JWT refresh token with longer lifespan.
    Returns a tuple of (token_string, jti, expires_in_seconds).
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
        expires_in = int(expires_delta.total_seconds())
    else:
        expires_in = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
        expire = now + timedelta(seconds=expires_in)

    jti = str(uuid.uuid4())
    payload: Dict[str, Any] = {
        "sub": str(subject),
        "type": "refresh",
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, jti, expires_in


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates signature, format, and expiration of a JWT token.
    Returns payload dictionary or None if invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, Exception):
        return None


# Backwards compatibility alias for decode_token
decode_access_token = decode_token
