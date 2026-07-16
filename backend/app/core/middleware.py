from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.roles import UserRole, RolePermissions
from app.core.dependencies import get_current_user_optional
import re
from typing import Dict, List, Optional
from datetime import datetime


class RoleMiddleware(BaseHTTPMiddleware):
    """
    Role-based access control middleware
    """
    
    def __init__(self, app):
        super().__init__(app)
        
        # Endpoint -> ruxsat mapping
        self.permission_mapping: Dict[str, str] = {
            r'^/api/admin$': 'users:read',
            r'^/api/admin/.*$': 'users:read',
            r'^/api/admin/users$': 'users:read',
            r'^/api/admin/users/\d+$': 'users:read',
            r'^/api/admin/users/\d+/block$': 'users:block',
            r'^/api/admin/users/\d+/unblock$': 'users:block',
            r'^/api/admin/users/\d+/delete$': 'users:delete',
            r'^/api/admin/users/\d+/role$': 'users:write',
            r'^/api/admin/stats$': 'stats:read',
            r'^/api/admin/audit-logs$': 'logs:read',
            
            # Car endpoints
            r'^/api/cars$': 'cars:read',
            r'^/api/cars/\d+$': 'cars:read',
            r'^/api/cars/\d+/update$': 'cars:write',
            r'^/api/cars/\d+/delete$': 'cars:delete',
            
            # Category endpoints
            r'^/api/categories$': 'categories:read',
            r'^/api/categories/\d+$': 'categories:read',
            r'^/api/categories/create$': 'categories:write',
            r'^/api/categories/\d+/update$': 'categories:write',
            r'^/api/categories/\d+/delete$': 'categories:delete',
        }
        
        # Public endpoints (authentication talab qilmaydi)
        self.public_paths = [
            r'^/$',
            r'^/health$',
            r'^/docs$',
            r'^/redoc$',
            r'^/openapi.json$',
            r'^/api/auth/login$',
            r'^/api/auth/register$',
        ]
        
        # Admin-only paths
        self.admin_only_paths = [
            r'^/api/admin/.*$',
        ]
    
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # Public endpoints - skip middleware
        if self._is_public(path):
            return await call_next(request)
        
        # User ni olish
        user = await self._get_user(request)
        
        # Admin-only paths
        if self._is_admin_only(path):
            if not user or not user.is_admin:
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={
                        "status_code": 403,
                        "detail": "Admin privileges required",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
        
        # Permission tekshiruvi
        permission = self._get_required_permission(path)
        if permission and user:
            if not user.has_permission(permission):
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={
                        "status_code": 403,
                        "detail": f"Permission '{permission}' required",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
        elif permission and not user:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "status_code": 401,
                    "detail": "Authentication required",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        # User ni request state ga qo'shish
        if user:
            request.state.user = user
        
        return await call_next(request)
    
    def _is_public(self, path: str) -> bool:
        """Path public ekanligini tekshirish"""
        for pattern in self.public_paths:
            if re.match(pattern, path):
                return True
        return False
    
    def _is_admin_only(self, path: str) -> bool:
        """Path admin-only ekanligini tekshirish"""
        for pattern in self.admin_only_paths:
            if re.match(pattern, path):
                return True
        return False
    
    def _get_required_permission(self, path: str) -> Optional[str]:
        """Path uchun kerakli ruxsatni olish"""
        for pattern, permission in self.permission_mapping.items():
            if re.match(pattern, path):
                return permission
        return None
    
    async def _get_user(self, request: Request):
        """Request'dan user ni olish"""
        from app.core.dependencies import get_current_user_optional
        from app.core.database import SessionLocal
        
        # Authorization header ni olish
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.replace("Bearer ", "")
        
        # User ni olish
        try:
            from jose import jwt
            from app.core.config import settings
            from app.services.user import UserService

            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            username = payload.get("sub")
            
            if username:
                db = SessionLocal()
                try:
                    user = UserService.get_user_by_username(db, username)
                    if user and user.is_active:
                        return user
                finally:
                    db.close()
        except:
            pass
        
        return None


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limit middleware
    """
    
    def __init__(self, app, redis_client=None):
        super().__init__(app)
        self.redis = redis_client
    
    async def dispatch(self, request: Request, call_next):
        # Rate limit tekshiruvi
        # Production da Redis bilan ishlatish tavsiya etiladi
        
        return await call_next(request)