from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime
from typing import List, Optional


class UserCreate(BaseModel):
    username: str = Field(..., min_length=4, max_length=20, pattern="^[a-zA-Z0-9]+$",
                          description="от 4 до 20 символов, латиница/цифры")
    password: str = Field(..., min_length=8, max_length=16,
                          description="от 8 до 16 символов, латиница/цифры/символы")


class UserBase(BaseModel):
    id: int
    username: str


class UserOut(UserBase):
    role: Literal["user", "admin"]

    class Config:
        from_attributes = True


class ReviewBase(BaseModel):
    id: int
    title: str
    movie_title: str
    content: str
    likes: int
    created_at: datetime


class ReviewCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=100)
    movie_title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=100, max_length=5000)


class ReviewCreateResponse(BaseModel):
    id: int


class ReviewResponse(ReviewBase):
    author: UserBase
    
    class Config:
        from_attributes = True


class MyReviewResponse(ReviewBase):
    status: str

    class Config:
        from_attributes = True


class DetailReviewResponse(ReviewBase):
    status: str
    author: UserBase


class PaginationInfo(BaseModel):
    current_page: int
    total_pages: int
    total_items: int
    items_per_page: int


class PaginatedReviewsResponse(BaseModel):
    reviews: List[ReviewResponse]
    pagination: PaginationInfo


class PaginatedMyReviewsResponse(BaseModel):
    reviews: List[MyReviewResponse]
    pagination: PaginationInfo


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)
    sort: Literal["created_at", "likes"] = Field("created_at")
    order: Literal["asc", "desc"] = Field("desc")
    search: Optional[str] = Field(None, min_length=2, max_length=50)

class PublicPaginationParams(PaginationParams):
    author_id: Optional[int] = Field(None)

class LikeToggleResponse(BaseModel):
    likes: int = Field(..., ge=0)
    is_liked: bool
