from datetime import datetime
from typing import Generic, Optional, TypeVar
from pydantic import BaseModel
from pydantic.generics import GenericModel

T = TypeVar('T')

class SuccessResponse(GenericModel, Generic[T]):
    status_code: int
    message: str
    data: Optional[T]
    timestamp: datetime

class ErrorResponse(BaseModel):
    detail: str
