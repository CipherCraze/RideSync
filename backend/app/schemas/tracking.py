from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class TrackingConfigResponse(BaseModel):
    default_masking_buffer_km: float = 1.5
    gradient_near_threshold_km: float = 2.0
    gradient_near_accuracy_km: float = 0.5
    gradient_far_threshold_km: float = 5.0
    gradient_far_accuracy_km: float = 0.08
    gradient_sensitivity: float = 1.0

class TrackingConfigUpdate(BaseModel):
    default_masking_buffer_km: Optional[float] = Field(None, ge=0.2, le=10.0)
    gradient_near_threshold_km: Optional[float] = Field(None, ge=0.5, le=20.0)
    gradient_near_accuracy_km: Optional[float] = Field(None, ge=0.05, le=5.0)
    gradient_far_threshold_km: Optional[float] = Field(None, ge=1.0, le=50.0)
    gradient_far_accuracy_km: Optional[float] = Field(None, ge=0.01, le=1.0)
    gradient_sensitivity: Optional[float] = Field(None, ge=0.1, le=5.0)

class VehicleLocationResponse(BaseModel):
    vehicle_id: int
    brand: str
    model: str
    year: int
    pickup_location: str
    geofence_type: str  # CIRCULAR or FLEXIBLE
    geofence_center_lat: Optional[float] = None
    geofence_center_lng: Optional[float] = None
    geofence_radius_km: Optional[float] = None
    geofence_center_name: Optional[str] = None
    
    # Wire Privacy coordinates (obfuscated by gradient)
    obfuscated_latitude: float
    obfuscated_longitude: float
    approx_latitude: Optional[float] = None
    approx_longitude: Optional[float] = None
    accuracy_radius_m: float
    is_obfuscated: bool = True
    
    # Telemetry status
    speed_kmh: float = 0.0
    battery_or_fuel_level: int = 85
    last_location_update: Optional[datetime] = None
    last_updated: Optional[datetime] = None
    is_geofence_breached: bool = False
    is_breached: bool = False
    breach_distance_km: float = 0.0
    breach_severity: str = "SAFE"
    status_chip: str = "Inside Safe Zone"
    status_label: str = "Inside Safe Zone"
    is_active_rental: bool = False
    rental_status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class VehicleTelemetryUpdate(BaseModel):
    latitude: float
    longitude: float
    speed_kmh: Optional[float] = None
    battery_or_fuel_level: Optional[int] = None

class SimulationRequest(BaseModel):
    target_state: str = "AUTO"  # "AUTO", "IN_BOUNDS", "BREACH_NEAR", "BREACH_FAR"

class LocationPingResponse(BaseModel):
    id: int
    vehicle_id: int
    booking_id: Optional[int] = None
    latitude: float
    longitude: float
    speed_kmh: float
    battery_or_fuel_level: float
    is_geofence_breached: bool
    breach_distance_km: float
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)

class OverdueLocationResponse(BaseModel):
    booking_id: int
    vehicle_id: int
    vehicle_name: str
    renter_name: str
    renter_phone: Optional[str] = None
    scheduled_end_date: datetime
    hours_overdue: float
    current_latitude: float
    current_longitude: float
    speed_kmh: float
    battery_or_fuel_level: float
    last_location_update: Optional[datetime] = None
    is_geofence_breached: bool
    breach_distance_km: float
    emergency_status: str

    model_config = ConfigDict(from_attributes=True)
