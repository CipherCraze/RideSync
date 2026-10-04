from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.schemas.user import UserResponse

class ReviewCreate(BaseModel):
    booking_id: int
    reviewee_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=1)
    review_type: Optional[str] = "RENTER_TO_OWNER"  # RENTER_TO_OWNER, OWNER_TO_RENTER, VEHICLE

class ReviewResponse(BaseModel):
    id: int
    booking_id: int
    reviewer_id: int
    reviewee_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    rating: int
    comment: str
    review_type: str
    is_hidden: bool = False
    created_at: datetime
    reviewer: Optional[UserResponse] = None
    reviewee: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)

class ReviewEligibilityResponse(BaseModel):
    booking_id: int
    can_review: bool
    already_reviewed: bool
    reason: Optional[str] = None
    reviewee_id: Optional[int] = None
    suggested_reviewee_id: Optional[int] = None
    suggested_review_type: Optional[str] = None

    @model_validator(mode="after")
    def populate_reviewee_id(self):
        if self.reviewee_id is None:
            self.reviewee_id = self.suggested_reviewee_id
        if self.suggested_reviewee_id is None:
            self.suggested_reviewee_id = self.reviewee_id
        return self

class ReviewModerationRequest(BaseModel):
    is_hidden: bool = True
    reason: Optional[str] = None
