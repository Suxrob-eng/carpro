from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

from app.models.enums import CarFuel, CarTransmission, CarStatus


class CarImageResponse(BaseModel):
    id: int
    image_url: str
    is_primary: bool
    order: int

    class Config:
        from_attributes = True


class CarBase(BaseModel):
    brand: str = Field(..., min_length=1, max_length=50)
    model: str = Field(..., min_length=1, max_length=50)
    year: int = Field(..., ge=1900, le=datetime.now().year + 1)
    price: float = Field(..., gt=0)
    mileage: int = Field(..., ge=0)
    fuel: CarFuel
    transmission: CarTransmission
    color: str = Field(..., min_length=1, max_length=30)
    description: Optional[str] = None
    category_id: Optional[int] = None


class CarCreate(CarBase):
    pass


class CarUpdate(BaseModel):
    brand: Optional[str] = Field(None, min_length=1, max_length=50)
    model: Optional[str] = Field(None, min_length=1, max_length=50)
    year: Optional[int] = Field(None, ge=1900, le=datetime.now().year + 1)
    price: Optional[float] = Field(None, gt=0)
    mileage: Optional[int] = Field(None, ge=0)
    fuel: Optional[CarFuel] = None
    transmission: Optional[CarTransmission] = None
    color: Optional[str] = Field(None, min_length=1, max_length=30)
    description: Optional[str] = None
    status: Optional[CarStatus] = None
    category_id: Optional[int] = None


class CarResponse(BaseModel):
    id: int
    brand: str
    model: str
    year: int
    price: float
    mileage: int
    fuel: CarFuel
    transmission: CarTransmission
    color: str
    description: Optional[str]
    status: CarStatus
    views_count: int
    average_rating: float
    is_featured: bool
    owner_id: int
    category_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    images: List[CarImageResponse] = []
    comments_count: int = 0
    favorites_count: int = 0

    class Config:
        from_attributes = True


class CarListResponse(BaseModel):
    data: List[CarResponse]
    total: int
    page: int
    size: int
    pages: int


class CarFilterParams(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    year: Optional[int] = None
    fuel: Optional[CarFuel] = None
    transmission: Optional[CarTransmission] = None
    color: Optional[str] = None
    category_id: Optional[int] = None
    owner_id: Optional[int] = None
    min_year: Optional[int] = None
    max_year: Optional[int] = None
    min_mileage: Optional[int] = None
    max_mileage: Optional[int] = None
    search: Optional[str] = None
    sort_by: Optional[str] = Field(None, description="price, year, mileage, created_at, views_count")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")
    page: int = Field(1, ge=1)
    size: int = Field(10, ge=1, le=100)