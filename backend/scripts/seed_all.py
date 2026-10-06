import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base, AsyncSessionLocal
from scripts.seed_users import seed_users
from scripts.seed_vehicles import seed_vehicles
from scripts.seed_tracking import seed_tracking
from scripts.seed_bookings import seed_bookings
from scripts.seed_notifications import seed_notifications
from scripts.seed_chat import seed_chat
from scripts.seed_reviews import seed_reviews
from scripts.seed_honor_scores import seed_honor_scores
from scripts.seed_reports import seed_reports

async def seed_all():
    print("======================================================")
    print("=== RideSync Deterministic Master Seed Starting... ===")
    print("======================================================")
    
    # 0. Sync tables - recreate fresh clean schema
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("[Schema] Clean SQLite schema initialized.")

    async with AsyncSessionLocal() as session:
        # Step 0: Accounts (Setup for everyone)
        print("\n--- [Step 0] Seeding Core Demo User Accounts ---")
        await seed_users(session)

        # Step 1: Person 1 (Vehicles & Documents)
        print("\n--- [Step 1] Seeding Person 1: Vehicles, Images & Documents ---")
        await seed_vehicles(session)

        # Step 2: Person 2 (GPS Tracking & Geofencing)
        print("\n--- [Step 2] Seeding Person 2: GPS Telemetry & Geofences ---")
        await seed_tracking(session)

        # Step 3: Person 3 (Booking & Rental Lifecycle)
        print("\n--- [Step 3] Seeding Person 3: Bookings, Lifecycle & Mock Payments ---")
        await seed_bookings(session)

        # Step 4: Person 4 (Chat, Reviews, Notifications & Trust)
        print("\n--- [Step 4] Seeding Person 4: Notifications, Chat, Reviews, Honor & Reports ---")
        await seed_notifications(session)
        await seed_chat(session)
        await seed_reviews(session)
        await seed_honor_scores(session)
        await seed_reports(session)

    print("\n======================================================")
    print("=== RideSync Master Seed Completed Successfully!   ===")
    print("======================================================")

if __name__ == "__main__":
    asyncio.run(seed_all())
