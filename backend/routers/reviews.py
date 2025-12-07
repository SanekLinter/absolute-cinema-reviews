from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database
from dependencies import get_current_user
from math import ceil

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

