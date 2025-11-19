from pydantic import BaseModel, Field
from typing import Literal

class UserCreate(BaseModel):
    username: str = Field(..., min_length=4, max_length=20, pattern="^[a-zA-Z0-9]+$",
                          description="от 4 до 20 символов, латиница/цифры")
    password: str = Field(..., min_length=8, max_length=16,
                          description="от 8 до 16 символов, латиница/цифры/символы")

class UserOut(BaseModel):
    id: int
    username: str
    role: Literal["user", "admin"]

    class Config:
        from_attributes = True