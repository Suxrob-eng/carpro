from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FavoriteCreate(BaseModel):
    car_id: int


class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    car_id: int
    created_at: datetime

    class Config:
        from_attributes = True