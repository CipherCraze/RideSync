from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc, asc
from sqlalchemy.orm import selectinload
from app.models.vehicle import Vehicle
from app.models.vehicle_image import VehicleImage
from app.repositories.base import BaseRepository

class VehicleRepository(BaseRepository[Vehicle]):
    def __init__(self, db: AsyncSession):
        super().__init__(Vehicle, db)

    async def get_with_details(self, vehicle_id: int) -> Optional[Vehicle]:
        result = await self.db.execute(
            select(Vehicle)
            .options(selectinload(Vehicle.images), selectinload(Vehicle.owner))
            .where(Vehicle.id == vehicle_id)
        )
        return result.scalars().first()

    async def get_by_owner(self, owner_id: int) -> List[Vehicle]:
        result = await self.db.execute(
            select(Vehicle)
            .options(selectinload(Vehicle.images))
            .where(Vehicle.owner_id == owner_id)
            .order_by(desc(Vehicle.created_at))
        )
        return list(result.scalars().all())

    async def search_vehicles(
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
    ) -> List[Vehicle]:
        stmt = select(Vehicle).options(selectinload(Vehicle.images), selectinload(Vehicle.owner))

        conditions = []
        if is_approved_only:
            conditions.append(Vehicle.is_approved == True)
            conditions.append(Vehicle.is_available == True)

        if query:
            q_pattern = f"%{query}%"
            conditions.append(
                or_(
                    Vehicle.brand.ilike(q_pattern),
                    Vehicle.model.ilike(q_pattern),
                    Vehicle.pickup_location.ilike(q_pattern),
                    Vehicle.description.ilike(q_pattern),
                )
            )

        if location:
            conditions.append(Vehicle.pickup_location.ilike(f"%{location}%"))
        if brand:
            conditions.append(Vehicle.brand.ilike(f"%{brand}%"))
        if vehicle_type:
            conditions.append(Vehicle.vehicle_type == vehicle_type)
        if fuel_type:
            conditions.append(Vehicle.fuel_type == fuel_type)
        if transmission:
            conditions.append(Vehicle.transmission == transmission)
        if min_seats:
            conditions.append(Vehicle.seats >= min_seats)
        if min_price is not None:
            conditions.append(Vehicle.price_per_day >= min_price)
        if max_price is not None:
            conditions.append(Vehicle.price_per_day <= max_price)
        if min_rating is not None:
            conditions.append(Vehicle.rating_avg >= min_rating)

        if conditions:
            stmt = stmt.where(and_(*conditions))

        if sort_by == "price_asc":
            stmt = stmt.order_by(asc(Vehicle.price_per_day))
        elif sort_by == "price_desc":
            stmt = stmt.order_by(desc(Vehicle.price_per_day))
        elif sort_by == "rating_desc":
            stmt = stmt.order_by(desc(Vehicle.rating_avg))
        else:  # newest
            stmt = stmt.order_by(desc(Vehicle.created_at))

        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_pending_approvals(self) -> List[Vehicle]:
        result = await self.db.execute(
            select(Vehicle)
            .options(selectinload(Vehicle.images), selectinload(Vehicle.owner))
            .where(Vehicle.is_approved == False)
            .order_by(desc(Vehicle.created_at))
        )
        return list(result.scalars().all())

    async def add_images(self, vehicle_id: int, image_urls: List[str]) -> List[VehicleImage]:
        images = []
        for idx, url in enumerate(image_urls):
            img = VehicleImage(
                vehicle_id=vehicle_id,
                image_url=url,
                is_primary=(idx == 0)
            )
            self.db.add(img)
            images.append(img)
        await self.db.commit()
        return images

