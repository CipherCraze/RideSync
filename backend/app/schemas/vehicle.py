from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserResponse

class VehicleImageSchema(BaseModel):
    id: Optional[int] = None
    image_url: str
    is_primary: bool = False

    model_config = ConfigDict(from_attributes=True)

class VehicleBase(BaseModel):
    brand: str
    model: str
    year: int = Field(..., ge=1990, le=2027)
    vehicle_type: str  # Sedan, SUV, Hatchback, Convertible, Truck, Van, Electric, Luxury
    fuel_type: str     # Petrol, Diesel, Electric, Hybrid
    transmission: str  # Automatic, Manual
    seats: int = Field(..., ge=1, le=20)
    price_per_day: float = Field(..., gt=0)
    description: str
    pickup_location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class VehicleCreate(VehicleBase):
    images: List[str] = []  # Image URLs

class VehicleUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    vehicle_type: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    seats: Optional[int] = None
    price_per_day: Optional[float] = None
    description: Optional[str] = None
    pickup_location: Optional[str] = None
    is_available: Optional[bool] = None
    images: Optional[List[str]] = None

class VehicleResponse(VehicleBase):
    id: int
    owner_id: int
    is_approved: bool
    is_available: bool
    rating_avg: float
    rating_count: int
    created_at: datetime
    images: List[VehicleImageSchema] = []

    model_config = ConfigDict(from_attributes=True)

class VehicleDetailResponse(VehicleResponse):
    owner: UserResponse
