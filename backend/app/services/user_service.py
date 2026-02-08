from sqlalchemy.orm import Session
import app.db.models as models
import app.schemas.user as user_schemas
from app.crud.user import CRUDUser
from app.utils.security import hash_password, verify_password, create_access_token
from app.exceptions import (
    UserNotFoundError,
    UserAlreadyExistsError,
    AuthenticationError
)


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.user_crud = CRUDUser()
    
    def get_user_by_id(
        self,
        user_id: int
    ) -> user_schemas.UserBase:

        user = self.user_crud.get(self.db, user_id)
        if not user:
            raise UserNotFoundError()
        
        return user_schemas.UserBase(
            id=user.id,
            username=user.username
        )
    
    def register_user(self, user_data: user_schemas.UserCreate) -> user_schemas.Token:
        existing_user = self.user_crud.get_by_username(self.db, user_data.username)
        if existing_user:
            raise UserAlreadyExistsError("Username already exists")

        hashed_password = hash_password(user_data.password)
        
        user = self.user_crud.create(
            db=self.db,
            username=user_data.username,
            password_hash=hashed_password,
            role=models.Role.USER
        )
        
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return user_schemas.Token(
            access_token=access_token,
            token_type="bearer"
        )
    
    def login_user(self, credentials: user_schemas.UserCreate) -> user_schemas.Token:
        user = self.user_crud.get_by_username(self.db, credentials.username)
        
        if not user or not verify_password(credentials.password, user.password_hash):
            raise AuthenticationError()
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return user_schemas.Token(
            access_token=access_token,
            token_type="bearer"
        )
    
    def get_current_user_info(self, current_user: models.User) -> user_schemas.UserOut:
        return user_schemas.UserOut(
            id=current_user.id,
            username=current_user.username,
            role=current_user.role
        )
