from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.models.review import Review
from app.repositories.base import BaseRepository

class ReviewRepository(BaseRepository[Review]):
    def __init__(self, db: AsyncSession):
        super().__init__(Review, db)

    async def get_with_details(self, review_id: int) -> Optional[Review]:
        result = await self.db.execute(
            select(Review)
            .options(
                selectinload(Review.reviewer),
                selectinload(Review.reviewee),
                selectinload(Review.vehicle),
            )
            .where(Review.id == review_id)
        )
        return result.scalars().first()

    async def get_by_vehicle(self, vehicle_id: int, include_hidden: bool = False) -> List[Review]:
        query = (
            select(Review)
            .options(selectinload(Review.reviewer), selectinload(Review.reviewee))
            .where(Review.vehicle_id == vehicle_id)
        )
        if not include_hidden:
            query = query.where(Review.is_hidden == False)
        result = await self.db.execute(query.order_by(desc(Review.created_at)))
        return list(result.scalars().all())

    async def get_by_user(self, user_id: int, include_hidden: bool = False) -> List[Review]:
        query = (
            select(Review)
            .options(selectinload(Review.reviewer), selectinload(Review.vehicle))
            .where(Review.reviewee_id == user_id)
        )
        if not include_hidden:
            query = query.where(Review.is_hidden == False)
        result = await self.db.execute(query.order_by(desc(Review.created_at)))
        return list(result.scalars().all())

    async def get_given_by_user(self, user_id: int) -> List[Review]:
        query = (
            select(Review)
            .options(selectinload(Review.reviewee), selectinload(Review.vehicle))
            .where(Review.reviewer_id == user_id)
            .order_by(desc(Review.created_at))
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_booking(self, booking_id: int) -> List[Review]:
        result = await self.db.execute(
            select(Review)
            .options(selectinload(Review.reviewer), selectinload(Review.reviewee))
            .where(Review.booking_id == booking_id)
        )
        return list(result.scalars().all())

    async def get_by_booking_and_reviewer(self, booking_id: int, reviewer_id: int) -> Optional[Review]:
        result = await self.db.execute(
            select(Review)
            .where(Review.booking_id == booking_id, Review.reviewer_id == reviewer_id)
        )
        return result.scalars().first()

    async def set_hidden(self, review_id: int, is_hidden: bool = True) -> Optional[Review]:
        review = await self.get_with_details(review_id)
        if review:
            review.is_hidden = is_hidden
            await self.db.commit()
        return await self.get_with_details(review_id)
