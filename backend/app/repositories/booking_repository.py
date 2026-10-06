from datetime import datetime
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc
from sqlalchemy.orm import selectinload
from app.models.booking import Booking
from app.models.vehicle import Vehicle
from app.repositories.base import BaseRepository

class BookingRepository(BaseRepository[Booking]):
    def __init__(self, db: AsyncSession):
        super().__init__(Booking, db)

    async def get_with_details(self, booking_id: int) -> Optional[Booking]:
        result = await self.db.execute(
            select(Booking)
            .options(
                selectinload(Booking.renter),
                selectinload(Booking.owner),
                selectinload(Booking.vehicle).selectinload(Vehicle.images),
                selectinload(Booking.vehicle).selectinload(Vehicle.documents),
            )
            .where(Booking.id == booking_id)
        )
        return result.scalars().first()

    async def get_by_renter(self, renter_id: int, status: Optional[str] = None) -> List[Booking]:
        stmt = (
            select(Booking)
            .options(
                selectinload(Booking.renter),
                selectinload(Booking.owner),
                selectinload(Booking.vehicle).selectinload(Vehicle.images),
                selectinload(Booking.vehicle).selectinload(Vehicle.documents),
            )
            .where(Booking.renter_id == renter_id)
        )
        if status:
            stmt = stmt.where(Booking.status == status)
        stmt = stmt.order_by(desc(Booking.created_at))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_owner(self, owner_id: int, status: Optional[str] = None) -> List[Booking]:
        stmt = (
            select(Booking)
            .options(
                selectinload(Booking.renter),
                selectinload(Booking.owner),
                selectinload(Booking.vehicle).selectinload(Vehicle.images),
                selectinload(Booking.vehicle).selectinload(Vehicle.documents),
            )
            .where(Booking.owner_id == owner_id)
        )
        if status:
            stmt = stmt.where(Booking.status == status)
        stmt = stmt.order_by(desc(Booking.created_at))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def check_overlapping_bookings(
        self,
        vehicle_id: int,
        start_date: datetime,
        end_date: datetime,
        exclude_booking_id: Optional[int] = None,
    ) -> bool:
        stmt = select(Booking).where(
            Booking.vehicle_id == vehicle_id,
            Booking.status.in_(["PENDING", "CONFIRMED", "RENTAL_ACTIVE"]),
            and_(Booking.start_date < end_date, Booking.end_date > start_date),
        )
        if exclude_booking_id:
            stmt = stmt.where(Booking.id != exclude_booking_id)
        
        result = await self.db.execute(stmt)
        return len(result.scalars().all()) > 0

    async def get_upcoming_for_vehicle(self, vehicle_id: int) -> List[Booking]:
        from datetime import timezone
        stmt = select(Booking).where(
            Booking.vehicle_id == vehicle_id,
            Booking.status.in_(["PENDING", "CONFIRMED", "RENTAL_ACTIVE"]),
            Booking.end_date >= datetime.now(timezone.utc)
        ).order_by(Booking.start_date)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
