import math
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.product import (
    ProductResponse,
    ProductListResponse,
    ProductCreate,
    ProductUpdate,
    StockUpdate,
    ImageUploadResponse,
    MultipleImageUploadResponse,
)
from app.schemas.common import MessageResponse
from app.services.product_service import product_service
from app.routes.deps import get_current_admin_user, get_current_merchant_user
from app.models.user import User

router = APIRouter(prefix="/products", tags=["Products"])


@router.get(
    "/",
    response_model=ProductListResponse,
    summary="List and search products",
    description=(
        "Public endpoint to browse and search the product catalog. "
        "Supports name/keyword search, category filter (by slug or ID), price range filtering, "
        "sorting by price, rating, or newest, and page-based pagination."
    ),
)
def list_products(
    page: int = Query(1, ge=1, description="Page number (starts at 1)"),
    size: int = Query(12, ge=1, le=100, description="Items per page (max 100)"),
    category: Optional[str] = Query(None, description="Filter by category slug"),
    category_id: Optional[int] = Query(None, description="Filter by category primary key ID"),
    search: Optional[str] = Query(None, description="Search keyword for product name or description"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Maximum price filter"),
    sort_by: Optional[str] = Query(
        "newest",
        description="Sort option: 'price_asc', 'price_desc', 'rating', 'newest', 'oldest'",
    ),
    db: Session = Depends(get_db),
):
    """
    List products with pagination, search, price/category filters, and sorting.
    """
    skip = (page - 1) * size
    products, total = product_service.get_products(
        db=db,
        skip=skip,
        limit=size,
        category_slug=category,
        category_id=category_id,
        search=search,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        include_inactive=False,
    )
    pages = math.ceil(total / size) if size > 0 and total > 0 else 1

    return ProductListResponse(
        items=products,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get(
    "/slug/{slug}",
    response_model=ProductResponse,
    summary="Get product by URL slug",
    description="Public endpoint to retrieve complete product details and category using its unique slug.",
)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)):
    """Retrieve product details by slug."""
    product = product_service.get_by_slug(db=db, slug=slug)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with slug '{slug}' not found.",
        )
    return product


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Get product by ID",
    description="Public endpoint to retrieve complete product details by its primary key ID.",
)
def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    """Retrieve product details by ID."""
    product = product_service.get_by_id(db=db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )
    return product


@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product (Admin and Merchant)",
    description=(
        "Restricted to administrators and merchants. Creates a new hardware product with category validation, "
        "stock count validation, price check, and automatic unique slug generation."
    ),
)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_merchant_user),
):
    """Create a new product listing."""
    if not product_in.merchant_id and not current_user.is_administrator:
        product_in.merchant_id = current_user.id
    if not product_in.store_name:
        product_in.store_name = current_user.store_name or current_user.full_name or "Merchant Store"
    return product_service.create(db=db, product_in=product_in)


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Update product details (Admin and Merchant)",
    description="Restricted to administrators and merchants. Updates product attributes with input validation.",
)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_merchant_user),
):
    """Update an existing product listing."""
    product = product_service.get_by_id(db=db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )
    return product_service.update(db=db, product=product, product_in=product_in)


@router.patch(
    "/{product_id}/stock",
    response_model=ProductResponse,
    summary="Manage product stock quantity (Admin and Merchant)",
    description=(
        "Restricted to administrators and merchants. Updates or adjusts warehouse stock quantity. "
        "Accepts either an absolute 'stock' count or a delta 'adjustment'. Rejects negative inventory."
    ),
)
def manage_product_stock(
    product_id: int,
    stock_in: StockUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_merchant_user),
):
    """Update inventory quantity for a product."""
    product = product_service.get_by_id(db=db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )
    return product_service.update_stock(
        db=db,
        product=product,
        stock=stock_in.stock,
        adjustment=stock_in.effective_adjustment,
    )


@router.post(
    "/{product_id}/upload-image",
    response_model=ImageUploadResponse,
    summary="Upload product image (Admin and Merchant)",
    description=(
        "Restricted to administrators and merchants. Stores an uploaded image in the dedicated local uploads directory "
        "and attaches the resulting URL to the product. Does not use AWS S3."
    ),
)
async def upload_product_image_for_product(
    product_id: int,
    file: UploadFile = File(..., description="Image file (PNG, JPG, JPEG, WEBP, GIF, SVG)"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_merchant_user),
):
    """Upload and attach an image to an existing product."""
    product = product_service.get_by_id(db=db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )

    image_url, filename = await product_service.save_product_image(
        db=db, file=file, product=product
    )
    return ImageUploadResponse(
        image_url=image_url,
        filename=filename,
        message=f"Product image uploaded and attached to '{product.name}' successfully.",
    )


@router.post(
    "/upload-image",
    response_model=ImageUploadResponse,
    summary="Upload product image standalone (Admin and Merchant)",
    description=(
        "Restricted to administrators and merchants. Stores an uploaded product image file in the dedicated local uploads directory. "
        "Returns the local static URL to use when creating or updating a product."
    ),
)
async def upload_product_image_standalone(
    file: UploadFile = File(..., description="Image file (PNG, JPG, JPEG, WEBP, GIF, SVG)"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_merchant_user),
):
    """Upload a product image without immediately attaching it to an existing product."""
    image_url, filename = await product_service.save_product_image(
        db=db, file=file, product=None
    )
    return ImageUploadResponse(
        image_url=image_url,
        filename=filename,
        message="Image uploaded successfully to local storage.",
    )


@router.post(
    "/upload-multiple-images",
    response_model=MultipleImageUploadResponse,
    summary="Upload multiple product images (Admin and Merchant)",
    description="Stores multiple uploaded product images in dedicated local storage and returns list of accessible URLs.",
)
async def upload_multiple_product_images(
    files: List[UploadFile] = File(..., description="Batch of image files (PNG, JPG, JPEG, WEBP, GIF, SVG)"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_merchant_user),
):
    """Upload multiple product images simultaneously."""
    saved_urls: List[str] = []
    saved_filenames: List[str] = []
    for file in files:
        if file.filename:
            image_url, filename = await product_service.save_product_image(
                db=db, file=file, product=None
            )
            saved_urls.append(image_url)
            saved_filenames.append(filename)

    return MultipleImageUploadResponse(
        image_urls=saved_urls,
        filenames=saved_filenames,
        count=len(saved_urls),
        message=f"Successfully uploaded {len(saved_urls)} product image(s).",
    )


@router.delete(
    "/{product_id}",
    response_model=MessageResponse,
    summary="Delete a product (Admin and Merchant)",
    description="Restricted to administrators and merchants. Removes a product listing from the database.",
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_merchant_user),
):
    """Delete a product listing."""
    product = product_service.get_by_id(db=db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )
    product_service.delete(db=db, product=product)
    return MessageResponse(message=f"Product {product_id} ('{product.name}') deleted successfully.")
