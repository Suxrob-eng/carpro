from pydantic import BaseModel, Field
from typing import Generic, TypeVar, List
from pydantic.generics import GenericModel

T = TypeVar('T')

class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(10, ge=1, le=100)

class PaginatedResponse(GenericModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    pages: int
    limit: int
