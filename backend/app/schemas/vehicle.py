from datetime import datetime
from typing import List, Optional, Union
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserResponse

class VehicleImageSchema(BaseModel):
    id: Optional[int] = None
    image_url: str
    angle: Optional[str] = "OTHER"  # FRONT, REAR, SIDE_LEFT, SIDE_RIGHT, INTERIOR, DASHBOARD, OTHER
    is_primary: bool = False

    model_config = ConfigDict(from_attributes=True)

class VehicleImageCreate(BaseModel):
    image_url: str
    angle: Optional[str] = "OTHER"
    is_primary: bool = False

class VehicleDocumentSchema(BaseModel):
    id: int
    vehicle_id: int
    document_type: str  # RC, PUC, SERVICE_RECORD, INSURANCE
    document_url: str
    document_number: Optional[str] = None
    expiry_date: Optional[datetime] = None
    status: str = "PENDING"  # PENDING, VERIFIED, REJECTED
    rejection_reason: Optional[str] = None
    uploaded_at: datetime
    verified_at: Optional[datetime] = None
    verified_by_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class VehicleDocumentCreate(BaseModel):
    document_type: str  # RC, PUC, SERVICE_RECORD, INSURANCE
    document_url: str
    document_number: Optional[str] = None
    expiry_date: Optional[datetime] = None

class VehicleDocumentVerify(BaseModel):
    status: str  # VERIFIED or REJECTED
    rejection_reason: Optional[str] = None

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
    status: Optional[str] = "PENDING"  # DRAFT or PENDING
    images: List[Union[str, VehicleImageCreate]] = []
    documents: Optional[List[VehicleDocumentCreate]] = []

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
    status: Optional[str] = None
    rejection_reason: Optional[str] = None
    images: Optional[List[Union[str, VehicleImageCreate]]] = None

class VehicleRejectionRequest(BaseModel):
    reason: str = Field(..., min_length=5, description="Reason for rejecting vehicle listing")

class VehicleResponse(VehicleBase):
    id: int
    owner_id: int
    status: str = "APPROVED"
    rejection_reason: Optional[str] = None
    is_approved: bool
    is_available: bool
    rating_avg: float
    rating_count: int
    created_at: datetime
    images: List[VehicleImageSchema] = []
    documents: List[VehicleDocumentSchema] = []

    model_config = ConfigDict(from_attributes=True)

class VehicleDetailResponse(VehicleResponse):
    owner: UserResponse
