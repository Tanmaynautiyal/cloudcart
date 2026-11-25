import os
import uuid
import shutil
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, UploadFile, status
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.core.config import settings
from app.utils.slug import slugify


ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class ProductService:
    # --- Product Operations ---

    @staticmethod
    def get_products(
        db: Session,
        skip: int = 0,
        limit: int = 12,
        category_slug: Optional[str] = None,
        category_id: Optional[int] = None,
        search: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        sort_by: Optional[str] = "newest",
        include_inactive: bool = False,
    ) -> Tuple[List[Product], int]:
        """
        Retrieves products with search, category filtering, price bounds, sorting, and pagination.
        """
        query = db.query(Product).options(joinedload(Product.category))

        if not include_inactive:
            query = query.filter(Product.is_active == True)

        # 1. Filter by Category ID or Slug
        if category_id:
            query = query.filter(Product.category_id == category_id)
        elif category_slug:
            query = query.join(Product.category).filter(Category.slug == category_slug)

        # 2. Search by Product Name (case-insensitive) or description
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                (Product.name.ilike(search_term)) | (Product.description.ilike(search_term))
            )

        # 3. Filter by Price Range
        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        if max_price is not None:
            query = query.filter(Product.price <= max_price)

        total = query.count()

        # 4. Sorting
        sort_mode = (sort_by or "newest").lower()
        if sort_mode in ("price_asc", "price_low_to_high"):
            query = query.order_by(Product.price.asc(), Product.id.asc())
        elif sort_mode in ("price_desc", "price_high_to_low"):
            query = query.order_by(Product.price.desc(), Product.id.desc())
        elif sort_mode in ("rating", "rating_desc", "top_rated"):
            query = query.order_by(Product.rating.desc(), Product.reviews_count.desc())
        elif sort_mode in ("oldest", "created_at_asc"):
            query = query.order_by(Product.created_at.asc(), Product.id.asc())
        else:  # "newest" / default
            query = query.order_by(Product.created_at.desc(), Product.id.desc())

        # 5. Pagination
        products = query.offset(skip).limit(limit).all()
        return products, total

    @staticmethod
    def get_by_id(db: Session, product_id: int) -> Optional[Product]:
        """Retrieves a single product by primary key ID with loaded category relationship."""
        return (
            db.query(Product)
            .options(joinedload(Product.category))
            .filter(Product.id == product_id)
            .first()
        )

    @staticmethod
    def get_by_slug(db: Session, slug: str) -> Optional[Product]:
        """Retrieves a single product by URL slug with loaded category relationship."""
        return (
            db.query(Product)
            .options(joinedload(Product.category))
            .filter(Product.slug == slug)
            .first()
        )

    @staticmethod
    def create(db: Session, product_in: ProductCreate) -> Product:
        """
        Creates a new product with category verification, stock validation, and slug uniqueness.
        """
        # Validate category existence
        category = db.query(Category).filter(Category.id == product_in.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with ID {product_in.category_id} not found. Please choose a valid category.",
            )

        # Validate stock
        if product_in.stock < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid stock quantity: stock cannot be negative.",
            )

        # Generate unique slug
        slug = product_in.slug or slugify(product_in.name)
        existing = db.query(Product).filter(Product.slug == slug).first()
        if existing:
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        product = Product(
            name=product_in.name,
            slug=slug,
            description=product_in.description,
            price=product_in.price,
            original_price=product_in.original_price,
            brand=product_in.brand,
            badge=product_in.badge,
            stock=product_in.stock,
            image_url=product_in.image_url,
            category_id=product_in.category_id,
            is_active=product_in.is_active,
            is_featured=product_in.is_featured,
            rating=product_in.rating,
            reviews_count=product_in.reviews_count,
            merchant_id=product_in.merchant_id,
            store_name=product_in.store_name,
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def update(db: Session, product: Product, product_in: ProductUpdate) -> Product:
        """
        Updates product attributes with validation for category, stock, and price.
        """
        update_data = product_in.model_dump(exclude_unset=True)

        # Validate category if supplied
        if "category_id" in update_data and update_data["category_id"] is not None:
            category = db.query(Category).filter(Category.id == update_data["category_id"]).first()
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Category with ID {update_data['category_id']} not found.",
                )

        # Validate stock if supplied
        if "stock" in update_data and update_data["stock"] is not None:
            if update_data["stock"] < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid stock quantity: stock cannot be negative.",
                )

        # Validate price if supplied
        if "price" in update_data and update_data["price"] is not None:
            if update_data["price"] <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid price: price must be greater than zero.",
                )

        # Handle slug update or conflict
        if "name" in update_data and not update_data.get("slug"):
            new_slug = slugify(update_data["name"])
            existing = db.query(Product).filter(Product.slug == new_slug, Product.id != product.id).first()
            if existing:
                new_slug = f"{new_slug}-{uuid.uuid4().hex[:6]}"
            update_data["slug"] = new_slug

        for field, value in update_data.items():
            setattr(product, field, value)

        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def update_stock(
        db: Session,
        product: Product,
        stock: Optional[int] = None,
        adjustment: Optional[int] = None,
    ) -> Product:
        """
        Updates product stock quantity either by setting an absolute value or applying a delta.
        Rejects negative stock levels with HTTP 400.
        """
        if stock is not None:
            if stock < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid stock quantity: stock cannot be negative.",
                )
            product.stock = stock
        elif adjustment is not None:
            new_stock = product.stock + adjustment
            if new_stock < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid stock adjustment: deducting {abs(adjustment)} units would result in negative inventory ({new_stock}). Current stock is {product.stock}.",
                )
            product.stock = new_stock
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either 'stock' or 'adjustment' must be provided to update inventory.",
            )

        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def delete(db: Session, product: Product) -> None:
        """Deletes a product from the database or soft-deactivates if order history exists."""
        from app.models.order import OrderItem
        from app.models.cart import CartItem
        from app.models.wishlist import Wishlist
        from app.models.review import Review

        has_orders = db.query(OrderItem).filter(OrderItem.product_id == product.id).first() is not None
        if has_orders:
            # Soft-delete to preserve order history and foreign key integrity
            product.is_active = False
            db.add(product)
            db.commit()
            return

        # Explicitly clean up related items before deleting product
        db.query(CartItem).filter(CartItem.product_id == product.id).delete(synchronize_session=False)
        db.query(Wishlist).filter(Wishlist.product_id == product.id).delete(synchronize_session=False)
        db.query(Review).filter(Review.product_id == product.id).delete(synchronize_session=False)
        db.delete(product)
        db.commit()

    @staticmethod
    async def save_product_image(
        db: Session,
        file: UploadFile,
        product: Optional[Product] = None,
    ) -> Tuple[str, str]:
        """
        Saves an uploaded product image file into the dedicated local uploads directory.
        Returns (image_url, filename).
        """
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No filename provided in upload payload.",
            )

        # Validate file extension
        _, ext = os.path.splitext(file.filename.lower())
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file format '{ext}'. Allowed extensions: {sorted(list(ALLOWED_IMAGE_EXTENSIONS))}",
            )

        # Destination directory in dedicated local uploads
        products_dir = os.path.join(settings.UPLOAD_DIR, "products")
        os.makedirs(products_dir, exist_ok=True)

        # Generate unique filename to prevent collisions and sanitize names
        safe_base = slugify(os.path.splitext(file.filename)[0]) or "product"
        unique_filename = f"{uuid.uuid4().hex[:12]}_{safe_base}{ext}"
        destination = os.path.join(products_dir, unique_filename)

        # Read contents and check file size limit
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum upload size of {MAX_FILE_SIZE // (1024 * 1024)} MB.",
            )

        with open(destination, "wb") as buffer:
            buffer.write(contents)

        image_url = f"/uploads/products/{unique_filename}"

        # If attached to a specific product, update its image_url
        if product:
            product.image_url = image_url
            db.add(product)
            db.commit()
            db.refresh(product)

        return image_url, unique_filename

    # --- Category Operations ---

    @staticmethod
    def get_categories(db: Session, include_inactive: bool = False) -> List[Category]:
        """
        Lists all categories with active product counts.
        """
        query = db.query(Category)
        if not include_inactive:
            query = query.filter(Category.is_active == True)
        categories = query.order_by(Category.name.asc()).all()

        # Annotate product counts
        for cat in categories:
            cat.product_count = (
                db.query(func.count(Product.id))
                .filter(Product.category_id == cat.id, Product.is_active == True)
                .scalar()
                or 0
            )
        return categories

    @staticmethod
    def get_category_by_id(db: Session, category_id: int) -> Optional[Category]:
        """Retrieves a single category by primary key ID."""
        cat = db.query(Category).filter(Category.id == category_id).first()
        if cat:
            cat.product_count = (
                db.query(func.count(Product.id))
                .filter(Product.category_id == cat.id, Product.is_active == True)
                .scalar()
                or 0
            )
        return cat

    @staticmethod
    def create_category(db: Session, cat_in: CategoryCreate) -> Category:
        """
        Creates a new category. Returns HTTP 409 Conflict if category name or slug already exists.
        """
        slug = cat_in.slug or slugify(cat_in.name)

        # Check for duplicate name or slug
        existing = db.query(Category).filter(
            (Category.name.ilike(cat_in.name.strip())) | (Category.slug == slug)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A category with name '{cat_in.name}' or slug '{slug}' already exists.",
            )

        category = Category(
            name=cat_in.name.strip(),
            slug=slug,
            description=cat_in.description,
            image_url=cat_in.image_url,
            is_active=cat_in.is_active,
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        category.product_count = 0
        return category

    @staticmethod
    def update_category(db: Session, category: Category, cat_in: CategoryUpdate) -> Category:
        """
        Updates category attributes. Returns HTTP 409 Conflict if new name/slug conflicts with another category.
        """
        update_data = cat_in.model_dump(exclude_unset=True)

        # Validate name or slug uniqueness if updating
        new_name = update_data.get("name")
        new_slug = update_data.get("slug") or (slugify(new_name) if new_name else None)

        if new_name or new_slug:
            conflict_filters = []
            if new_name:
                conflict_filters.append(Category.name.ilike(new_name.strip()))
            if new_slug:
                conflict_filters.append(Category.slug == new_slug)

            existing = (
                db.query(Category)
                .filter(Category.id != category.id)
                .filter(*conflict_filters)
                .first()
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Another category already exists with name '{new_name or existing.name}' or slug '{new_slug or existing.slug}'.",
                )

        if new_slug and "slug" not in update_data:
            update_data["slug"] = new_slug

        for field, value in update_data.items():
            setattr(category, field, value)

        db.add(category)
        db.commit()
        db.refresh(category)
        category.product_count = (
            db.query(func.count(Product.id))
            .filter(Product.category_id == category.id, Product.is_active == True)
            .scalar()
            or 0
        )
        return category

    @staticmethod
    def delete_category(db: Session, category: Category) -> None:
        """
        Deletes a category. Rejects deletion with HTTP 400 Bad Request if it still contains products.
        """
        linked_count = db.query(Product).filter(Product.category_id == category.id).count()
        if linked_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete category '{category.name}' because it contains {linked_count} product(s). Please delete or reassign those products first.",
            )

        db.delete(category)
        db.commit()


product_service = ProductService()
