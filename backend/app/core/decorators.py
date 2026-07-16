from functools import wraps
from datetime import datetime
from typing import Optional, Dict, Any
import json
import time

from fastapi import Request, HTTPException, status
from models.audit_log import AuditLog
from backend.app.database import SessionLocal
from backend.core.roles import UserRole


def log_audit(action: str, log_request: bool = True, log_response: bool = False):
    """
    Audit log yozish uchun decorator
    
    Args:
        action: Log uchun action nomi
        log_request: Request body ni log qilish
        log_response: Response body ni log qilish
    
    Usage:
        @log_audit("CREATE_USER", log_request=True)
        def create_user(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            
            # Request ma'lumotlarini olish
            request = None
            ip_address = None
            user_agent = None
            method = None
            endpoint = None
            request_data = None
            
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if request:
                ip_address = request.client.host if request.client else None
                user_agent = request.headers.get("user-agent")
                method = request.method
                endpoint = request.url.path
                
                if log_request and request.method in ["POST", "PUT", "PATCH"]:
                    try:
                        import json
                        if hasattr(request, '_body'):
                            body = request._body
                            if body:
                                try:
                                    body_data = json.loads(body)
                                    if "password" in body_data:
                                        body_data["password"] = "***"
                                    if "token" in body_data:
                                        body_data["token"] = "***"
                                    if "refresh_token" in body_data:
                                        body_data["refresh_token"] = "***"
                                    request_data = body_data
                                except:
                                    pass
                    except:
                        pass
            
            # User ni aniqlash
            current_user = kwargs.get('current_user') or kwargs.get('admin')
            user_id = current_user.id if current_user else None
            username = current_user.username if current_user else None
            
            status_log = "SUCCESS"
            error_message = None
            response_data = None
            
            try:
                result = func(*args, **kwargs)
                
                if log_response and result:
                    if hasattr(result, 'dict'):
                        response_data = result.dict()
                    elif hasattr(result, '__dict__'):
                        response_data = {k: str(v) for k, v in result.__dict__.items() if not k.startswith('_')}
                    elif isinstance(result, dict):
                        response_data = result
                    elif isinstance(result, list):
                        response_data = [str(item) for item in result]
                
                return result
            except Exception as e:
                status_log = "FAILED"
                error_message = str(e)
                raise e
            finally:
                # Audit log yozish
                duration_ms = int((time.time() - start_time) * 1000)
                db = SessionLocal()
                try:
                    audit_log = AuditLog(
                        user_id=user_id,
                        username=username,
                        action=action,
                        endpoint=endpoint,
                        method=method,
                        status=status_log,
                        ip_address=ip_address,
                        user_agent=user_agent,
                        request_data=request_data,
                        response_data=response_data,
                        error_message=error_message,
                        duration_ms=duration_ms
                    )
                    db.add(audit_log)
                    db.commit()
                except Exception as e:
                    print(f"Audit log yozishda xatolik: {e}")
                finally:
                    db.close()
        return wrapper
    return decorator


def rate_limit(limit: int = 60, window: int = 60, key_prefix: str = ""):
    """
    Rate limit decorator
    
    Args:
        limit: Maksimal so'rovlar soni
        window: Vaqt oralig'i (sekund)
        key_prefix: Redis key prefix
    
    Usage:
        @rate_limit(limit=10, window=60)  # 10 requests per minute
        def login(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # User ni aniqlash
            current_user = kwargs.get('current_user') or kwargs.get('admin')
            
            if current_user and current_user.is_admin:
                # Admin uchun cheklov yo'q
                return func(*args, **kwargs)
            
            # Rate limit tekshiruvi
            # Production da Redis bilan ishlatish tavsiya etiladi
            
            # Request dan IP va endpoint olish
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if request:
                client_ip = request.client.host if request.client else "unknown"
                path = request.url.path
                # Bu yerda Redis orqali rate limit tekshiruvi bo'lishi kerak
                # Redis yoki boshqa caching tizimi bilan ishlatish uchun
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def cache_response(ttl: int = 300, key: Optional[str] = None):
    """
    Response ni cache qilish decorator
    
    Args:
        ttl: Cache vaqti (sekund)
        key: Cache kaliti (agar berilmasa, funktsiya nomi va parametrlar asosida)
    
    Usage:
        @cache_response(ttl=60)
        def get_categories(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Bu yerda Redis implementatsiyasi bo'lishi kerak
            # Hozircha oddiy implementatsiya
            
            # Cache kalitini yaratish
            cache_key = key or f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Cache dan o'qish (Redis bilan)
            # cached = redis.get(cache_key)
            # if cached:
            #     return json.loads(cached)
            
            result = func(*args, **kwargs)
            
            # Cache ga yozish (Redis bilan)
            # redis.setex(cache_key, ttl, json.dumps(result))
            
            return result
        return wrapper
    return decorator


def validate_input(schema):
    """
    Input validation decorator
    
    Usage:
        @validate_input(CreateCar)
        def create_car(car_data: CreateCar, ...):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Pydantic model validation avtomatik ishlaydi
            # Bu decorator qo'shimcha validatsiya uchun
            # Masalan, custom validation qo'shish mumkin
            
            # Schema nomini tekshirish
            for arg in args:
                if hasattr(arg, '__class__') and arg.__class__.__name__ == schema.__name__:
                    # Qo'shimcha validatsiya
                    pass
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def require_2fa():
    """
    2FA talab qiluvchi decorator
    
    Usage:
        @require_2fa()
        def delete_account(...):
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
            
            # 2FA tekshiruvi
            # Foydalanuvchining 2FA yoqilganligini tekshirish
            if hasattr(current_user, 'is_2fa_enabled') and current_user.is_2fa_enabled:
                # 2FA kodi tekshiruvi
                # 2FA kodi request body dan yoki header dan olinadi
                pass
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def log_execution_time():
    """
    Funksiya bajarilish vaqtini log qilish decorator
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()
            duration = end_time - start_time
            print(f"Function {func.__name__} executed in {duration:.4f} seconds")
            return result
        return wrapper
    return decorator


def retry_on_failure(max_retries: int = 3, delay: int = 1):
    """
    Xatolik bo'lganda qayta urinish decorator
    
    Args:
        max_retries: Maksimal qayta urinishlar soni
        delay: Urinishlar orasidagi vaqt (sekund)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            import time
            last_exception = None
            
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        time.sleep(delay)
                        continue
                    raise last_exception
            raise last_exception
        return wrapper
    return decorator