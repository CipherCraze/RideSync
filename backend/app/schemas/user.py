from datetime import datetime
from typing import List, Optional
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

class UserListingSummary(BaseModel):
    id: int
    brand: str
    model: str
    year: int
    vehicle_type: str
    price_per_day: float
    pickup_location: str
    rating_avg: float
    primary_image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UserPublicCard(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    honor_score: int
    honor_category: str
    is_verified: bool
    created_at: datetime
    active_listings_count: int = 0
    active_listings: List[UserListingSummary] = []

    model_config = ConfigDict(from_attributes=True)

class UserPublicDetail(UserPublicCard):
    reviews_count: int = 0
    rating_avg: float = 5.0
