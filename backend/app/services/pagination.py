from sqlalchemy.orm import Query
from backend.app.schemas.pagination import PaginatedResponse, PaginationParams
from typing import TypeVar, Type, List, Any

T = TypeVar('T')


def paginate(
    query: Query,
    params: PaginationParams,
    schema: Type[T]
) -> PaginatedResponse[T]:
    """
    SQLAlchemy so'rovini sahifalaydi va PaginatedResponse qaytaradi.
    
    Args:
        query: SQLAlchemy query obyekti
        params: Sahifalash parametrlari (page, limit)
        schema: Har bir element uchun Pydantic modeli
    
    Returns:
        PaginatedResponse obyekti (items, total, page, pages, limit)
    """
    total = query.count()
    items = query.offset((params.page - 1) * params.limit).limit(params.limit).all()
    
    return PaginatedResponse(
        items=[schema.model_validate(item) for item in items],
        total=total,
        page=params.page,
        pages=(total + params.limit - 1) // params.limit,
        limit=params.limit
    )