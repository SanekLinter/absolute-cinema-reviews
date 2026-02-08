from fastapi import APIRouter, Depends, Path, status
from sqlalchemy.orm import Session

import app.schemas.user as user_schemas
from app.services.user_service import UserService
from app.db.session import get_db


router = APIRouter(tags=["users"])


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


@router.get("/{user_id}", response_model=user_schemas.UserBase)
def get_user_by_id(
    user_id: int = Path(..., ge=1),
    user_service: UserService = Depends(get_user_service)
):
    return user_service.get_user_by_id(user_id)
