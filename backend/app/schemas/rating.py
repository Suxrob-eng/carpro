from pydantic import BaseModel

class RatingCreate(BaseModel):
    stars: int
