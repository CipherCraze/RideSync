from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserResponse

class ReviewCreate(BaseModel):
    booking_id: int
    reviewee_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    rating: int = Field(..., ge=1, le=5)
    comment: str
    review_type: str  # RENTER_TO_OWNER, OWNER_TO_RENTER, VEHICLE

class ReviewResponse(BaseModel):
    id: int
    booking_id: int
    reviewer_id: int
    reviewee_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    rating: int
    comment: str
    review_type: str
    created_at: datetime
    reviewer: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
