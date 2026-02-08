from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
import app.db.models as models
import app.schemas.review as review

class CRUDReview:
    @staticmethod
    def get(db: Session, review_id: int) -> Optional[models.Review]:
        return db.query(models.Review).filter(models.Review.id == review_id).first()

    @staticmethod
    def get_with_author(db: Session, review_id: int) -> Optional[models.Review]:
        from sqlalchemy.orm import joinedload
        return (
            db.query(models.Review)
            .options(joinedload(models.Review.author))
            .filter(models.Review.id == review_id)
            .first()
        )

    @staticmethod
    def create(db: Session, user_id: int, **review_data) -> models.Review:
        review = models.Review(
            user_id=user_id,
            status=models.ReviewStatus.PENDING,
            likes=0,
            **review_data
        )
        db.add(review)
        db.commit()
        db.refresh(review)
        return review

    @staticmethod
    def update(db: Session, review: models.Review, **update_data) -> models.Review:
        for field, value in update_data.items():
            setattr(review, field, value)
        db.commit()
        db.refresh(review)
        return review

    @staticmethod
    def delete(db: Session, review: models.Review) -> None:
        db.delete(review)
        db.commit()

    @staticmethod
    def change_status(db: Session, review: models.Review, status: str) -> models.Review:
        review.status = status
        db.commit()
        db.refresh(review)
        return review

    @staticmethod
    def get_public_reviews(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = review.SortBy.CREATED_AT,
        sort_order: str = review.SortOrder.DESC,
        search: Optional[str] = None,
        author_id: Optional[int] = None
    ) -> Tuple[List[models.Review], int]:
        query = db.query(models.Review).filter(models.Review.status == models.ReviewStatus.APPROVED)
        
        if author_id:
            query = query.filter(models.Review.user_id == author_id)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (models.Review.title.ilike(search_term)) |
                (models.Review.movie_title.ilike(search_term))
            )
        
        total = query.count()
        
        
        sort_column = None
        if sort_by == review.SortBy.LIKES:
            sort_column = models.Review.likes
        else:
            sort_column = models.Review.created_at
        if sort_order == review.SortOrder.ASC:
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))
        
        reviews = query.offset(skip).limit(limit).all()
        return reviews, total

    @staticmethod
    def get_user_reviews(
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = review.SortBy.CREATED_AT,
        sort_order: str = review.SortOrder.DESC,
        search: Optional[str] = None
    ) -> Tuple[List[models.Review], int]:
        query = db.query(models.Review).filter(models.Review.user_id == user_id)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (models.Review.title.ilike(search_term)) |
                (models.Review.movie_title.ilike(search_term))
            )
        
        total = query.count()
        
        sort_column = None
        if sort_by == review.SortBy.LIKES:
            sort_column = models.Review.likes
        else:
            sort_column = models.Review.created_at
        if sort_order == review.SortOrder.ASC:
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))
        
        reviews = query.offset(skip).limit(limit).all()
        return reviews, total

    @staticmethod
    def get_pending_reviews(
        db: Session,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[models.Review], int]:
        query = db.query(models.Review).filter(models.Review.status == models.ReviewStatus.PENDING)
        total = query.count()
        reviews = query.order_by(desc(models.Review.created_at)).offset(skip).limit(limit).all()
        return reviews, total
