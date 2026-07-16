from .auth import router as auth_router
from .user import router as user_router
from .car import router as car_router
from .category import router as category_router
from .favorites import router as favorites_router
from .admin import router as admin_router
from .routers_extended import router as extended_router

__all__ = [
    "auth_router",
    "user_router",
    "car_router",
    "category_router",
    "favorites_router",
    "admin_router",
    "extended_router",
]