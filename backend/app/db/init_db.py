import os
import logging
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.address import Address
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)


def init_db(db: Session = None) -> None:
    """
    Initializes PostgreSQL database tables and ensures initial administrative accounts exist.
    All category and product catalog data is stored permanently in the PostgreSQL database
    and accessed exclusively through FastAPI REST APIs.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # 1. Create all relational tables in PostgreSQL
        Base.metadata.create_all(bind=engine)
        logger.info("PostgreSQL database tables verified and ready.")

        # 2. Seed Default Admin User if not already present
        admin = db.query(User).filter(User.email == "admin@cloudcart.com").first()
        if not admin:
            admin = User(
                email="admin@cloudcart.com",
                username="admin",
                full_name="CloudCart Super Admin",
                phone="+1 (555) 019-2831",
                hashed_password=get_password_hash("Admin123!"),
                role="ADMIN",
                is_admin=True,
                is_active=True,
                avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80",
            )
            db.add(admin)
            db.flush()
            logger.info("Created default admin user: admin@cloudcart.com / Admin123!")
        else:
            if admin.role != "ADMIN" or not admin.is_admin:
                admin.role = "ADMIN"
                admin.is_admin = True
                db.commit()

        # 3. Seed Demo Customer User if not already present
        demo_user = db.query(User).filter(User.email == "demo@cloudcart.com").first()
        if not demo_user:
            demo_user = User(
                email="demo@cloudcart.com",
                username="demouser",
                full_name="Tanmay",
                phone="+1 (555) 234-5678",
                hashed_password=get_password_hash("Demo123!"),
                role="CUSTOMER",
                is_admin=False,
                is_active=True,
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
            )
            db.add(demo_user)
            db.flush()

            demo_address = Address(
                user_id=demo_user.id,
                full_name="Tanmay",
                phone="+1 (555) 234-5678",
                address_line1="742 Evergreen Terrace",
                address_line2="Suite 400",
                city="San Francisco",
                state="CA",
                postal_code="94105",
                country="United States",
                is_default_shipping=True,
                is_default_billing=True,
                address_type="BOTH",
            )
            db.add(demo_address)
            logger.info("Created default customer: demo@cloudcart.com / Demo123!")

        # 4. Seed Frontend Demo Customer (tanmay@cloudcart.com)
        fe_demo = db.query(User).filter(User.email == "tanmay@cloudcart.com").first()
        if not fe_demo:
            fe_demo = User(
                email="tanmay@cloudcart.com",
                username="tanmay",
                full_name="Tanmay",
                phone="+1 (555) 789-0123",
                hashed_password=get_password_hash("CloudCart2026!"),
                role="CUSTOMER",
                is_admin=False,
                is_active=True,
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
            )
            db.add(fe_demo)

        # 5. Seed Verified Merchant Seller (seller@cloudcart.com)
        seller_user = db.query(User).filter(User.email == "seller@cloudcart.com").first()
        if not seller_user:
            seller_user = User(
                email="seller@cloudcart.com",
                username="apextech",
                full_name="Apex Tech Official Store",
                store_name="Apex Tech Hub",
                phone="+1 (555) 890-4321",
                hashed_password=get_password_hash("Seller123!"),
                role="SELLER",
                is_admin=False,
                is_active=True,
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
            )
            db.add(seller_user)

        db.commit()

        # 6. Log database catalog stats (stored directly in PostgreSQL tables)
        cat_count = db.query(Category).count()
        prod_count = db.query(Product).count()
        logger.info(f"PostgreSQL Database Ready: {cat_count} categories, {prod_count} products live in DB.")

    except Exception as exc:
        db.rollback()
        logger.warning(f"Database initialization error: {exc}", exc_info=True)
    finally:
        if should_close:
            db.close()
