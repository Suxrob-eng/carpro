from fastapi import APIRouter, Depends, HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.dependencies import get_current_user
from app.models.user import User
from ..schemas.auth import (
    LoginRequest,
    RegisterRequest,
    Token,
    TokenRefresh,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from ..schemas.user import UserResponse, UserUpdate
from ..services.auth import AuthService
from ..services.user import UserService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user"""
    user = AuthService.register(db, data)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Login and get access token"""
    access_token, refresh_token, _ = AuthService.login(db, data.username, data.password)
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
def refresh(data: TokenRefresh, db: Session = Depends(get_db)):
    """Refresh access token"""
    access_token, refresh_token = AuthService.refresh_token(db, data.refresh_token)
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout (client-side token removal)"""
    AuthService.logout(db, current_user.id)
    return None


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user profile"""
    user = UserService.update_profile(db, current_user.id, data)
    return UserResponse.model_validate(user)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change user password"""
    UserService.change_password(db, current_user.id, data.old_password, data.new_password)
    return None


@router.post("/avatar")
def upload_avatar(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload user avatar"""
    user = UserService.upload_avatar(db, current_user.id, file)
    return {"avatar_url": user.avatar_url}


@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request password reset"""
    # Implementation would send email with reset token
    # For now, just return success
    return None


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password with token"""
    # Implementation would validate token and update password
    return None