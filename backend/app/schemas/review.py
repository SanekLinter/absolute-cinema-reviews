from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import app.db.models as models

ReviewStatus = models.ReviewStatus

class SortBy(str, Enum):
    CREATED_AT = "created_at"
    LIKES = "likes"

class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class ReviewCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=100)
    movie_title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=100, max_length=5000)


class ReviewUpdate(ReviewCreate):
    pass


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)
    sort: SortBy = SortBy.CREATED_AT
    order: SortOrder = SortOrder.DESC
    search: Optional[str] = Field(None, min_length=2, max_length=50)


class PublicPaginationParams(PaginationParams):
    author_id: Optional[int] = None


class PaginationInfo(BaseModel):
    current_page: int
    total_pages: int
    total_items: int
    items_per_page: int


class AuthorInfo(BaseModel):
    id: int
    username: str
    
    class Config:
        from_attributes = True


class BaseReviewResponse(BaseModel):
    id: int
    title: str
    movie_title: str
    content: str
    status: ReviewStatus
    likes: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ReviewResponse(BaseReviewResponse):
    author: AuthorInfo
    is_liked: Optional[bool] = None


class PaginatedReviewsResponse(BaseModel):
    reviews: List[ReviewResponse]
    pagination: PaginationInfo


class MyReviewResponse(BaseReviewResponse):
    is_liked: Optional[bool] = None


class PaginatedMyReviewsResponse(BaseModel):
    reviews: List[MyReviewResponse]
    pagination: PaginationInfo


class DetailReviewResponse(ReviewResponse):
    pass


class ReviewCreateResponse(BaseModel):
    id: int


class LikeToggleResponse(BaseModel):
    likes: int
    is_liked: bool
