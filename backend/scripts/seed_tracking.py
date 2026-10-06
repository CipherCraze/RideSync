"""
RideSync Person 2: GPS Tracking & Geofencing Seed
Seeds dynamic privacy gradient configuration and location pings history.
"""

import asyncio
import os
import sys
import json
from datetime import datetime, timezone, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.vehicle import Vehicle
from app.models.location_ping import LocationPing
from app.models.system_config import SystemConfig

async def seed_tracking(session=None):
    close_session = False
    if session is None:
        session = AsyncSessionLocal()
        close_session = True

    try:
        now = datetime.now(timezone.utc)

        # 1. System Config for tracking & geofence dynamic accuracy gradient
        tracking_cfg = {
            "default_masking_buffer_km": 1.5,
            "gradient_near_threshold_km": 2.0,
            "gradient_near_accuracy_km": 0.5,
            "gradient_far_threshold_km": 5.0,
            "gradient_far_accuracy_km": 0.08,
            "gradient_sensitivity": 1.0,
        }

        stmt = select(SystemConfig).filter(SystemConfig.key == "tracking_config")
        cfg_record = (await session.execute(stmt)).scalar_one_or_none()
        if not cfg_record:
            cfg_record = SystemConfig(
                key="tracking_config",
                value=json.dumps(tracking_cfg),
                description="Global GPS Privacy and Geofencing Dynamic Gradient Parameters",
                updated_at=now,
            )
            session.add(cfg_record)
            await session.commit()
            print("[Tracking] Seeded global tracking gradient system configuration.")

        # 2. Seed initial LocationPing breadcrumbs for vehicles
        vehicles = (await session.execute(select(Vehicle))).scalars().all()
        if not vehicles:
            print("[Tracking] No vehicles found to seed tracking pings. Run seed_vehicles first.")
            return

        pings_data = []
        for v in vehicles[:5]:
            base_lat = v.current_latitude or v.latitude or 37.7749
            base_lng = v.current_longitude or v.longitude or -122.4194

            # Create 5 historical breadcrumb pings per vehicle
            for i in range(5, 0, -1):
                pings_data.append(
                    LocationPing(
                        vehicle_id=v.id,
                        booking_id=None,
                        latitude=round(base_lat - (i * 0.003), 6),
                        longitude=round(base_lng - (i * 0.002), 6),
                        speed_kmh=max(0.0, 45.0 - (i * 5)),
                        battery_or_fuel_level=max(15.0, 90.0 - (i * 2)),
                        is_geofence_breached=False,
                        breach_distance_km=0.0,
                        recorded_at=now - timedelta(minutes=i * 10),
                    )
                )

        session.add_all(pings_data)
        await session.commit()
        print(f"[Tracking] Seeded {len(pings_data)} historical location pings across vehicles.")

    finally:
        if close_session:
            await session.close()

if __name__ == "__main__":
    asyncio.run(seed_tracking())
