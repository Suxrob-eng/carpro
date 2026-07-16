from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile

from app.models.user import User
from app.models.enums import UserRole
from ..schemas.user import UserUpdate, UserResponse
from ..utils.file_upload import upload_avatar
from ..core.security import get_password_hash, verify_password


class UserService:
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def update_profile(db: Session, user_id: int, data: UserUpdate) -> User:
        user = UserService.get_user_by_id(db, user_id)

        update_data = data.model_dump(exclude_unset=True)

        # Check if email is being changed and is unique
        if "email" in update_data and update_data["email"]:
            existing = db.query(User).filter(
                User.email == update_data["email"],
                User.id != user_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already taken",
                )

        for key, value in update_data.items():
            setattr(user, key, value)

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def change_password(db: Session, user_id: int, old_password: str, new_password: str) -> None:
        user = UserService.get_user_by_id(db, user_id)

        if not verify_password(old_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        user.hashed_password = get_password_hash(new_password)
        db.commit()

    @staticmethod
    def upload_avatar(db: Session, user_id: int, file: UploadFile) -> User:
        user = UserService.get_user_by_id(db, user_id)

        avatar_url = upload_avatar(file, user_id)
        user.avatar_url = avatar_url
        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def block_user(db: Session, user_id: int, admin_id: int) -> User:
        user = UserService.get_user_by_id(db, user_id)

        if user.role == UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot block an admin user",
            )

        if user.id == admin_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot block yourself",
            )

        user.is_active = False
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def unblock_user(db: Session, user_id: int) -> User:
        user = UserService.get_user_by_id(db, user_id)
        user.is_active = True
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_users(
        db: Session,
        page: int = 1,
        size: int = 10,
        search: Optional[str] = None,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
    ) -> Dict[str, Any]:
        query = db.query(User)

        if search:
            query = query.filter(
                (User.username.ilike(f"%{search}%")) |
                (User.full_name.ilike(f"%{search}%")) |
                (User.email.ilike(f"%{search}%")) |
                (User.phone_number.ilike(f"%{search}%"))
            )

        if role:
            query = query.filter(User.role == role)

        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        total = query.count()

        offset = (page - 1) * size
        users = query.offset(offset).limit(size).all()

        return {
            "data": [UserResponse.model_validate(u).model_dump() for u in users],
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size if total > 0 else 0,
        }

    @staticmethod
    def get_user_stats(db: Session) -> Dict[str, Any]:
        total = db.query(User).count()
        active = db.query(User).filter(User.is_active == True).count()
        blocked = db.query(User).filter(User.is_active == False).count()
        admin = db.query(User).filter(User.role == UserRole.ADMIN).count()

        return {
            "total": total,
            "active": active,
            "blocked": blocked,
            "admin": admin,
        }