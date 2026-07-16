from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.dependencies import get_current_user
from app.models.user import User
from ..schemas.favorite import FavoriteCreate, FavoriteResponse
from ..services.car import CarService

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("")
def get_favorites(
    page: int = 1,
    size: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's favorite cars"""
    result = CarService.get_user_favorites(db, current_user.id, page, size)
    return result


@router.post("", status_code=status.HTTP_201_CREATED)
def add_favorite(
    data: FavoriteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add car to favorites"""
    added = CarService.toggle_favorite(db, current_user.id, data.car_id)
    return {"favorited": added}


@router.delete("/{car_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    car_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove car from favorites"""
    CarService.toggle_favorite(db, current_user.id, car_id)
    return None 