from typing import Optional, Tuple
from sqlalchemy.orm import Session
import app.db.models as models

class CRUDLike:
    @staticmethod
    def get_like(db: Session, user_id: int, review_id: int) -> Optional[models.Like]:
        return (
            db.query(models.Like)
            .filter(
                models.Like.user_id == user_id,
                models.Like.review_id == review_id
            )
            .first()
        )

    @staticmethod
    def create_like(db: Session, user_id: int, review_id: int) -> models.Like:
        like = models.Like(user_id=user_id, review_id=review_id)
        db.add(like)
        return like

    @staticmethod
    def delete_like(db: Session, like: models.Like) -> None:
        db.delete(like)

    @staticmethod
    def toggle_like(
        db: Session,
        user_id: int,
        review_id: int,
        review: models.Review
    ) -> Tuple[bool, int]:  # (is_liked, new_likes_count)
        existing_like = CRUDLike.get_like(db, user_id, review_id)
        
        if existing_like:
            db.delete(existing_like)
            review.likes -= 1
            is_liked = False
        else:
            new_like = models.Like(user_id=user_id, review_id=review_id)
            db.add(new_like)
            review.likes += 1
            is_liked = True
        
        db.commit()
        return is_liked, review.likes