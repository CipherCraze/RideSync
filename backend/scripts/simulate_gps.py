"""
RideSync GPS Simulator Script
Person 2: GPS Tracking & Geofencing

Simulates vehicle movement by replaying coordinate routes.
No physical GPS hardware required. Ingests pings into database,
evaluates geofence compliance, and logs notifications on breaches.
"""

import asyncio
import argparse
import sys
import os
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.vehicle import Vehicle
from app.services.vehicle_tracking_service import VehicleTrackingService
from app.schemas.tracking import VehicleTelemetryUpdate

ROUTES = {
    "sfo_normal": [
        # Cruising within safe 25km radius around SFO / Downtown SF
        {"lat": 37.6213, "lng": -122.3790, "speed": 0.0, "battery": 92},
        {"lat": 37.6350, "lng": -122.3900, "speed": 45.0, "battery": 91},
        {"lat": 37.6580, "lng": -122.4050, "speed": 62.0, "battery": 90},
        {"lat": 37.6850, "lng": -122.4120, "speed": 68.0, "battery": 89},
        {"lat": 37.7120, "lng": -122.4180, "speed": 55.0, "battery": 88},
        {"lat": 37.7340, "lng": -122.4200, "speed": 40.0, "battery": 87},
        {"lat": 37.7550, "lng": -122.4190, "speed": 35.0, "battery": 86},
        {"lat": 37.7749, "lng": -122.4194, "speed": 28.0, "battery": 85},
    ],
    "sfo_breach": [
        # Heading south on US-101 past San Jose (breaching 25km radius)
        {"lat": 37.6213, "lng": -122.3790, "speed": 50.0, "battery": 85},
        {"lat": 37.5385, "lng": -122.3020, "speed": 75.0, "battery": 83},
        {"lat": 37.4852, "lng": -122.2364, "speed": 78.0, "battery": 81},
        {"lat": 37.4419, "lng": -122.1430, "speed": 82.0, "battery": 79},  # ~24 km: Near border
        {"lat": 37.3861, "lng": -122.0839, "speed": 85.0, "battery": 77},  # ~30 km: BREACH NEAR
        {"lat": 37.3382, "lng": -121.8863, "speed": 90.0, "battery": 74},  # ~45 km: BREACH FAR
    ],
    "nyc_loop": [
        # Manhattan loop
        {"lat": 40.7589, "lng": -73.9851, "speed": 25.0, "battery": 88},
        {"lat": 40.7650, "lng": -73.9780, "speed": 30.0, "battery": 87},
        {"lat": 40.7812, "lng": -73.9665, "speed": 32.0, "battery": 86},
        {"lat": 40.7950, "lng": -73.9550, "speed": 28.0, "battery": 85},
        {"lat": 40.7750, "lng": -73.9520, "speed": 24.0, "battery": 84},
        {"lat": 40.7589, "lng": -73.9851, "speed": 0.0, "battery": 83},
    ]
}

async def run_simulation(vehicle_id: int, route_name: str = "sfo_normal", interval_sec: float = 1.0):
    waypoints = ROUTES.get(route_name)
    if not waypoints:
        print(f"Unknown route '{route_name}'. Available: {list(ROUTES.keys())}")
        return

    print(f"\n[SIMULATOR] Starting GPS Route Replay Simulation for Vehicle ID: {vehicle_id}")
    print(f"[ROUTE] '{route_name}' ({len(waypoints)} waypoints) | Interval: {interval_sec}s")
    print("-" * 65)

    async with AsyncSessionLocal() as session:
        v_stmt = select(Vehicle).filter(Vehicle.id == vehicle_id)
        v = (await session.execute(v_stmt)).scalar_one_or_none()
        if not v:
            print(f"[ERROR] Vehicle with ID {vehicle_id} not found in database.")
            return

        print(f"Vehicle: {v.brand} {v.model} ({v.year}) | Geofence Radius: {v.geofence_radius_km} km")
        tracking_service = VehicleTrackingService(session)

        for idx, pt in enumerate(waypoints, start=1):
            telemetry = VehicleTelemetryUpdate(
                latitude=pt["lat"],
                longitude=pt["lng"],
                speed_kmh=pt["speed"],
                battery_or_fuel_level=pt["battery"],
            )

            res = await tracking_service.update_telemetry(vehicle_id, telemetry)

            status_icon = "[BREACH]" if res.is_geofence_breached else "[IN_BOUNDS]"
            print(
                f"[{idx}/{len(waypoints)}] {status_icon} Lat: {res.approx_latitude:.4f}, "
                f"Lng: {res.approx_longitude:.4f} | Speed: {res.speed_kmh:.0f} km/h | "
                f"Status: {res.status_chip} | Breach Dist: {res.breach_distance_km:.1f} km | "
                f"Accuracy: ~{res.accuracy_radius_m:.0f}m"
            )

            if idx < len(waypoints) and interval_sec > 0:
                await asyncio.sleep(interval_sec)

        print("-" * 65)
        print(f"[SUCCESS] Simulation completed! All {len(waypoints)} waypoints recorded to location_pings table.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RideSync GPS Telemetry Route Simulator")
    parser.add_argument("--vehicle-id", type=int, default=1, help="ID of vehicle to simulate (default: 1)")
    parser.add_argument("--route", type=str, default="sfo_normal", choices=list(ROUTES.keys()), help="Route to replay")
    parser.add_argument("--delay", type=float, default=0.5, help="Delay between pings in seconds (default: 0.5)")
    args = parser.parse_args()

    asyncio.run(run_simulation(args.vehicle_id, args.route, args.delay))
