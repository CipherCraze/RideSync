from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.vehicle_tracking_service import VehicleTrackingService
from app.schemas.tracking import (
    VehicleLocationResponse,
    VehicleTelemetryUpdate,
    SimulationRequest,
    TrackingConfigResponse
)

router = APIRouter(prefix="/tracking", tags=["Tracking & Geofencing"])

@router.get("/fleet", response_model=List[VehicleLocationResponse])
async def get_my_fleet_tracking(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns real-time fleet map telemetry for all vehicles owned by the host.
    Applies Wire Privacy coordinates and dynamic accuracy gradient sizing.
    """
    service = VehicleTrackingService(db)
    return await service.get_owner_fleet(current_user.id)

@router.get("/vehicles/{vehicle_id}", response_model=VehicleLocationResponse)
async def get_vehicle_location(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns privacy-preserved location of a vehicle for host or active renter.
    """
    service = VehicleTrackingService(db)
    return await service.get_vehicle_location(vehicle_id, current_user.id)

@router.post("/vehicles/{vehicle_id}/simulate", response_model=VehicleLocationResponse)
async def simulate_vehicle_movement(
    vehicle_id: int,
    req: SimulationRequest = SimulationRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Simulates vehicle transit to demonstrate progressive accuracy gradient:
    IN_BOUNDS (coarse ~1.5km), BREACH_NEAR (~500m), or BREACH_FAR (~80m).
    """
    service = VehicleTrackingService(db)
    return await service.simulate_movement(vehicle_id, current_user.id, req.target_state)

@router.post("/vehicles/{vehicle_id}/telemetry", response_model=VehicleLocationResponse)
async def update_telemetry(
    vehicle_id: int,
    telemetry: VehicleTelemetryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingests live or simulated GPS readings.
    """
    service = VehicleTrackingService(db)
    return await service.update_telemetry(vehicle_id, telemetry)
