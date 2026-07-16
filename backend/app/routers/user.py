from ..core.dependencies import get_current_user_optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional

from ..core.database import get_db
from ..core.dependencies import get_current_user, get_current_admin_user
from app.models.user import User
from app.models.enums import UserRole
from ..schemas.user import UserResponse, UserUpdate, UserListResponse
from ..services.user import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user by ID"""
    user = UserService.get_user_by_id(db, user_id)
    return UserResponse.model_validate(user)


@router.get("/{user_id}/cars")
def get_user_cars(
    user_id: int,
    page: int = 1,
    size: int = 10,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Get cars by user"""
    from ..services.car import CarService
    from ..schemas.car import CarFilterParams

    filters = CarFilterParams(owner_id=user_id, page=page, size=size)
    return CarService.get_cars(db, filters)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user (admin only)"""
    # Check if current user is admin or the user themselves
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user",
        )

    user = UserService.update_profile(db, user_id, data)
    return UserResponse.model_validate(user)