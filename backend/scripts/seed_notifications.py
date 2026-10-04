import asyncio
import os
import sys
import json
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.notification import Notification

async def seed_notifications(session=None):
    close_session = False
    if session is None:
        session = AsyncSessionLocal()
        close_session = True

    try:
        users = (await session.execute(select(User))).scalars().all()
        user_map = {u.email: u for u in users}

        if not user_map:
            print("No users found. Please seed users first.")
            return

        notifications_data = []

        alex = user_map.get("alex.owner@ridesync.com")
        sarah = user_map.get("sarah.renter@ridesync.com")
        michael = user_map.get("michael.user@ridesync.com")
        dave = user_map.get("dave.risky@ridesync.com")

        if alex:
            notifications_data.extend([
                Notification(
                    user_id=alex.id,
                    title="Rental Active: Porsche Macan GTS",
                    message="Michael Scott has checked in and started his active rental.",
                    type="RENTAL_ACTIVE",
                    is_read=True,
                    link_url="/booking-requests",
                    payload_json=json.dumps({"action": "check_in", "vehicle": "Porsche Macan GTS"}),
                    created_at=datetime.now(timezone.utc),
                ),
                Notification(
                    user_id=alex.id,
                    title="New Review Received",
                    message="Sarah Chen left you a 5-star review for the Tesla Model 3 rental.",
                    type="REVIEW_RECEIVED",
                    is_read=False,
                    link_url="/profile",
                    payload_json=json.dumps({"rating": 5, "reviewer": "Sarah Chen"}),
                    created_at=datetime.now(timezone.utc),
                ),
            ])

        if sarah:
            notifications_data.extend([
                Notification(
                    user_id=sarah.id,
                    title="Booking Request Confirmed",
                    message="Your trip request for Ford Mustang GT has been confirmed by Michael Scott.",
                    type="BOOKING_ACCEPTED",
                    is_read=False,
                    link_url="/my-rentals",
                    payload_json=json.dumps({"booking_status": "CONFIRMED"}),
                    created_at=datetime.now(timezone.utc),
                ),
                Notification(
                    user_id=sarah.id,
                    title="New message from Alex Morgan",
                    message="Hey Sarah, the car is charged and parked in spot B12 at SFO.",
                    type="MESSAGE_RECEIVED",
                    is_read=False,
                    link_url="/chat",
                    payload_json=json.dumps({"sender": "Alex Morgan"}),
                    created_at=datetime.now(timezone.utc),
                ),
            ])

        if dave:
            notifications_data.append(
                Notification(
                    user_id=dave.id,
                    title="Honor Score Updated",
                    message="Your Honor Score was adjusted by -15 points due to late vehicle return.",
                    type="HONOR_ADJUSTMENT",
                    is_read=True,
                    link_url="/profile",
                    payload_json=json.dumps({"points_change": -15, "reason": "Late return"}),
                    created_at=datetime.now(timezone.utc),
                )
            )

        if notifications_data:
            session.add_all(notifications_data)
            await session.commit()
            print(f"Seeded {len(notifications_data)} notifications successfully.")
    finally:
        if close_session:
            await session.close()

if __name__ == "__main__":
    asyncio.run(seed_notifications())
