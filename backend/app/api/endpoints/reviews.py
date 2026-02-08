from fastapi import APIRouter, Depends, Path, status
from typing import Optional
from sqlalchemy.orm import Session

import app.schemas.review as review_schemas
from app.dependencies import get_current_user, get_current_admin, get_current_user_optional
from app.services.review_service import ReviewService
from app.db.session import get_db
import app.db.models as models


router = APIRouter(tags=["reviews"])


def get_review_service(db: Session = Depends(get_db)) -> ReviewService:
    return ReviewService(db)


@router.get("/public", response_model=review_schemas.PaginatedReviewsResponse)
def get_public_reviews(
    params: review_schemas.PublicPaginationParams = Depends(),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    review_service: ReviewService = Depends(get_review_service)
):
    return review_service.get_public_reviews(params, current_user)


@router.get("/{review_id}", response_model=review_schemas.DetailReviewResponse)
def get_review_detail(
    review_id: int = Path(..., ge=1),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    review_service: ReviewService = Depends(get_review_service)
):
    return review_service.get_review_detail(review_id, current_user)


@router.get("/my", response_model=review_schemas.PaginatedMyReviewsResponse)
def get_my_reviews(
    params: review_schemas.PaginationParams = Depends(),
    current_user: models.User = Depends(get_current_user),
    review_service: ReviewService = Depends(get_review_service)
):
    return review_service.get_my_reviews(params, current_user)


@router.post("/", response_model=review_schemas.ReviewCreateResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review_in: review_schemas.ReviewCreate,
    current_user: models.User = Depends(get_current_user),
    review_service: ReviewService = Depends(get_review_service)
):
    return review_service.create_review(review_in, current_user)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int = Path(..., ge=1),
    current_user: models.User = Depends(get_current_user),
    review_service: ReviewService = Depends(get_review_service)
):
    review_service.delete_review(review_id, current_user)


@router.put("/{review_id}", response_model=review_schemas.DetailReviewResponse)
def edit_review(
    review_in: review_schemas.ReviewCreate,
    review_id: int = Path(..., ge=1),
    current_user: models.User = Depends(get_current_user),
    review_service: ReviewService = Depends(get_review_service)
):
    return review_service.edit_review(review_id, review_in, current_user)


@router.post("/{review_id}/like", response_model=review_schemas.LikeToggleResponse)
def toggle_like(
    review_id: int = Path(..., ge=1),
    current_user: models.User = Depends(get_current_user),
    review_service: ReviewService = Depends(get_review_service)
):
    return review_service.toggle_like(review_id, current_user)


@router.get("/moderation", response_model=review_schemas.PaginatedReviewsResponse)
def get_moderation_reviews(
    params: review_schemas.PublicPaginationParams = Depends(),
    current_user: models.User = Depends(get_current_admin),
    review_service: ReviewService = Depends(get_review_service)
):
    return review_service.get_moderation_reviews(params)


@router.post("/{review_id}/approve", status_code=status.HTTP_200_OK)
def approve_review(
    review_id: int = Path(..., ge=1),
    current_user: models.User = Depends(get_current_admin),
    review_service: ReviewService = Depends(get_review_service)
):
    review_service.approve_review(review_id)
    return


@router.post("/{review_id}/reject", status_code=status.HTTP_200_OK)
def reject_review(
    review_id: int = Path(..., ge=1),
    current_user: models.User = Depends(get_current_admin),
    review_service: ReviewService = Depends(get_review_service)
):
    review_service.reject_review(review_id)
    return
