from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from ..core.database import get_db
from ..core.dependencies import get_current_admin_user
from app.models.user import User
from app.models.enums import UserRole
from ..schemas.user import UserResponse, UserListResponse
from ..services.user import UserService
from ..services.car import CarService

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=UserListResponse)
def get_users(
    page: int = 1,
    size: int = 10,
    search: Optional[str] = None,
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get all users (admin only)"""
    result = UserService.get_users(db, page, size, search, role, is_active)
    return UserListResponse(**result)


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_admin(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get user by ID (admin only)"""
    user = UserService.get_user_by_id(db, user_id)
    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}/block", response_model=UserResponse)
def block_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Block a user (admin only)"""
    user = UserService.block_user(db, user_id, current_user.id)
    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}/unblock", response_model=UserResponse)
def unblock_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Unblock a user (admin only)"""
    user = UserService.unblock_user(db, user_id)
    return UserResponse.model_validate(user)


@router.get("/stats")
def get_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get admin statistics (admin only)"""
    user_stats = UserService.get_user_stats(db)
    car_stats = CarService.get_car_stats(db)

    return {
        "users": user_stats,
        "cars": car_stats,
    }