from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

import app.schemas.user as user_schemas
from app.services.user_service import UserService
import app.db.models as models
from app.db.session import get_db
from app.dependencies import get_current_user


router = APIRouter(tags=["auth"])


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


@router.post("/register", response_model=user_schemas.Token, status_code=status.HTTP_201_CREATED)
def register_user(
    user_in: user_schemas.UserCreate,
    user_service: UserService = Depends(get_user_service)
):
    return user_service.register_user(user_in)


@router.post("/login", response_model=user_schemas.Token)
def login_user(
    user_in: user_schemas.UserCreate,
    user_service: UserService = Depends(get_user_service)
):
    return user_service.login_user(user_in)


@router.get("/me", response_model=user_schemas.UserOut)
def get_current_user_info(
    current_user: models.User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    return user_service.get_current_user_info(current_user)
