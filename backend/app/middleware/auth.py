from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time

from ..core.security import decode_token


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip auth check for certain paths
        public_paths = [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/auth/login",
            "/auth/register",
            "/auth/refresh",
            "/auth/forgot-password",
            "/auth/reset-password",
            "/",
            "/health",
        ]

        if request.url.path in public_paths or request.url.path.startswith("/static/") or request.url.path.startswith("/media/"):
            return await call_next(request)

        return await call_next(request)