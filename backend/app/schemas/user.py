from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: str | None = None
    profile_picture: str | None = None
    driving_license_number: str | None = None
    address: str | None = None
    bio: str | None = None

class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    profile_picture: str | None = None
    driving_license_number: str | None = None
    address: str | None = None
    bio: str | None = None

class UserVerificationRequest(BaseModel):
    driving_license_number: str

class UserResponse(UserBase):
    id: int
    honor_score: int
    is_verified: bool
    is_admin: bool
    is_suspended: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserProfileResponse(UserResponse):
    vehicles_count: int = 0
    bookings_count: int = 0
    reviews_count: int = 0
    honor_category: str = "Trusted"
