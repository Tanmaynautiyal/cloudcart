import re
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, AliasChoices
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="User unique email address")
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="Unique username")
    full_name: Optional[str] = Field(None, max_length=150, description="Full name of user")
    phone: Optional[str] = Field(None, max_length=50, description="Contact phone number")
    store_name: Optional[str] = Field(None, max_length=200, description="Merchant store brand name (for sellers)")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            v = v.strip().lower()
            if v and not re.match(r"^[a-zA-Z0-9_-]+$", v):
                raise ValueError("Username can only contain alphanumeric characters, underscores, and hyphens.")
            return v
        return v


class UserRegister(BaseModel):
    """
    Schema for public user registration.
    Supports standard registration fields as well as name / confirmPassword from frontend form.
    """
    email: EmailStr = Field(..., description="Normalized unique email address")
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="Optional username (defaults to email handle)")
    full_name: Optional[str] = Field(None, max_length=150, description="Full name")
    name: Optional[str] = Field(None, max_length=150, description="Alias for full_name")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    store_name: Optional[str] = Field(None, max_length=200, description="Store name for sellers")
    storeName: Optional[str] = Field(None, max_length=200, description="Store name camelCase alias")
    role: Optional[Any] = Field(UserRole.CUSTOMER, description="Requested role (CUSTOMER or MERCHANT/SELLER)")
    password: str = Field(..., min_length=8, description="Minimum 8 characters with upper, lower, and digit")
    confirm_password: Optional[str] = Field(None, description="Password confirmation")
    confirmPassword: Optional[str] = Field(None, description="CamelCase confirmation alias")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("role", mode="before")
    @classmethod
    def normalize_role(cls, v: Optional[Any]) -> Optional[UserRole]:
        if v is None:
            return UserRole.CUSTOMER
        if isinstance(v, UserRole):
            return v
        if isinstance(v, str):
            v_clean = v.strip().upper()
            if v_clean in ("MERCHANT", "SELLER"):
                return UserRole.MERCHANT
            if v_clean == "CUSTOMER":
                return UserRole.CUSTOMER
            if v_clean == "ADMIN":
                return UserRole.ADMIN
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter (A-Z).")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter (a-z).")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit (0-9).")
        return v


class UserCreate(UserRegister):
    """
    Schema for internal/admin user creation.
    Allows specifying role and active status.
    """
    role: Optional[UserRole] = UserRole.CUSTOMER
    is_admin: Optional[bool] = False
    is_active: Optional[bool] = True


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = Field(default=None, validation_alias=AliasChoices("full_name", "name"))
    phone: Optional[str] = None
    store_name: Optional[str] = Field(default=None, validation_alias=AliasChoices("store_name", "storeName"))
    password: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None
    is_blocked: Optional[bool] = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: Optional[str]) -> Optional[str]:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    store_name: Optional[str] = None
    role: str
    is_admin: bool
    is_seller: bool = False
    is_active: bool
    is_blocked: bool = False
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    access_token: Optional[str] = None
    token_type: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
