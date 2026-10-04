from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.review_repository import ReviewRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.review import ReviewCreate, ReviewEligibilityResponse
from app.services.notification_service import NotificationService

class ReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.review_repo = ReviewRepository(db)
        self.booking_repo = BookingRepository(db)
        self.vehicle_repo = VehicleRepository(db)
        self.user_repo = UserRepository(db)
        self.notification_service = NotificationService(db)

    async def check_booking_eligibility(self, booking_id: int, user_id: int) -> ReviewEligibilityResponse:
        booking = await self.booking_repo.get(booking_id)
        if not booking:
            return ReviewEligibilityResponse(
                booking_id=booking_id,
                can_review=False,
                already_reviewed=False,
                reason="Booking not found."
            )

        if user_id not in [booking.renter_id, booking.owner_id]:
            return ReviewEligibilityResponse(
                booking_id=booking_id,
                can_review=False,
                already_reviewed=False,
                reason="You were not a participant in this booking."
            )

        already_reviewed = await self.review_repo.get_by_booking_and_reviewer(booking.id, user_id)
        if already_reviewed:
            return ReviewEligibilityResponse(
                booking_id=booking_id,
                can_review=False,
                already_reviewed=True,
                reason="You have already submitted a review for this booking."
            )

        if booking.status not in ["COMPLETED", "RETURNED"]:
            return ReviewEligibilityResponse(
                booking_id=booking_id,
                can_review=False,
                already_reviewed=False,
                reason=f"Booking is in {booking.status} status. Reviews can only be submitted after completion."
            )

        target_reviewee = booking.owner_id if user_id == booking.renter_id else booking.renter_id
        target_type = "RENTER_TO_OWNER" if user_id == booking.renter_id else "OWNER_TO_RENTER"

        return ReviewEligibilityResponse(
            booking_id=booking_id,
            can_review=True,
            already_reviewed=False,
            reason="Eligible to review.",
            suggested_reviewee_id=target_reviewee,
            suggested_review_type=target_type
        )

    async def create_review(self, reviewer_id: int, review_in: ReviewCreate):
        if not (1 <= review_in.rating <= 5):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rating must be an integer between 1 and 5."
            )

        booking = await self.booking_repo.get(review_in.booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")

        if booking.status not in ["COMPLETED", "RETURNED"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reviews can only be submitted after rental completion or return."
            )

        if reviewer_id not in [booking.renter_id, booking.owner_id]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only review bookings you participated in."
            )

        # Check for duplicate review
        existing = await self.review_repo.get_by_booking_and_reviewer(booking.id, reviewer_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already submitted a review for this booking."
            )

        # Determine reviewee
        reviewee_id = review_in.reviewee_id
        if not reviewee_id:
            reviewee_id = booking.owner_id if reviewer_id == booking.renter_id else booking.renter_id

        if reviewer_id == reviewee_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot review yourself."
            )

        review_type = review_in.review_type
        if not review_type:
            review_type = "RENTER_TO_OWNER" if reviewer_id == booking.renter_id else "OWNER_TO_RENTER"

        vehicle_id = review_in.vehicle_id or booking.vehicle_id

        review_data = {
            "booking_id": booking.id,
            "reviewer_id": reviewer_id,
            "reviewee_id": reviewee_id,
            "vehicle_id": vehicle_id,
            "rating": review_in.rating,
            "comment": review_in.comment.strip(),
            "review_type": review_type,
            "is_hidden": False,
        }

        review = await self.review_repo.create(review_data)

        # Notify reviewee
        reviewer = await self.user_repo.get(reviewer_id)
        reviewer_name = reviewer.full_name if reviewer else "A user"
        await self.notification_service.notify(
            user_id=reviewee_id,
            type="REVIEW_RECEIVED",
            title="New Review Received",
            message=f"{reviewer_name} gave you a {review_in.rating}-star review: '{review_in.comment[:50]}...'",
            payload={
                "review_id": review.id,
                "booking_id": booking.id,
                "rating": review_in.rating,
            },
            link_url="/profile"
        )

        # Recalculate vehicle rating if vehicle_id exists
        if vehicle_id:
            vehicle = await self.vehicle_repo.get(vehicle_id)
            if vehicle:
                all_vehicle_reviews = await self.review_repo.get_by_vehicle(vehicle.id)
                count = len(all_vehicle_reviews)
                if count > 0:
                    avg = sum(r.rating for r in all_vehicle_reviews) / count
                    await self.vehicle_repo.update(vehicle, {
                        "rating_avg": round(float(avg), 1),
                        "rating_count": count
                    })

        return await self.review_repo.get_with_details(review.id)

    async def get_by_vehicle(self, vehicle_id: int):
        return await self.review_repo.get_by_vehicle(vehicle_id)

    async def get_by_user(self, user_id: int):
        return await self.review_repo.get_by_user(user_id)

    async def get_reviews_given(self, user_id: int):
        return await self.review_repo.get_given_by_user(user_id)

    async def hide_review(self, review_id: int, is_hidden: bool = True):
        review = await self.review_repo.set_hidden(review_id, is_hidden)
        if not review:
            raise HTTPException(status_code=404, detail="Review not found.")
        return review
