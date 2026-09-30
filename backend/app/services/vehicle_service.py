from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.vehicle_repository import VehicleRepository
from app.repositories.user_repository import UserRepository
from app.repositories.booking_repository import BookingRepository
from app.schemas.vehicle import VehicleCreate, VehicleUpdate
from app.services.notification_service import NotificationService

class VehicleService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.vehicle_repo = VehicleRepository(db)
        self.user_repo = UserRepository(db)
        self.booking_repo = BookingRepository(db)
        self.notification_service = NotificationService(db)

    async def create_vehicle(self, owner_id: int, vehicle_in: VehicleCreate):
        owner = await self.user_repo.get(owner_id)
        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found")

        if owner.is_suspended:
            raise HTTPException(status_code=403, detail="Suspended users cannot list vehicles.")

        # Auto-approve if owner is verified or admin
        auto_approved = owner.is_verified or owner.is_admin

        vehicle_dict = vehicle_in.model_dump(exclude={"images"})
        vehicle_dict["owner_id"] = owner_id
        vehicle_dict["is_approved"] = auto_approved
        vehicle_dict["is_available"] = True
        vehicle_dict["rating_avg"] = 5.0
        vehicle_dict["rating_count"] = 0

        vehicle = await self.vehicle_repo.create(vehicle_dict)

        # Add images
        if vehicle_in.images:
            await self.vehicle_repo.add_images(vehicle.id, vehicle_in.images)

        # Re-fetch with images and owner loaded
        detailed_vehicle = await self.vehicle_repo.get_with_details(vehicle.id)

        if not auto_approved:
            await self.notification_service.notify(
                user_id=owner_id,
                title="Listing Pending Approval",
                message=f"Your {vehicle.brand} {vehicle.model} listing has been submitted and is pending admin approval.",
                notification_type="ADMIN_VERIFICATION",
                link_url=f"/vehicles/{vehicle.id}"
            )
        
        return detailed_vehicle

    async def update_vehicle(self, vehicle_id: int, owner_id: int, vehicle_in: VehicleUpdate):
        vehicle = await self.vehicle_repo.get(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        if vehicle.owner_id != owner_id:
            owner = await self.user_repo.get(owner_id)
            if not owner or not owner.is_admin:
                raise HTTPException(status_code=403, detail="Not authorized to update this vehicle")

        update_dict = vehicle_in.model_dump(exclude_unset=True, exclude={"images"})
        updated = await self.vehicle_repo.update(vehicle, update_dict)

        if vehicle_in.images is not None:
            # Replace images
            await self.vehicle_repo.add_images(vehicle.id, vehicle_in.images)

        return await self.vehicle_repo.get_with_details(vehicle.id)

    async def delete_vehicle(self, vehicle_id: int, owner_id: int):
        vehicle = await self.vehicle_repo.get(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        if vehicle.owner_id != owner_id:
            owner = await self.user_repo.get(owner_id)
            if not owner or not owner.is_admin:
                raise HTTPException(status_code=403, detail="Not authorized to delete this vehicle")

        return await self.vehicle_repo.delete(vehicle_id)

    async def get_vehicle_by_id(self, vehicle_id: int):
        vehicle = await self.vehicle_repo.get_with_details(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        return vehicle

    async def get_vehicle_availability(self, vehicle_id: int):
        vehicle = await self.vehicle_repo.get(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        bookings = await self.booking_repo.get_upcoming_for_vehicle(vehicle_id)
        
        return [{"start_date": b.start_date, "end_date": b.end_date} for b in bookings]

    async def get_owner_vehicles(self, owner_id: int):
        return await self.vehicle_repo.get_by_owner(owner_id)

    async def search(
        self,
        query: Optional[str] = None,
        location: Optional[str] = None,
        brand: Optional[str] = None,
        vehicle_type: Optional[str] = None,
        fuel_type: Optional[str] = None,
        transmission: Optional[str] = None,
        min_seats: Optional[int] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_rating: Optional[float] = None,
        sort_by: Optional[str] = "newest",
        is_approved_only: bool = True,
        skip: int = 0,
        limit: int = 50,
    ):
        return await self.vehicle_repo.search_vehicles(
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
            is_approved_only=is_approved_only,
            skip=skip,
            limit=limit,
        )
