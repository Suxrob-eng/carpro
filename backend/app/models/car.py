from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, Text,
    ForeignKey, Enum as SQLEnum, Index
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base
from .enums import CarFuel, CarTransmission, CarStatus


class Car(Base):
    __tablename__ = "cars"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(50), nullable=False, index=True)
    model = Column(String(50), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    price = Column(Float, nullable=False, index=True)
    mileage = Column(Integer, nullable=False)
    fuel = Column(SQLEnum(CarFuel), nullable=False)
    transmission = Column(SQLEnum(CarTransmission), nullable=False)
    color = Column(String(30), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(CarStatus), default=CarStatus.ACTIVE, nullable=False, index=True)
    views_count = Column(Integer, default=0, nullable=False)
    average_rating = Column(Float, default=0.0, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)

    # Coordinates
    latitude = Column(Float, nullable=True, default=41.31108)
    longitude = Column(Float, nullable=True, default=69.24056)

    # Specifications
    horsepower = Column(Integer, nullable=True, default=150)
    acceleration = Column(Float, nullable=True, default=8.5)
    drive = Column(String(30), nullable=True, default="Front-Wheel Drive")
    safety = Column(Float, nullable=True, default=5.0)
    comfort = Column(Float, nullable=True, default=4.5)
    reliability = Column(Float, nullable=True, default=4.7)
    maintenance = Column(Float, nullable=True, default=300.0)
    vin = Column(String(50), nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="cars")
    category = relationship("Category", back_populates="cars")
    images = relationship("CarImage", back_populates="car", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="car", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="car", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_cars_brand_model", "brand", "model"),
        Index("ix_cars_price_year", "price", "year"),
    )

    def __repr__(self):
        return f"<Car {self.brand} {self.model} ({self.year})>"


class CarImage(Base):
    __tablename__ = "car_images"

    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    order = Column(Integer, default=0, nullable=False)

    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    car = relationship("Car", back_populates="images")

    def __repr__(self):
        return f"<CarImage {self.id}>"
