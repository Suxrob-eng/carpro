from models.user import User
from backend.core.security import hash_password, verify_password
from backend.app.schemas.user import RegisterSchema
from backend.core.roles import UserRole
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.refresh_token import RefreshToken

from backend.core.config import create_refresh_token, REFRESH_TOKEN_EXPIRE_DAYS
from datetime import timedelta

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username, User.is_active == True).first()
    if not user or not verify_password(password, user.password):
        return None
    user.last_login = datetime.utcnow()
    db.commit()

    refresh_token_str = create_refresh_token({"sub": user.username})
    refresh_token = RefreshToken(
        token=refresh_token_str,
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(refresh_token)
    db.commit()
    return user, refresh_token_str


def create_user(db: Session, user_data: RegisterSchema):
    """Yangi foydalanuvchi yaratish"""
    existing_user = db.query(User).filter(
        User.username == user_data.username
    ).first()
    
    if existing_user:
        raise ValueError("Username already exists")
    
    existing_phone = db.query(User).filter(
        User.phone_number == user_data.phone_number
    ).first()
    
    if existing_phone:
        raise ValueError("Phone number already exists")
    
    new_user = User(
        username=user_data.username,
        phone_number=user_data.phone_number,
        password=hash_password(user_data.password),
        role=UserRole.USER
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Username bo'yicha foydalanuvchini olish"""
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """ID bo'yicha foydalanuvchini olish"""
    return db.query(User).filter(User.id == user_id).first()


def get_all_users(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    search: str = None,
    role: UserRole = None,
    is_active: bool = None
) -> List[User]:
    """Barcha foydalanuvchilarni olish (filtrlar bilan)"""
    query = db.query(User)
    
    if search:
        query = query.filter(
            User.username.ilike(f"%{search}%") | 
            User.phone_number.ilike(f"%{search}%") |
            User.email.ilike(f"%{search}%") |
            User.full_name.ilike(f"%{search}%")
        )
    
    if role:
        query = query.filter(User.role == role)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    return query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()


def block_user(db: Session, user_id: int) -> User:
    """Foydalanuvchini bloklash"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")
    if user.is_admin:
        raise ValueError("Cannot block admin user")
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


def unblock_user(db: Session, user_id: int) -> User:
    """Foydalanuvchini blokdan chiqarish"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> User:
    """Foydalanuvchini o'chirish"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")
    if user.is_admin:
        raise ValueError("Cannot delete admin user")
    db.delete(user)
    db.commit()
    return user


def change_user_role(db: Session, user_id: int, new_role: UserRole, admin_id: int) -> User:
    """Foydalanuvchi rolini o'zgartirish"""
    admin = get_user_by_id(db, admin_id)
    if not admin or not admin.is_admin:
        raise ValueError("Only admin can change roles")

    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")

    if user.id == admin_id:
        raise ValueError("Cannot change your own role")

    user.role = new_role
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


def get_users_by_role(db: Session, role: UserRole, skip: int = 0, limit: int = 100) -> List[User]:
    """Rol bo'yicha foydalanuvchilarni olish"""
    return db.query(User).filter(
        User.role == role
    ).offset(skip).limit(limit).all()


def get_user_stats(db: Session) -> dict:
    """Foydalanuvchilar statistikasi"""
    total = db.query(User).count()
    active = db.query(User).filter(User.is_active == True).count()
    blocked = db.query(User).filter(User.is_active == False).count()
    
    role_stats = db.query(
        User.role, func.count(User.id)
    ).group_by(User.role).all()
    
    return {
        "total": total,
        "active": active,
        "blocked": blocked,
        "by_role": {role.value: count for role, count in role_stats}
    }


def lock_user_account(db: Session, user_id: int, duration_minutes: int = 30) -> User:
    """Foydalanuvchi hisobini vaqtincha bloklash"""
    from datetime import timedelta
    
    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")
    
    user.locked_until = datetime.utcnow() + timedelta(minutes=duration_minutes)
    db.commit()
    db.refresh(user)
    return user


def unlock_user_account(db: Session, user_id: int) -> User:
    """Foydalanuvchi hisobini ochish"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")
    
    user.locked_until = None
    user.failed_login_attempts = 0
    db.commit()
    db.refresh(user)
    return user