from functools import wraps
from fastapi import HTTPException, status
from typing import List, Union, Optional
from backend.core.roles import UserRole, RolePermissions


def require_permission(permission: str):
    """
    Ruxsat talab qiluvchi decorator
    
    Usage:
        @require_permission("users:write")
        def create_user(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user') or kwargs.get('admin')
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            if hasattr(current_user, 'is_active') and not current_user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User is blocked"
                )
            
            if not current_user.has_permission(permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{permission}' required"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def require_roles(roles: Union[UserRole, List[UserRole]]):
    """
    Rol talab qiluvchi decorator
    
    Usage:
        @require_roles([UserRole.ADMIN, UserRole.MANAGER])
        def manage_cars(...):
            ...
    """
    if isinstance(roles, UserRole):
        roles = [roles]
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user') or kwargs.get('admin')
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if hasattr(current_user, 'is_active') and not current_user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User is blocked"
                )
            
            if not any(current_user.has_role(role) for role in roles):
                role_names = ", ".join([r.value for r in roles])
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Required roles: {role_names}"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def require_any_permission(permissions: List[str]):
    """
    Bir nechta ruxsatlardan birortasini talab qiluvchi decorator
    
    Usage:
        @require_any_permission(["cars:write", "cars:delete"])
        def manage_cars(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user') or kwargs.get('admin')
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if hasattr(current_user, 'is_active') and not current_user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User is blocked"
                )
            
            has_permission = any(
                current_user.has_permission(perm) for perm in permissions
            )
            
            if not has_permission:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Required any of permissions: {', '.join(permissions)}"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def require_all_permissions(permissions: List[str]):
    """
    Barcha ruxsatlarni talab qiluvchi decorator
    
    Usage:
        @require_all_permissions(["users:read", "users:write"])
        def manage_users(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user') or kwargs.get('admin')
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if hasattr(current_user, 'is_active') and not current_user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User is blocked"
                )
            
            has_all = all(
                current_user.has_permission(perm) for perm in permissions
            )
            
            if not has_all:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Required all permissions: {', '.join(permissions)}"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def allow_anonymous():
    """
    Autentifikatsiya talab qilmaydigan endpoint uchun decorator
    
    Usage:
        @allow_anonymous()
        def public_endpoint(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return decorator


def require_self_or_admin(resource_id_param: str = "user_id"):
    """
    Foydalanuvchi o'zini yoki adminni tekshiruvchi decorator
    
    Usage:
        @require_self_or_admin("user_id")
        def update_user(user_id: int, ...):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user') or kwargs.get('admin')
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            if current_user.is_admin:
                return func(*args, **kwargs)

            target_user_id = kwargs.get(resource_id_param)
            if target_user_id is None:
                if len(args) > 0:
                    target_user_id = args[0]
            
            if target_user_id and target_user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only access your own resources"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def require_self_or_admin_with_resource(resource_owner_id_param: str = "owner_id"):
    """
    Resurs egasini tekshiruvchi decorator
    
    Usage:
        @require_self_or_admin_with_resource("owner_id")
        def update_car(owner_id: int, ...):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user') or kwargs.get('admin')
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            if current_user.is_admin:
                return func(*args, **kwargs)

            owner_id = kwargs.get(resource_owner_id_param)
            if owner_id is None:
                if len(args) > 0:
                    owner_id = args[0]
            
            if owner_id and owner_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to access this resource"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def rate_limit_decorator(limit: int = 60, window: int = 60):
    """
    Rate limit decorator
    
    Usage:
        @rate_limit_decorator(limit=10, window=60)
        def login(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user') or kwargs.get('admin')
            
            if current_user and current_user.is_admin:
                return func(*args, **kwargs)
            
            # Rate limit tekshiruvi
            # Production da Redis bilan ishlatish tavsiya etiladi
            
            return func(*args, **kwargs)
        return wrapper
    return decorator