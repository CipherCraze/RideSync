from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse, VehicleDetailResponse
from app.services.vehicle_service import VehicleService
from app.models.user import User

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.get("/", response_model=List[VehicleResponse])
async def search_vehicles(
    query: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    vehicle_type: Optional[str] = Query(None),
    fuel_type: Optional[str] = Query(None),
    transmission: Optional[str] = Query(None),
    min_seats: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_rating: Optional[float] = Query(None),
    sort_by: Optional[str] = Query("newest"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = VehicleService(db)
    return await service.search(
        query=query,
        location=location,
        brand=brand,
        vehicle_type=vehicle_type,
        fuel_type=fuel_type,
        transmission=transmission,
        min_seats=min_seats,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        sort_by=sort_by,
        is_approved_only=True,
        skip=skip,
        limit=limit,
    )

@router.get("/my-listings", response_model=List[VehicleResponse])
async def get_my_vehicles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = VehicleService(db)
    return await service.get_owner_vehicles(current_user.id)

@router.get("/{vehicle_id}", response_model=VehicleDetailResponse)
async def get_vehicle(vehicle_id: int, db: AsyncSession = Depends(get_db)):
    service = VehicleService(db)
    return await service.get_vehicle_by_id(vehicle_id)

@router.post("/", response_model=VehicleDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    vehicle_in: VehicleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = VehicleService(db)
    return await service.create_vehicle(current_user.id, vehicle_in)

@router.put("/{vehicle_id}", response_model=VehicleDetailResponse)
async def update_vehicle(
    vehicle_id: int,
    vehicle_in: VehicleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = VehicleService(db)
    return await service.update_vehicle(vehicle_id, current_user.id, vehicle_in)

@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = VehicleService(db)
    await service.delete_vehicle(vehicle_id, current_user.id)
