from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.address import Address
from app.models.user import User
from app.schemas.address import AddressCreate, AddressUpdate, AddressResponse
from app.schemas.common import MessageResponse
from app.routes.deps import get_current_active_user

router = APIRouter(prefix="/addresses", tags=["Addresses"])


@router.get("/", response_model=List[AddressResponse])
def get_user_addresses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get all saved addresses for the authenticated user.
    """
    return (
        db.query(Address)
        .filter(Address.user_id == current_user.id)
        .order_by(Address.is_default_shipping.desc(), Address.id.desc())
        .all()
    )


@router.post("/", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
def create_address(
    address_in: AddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Add a new shipping or billing address.
    """
    if address_in.is_default_shipping:
        db.query(Address).filter(
            Address.user_id == current_user.id, Address.is_default_shipping == True
        ).update({"is_default_shipping": False})

    if address_in.is_default_billing:
        db.query(Address).filter(
            Address.user_id == current_user.id, Address.is_default_billing == True
        ).update({"is_default_billing": False})

    address = Address(user_id=current_user.id, **address_in.model_dump())
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.put("/{address_id}", response_model=AddressResponse)
def update_address(
    address_id: int,
    address_in: AddressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update an existing address.
    """
    address = (
        db.query(Address)
        .filter(Address.id == address_id, Address.user_id == current_user.id)
        .first()
    )
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found.",
        )

    update_data = address_in.model_dump(exclude_unset=True)

    if update_data.get("is_default_shipping"):
        db.query(Address).filter(
            Address.user_id == current_user.id, Address.id != address_id
        ).update({"is_default_shipping": False})

    if update_data.get("is_default_billing"):
        db.query(Address).filter(
            Address.user_id == current_user.id, Address.id != address_id
        ).update({"is_default_billing": False})

    for field, value in update_data.items():
        setattr(address, field, value)

    db.commit()
    db.refresh(address)
    return address


@router.delete("/{address_id}", response_model=MessageResponse)
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete a saved address.
    """
    address = (
        db.query(Address)
        .filter(Address.id == address_id, Address.user_id == current_user.id)
        .first()
    )
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found.",
        )
    db.delete(address)
    db.commit()
    return MessageResponse(message="Address deleted successfully.")
