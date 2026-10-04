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
from app.models.report import Report

async def seed_reports(session=None):
    close_session = False
    if session is None:
        session = AsyncSessionLocal()
        close_session = True

    try:
        users = (await session.execute(select(User))).scalars().all()
        user_map = {u.email: u for u in users}

        alex = user_map.get("alex.owner@ridesync.com")
        sarah = user_map.get("sarah.renter@ridesync.com")
        dave = user_map.get("dave.risky@ridesync.com")

        if not alex or not dave:
            print("Required users not found for report seeding.")
            return

        # Check existing reports
        existing = (await session.execute(select(Report))).scalars().all()
        if existing:
            print("Reports already exist. Skipping report seeding.")
            return

        reviews = (await session.execute(select(Review))).scalars().all()
        first_review = reviews[0] if reviews else None

        bookings = (await session.execute(select(Booking))).scalars().all()
        first_booking = bookings[0] if bookings else None

        now = datetime.now(timezone.utc)
        reports = [
            Report(
                reporter_id=alex.id,
                reported_user_id=dave.id,
                reported_vehicle_id=None,
                booking_id=first_booking.id if first_booking else None,
                review_id=None,
                reason="LATE_RETURN",
                details="Renter returned the vehicle 4 hours past the agreed return window without prior communication.",
                status="RESOLVED",
                admin_notes="Verified GPS timestamp logs. Applied -15 honor score penalty.",
                created_at=now,
                resolved_at=now,
            ),
            Report(
                reporter_id=sarah.id if sarah else alex.id,
                reported_user_id=dave.id,
                reported_vehicle_id=None,
                booking_id=None,
                review_id=first_review.id if first_review else None,
                reason="INAPPROPRIATE_BEHAVIOR",
                details="Unprofessional and hostile messaging in communication chat.",
                status="UNDER_REVIEW",
                admin_notes="Reviewing chat history between parties.",
                created_at=now,
            ),
            Report(
                reporter_id=alex.id,
                reported_user_id=None,
                reported_vehicle_id=None,
                booking_id=None,
                review_id=None,
                reason="SUSPICIOUS_ACTIVITY",
                details="Suspected fraudulent inquiry asking to transact offline outside RideSync.",
                status="OPEN",
                admin_notes=None,
                created_at=now,
            ),
        ]

        session.add_all(reports)
        await session.commit()
        print(f"Seeded {len(reports)} reports/disputes successfully.")
    finally:
        if close_session:
            await session.close()

if __name__ == "__main__":
    asyncio.run(seed_reports())
