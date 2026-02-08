from typing import Optional
from sqlalchemy.orm import Session
from math import ceil
import app.db.models as models
import app.schemas.review as review_schemas
from app.crud.review import CRUDReview
from app.crud.like import CRUDLike
from app.exceptions import (
    ReviewNotFoundError,
    PermissionDeniedError,
    InvalidReviewStateError
)

class ReviewService:
    def __init__(self, db: Session):
        self.db = db
        self.review_crud = CRUDReview()
        self.like_crud = CRUDLike()
    

    def get_public_reviews(
        self,
        pagination: review_schemas.PublicPaginationParams,
        current_user: Optional[models.User]
    ) -> review_schemas.PaginatedReviewsResponse:
        
        skip = (pagination.page - 1) * pagination.limit
        
        reviews, total = self.review_crud.get_public_reviews(
            db=self.db,
            skip=skip,
            limit=pagination.limit,
            sort_by=pagination.sort,
            sort_order=pagination.order,
            search=pagination.search,
            author_id=pagination.author_id
        )
        
        review_responses = [
            self._build_review_response(review, current_user)
            for review in reviews
        ]
        
        return review_schemas.PaginatedReviewsResponse(
            reviews=review_responses,
            pagination=self._build_pagination_info(
                page=pagination.page,
                limit=pagination.limit,
                total=total
            )
        )
    
    def get_my_reviews(
        self,
        pagination: review_schemas.PaginationParams,
        current_user: models.User
    ) -> review_schemas.PaginatedMyReviewsResponse:

        skip = (pagination.page - 1) * pagination.limit
        
        reviews, total = self.review_crud.get_user_reviews(
            db=self.db,
            user_id=current_user.id,
            skip=skip,
            limit=pagination.limit,
            sort_by=pagination.sort,
            sort_order=pagination.order,
            search=pagination.search
        )
        
        review_responses = [
            review_schemas.MyReviewResponse(
                id=review.id,
                title=review.title,
                movie_title=review.movie_title,
                content=review.content,
                status=review.status,
                likes=review.likes,
                created_at=review.created_at,
                is_liked=self._is_review_liked_by_user(review.id, current_user.id)
            )
            for review in reviews
        ]
        
        return review_schemas.PaginatedMyReviewsResponse(
            reviews=review_responses,
            pagination=self._build_pagination_info(
                page=pagination.page,
                limit=pagination.limit,
                total=total
            )
        )
    
    def get_moderation_reviews(
        self,
        pagination: review_schemas.PublicPaginationParams
    ) -> review_schemas.PaginatedReviewsResponse:

        skip = (pagination.page - 1) * pagination.limit
        
        reviews, total = self.review_crud.get_pending_reviews(
            db=self.db,
            skip=skip,
            limit=pagination.limit
        )
        
        review_responses = [
            review_schemas.ReviewResponse(
                id=review.id,
                title=review.title,
                movie_title=review.movie_title,
                content=review.content,
                status=review.status,
                likes=review.likes,
                created_at=review.created_at,
                author=review_schemas.AuthorInfo(
                    id=review.author.id,
                    username=review.author.username
                ),
                is_liked=None
            )
            for review in reviews
        ]
        
        return review_schemas.PaginatedReviewsResponse(
            reviews=review_responses,
            pagination=self._build_pagination_info(
                page=pagination.page,
                limit=pagination.limit,
                total=total
            )
        )
    
    def get_review_detail(
        self,
        review_id: int,
        current_user: Optional[models.User]
    ) -> review_schemas.DetailReviewResponse:

        review = self.review_crud.get_with_author(self.db, review_id)
        if not review:
            raise ReviewNotFoundError()
        

        is_author = current_user and current_user.id == review.user_id
        is_admin = current_user and current_user.role == models.Role.ADMIN
        
        if review.status != models.ReviewStatus.APPROVED and not is_author and not is_admin:
            raise ReviewNotFoundError()
        
        return review_schemas.DetailReviewResponse(
            id=review.id,
            title=review.title,
            movie_title=review.movie_title,
            content=review.content,
            status=review.status,
            likes=review.likes,
            author=review_schemas.AuthorInfo(
                id=review.author.id,
                username=review.author.username
            ),
            created_at=review.created_at,
            is_liked=self._is_review_liked_by_user(review.id, current_user.id if current_user else None)
        )
    
    def create_review(
        self,
        review_data: review_schemas.ReviewCreate,
        current_user: models.User
    ) -> review_schemas.ReviewCreateResponse:

        review = self.review_crud.create(
            db=self.db,
            user_id=current_user.id,
            title=review_data.title,
            movie_title=review_data.movie_title,
            content=review_data.content
        )
        
        return review_schemas.ReviewCreateResponse(id=review.id)
    
    def approve_review(self, review_id: int) -> None:

        review = self.review_crud.get(self.db, review_id)
        if not review:
            raise ReviewNotFoundError()
        
        if review.status != models.ReviewStatus.PENDING:
            raise InvalidReviewStateError("Review has already been processed")
        
        self.review_crud.change_status(self.db, review,  models.ReviewStatus.APPROVED)
    
    def reject_review(self, review_id: int) -> None:

        review = self.review_crud.get(self.db, review_id)
        if not review:
            raise ReviewNotFoundError()
        
        if review.status != models.ReviewStatus.PENDING:
            raise InvalidReviewStateError("Review has already been processed")
        
        self.review_crud.change_status(self.db, review, models.ReviewStatus.REJECTED)
    
    def delete_review(self, review_id: int, current_user: models.User) -> None:

        review = self.review_crud.get(self.db, review_id)
        if not review:
            raise ReviewNotFoundError()
        
        if review.user_id != current_user.id:
            raise PermissionDeniedError("You can only delete your own reviews")
        
        self.review_crud.delete(self.db, review)
    
    def edit_review(
        self,
        review_id: int,
        review_data: review_schemas.ReviewUpdate,
        current_user: models.User
    ) -> review_schemas.DetailReviewResponse:

        review = self.review_crud.get(self.db, review_id)
        if not review:
            raise ReviewNotFoundError()
        
        if review.user_id != current_user.id:
            raise PermissionDeniedError("You can only edit your own reviews")
        
        updated_review = self.review_crud.update(
            db=self.db,
            review=review,
            title=review_data.title,
            movie_title=review_data.movie_title,
            content=review_data.content,
            status=models.ReviewStatus.PENDING
        )
        
        return self.get_review_detail(review_id, current_user)
    
    def toggle_like(
        self,
        review_id: int,
        current_user: models.User
    ) -> review_schemas.LikeToggleResponse:

        review = self.review_crud.get(self.db, review_id)
        if not review:
            raise ReviewNotFoundError()
        
        if review.status != models.ReviewStatus.APPROVED:
            raise InvalidReviewStateError("You can only like approved reviews")
        
        is_liked, likes_count = self.like_crud.toggle_like(
            db=self.db,
            user_id=current_user.id,
            review_id=review_id,
            review=review
        )
        
        return review_schemas.LikeToggleResponse(
            likes=likes_count,
            is_liked=is_liked
        )
    

    def _build_review_response(
        self,
        review: models.Review,
        current_user: Optional[models.User]
    ) -> review_schemas.ReviewResponse:

        return review_schemas.ReviewResponse(
            id=review.id,
            title=review.title,
            movie_title=review.movie_title,
            content=review.content,
            status=review.status,
            likes=review.likes,
            created_at=review.created_at,
            author=review_schemas.AuthorInfo(
                id=review.author.id,
                username=review.author.username
            ),
            is_liked=self._is_review_liked_by_user(
                review.id,
                current_user.id if current_user else None
            )
        )
    
    def _is_review_liked_by_user(
        self,
        review_id: int,
        user_id: Optional[int]
    ) -> Optional[bool]:

        if not user_id:
            return None
        like = self.like_crud.get_like(self.db, user_id, review_id)
        return like is not None
    
    def _build_pagination_info(
        self,
        page: int,
        limit: int,
        total: int
    ) -> review_schemas.PaginationInfo:

        total_pages = ceil(total / limit) if total > 0 else 1
        return review_schemas.PaginationInfo(
            current_page=page,
            total_pages=total_pages,
            total_items=total,
            items_per_page=limit
        )
