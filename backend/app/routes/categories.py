from typing import List, Optional
from pathlib import Path
import shutil
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.category import CategoryResponse, CategoryCreate, CategoryUpdate
from app.schemas.product import ImageUploadResponse
from app.schemas.common import MessageResponse
from app.services.product_service import product_service
from app.routes.deps import get_current_admin_user
from app.models.user import User
from app.core.config import settings

router = APIRouter(prefix="/categories", tags=["Categories"])

CATEGORY_UPLOAD_DIR = Path(settings.UPLOAD_DIR) / "categories"
CATEGORY_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post(
    "/upload-image",
    response_model=ImageUploadResponse,
    summary="Upload category cover image (Admin only)",
    description="Stores an uploaded category cover image and returns its public URL path.",
)
async def upload_category_image(
    file: UploadFile = File(...),
    _: User = Depends(get_current_admin_user),
):
    """Upload a category cover image file."""
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
    ext = Path(file.filename or "").suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(sorted(allowed_extensions))}",
        )

    unique_filename = f"cat_{uuid4().hex[:10]}{ext}"
    destination_path = CATEGORY_UPLOAD_DIR / unique_filename

    with destination_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"/uploads/categories/{unique_filename}"
    return ImageUploadResponse(
        image_url=image_url,
        filename=unique_filename,
        message="Category cover image uploaded successfully.",
    )


@router.get(
    "/",
    response_model=List[CategoryResponse],
    summary="List all categories",
    description="Public endpoint to list all active product departments with dynamic product counts.",
)
def get_categories(
    include_inactive: bool = Query(False, description="Whether to include deactivated categories"),
    db: Session = Depends(get_db),
):
    """Get all active product categories."""
    return product_service.get_categories(db=db, include_inactive=include_inactive)


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Get category by ID",
    description="Public endpoint to retrieve category details and product counts by primary key ID.",
)
def get_category_by_id(category_id: int, db: Session = Depends(get_db)):
    """Get a specific category by ID."""
    category = product_service.get_category_by_id(db=db, category_id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID {category_id} not found.",
        )
    return category


@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new category (Admin only)",
    description=(
        "Restricted to administrators. Creates a new category department. "
        "Returns HTTP 409 Conflict if category name or slug already exists."
    ),
)
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """Create a new product category."""
    return product_service.create_category(db=db, cat_in=cat_in)


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Update category details (Admin only)",
    description=(
        "Restricted to administrators. Updates category details. "
        "Returns HTTP 404 if not found, or HTTP 409 if new name conflicts with an existing category."
    ),
)
def update_category(
    category_id: int,
    cat_in: CategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """Update category details."""
    category = product_service.get_category_by_id(db=db, category_id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID {category_id} not found.",
        )
    return product_service.update_category(db=db, category=category, cat_in=cat_in)


@router.delete(
    "/{category_id}",
    response_model=MessageResponse,
    summary="Delete a category (Admin only)",
    description=(
        "Restricted to administrators. Removes a category from the database. "
        "Returns HTTP 400 Bad Request if the category currently contains products."
    ),
)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """Delete a category department."""
    category = product_service.get_category_by_id(db=db, category_id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID {category_id} not found.",
        )
    product_service.delete_category(db=db, category=category)
    return MessageResponse(
        message=f"Category '{category.name}' (ID {category_id}) deleted successfully."
    )
