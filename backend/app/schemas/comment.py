from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    rating: Optional[float] = Field(None, ge=0, le=5)
    parent_id: Optional[int] = None


class CommentUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=2000)
    rating: Optional[float] = Field(None, ge=0, le=5)


class CommentResponse(BaseModel):
    id: int
    content: str
    rating: Optional[float]
    user_id: int
    car_id: int
    parent_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    replies: list["CommentResponse"] = []

    class Config:
        from_attributes = True


CommentResponse.model_rebuild()