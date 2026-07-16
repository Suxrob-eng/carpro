from sqlalchemy.orm import Session
from models.car import Car
from models.category import Category
from backend.app.schemas.car import CreateCar, UpdateCar
from typing import Optional, List


class CarService:
    
    @staticmethod
    def get_car_by_id(db: Session, car_id: int) -> Optional[Car]:
        return db.query(Car).filter(Car.id == car_id).first()
    
    @staticmethod
    def create_car(db: Session, car_data: CreateCar, owner_id: int) -> Car:
        if car_data.category_id:
            category = db.query(Category).filter(
                Category.id == car_data.category_id
            ).first()
            if not category:
                raise ValueError("Category not found")
        
        new_car = Car(
            brand=car_data.brand,
            model=car_data.model,
            year=car_data.year,
            price=car_data.price,
            mileage=car_data.mileage,
            fuel=car_data.fuel,
            transmission=car_data.transmission,
            color=car_data.color,
            description=car_data.description,
            owner_id=owner_id,
            category_id=car_data.category_id
        )
        
        db.add(new_car)
        db.commit()
        db.refresh(new_car)
        return new_car
    
    @staticmethod
    def update_car(
        db: Session, 
        car_id: int, 
        car_data: UpdateCar,
        user_id: int,
        is_admin: bool = False
    ) -> Car:
        car = CarService.get_car_by_id(db, car_id)
        if not car:
            raise ValueError("Car not found")
        
        if not is_admin and car.owner_id != user_id:
            raise ValueError("You don't have permission to update this car")
        
        if car_data.brand is not None:
            car.brand = car_data.brand
        if car_data.model is not None:
            car.model = car_data.model
        if car_data.year is not None:
            car.year = car_data.year
        if car_data.price is not None:
            car.price = car_data.price
        if car_data.mileage is not None:
            car.mileage = car_data.mileage
        if car_data.fuel is not None:
            car.fuel = car_data.fuel
        if car_data.transmission is not None:
            car.transmission = car_data.transmission
        if car_data.color is not None:
            car.color = car_data.color
        if car_data.description is not None:
            car.description = car_data.description
        if car_data.category_id is not None:
            category = db.query(Category).filter(
                Category.id == car_data.category_id
            ).first()
            if not category:
                raise ValueError("Category not found")
            car.category_id = car_data.category_id
        
        db.commit()
        db.refresh(car)
        return car
    
    @staticmethod
    def delete_car(
        db: Session, 
        car_id: int,
        user_id: int,
        is_admin: bool = False
    ) -> None:
        car = CarService.get_car_by_id(db, car_id)
        if not car:
            raise ValueError("Car not found")
        
        if not is_admin and car.owner_id != user_id:
            raise ValueError("You don't have permission to delete this car")
        
        db.delete(car)
        db.commit()