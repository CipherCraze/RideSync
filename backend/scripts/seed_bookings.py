"""
RideSync Person 3: Booking & Rental Lifecycle Seed
Seeds bookings across all lifecycle stages (PENDING, CONFIRMED, RENTAL_ACTIVE,
RETURNED, COMPLETED, CANCELLED), mock transactions/receipts, radius agreement, and overdue flags.
"""

import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.booking import Booking
from app.models.transaction import Transaction

async def seed_bookings(session=None):
    close_session = False
    if session is None:
        session = AsyncSessionLocal()
        close_session = True

    try:
        users = (await session.execute(select(User))).scalars().all()
        user_map = {u.email: u for u in users}

        vehicles = (await session.execute(select(Vehicle))).scalars().all()
        if not user_map or not vehicles:
            print("[Bookings] Users or Vehicles not found. Seed them first.")
            return

        alex = user_map.get("alex.owner@ridesync.com")
        sarah = user_map.get("sarah.renter@ridesync.com")
        michael = user_map.get("michael.user@ridesync.com")
        dave = user_map.get("dave.risky@ridesync.com")

        now = datetime.now(timezone.utc)

        # 1. Past Completed Booking (Sarah rented Tesla from Alex)
        b1 = Booking(
            renter_id=sarah.id,
            vehicle_id=vehicles[0].id,
            owner_id=alex.id,
            start_date=now - timedelta(days=10),
            end_date=now - timedelta(days=7),
            total_price=255.0,
            status="COMPLETED",
            payment_status="PAID",
            permitted_radius_km=30.0,
            radius_proposal_status="ACCEPTED",
        )

        # 2. Currently Active Rental (Michael renting Porsche Macan from Alex)
        b2 = Booking(
            renter_id=michael.id,
            vehicle_id=vehicles[1].id,
            owner_id=alex.id,
            start_date=now - timedelta(days=1),
            end_date=now + timedelta(days=2),
            total_price=585.0,
            status="RENTAL_ACTIVE",
            payment_status="PAID",
            permitted_radius_km=35.0,
            radius_proposal_status="ACCEPTED",
        )

        # 3. Overdue Active Rental (Dave renting BMW M4 from Sarah, return scheduled 5 hours ago)
        b3 = Booking(
            renter_id=dave.id,
            vehicle_id=vehicles[2].id,
            owner_id=sarah.id,
            start_date=now - timedelta(days=3),
            end_date=now - timedelta(hours=5),
            total_price=480.0,
            status="RENTAL_ACTIVE",
            payment_status="PAID",
            permitted_radius_km=25.0,
            proposed_radius_km=40.0,
            radius_proposal_by="RENTER",
            radius_proposal_status="PENDING",
        )

        # 4. Confirmed Upcoming Rental (Sarah renting Rivian from Alex, paid)
        b4 = Booking(
            renter_id=sarah.id,
            vehicle_id=vehicles[3].id,
            owner_id=alex.id,
            start_date=now + timedelta(days=4),
            end_date=now + timedelta(days=7),
            total_price=420.0,
            status="CONFIRMED",
            payment_status="PAID",
            permitted_radius_km=50.0,
            radius_proposal_status="ACCEPTED",
        )

        # 5. Pending Booking Request (Michael requesting Mustang from himself - switch to Alex)
        b5 = Booking(
            renter_id=michael.id,
            vehicle_id=vehicles[0].id,
            owner_id=alex.id,
            start_date=now + timedelta(days=10),
            end_date=now + timedelta(days=12),
            total_price=170.0,
            status="PENDING",
            payment_status="PENDING",
            permitted_radius_km=25.0,
            radius_proposal_status="NONE",
        )

        # 6. Cancelled Booking with Refunded Flag
        b6 = Booking(
            renter_id=dave.id,
            vehicle_id=vehicles[1].id,
            owner_id=alex.id,
            start_date=now - timedelta(days=5),
            end_date=now - timedelta(days=3),
            total_price=390.0,
            status="CANCELLED",
            payment_status="REFUNDED",
            cancellation_reason="Trip plans changed due to flight schedule rescheduling.",
            permitted_radius_km=25.0,
        )

        session.add_all([b1, b2, b3, b4, b5, b6])
        await session.commit()

        for b in [b1, b2, b3, b4, b5, b6]:
            await session.refresh(b)

        # Seed Mock Payment Transactions / Receipts
        transactions = [
            Transaction(booking_id=b1.id, amount=b1.total_price, status="SUCCESS"),
            Transaction(booking_id=b2.id, amount=b2.total_price, status="SUCCESS"),
            Transaction(booking_id=b3.id, amount=b3.total_price, status="SUCCESS"),
            Transaction(booking_id=b4.id, amount=b4.total_price, status="SUCCESS"),
            Transaction(booking_id=b6.id, amount=b6.total_price, status="SUCCESS"),
        ]
        session.add_all(transactions)
        await session.commit()

        print(f"[Bookings] Successfully seeded 6 bookings across all lifecycle states with mock payment transactions.")

    finally:
        if close_session:
            await session.close()

if __name__ == "__main__":
    asyncio.run(seed_bookings())
