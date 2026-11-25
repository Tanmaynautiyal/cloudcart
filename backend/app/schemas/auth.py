from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.schemas.user import UserResponse


class Token(BaseModel):
    access_token: str = Field(..., description="JWT Bearer access token")
    refresh_token: str = Field(..., description="JWT Bearer refresh token")
    token_type: str = Field("bearer", description="Token scheme type")
    expires_in: int = Field(..., description="Access token expiration lifespan in seconds")
    user: Optional[UserResponse] = Field(None, description="Authenticated user account details")


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    type: Optional[str] = None
    jti: Optional[str] = None
    exp: Optional[int] = None
    iat: Optional[int] = None


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered account email address")
    password: str = Field(..., description="Account password")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="Valid signed JWT refresh token")


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = Field(
        None, description="Optional refresh token to invalidate alongside access token"
    )


class AuthStatusResponse(BaseModel):
    success: bool
    message: str
