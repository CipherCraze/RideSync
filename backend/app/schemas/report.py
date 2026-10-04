from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, model_validator
from app.schemas.user import UserResponse
from app.schemas.vehicle import VehicleResponse
from app.schemas.review import ReviewResponse

class ReportCreate(BaseModel):
    reported_user_id: Optional[int] = None
    reported_vehicle_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    booking_id: Optional[int] = None
    review_id: Optional[int] = None
    reason: Optional[str] = None  # FAKE_LISTING, INAPPROPRIATE_BEHAVIOR, VEHICLE_DAMAGE, FRAUD, LATE_RETURN, ABUSIVE_REVIEW, OTHER
    category: Optional[str] = None
    details: Optional[str] = None
    description: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def resolve_aliases(cls, values):
        if isinstance(values, dict):
            if "reported_vehicle_id" not in values and "vehicle_id" in values:
                values["reported_vehicle_id"] = values["vehicle_id"]
            if not values.get("reason") and values.get("category"):
                values["reason"] = values["category"]
        return values

    @model_validator(mode="after")
    def ensure_details(self):
        if not self.reason and not self.category:
            raise ValueError("Either 'reason' or 'category' must be provided.")
        if not self.reason:
            self.reason = self.category
        if not self.category:
            self.category = self.reason

        if not self.reported_vehicle_id and self.vehicle_id:
            self.reported_vehicle_id = self.vehicle_id

        if not self.details and not self.description:
            raise ValueError("Either 'details' or 'description' must be provided.")
        if not self.details and self.description:
            self.details = self.description
        if not self.description and self.details:
            self.description = self.details
        return self

class ReportUpdate(BaseModel):
    status: str  # OPEN, UNDER_REVIEW, RESOLVED, REJECTED, PENDING, DISMISSED
    admin_notes: Optional[str] = None
    honor_score_penalty: Optional[int] = None
    honor_penalty: Optional[int] = None
    hide_review: Optional[bool] = None

    @model_validator(mode="before")
    @classmethod
    def resolve_penalty(cls, values):
        if isinstance(values, dict):
            if "honor_score_penalty" not in values and "honor_penalty" in values:
                values["honor_score_penalty"] = values["honor_penalty"]
            elif "honor_penalty" not in values and "honor_score_penalty" in values:
                values["honor_penalty"] = values["honor_score_penalty"]
        return values

class ReportResponse(BaseModel):
    id: int
    reporter_id: int
    reported_user_id: Optional[int] = None
    reported_vehicle_id: Optional[int] = None
    booking_id: Optional[int] = None
    review_id: Optional[int] = None
    reason: str
    details: str
    description: Optional[str] = None
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    reporter: Optional[UserResponse] = None
    reported_user: Optional[UserResponse] = None
    reported_vehicle: Optional[VehicleResponse] = None
    review: Optional[ReviewResponse] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def ensure_description(self):
        if self.description is None:
            self.description = self.details
        return self
