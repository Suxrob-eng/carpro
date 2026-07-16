from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
import re


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    phone_number: str = Field(..., min_length=7, max_length=20)
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=100)
    password: str = Field(..., min_length=6)

    @field_validator("phone_number")
    def validate_phone(cls, v):
        cleaned = re.sub(r"[^0-9+]", "", v)
        if len(cleaned) < 7:
            raise ValueError("Invalid phone number format")
        return cleaned


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)


class EmailVerificationRequest(BaseModel):
    token: str