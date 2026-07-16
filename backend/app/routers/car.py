from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List

from ..core.database import get_db
from ..core.dependencies import get_current_user, get_current_user_optional
from app.models.user import User
from ..schemas.car import (
    CarCreate,
    CarUpdate,
    CarResponse,
    CarListResponse,
    CarFilterParams,
    CarImageResponse,
)
from ..schemas.comment import CommentCreate, CommentResponse
from ..services.car import CarService

router = APIRouter(prefix="/cars", tags=["Cars"])


@router.get("", response_model=CarListResponse)
def get_cars(
    brand: Optional[str] = None,
    model: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    year: Optional[int] = None,
    fuel: Optional[str] = None,
    transmission: Optional[str] = None,
    color: Optional[str] = None,
    category_id: Optional[int] = None,
    owner_id: Optional[int] = None,
    min_year: Optional[int] = None,
    max_year: Optional[int] = None,
    min_mileage: Optional[int] = None,
    max_mileage: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    page: int = 1,
    size: int = 10,
    db: Session = Depends(get_db),
):
    """Get all cars with filters"""
    filters = CarFilterParams(
        brand=brand,
        model=model,
        min_price=min_price,
        max_price=max_price,
        year=year,
        fuel=fuel,
        transmission=transmission,
        color=color,
        category_id=category_id,
        owner_id=owner_id,
        min_year=min_year,
        max_year=max_year,
        min_mileage=min_mileage,
        max_mileage=max_mileage,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        size=size,
    )
    result = CarService.get_cars(db, filters)
    return CarListResponse(**result)


@router.post("", response_model=CarResponse, status_code=status.HTTP_201_CREATED)
def create_car(
    data: CarCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new car"""
    car = CarService.create_car(db, data, current_user.id)
    return CarResponse.model_validate(car)


@router.get("/{car_id}", response_model=CarResponse)
def get_car(
    car_id: int,
    db: Session = Depends(get_db),
):
    """Get car by ID"""
    car = CarService.get_car_by_id(db, car_id, increment_view=True)
    result = CarResponse.model_validate(car).model_dump()
    result["comments_count"] = len(car.comments) if car.comments else 0
    result["favorites_count"] = len(car.favorites) if car.favorites else 0
    return result


@router.put("/{car_id}", response_model=CarResponse)
def update_car(
    car_id: int,
    data: CarUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update car"""
    car = CarService.update_car(db, car_id, data, current_user.id)
    return CarResponse.model_validate(car)


@router.delete("/{car_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_car(
    car_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete car"""
    CarService.delete_car(db, car_id, current_user.id)
    return None


@router.post("/{car_id}/images", response_model=List[CarImageResponse])
def upload_car_images(
    car_id: int,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload images for a car"""
    # Check ownership
    car = CarService.get_car_by_id(db, car_id)
    if car.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload images for this car",
        )

    images = CarService.upload_images(db, car_id, files)
    return [CarImageResponse.model_validate(img) for img in images]


@router.post("/{car_id}/comments", response_model=CommentResponse)
def add_comment(
    car_id: int,
    data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a comment to a car"""
    comment = CarService.add_comment(
        db, current_user.id, car_id, data.content, data.rating
    )
    return CommentResponse.model_validate(comment)


@router.get("/{car_id}/comments")
def get_comments(
    car_id: int,
    page: int = 1,
    size: int = 10,
    db: Session = Depends(get_db),
):
    """Get comments for a car"""
    result = CarService.get_comments(db, car_id, page, size)

    # Load user data for each comment
    comments_data = []
    for comment in result["data"]:
        comment_dict = CommentResponse.model_validate(comment).model_dump()
        if comment.user:
            comment_dict["username"] = comment.user.username
            comment_dict["avatar_url"] = comment.user.avatar_url
        comments_data.append(comment_dict)

    return {
        "data": comments_data,
        "total": result["total"],
        "page": result["page"],
        "size": result["size"],
        "pages": result["pages"],
    }


@router.get("/{car_id}/favorites")
def check_favorite(
    car_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check if car is favorited by current user"""
    from app.models.favorite import Favorite

    exists = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.car_id == car_id,
    ).first() is not None

    return {"is_favorite": exists}