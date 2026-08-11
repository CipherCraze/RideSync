from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse
from app.schemas.vehicle import VehicleResponse

class ReportCreate(BaseModel):
    reported_user_id: Optional[int] = None
    reported_vehicle_id: Optional[int] = None
    reason: str  # FAKE_LISTING, INAPPROPRIATE_BEHAVIOR, VEHICLE_DAMAGE, FRAUD, LATE_RETURN, OTHER
    details: str

class ReportUpdate(BaseModel):
    status: str  # PENDING, INVESTIGATING, RESOLVED, DISMISSED
    admin_notes: Optional[str] = None

class ReportResponse(BaseModel):
    id: int
    reporter_id: int
    reported_user_id: Optional[int] = None
    reported_vehicle_id: Optional[int] = None
    reason: str
    details: str
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    reporter: Optional[UserResponse] = None
    reported_user: Optional[UserResponse] = None
    reported_vehicle: Optional[VehicleResponse] = None

    model_config = ConfigDict(from_attributes=True)
