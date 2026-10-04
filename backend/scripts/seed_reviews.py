import asyncio
import os
import sys
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.booking import Booking
from app.models.review import Review

async def seed_reviews(session=None):
    close_session = False
    if session is None:
        session = AsyncSessionLocal()
        close_session = True

    try:
        users = (await session.execute(select(User))).scalars().all()
        user_map = {u.email: u for u in users}

        alex = user_map.get("alex.owner@ridesync.com")
        sarah = user_map.get("sarah.renter@ridesync.com")

        if not alex or not sarah:
            print("Required users not found for review seeding.")
            return

        # Find completed booking between Sarah and Alex
        bookings = (await session.execute(select(Booking))).scalars().all()
        completed_booking = next((b for b in bookings if b.status in ["COMPLETED", "RETURNED"]), None)

        if not completed_booking:
            print("No completed booking found. Review seeding requires a completed booking (Person 3 integration). Skipping.")
            return

        # Check existing reviews
        existing = (await session.execute(
            select(Review).where(Review.booking_id == completed_booking.id)
        )).scalars().all()

        if existing:
            print(f"Reviews already exist for booking #{completed_booking.id}. Skipping to prevent duplicate reviews.")
            return

        now = datetime.now(timezone.utc)
        reviews = [
            Review(
                booking_id=completed_booking.id,
                reviewer_id=completed_booking.renter_id,
                reviewee_id=completed_booking.owner_id,
                vehicle_id=completed_booking.vehicle_id,
                rating=5,
                comment="Alex was an incredible host! The Tesla Model 3 was fully charged, immaculately clean, and super fun to drive.",
                review_type="RENTER_TO_OWNER",
                is_hidden=False,
                created_at=now,
                updated_at=now,
            ),
            Review(
                booking_id=completed_booking.id,
                reviewer_id=completed_booking.owner_id,
                reviewee_id=completed_booking.renter_id,
                vehicle_id=None,
                rating=5,
                comment="Sarah took wonderful care of my car and returned it early with a spotless interior. 10/10 recommended renter!",
                review_type="OWNER_TO_RENTER",
                is_hidden=False,
                created_at=now,
                updated_at=now,
            ),
        ]

        session.add_all(reviews)
        await session.commit()
        print(f"Seeded {len(reviews)} mutual reviews successfully.")
    finally:
        if close_session:
            await session.close()

if __name__ == "__main__":
    asyncio.run(seed_reviews())
