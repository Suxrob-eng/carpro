from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, asc
from fastapi import HTTPException, status, UploadFile

from app.models.car import Car, CarImage
from app.models.user import User
from app.models.favorite import Favorite
from app.models.comment import Comment
from app.models.category import Category
from app.models.enums import CarStatus, CarFuel, CarTransmission
from ..schemas.car import CarCreate, CarUpdate, CarFilterParams, CarResponse
from ..utils.file_upload import upload_car_images


class CarService:
    @staticmethod
    def get_car_by_id(db: Session, car_id: int, increment_view: bool = False) -> Car:
        query = db.query(Car).options(
            joinedload(Car.images),
            joinedload(Car.owner),
            joinedload(Car.category),
        )

        car = query.filter(Car.id == car_id).first()

        if not car:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Car not found",
            )

        if increment_view:
            car.views_count += 1
            db.commit()

        return car

    @staticmethod
    def create_car(db: Session, data: CarCreate, owner_id: int) -> Car:
        # Check category exists if provided
        if data.category_id:
            category = db.query(Category).filter(Category.id == data.category_id).first()
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found",
                )

        car = Car(
            brand=data.brand,
            model=data.model,
            year=data.year,
            price=data.price,
            mileage=data.mileage,
            fuel=data.fuel,
            transmission=data.transmission,
            color=data.color,
            description=data.description,
            category_id=data.category_id,
            owner_id=owner_id,
            status=CarStatus.ACTIVE,
        )

        db.add(car)
        db.commit()
        db.refresh(car)

        return car

    @staticmethod
    def update_car(db: Session, car_id: int, data: CarUpdate, user_id: int) -> Car:
        car = CarService.get_car_by_id(db, car_id)

        # Check ownership or admin
        if car.owner_id != user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or user.role != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to update this car",
                )

        update_data = data.model_dump(exclude_unset=True)

        # Check category if provided
        if "category_id" in update_data and update_data["category_id"]:
            category = db.query(Category).filter(Category.id == update_data["category_id"]).first()
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found",
                )

        for key, value in update_data.items():
            setattr(car, key, value)

        db.commit()
        db.refresh(car)
        return car

    @staticmethod
    def delete_car(db: Session, car_id: int, user_id: int) -> None:
        car = CarService.get_car_by_id(db, car_id)

        # Check ownership or admin
        if car.owner_id != user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or user.role != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to delete this car",
                )

        db.delete(car)
        db.commit()

    @staticmethod
    def upload_images(db: Session, car_id: int, files: List[UploadFile]) -> List[CarImage]:
        car = CarService.get_car_by_id(db, car_id)

        image_urls = upload_car_images(files, car_id)

        images = []
        for i, url in enumerate(image_urls):
            is_primary = (i == 0)
            image = CarImage(
                image_url=url,
                is_primary=is_primary,
                order=i,
                car_id=car_id,
            )
            db.add(image)
            images.append(image)

        db.commit()

        # Refresh car to load images
        db.refresh(car)

        return images

    @staticmethod
    def get_cars(
        db: Session,
        filters: CarFilterParams,
    ) -> Dict[str, Any]:
        query = db.query(Car).options(
            joinedload(Car.images),
            joinedload(Car.owner),
            joinedload(Car.category),
        ).filter(Car.status == CarStatus.ACTIVE)

        # Apply filters
        if filters.brand:
            query = query.filter(Car.brand.ilike(f"%{filters.brand}%"))

        if filters.model:
            query = query.filter(Car.model.ilike(f"%{filters.model}%"))

        if filters.min_price is not None:
            query = query.filter(Car.price >= filters.min_price)

        if filters.max_price is not None:
            query = query.filter(Car.price <= filters.max_price)

        if filters.year:
            query = query.filter(Car.year == filters.year)

        if filters.min_year:
            query = query.filter(Car.year >= filters.min_year)

        if filters.max_year:
            query = query.filter(Car.year <= filters.max_year)

        if filters.fuel:
            query = query.filter(Car.fuel == filters.fuel)

        if filters.transmission:
            query = query.filter(Car.transmission == filters.transmission)

        if filters.color:
            query = query.filter(Car.color.ilike(f"%{filters.color}%"))

        if filters.category_id:
            query = query.filter(Car.category_id == filters.category_id)

        if filters.owner_id:
            query = query.filter(Car.owner_id == filters.owner_id)

        if filters.min_mileage is not None:
            query = query.filter(Car.mileage >= filters.min_mileage)

        if filters.max_mileage is not None:
            query = query.filter(Car.mileage <= filters.max_mileage)

        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Car.brand.ilike(search_term),
                    Car.model.ilike(search_term),
                    Car.description.ilike(search_term),
                )
            )

        # Sorting
        sort_column = filters.sort_by or "created_at"
        sort_direction = filters.sort_order or "desc"

        sort_mapping = {
            "price": Car.price,
            "year": Car.year,
            "mileage": Car.mileage,
            "created_at": Car.created_at,
            "views_count": Car.views_count,
            "average_rating": Car.average_rating,
        }

        column = sort_mapping.get(sort_column, Car.created_at)

        if sort_direction == "asc":
            query = query.order_by(asc(column))
        else:
            query = query.order_by(desc(column))

        # Pagination
        total = query.count()
        page = filters.page or 1
        size = filters.size or 10
        offset = (page - 1) * size

        cars = query.offset(offset).limit(size).all()

        # Build response with additional counts
        result_data = []
        for car in cars:
            car_dict = CarResponse.model_validate(car).model_dump()
            # Add counts
            car_dict["comments_count"] = db.query(Comment).filter(Comment.car_id == car.id).count()
            car_dict["favorites_count"] = db.query(Favorite).filter(Favorite.car_id == car.id).count()
            result_data.append(car_dict)

        return {
            "data": result_data,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size if total > 0 else 0,
        }

    @staticmethod
    def toggle_favorite(db: Session, user_id: int, car_id: int) -> bool:
        # Check car exists
        car = db.query(Car).filter(Car.id == car_id).first()
        if not car:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Car not found",
            )

        existing = db.query(Favorite).filter(
            Favorite.user_id == user_id,
            Favorite.car_id == car_id,
        ).first()

        if existing:
            db.delete(existing)
            db.commit()
            return False  # Removed from favorites
        else:
            favorite = Favorite(user_id=user_id, car_id=car_id)
            db.add(favorite)
            db.commit()
            return True  # Added to favorites

    @staticmethod
    def add_comment(db: Session, user_id: int, car_id: int, content: str, rating: Optional[float] = None) -> Comment:
        car = db.query(Car).filter(Car.id == car_id).first()
        if not car:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Car not found",
            )

        comment = Comment(
            content=content,
            rating=rating,
            user_id=user_id,
            car_id=car_id,
        )

        db.add(comment)

        # Update average rating
        if rating is not None:
            avg_rating = db.query(func.avg(Comment.rating)).filter(
                Comment.car_id == car_id,
                Comment.rating.isnot(None)
            ).scalar()
            car.average_rating = round(float(avg_rating or 0), 2)

        db.commit()
        db.refresh(comment)

        return comment

    @staticmethod
    def get_comments(db: Session, car_id: int, page: int = 1, size: int = 10) -> Dict[str, Any]:
        car = db.query(Car).filter(Car.id == car_id).first()
        if not car:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Car not found",
            )

        query = db.query(Comment).filter(
            Comment.car_id == car_id,
            Comment.parent_id.is_(None),
        )

        total = query.count()
        offset = (page - 1) * size
        comments = query.offset(offset).limit(size).all()

        return {
            "data": comments,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size if total > 0 else 0,
        }

    @staticmethod
    def get_user_favorites(db: Session, user_id: int, page: int = 1, size: int = 10) -> Dict[str, Any]:
        query = db.query(Car).options(
            joinedload(Car.images),
            joinedload(Car.owner),
        ).join(Favorite, Favorite.car_id == Car.id).filter(
            Favorite.user_id == user_id,
            Car.status == CarStatus.ACTIVE,
        )

        total = query.count()
        offset = (page - 1) * size
        cars = query.offset(offset).limit(size).all()

        result_data = []
        for car in cars:
            car_dict = CarResponse.model_validate(car).model_dump()
            car_dict["comments_count"] = db.query(Comment).filter(Comment.car_id == car.id).count()
            car_dict["favorites_count"] = db.query(Favorite).filter(Favorite.car_id == car.id).count()
            result_data.append(car_dict)

        return {
            "data": result_data,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size if total > 0 else 0,
        }

    @staticmethod
    def get_car_stats(db: Session) -> Dict[str, Any]:
        total = db.query(Car).count()
        active = db.query(Car).filter(Car.status == CarStatus.ACTIVE).count()
        sold = db.query(Car).filter(Car.status == CarStatus.SOLD).count()
        featured = db.query(Car).filter(Car.is_featured == True).count()

        return {
            "total": total,
            "active": active,
            "sold": sold,
            "featured": featured,
        }