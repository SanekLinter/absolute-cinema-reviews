from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session
import models, schemas, database

router = APIRouter(tags=["users"])


@router.get("/{user_id}", response_model=schemas.UserBase)
def get_user_by_id(
    user_id: int = Path(..., ge=1),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User doesn't exist"
        )
    return schemas.UserBase(id=user.id, username=user.username)
