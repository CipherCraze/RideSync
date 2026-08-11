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

class BookingResponse(BaseModel):
    id: int
    renter_id: int
    vehicle_id: int
    owner_id: int
    start_date: datetime
    end_date: datetime
    total_price: float
    status: str
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BookingDetailResponse(BookingResponse):
    renter: UserResponse
    owner: UserResponse
    vehicle: VehicleResponse
