from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

from app.models.enums import UserRole


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    phone_number: str = Field(..., min_length=7, max_length=20)
    full_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    location: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=200)
    birth_date: Optional[datetime] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    location: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=200)
    birth_date: Optional[datetime] = None
    email: Optional[EmailStr] = None


class UserProfileUpdate(UserUpdate):
    pass


class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str]
    phone_number: str
    full_name: Optional[str]
    bio: Optional[str]
    location: Optional[str]
    website: Optional[str]
    birth_date: Optional[datetime]
    avatar_url: Optional[str]
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    data: list[UserResponse]
    total: int
    page: int
    size: int
    pages: int