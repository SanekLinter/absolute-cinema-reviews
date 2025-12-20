from fastapi import APIRouter, Depends, Path, HTTPException, status
from sqlalchemy.orm import Session, joinedload
import models, schemas, database
from dependencies import get_current_user, get_current_admin, get_current_user_optional
from math import ceil
from typing import Optional
from datetime import datetime

router = APIRouter(tags=["reviews"])


@router.get("/public", response_model=schemas.PaginatedReviewsResponse)
def get_public_reviews(
    params: schemas.PublicPaginationParams = Depends(),
    db: Session = Depends(database.get_db)
):
    try:
        page = params.page
        limit = params.limit
        sort = params.sort
        order = params.order
        search = params.search
        author_id = params.author_id

        query = db.query(models.Review).filter(models.Review.status == "approved")
        
        if author_id:
            query = query.filter(models.Review.user_id == author_id)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (models.Review.title.ilike(search_term)) | 
                (models.Review.movie_title.ilike(search_term))
            )
        
        total_count = query.count()
        
        sort_column = None
        if sort == "likes":
            sort_column = models.Review.likes
        else:
            sort_column = models.Review.created_at
        
        if order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        offset = (page - 1) * limit
        reviews = query.offset(offset).limit(limit).all()
        
        review_responses = [
            schemas.ReviewResponse(
                id=review.id,
                title=review.title,
                movie_title=review.movie_title,
                content=review.content,
                status=review.status,
                likes=review.likes,
                created_at=review.created_at,
                author=schemas.UserBase(
                    id=review.author.id,
                    username=review.author.username
                )
            )
            for review in reviews
        ]
        
        total_pages = ceil(total_count / limit) if total_count > 0 else 1
        
        return schemas.PaginatedReviewsResponse(
            reviews=review_responses,
            pagination=schemas.PaginationInfo(
                current_page=page,
                total_pages=total_pages,
                total_items=total_count,
                items_per_page=limit
            )
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сервера: {str(e)}")


@router.get("/my", response_model=schemas.PaginatedMyReviewsResponse)
def get_my_reviews(
    params: schemas.PaginationParams = Depends(),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    try:
        page = params.page
        limit = params.limit
        sort = params.sort
        order = params.order
        search = params.search

        query = db.query(models.Review).filter(models.Review.user_id == current_user.id)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (models.Review.title.ilike(search_term)) | 
                (models.Review.movie_title.ilike(search_term))
            )
        
        total_count = query.count()
        
        sort_column = None
        if sort == "likes":
            sort_column = models.Review.likes
        else:
            sort_column = models.Review.created_at
        
        if order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        offset = (page - 1) * limit
        reviews = query.offset(offset).limit(limit).all()
        
        my_review_responses = [
            schemas.MyReviewResponse(
                id=review.id,
                title=review.title,
                movie_title=review.movie_title,
                content=review.content,
                likes=review.likes,
                created_at=review.created_at,
                status=review.status
            )
            for review in reviews
        ]
        
        total_pages = ceil(total_count / limit) if total_count > 0 else 1
        
        return schemas.PaginatedMyReviewsResponse(
            reviews=my_review_responses,
            pagination=schemas.PaginationInfo(
                current_page=page,
                total_pages=total_pages,
                total_items=total_count,
                items_per_page=limit
            )
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сервера: {str(e)}")


@router.get("/moderation", response_model=schemas.PaginatedReviewsResponse)
def get_moderation_reviews(
    current_user: models.User = Depends(get_current_admin),
    params: schemas.PublicPaginationParams = Depends(),
    db: Session = Depends(database.get_db),
):
    try:
        page = params.page
        limit = params.limit

        query = db.query(models.Review).filter(models.Review.status == "pending")
        
        total_count = query.count()
        
        sort_column = models.Review.created_at
        query = query.order_by(sort_column.desc())
        
        offset = (page - 1) * limit
        reviews = query.offset(offset).limit(limit).all()
        
        review_responses = [
            schemas.ReviewResponse(
                id=review.id,
                title=review.title,
                movie_title=review.movie_title,
                content=review.content,
                status=review.status,
                likes=review.likes,
                created_at=review.created_at,
                author=schemas.UserBase(
                    id=review.author.id,
                    username=review.author.username
                )
            )
            for review in reviews
        ]
        
        total_pages = ceil(total_count / limit) if total_count > 0 else 1
        
        return schemas.PaginatedReviewsResponse(
            reviews=review_responses,
            pagination=schemas.PaginationInfo(
                current_page=page,
                total_pages=total_pages,
                total_items=total_count,
                items_per_page=limit
            )
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сервера: {str(e)}")


@router.get("/{review_id}", response_model=schemas.DetailReviewResponse)
def get_review_detail(
    review_id: int = Path(..., ge=1),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(database.get_db)
):
    review = (
        db.query(models.Review)
        .options(joinedload(models.Review.author))
        .filter(models.Review.id == review_id)
        .first()
    )

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    is_author = current_user and current_user.id == review.user_id
    is_admin = current_user and current_user.role == "admin"

    if review.status == "approved" or is_author or is_admin:
        return schemas.DetailReviewResponse(
            id=review.id,
            title=review.title,
            movie_title=review.movie_title,
            content=review.content,
            status=review.status,
            likes=review.likes,
            author=schemas.UserBase(
                id=review.author.id,
                username=review.author.username
            ),
            created_at=review.created_at
        )
    else:
        raise HTTPException(status_code=404, detail="Review not found")


@router.post("/", response_model=schemas.ReviewCreateResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review_in: schemas.ReviewCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    new_review = models.Review(
        user_id=current_user.id,
        title=review_in.title,
        movie_title=review_in.movie_title,
        content=review_in.content,
        status="pending",
        likes=0,
        created_at=datetime.utcnow()
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return schemas.ReviewCreateResponse(
        id=new_review.id
    )


@router.post("/{review_id}/approve", status_code=status.HTTP_200_OK)
def approve_review(
    review_id: int = Path(..., ge=1),
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    if review.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Review has already been processed")

    review.status = "approved"
    db.commit()

    return


@router.post("/{review_id}/reject", status_code=status.HTTP_200_OK)
def reject_review(
    review_id: int = Path(..., ge=1),
    current_user: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.status != "pending":
        raise HTTPException(status_code=400, detail="Review has already been processed")

    review.status = "rejected"
    db.commit()

    return


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int = Path(..., ge=1),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Access is denied: you can only delete your own reviews"
        )

    db.delete(review)
    db.commit()

    return


@router.put("/{review_id}", response_model=schemas.DetailReviewResponse)
def edit_review(
    review_in: schemas.ReviewCreate,
    review_id: int = Path(..., ge=1),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Access is denied: you can only delete your own reviews"
        )

    review.title = review_in.title
    review.movie_title = review_in.movie_title
    review.content = review_in.content
    review.status = "pending"

    db.commit()
    db.refresh(review)

    return schemas.DetailReviewResponse(
        id=review.id,
        title=review.title,
        movie_title=review.movie_title,
        content=review.content,
        status=review.status,
        likes=review.likes,
        author=schemas.UserBase(
            id=current_user.id,
            username=current_user.username
        ),
        created_at=review.created_at
    )
