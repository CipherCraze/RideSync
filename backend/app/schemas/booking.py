from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse
from app.schemas.vehicle import VehicleResponse

class BookingCreate(BaseModel):
    vehicle_id: int
    start_date: datetime
    end_date: datetime

class BookingStatusUpdate(BaseModel):
    status: str # CONFIRMED, REJECTED, RENTAL_ACTIVE, RETURNED, COMPLETED, CANCELLED
    cancellation_reason: Optional[str] = None

class RadiusProposalRequest(BaseModel):
    proposed_radius_km: float

class RadiusProposalDecision(BaseModel):
    action: str # "ACCEPT" or "REJECT"

class BookingResponse(BaseModel):
    id: int
    renter_id: int
    vehicle_id: int
    owner_id: int
    start_date: datetime
    end_date: datetime
    total_price: float
    status: str
    payment_status: str
    cancellation_reason: Optional[str] = None
    is_overdue: Optional[bool] = False
    permitted_radius_km: Optional[float] = 25.0
    proposed_radius_km: Optional[float] = None
    radius_proposal_by: Optional[str] = None
    radius_proposal_status: Optional[str] = "NONE"
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BookingDetailResponse(BookingResponse):
    renter: UserResponse
    owner: UserResponse
    vehicle: VehicleResponse
