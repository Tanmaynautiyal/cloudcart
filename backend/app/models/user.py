import enum
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.cart import Cart
    from app.models.order import Order
    from app.models.address import Address
    from app.models.wishlist import Wishlist
    from app.models.review import Review
    from app.models.payment import Payment


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MERCHANT = "MERCHANT"
    SELLER = "SELLER"
    CUSTOMER = "CUSTOMER"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    store_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(20), default=UserRole.CUSTOMER.value, server_default="CUSTOMER", nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    addresses: Mapped[List["Address"]] = relationship(
        "Address", back_populates="user", cascade="all, delete-orphan"
    )
    orders: Mapped[List["Order"]] = relationship(
        "Order", back_populates="user", cascade="all, delete-orphan"
    )
    cart: Mapped[Optional["Cart"]] = relationship(
        "Cart", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    wishlist_items: Mapped[List["Wishlist"]] = relationship(
        "Wishlist", back_populates="user", cascade="all, delete-orphan"
    )
    reviews: Mapped[List["Review"]] = relationship(
        "Review", back_populates="user", cascade="all, delete-orphan"
    )
    payments: Mapped[List["Payment"]] = relationship(
        "Payment", back_populates="user"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email='{self.email}' username='{self.username}' role='{self.role}'>"

    @property
    def is_administrator(self) -> bool:
        return self.role in (UserRole.ADMIN.value, "ADMIN", "admin") or self.is_admin

    @property
    def is_merchant_seller(self) -> bool:
        return self.role in (UserRole.MERCHANT.value, UserRole.SELLER.value, "MERCHANT", "SELLER", "merchant", "seller") or self.is_administrator

    @property
    def is_merchant(self) -> bool:
        return self.role in (UserRole.MERCHANT.value, UserRole.SELLER.value, "MERCHANT", "SELLER", "merchant", "seller")

    @property
    def is_seller(self) -> bool:
        return self.is_merchant
