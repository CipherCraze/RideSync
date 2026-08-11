from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.models.review import Review
from app.repositories.base import BaseRepository

class ReviewRepository(BaseRepository[Review]):
    def __init__(self, db: AsyncSession):
        super().__init__(Review, db)

    async def get_by_vehicle(self, vehicle_id: int) -> List[Review]:
        result = await self.db.execute(
            select(Review)
            .options(selectinload(Review.reviewer))
            .where(Review.vehicle_id == vehicle_id)
            .order_by(desc(Review.created_at))
        )
        return list(result.scalars().all())

    async def get_by_user(self, user_id: int) -> List[Review]:
        result = await self.db.execute(
            select(Review)
            .options(selectinload(Review.reviewer))
            .where(Review.reviewee_id == user_id)
            .order_by(desc(Review.created_at))
        )
        return list(result.scalars().all())

    async def get_by_booking(self, booking_id: int) -> List[Review]:
        result = await self.db.execute(
            select(Review)
            .where(Review.booking_id == booking_id)
        )
        return list(result.scalars().all())
