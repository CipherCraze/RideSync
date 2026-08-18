from pydantic import BaseModel, EmailStr, Field
from app.schemas.user import UserResponse

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: int | None = None

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    phone: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLoginRequest(BaseModel):
    token: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
