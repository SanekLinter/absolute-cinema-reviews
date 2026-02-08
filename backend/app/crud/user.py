from typing import Optional
from sqlalchemy.orm import Session
import app.db.models as models

class CRUDUser:
    @staticmethod
    def get(db: Session, user_id: int) -> Optional[models.User]:
        return db.query(models.User).filter(models.User.id == user_id).first()

    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[models.User]:
        return db.query(models.User).filter(models.User.username == username).first()

    @staticmethod
    def create(db: Session, *, username: str, password_hash: str, role: str = models.Role.USER) -> models.User:
        user = models.User(
            username=username,
            password_hash=password_hash,
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update(db: Session, *, user: models.User, **update_data) -> models.User:
        for field, value in update_data.items():
            setattr(user, field, value)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def delete(db: Session, user_id: int) -> bool:
        user = CRUDUser.get(db, user_id)
        if user:
            db.delete(user)
            db.commit()
            return True
        return False
