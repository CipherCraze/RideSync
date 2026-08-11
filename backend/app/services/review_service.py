from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.repositories.review_repository import ReviewRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.review import ReviewCreate
from app.services.honor_service import HonorService
from app.services.notification_service import NotificationService

class ReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.review_repo = ReviewRepository(db)
        self.booking_repo = BookingRepository(db)
        self.vehicle_repo = VehicleRepository(db)
        self.user_repo = UserRepository(db)
        self.honor_service = HonorService(db)
        self.notification_service = NotificationService(db)

    async def create_review(self, reviewer_id: int, review_in: ReviewCreate):
        booking = await self.booking_repo.get_with_details(review_in.booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")

        if booking.status not in ["COMPLETED", "RETURNED"]:
            raise HTTPException(status_code=400, detail="Reviews can only be submitted after rental completion or return.")

        if reviewer_id not in [booking.renter_id, booking.owner_id]:
            raise HTTPException(status_code=403, detail="You can only review bookings you participated in.")

        review_data = review_in.model_dump()
        review_data["reviewer_id"] = reviewer_id

        review = await self.review_repo.create(review_data)

        # Honor score hook for user reviews
        if review_in.reviewee_id:
            reviewee = await self.user_repo.get(review_in.reviewee_id)
            if reviewee:
                if review_in.rating >= 4:
                    await self.honor_service.adjust_score(
                        user_id=reviewee.id,
                        points_change=3,
                        reason=f"Received a positive {review_in.rating}-star review for rental #{booking.id}"
                    )
                elif review_in.rating <= 2:
                    await self.honor_service.adjust_score(
                        user_id=reviewee.id,
                        points_change=-5,
                        reason=f"Received a critical {review_in.rating}-star review for rental #{booking.id}"
                    )

                await self.notification_service.notify(
                    user_id=reviewee.id,
                    title="New Review Received",
                    message=f"You received a {review_in.rating}-star review: '{review_in.comment[:50]}...'",
                    notification_type="REVIEW_RECEIVED"
                )

        # Vehicle rating recalculation
        if review_in.vehicle_id:
            vehicle = await self.vehicle_repo.get_with_details(review_in.vehicle_id)
            if vehicle:
                all_vehicle_reviews = await self.review_repo.get_by_vehicle(vehicle.id)
                count = len(all_vehicle_reviews)
                if count > 0:
                    avg = sum(r.rating for r in all_vehicle_reviews) / count
                    await self.vehicle_repo.update(vehicle, {
                        "rating_avg": round(float(avg), 1),
                        "rating_count": count
                    })

        return review

    async def get_by_vehicle(self, vehicle_id: int):
        return await self.review_repo.get_by_vehicle(vehicle_id)

    async def get_by_user(self, user_id: int):
        return await self.review_repo.get_by_user(user_id)
