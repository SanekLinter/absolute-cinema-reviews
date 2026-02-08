from fastapi import Depends, Header, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from jose import JWTError

from app.db.session import get_db
import app.db.models as models
from app.utils.security import verify_token
from app.exceptions import AuthenticationError, UserNotFoundError, PermissionDeniedError

bearer_scheme = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = AuthenticationError("Could not validate credentials")

    token = credentials.credentials
    try:
        payload = verify_token(token)
        if payload is None:
            raise credentials_exception
        
        user_id: int = int(payload.get("sub"))
        if user_id is None:
            raise credentials_exception
    except (JWTError, ValueError):
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise UserNotFoundError()
    
    return user


def get_current_admin(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    if current_user.role != models.Role.ADMIN:
        raise PermissionDeniedError("Not enough permissions")
    return current_user


def get_current_user_optional(
    authorization: Optional[str] = Header(None)
) -> Optional[models.User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]

    try:
        return get_current_user(token)
    except (HTTPException, AuthenticationError, UserNotFoundError):
        return None
