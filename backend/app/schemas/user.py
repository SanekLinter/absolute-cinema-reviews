from pydantic import BaseModel, Field
from typing import Optional
import app.db.models as models

UserRole = models.Role

class UserCreate(BaseModel):
    username: str = Field(..., min_length=4, max_length=20, pattern="^[a-zA-Z0-9]+$")
    password: str = Field(..., min_length=8, max_length=16)
    

class UserBase(BaseModel):
    id: int
    username: str
    
    class Config:
        from_attributes = True


class UserOut(UserBase):
    role: UserRole
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
