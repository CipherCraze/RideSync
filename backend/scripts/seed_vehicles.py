"""
RideSync Person 1: Vehicle Listing & Document Verification Seed
Seeds 15 dummy vehicles with multi-angle photos, compliance documents (RC, PUC, Service Records),
and approval workflow statuses (APPROVED, PENDING, REJECTED, DRAFT).
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
from app.models.vehicle_image import VehicleImage
from app.models.vehicle_document import VehicleDocument

async def seed_vehicles(session=None):
    close_session = False
    if session is None:
        session = AsyncSessionLocal()
        close_session = True

    try:
        users = (await session.execute(select(User))).scalars().all()
        user_map = {u.email: u for u in users}

        if not user_map:
            print("[Vehicles] No users found. Run seed_users first.")
            return

        alex = user_map.get("alex.owner@ridesync.com")
        sarah = user_map.get("sarah.renter@ridesync.com")
        michael = user_map.get("michael.user@ridesync.com")
        dave = user_map.get("dave.risky@ridesync.com")
        admin = user_map.get("admin@ridesync.com")

        # Check if vehicles already seeded
        existing_v = (await session.execute(select(Vehicle))).scalars().all()
        if len(existing_v) >= 15:
            print(f"[Vehicles] Already have {len(existing_v)} vehicles seeded.")
            return

        now = datetime.now(timezone.utc)

        vehicles_data = [
            # 1. Tesla Model 3
            {
                "owner_id": alex.id,
                "brand": "Tesla",
                "model": "Model 3 Long Range",
                "year": 2024,
                "vehicle_type": "Electric",
                "fuel_type": "Electric",
                "transmission": "Automatic",
                "seats": 5,
                "price_per_day": 85.0,
                "description": "Brand new 2024 Tesla Model 3 with Autopilot, Premium Audio, 341 miles range, and glass roof. Cleaned and disinfected before every rental.",
                "pickup_location": "San Francisco Airport (SFO), CA",
                "latitude": 37.6213,
                "longitude": -122.3790,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.9,
                "rating_count": 14,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                    {"url": "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=1200&q=80", "angle": "REAR", "is_primary": False},
                    {"url": "https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?w=1200&q=80", "angle": "INTERIOR", "is_primary": False},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "CA-TS3-2024", "exp": None, "status": "VERIFIED"},
                    {"type": "PUC", "url": "http://localhost:8000/uploads/documents/sample_puc.pdf", "num": "PUC-99214", "exp": now + timedelta(days=300), "status": "VERIFIED"},
                    {"type": "SERVICE_RECORD", "url": "http://localhost:8000/uploads/documents/sample_service_record.pdf", "num": "SRV-2024-01", "exp": None, "status": "VERIFIED"},
                ]
            },
            # 2. Porsche Macan GTS
            {
                "owner_id": alex.id,
                "brand": "Porsche",
                "model": "Macan GTS",
                "year": 2023,
                "vehicle_type": "Luxury",
                "fuel_type": "Petrol",
                "transmission": "Automatic",
                "seats": 5,
                "price_per_day": 195.0,
                "description": "Exhilarating 434 HP twin-turbo V6 SUV. Features Sport Chrono package, panoramic sunroof, Bose Surround Sound, and red leather interior.",
                "pickup_location": "Downtown San Francisco, CA",
                "latitude": 37.7749,
                "longitude": -122.4194,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 5.0,
                "rating_count": 8,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                    {"url": "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1200&q=80", "angle": "SIDE_LEFT", "is_primary": False},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "CA-POR-8812", "exp": None, "status": "VERIFIED"},
                    {"type": "PUC", "url": "http://localhost:8000/uploads/documents/sample_puc.pdf", "num": "PUC-8812", "exp": now + timedelta(days=180), "status": "VERIFIED"},
                ]
            },
            # 3. BMW M4 Competition
            {
                "owner_id": sarah.id,
                "brand": "BMW",
                "model": "M4 Competition Coupe",
                "year": 2023,
                "vehicle_type": "Luxury",
                "fuel_type": "Petrol",
                "transmission": "Automatic",
                "seats": 4,
                "price_per_day": 160.0,
                "description": "503 HP twin-turbo inline 6 monster. Isle of Man Green metallic paint with M Carbon bucket seats and Head-Up display. Unforgettable driving experience.",
                "pickup_location": "Manhattan Midtown, New York, NY",
                "latitude": 40.7589,
                "longitude": -73.9851,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.8,
                "rating_count": 11,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                    {"url": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&q=80", "angle": "REAR", "is_primary": False},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "NY-M4C-1092", "exp": None, "status": "VERIFIED"},
                    {"type": "PUC", "url": "http://localhost:8000/uploads/documents/sample_puc.pdf", "num": "PUC-9102", "exp": now + timedelta(days=240), "status": "VERIFIED"},
                ]
            },
            # 4. Rivian R1T Adventure
            {
                "owner_id": alex.id,
                "brand": "Rivian",
                "model": "R1T Adventure",
                "year": 2023,
                "vehicle_type": "Electric",
                "fuel_type": "Electric",
                "transmission": "Automatic",
                "seats": 5,
                "price_per_day": 140.0,
                "description": "Quad-Motor AWD electric pickup with 835 HP, air suspension, built-in camp kitchen, gear tunnel, and 314 miles EPA range.",
                "pickup_location": "Palo Alto Caltrain Station, CA",
                "latitude": 37.4431,
                "longitude": -122.1648,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 5.0,
                "rating_count": 6,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "CA-RIV-4412", "exp": None, "status": "VERIFIED"},
                ]
            },
            # 5. Ford Mustang GT
            {
                "owner_id": michael.id,
                "brand": "Ford",
                "model": "Mustang GT Fastback",
                "year": 2022,
                "vehicle_type": "Muscle",
                "fuel_type": "Petrol",
                "transmission": "Manual",
                "seats": 4,
                "price_per_day": 110.0,
                "description": "Roaring 5.0L Coyote V8 engine delivering 450 horsepower. 6-speed manual with rev-matching, active valve exhaust, and Brembo brakes.",
                "pickup_location": "Scranton Center, PA",
                "latitude": 41.4090,
                "longitude": -75.6624,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.7,
                "rating_count": 9,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "PA-GT-5091", "exp": None, "status": "VERIFIED"},
                ]
            },
            # 6. Mercedes-Benz C300
            {
                "owner_id": sarah.id,
                "brand": "Mercedes-Benz",
                "model": "C-Class C300 4MATIC",
                "year": 2023,
                "vehicle_type": "Sedan",
                "fuel_type": "Petrol",
                "transmission": "Automatic",
                "seats": 5,
                "price_per_day": 125.0,
                "description": "Refined executive sedan with Burmester audio, ambient 64-color lighting, MBUX navigation with augmented video, and AMG line styling.",
                "pickup_location": "Brooklyn Heights, New York, NY",
                "latitude": 40.6958,
                "longitude": -73.9936,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.9,
                "rating_count": 15,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "NY-MB-3001", "exp": None, "status": "VERIFIED"},
                ]
            },
            # 7. Audi RS6 Avant
            {
                "owner_id": alex.id,
                "brand": "Audi",
                "model": "RS6 Avant Performance",
                "year": 2024,
                "vehicle_type": "Luxury",
                "fuel_type": "Petrol",
                "transmission": "Automatic",
                "seats": 5,
                "price_per_day": 240.0,
                "description": "The ultimate family supercar wagon. 621 HP twin-turbo V8, quattro all-wheel drive, ceramic brakes, and RS sport exhaust.",
                "pickup_location": "Oakland International Airport (OAK), CA",
                "latitude": 37.7126,
                "longitude": -122.2197,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 5.0,
                "rating_count": 7,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "CA-RS6-2024", "exp": None, "status": "VERIFIED"},
                ]
            },
            # 8. Hyundai Ioniq 5
            {
                "owner_id": sarah.id,
                "brand": "Hyundai",
                "model": "Ioniq 5 Limited AWD",
                "year": 2023,
                "vehicle_type": "Electric",
                "fuel_type": "Electric",
                "transmission": "Automatic",
                "seats": 5,
                "price_per_day": 75.0,
                "description": "Futuristic retro-modern EV crossover. Ultra-fast 800V charging (10% to 80% in 18 mins), relaxation front seats, head-up display.",
                "pickup_location": "Jersey City Exchange Place, NJ",
                "latitude": 40.7168,
                "longitude": -74.0324,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.85,
                "rating_count": 18,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "NJ-IQ5-8819", "exp": None, "status": "VERIFIED"},
                ]
            },
            # 9. Jeep Wrangler Rubicon 392
            {
                "owner_id": michael.id,
                "brand": "Jeep",
                "model": "Wrangler Rubicon 392",
                "year": 2023,
                "vehicle_type": "SUV",
                "fuel_type": "Petrol",
                "transmission": "Automatic",
                "seats": 5,
                "price_per_day": 150.0,
                "description": "470 HP 6.4L HEMI V8 trail monster. Fox shock absorbers, 35-inch all-terrain tires, sky one-touch power top, and Dana 44 axles.",
                "pickup_location": "Denver International Airport (DEN), CO",
                "latitude": 39.8561,
                "longitude": -104.6737,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.9,
                "rating_count": 10,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "CO-RUB-392", "exp": None, "status": "VERIFIED"},
                ]
            },
            # 10. Toyota GR Supra
            {
                "owner_id": alex.id,
                "brand": "Toyota",
                "model": "GR Supra 3.0 Premium",
                "year": 2023,
                "vehicle_type": "Sports",
                "fuel_type": "Petrol",
                "transmission": "Manual",
                "seats": 2,
                "price_per_day": 130.0,
                "description": "382 HP turbocharged 3.0L inline 6 with 6-speed intelligent manual transmission, Brembo 4-piston calipers, and JBL audio.",
                "pickup_location": "San Jose Santana Row, CA",
                "latitude": 37.3216,
                "longitude": -121.9479,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.9,
                "rating_count": 13,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "CA-SUP-3001", "exp": None, "status": "VERIFIED"},
                ]
            },
            # 11. Chevrolet Corvette Stingray
            {
                "owner_id": dave.id,
                "brand": "Chevrolet",
                "model": "Corvette Stingray 3LT (C8)",
                "year": 2023,
                "vehicle_type": "Luxury",
                "fuel_type": "Petrol",
                "transmission": "Automatic",
                "seats": 2,
                "price_per_day": 210.0,
                "description": "Mid-engine 6.2L LT2 V8 supercar with Z51 performance package, magnetic ride control, and GT2 competition bucket seats.",
                "pickup_location": "Scottsdale, Phoenix, AZ",
                "latitude": 33.4942,
                "longitude": -111.9261,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.95,
                "rating_count": 12,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "AZ-C8-1002", "exp": None, "status": "VERIFIED"},
                ]
            },
            # 12. Honda Civic Type R
            {
                "owner_id": michael.id,
                "brand": "Honda",
                "model": "Civic Type R (FL5)",
                "year": 2023,
                "vehicle_type": "Hatchback",
                "fuel_type": "Petrol",
                "transmission": "Manual",
                "seats": 4,
                "price_per_day": 95.0,
                "description": "Purist 315 HP turbocharged 6-speed manual hatchback with Brembo brakes, rev-match system, and championship white paint.",
                "pickup_location": "Philadelphia Center City, PA",
                "latitude": 39.9526,
                "longitude": -75.1652,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.9,
                "rating_count": 8,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "PA-CTR-7719", "exp": None, "status": "VERIFIED"},
                ]
            },
            # 13. Volvo XC90 Recharge (PENDING APPROVAL)
            {
                "owner_id": sarah.id,
                "brand": "Volvo",
                "model": "XC90 Recharge Ultimate",
                "year": 2024,
                "vehicle_type": "SUV",
                "fuel_type": "Hybrid",
                "transmission": "Automatic",
                "seats": 7,
                "price_per_day": 145.0,
                "description": "Luxurious 7-passenger plug-in hybrid SUV. 455 HP, Bowers & Wilkins sound system, air purifier, and top-tier Scandinavian safety.",
                "pickup_location": "Boston Logan Airport (BOS), MA",
                "latitude": 42.3656,
                "longitude": -71.0096,
                "status": "PENDING",
                "is_approved": False,
                "is_available": True,
                "rating_avg": 5.0,
                "rating_count": 0,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "MA-XC9-4412", "exp": None, "status": "PENDING"},
                ]
            },
            # 14. Mini Cooper S Convertible (REJECTED)
            {
                "owner_id": dave.id,
                "brand": "Mini",
                "model": "Cooper S Convertible",
                "year": 2022,
                "vehicle_type": "Convertible",
                "fuel_type": "Petrol",
                "transmission": "Automatic",
                "seats": 4,
                "price_per_day": 72.0,
                "description": "Fun go-kart handling in sunny convertible setup. Harman Kardon sound, union jack LED taillights.",
                "pickup_location": "Orlando Airport (MCO), FL",
                "latitude": 28.4312,
                "longitude": -81.3081,
                "status": "REJECTED",
                "is_approved": False,
                "is_available": False,
                "rejection_reason": "Uploaded PUC certificate is expired. Please re-upload a valid emission test certificate.",
                "rating_avg": 4.5,
                "rating_count": 2,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "FL-MIN-1192", "exp": None, "status": "VERIFIED"},
                    {"type": "PUC", "url": "http://localhost:8000/uploads/documents/sample_puc.pdf", "num": "PUC-OLD-11", "exp": now - timedelta(days=15), "status": "REJECTED", "reason": "Expired document"},
                ]
            },
            # 15. Volkswagen Golf GTI (DRAFT)
            {
                "owner_id": michael.id,
                "brand": "Volkswagen",
                "model": "Golf GTI SE (Mk8)",
                "year": 2023,
                "vehicle_type": "Hatchback",
                "fuel_type": "Petrol",
                "transmission": "Automatic",
                "seats": 5,
                "price_per_day": 68.0,
                "description": "The benchmark hot hatch. 241 HP turbo engine with 7-speed DSG transmission, plaid sport seats, and digital cockpit pro.",
                "pickup_location": "Chicago O'Hare Airport (ORD), IL",
                "latitude": 41.9742,
                "longitude": -87.9073,
                "status": "DRAFT",
                "is_approved": False,
                "is_available": False,
                "rating_avg": 5.0,
                "rating_count": 0,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "IL-GTI-9081", "exp": None, "status": "PENDING"},
                ]
            },
        ]

        count = 0
        for idx, vd in enumerate(vehicles_data):
            imgs = vd.pop("images")
            docs = vd.pop("documents")

            lat = vd.get("latitude", 37.7749)
            lng = vd.get("longitude", -122.4194)
            pickup = vd.get("pickup_location", "San Francisco, CA")

            if idx in (2, 7):
                vd["geofence_type"] = "FLEXIBLE"
                vd["geofence_radius_km"] = None
                vd["geofence_center_lat"] = None
                vd["geofence_center_lng"] = None
                vd["geofence_center_name"] = "Flexible Operating Area (Coordinated with Host)"
            else:
                vd["geofence_type"] = "CIRCULAR"
                vd["geofence_radius_km"] = 25.0 if idx % 2 == 0 else 35.0
                vd["geofence_center_lat"] = lat
                vd["geofence_center_lng"] = lng
                vd["geofence_center_name"] = f"Metro Operating Perimeter ({pickup.split(',')[0].strip()})"

            vd["current_latitude"] = lat + (0.002 if idx % 2 == 0 else -0.003)
            vd["current_longitude"] = lng + (0.001 if idx % 2 == 0 else -0.002)
            vd["speed_kmh"] = 40.0 if idx == 1 else 0.0
            vd["battery_or_fuel_level"] = max(20, 95 - (idx * 4))
            vd["last_location_update"] = now
            vd["is_geofence_breached"] = False
            vd["breach_distance_km"] = 0.0

            v = Vehicle(**vd)
            session.add(v)
            await session.commit()
            await session.refresh(v)
            count += 1

            for img in imgs:
                vi = VehicleImage(
                    vehicle_id=v.id,
                    image_url=img["url"],
                    angle=img.get("angle", "OTHER"),
                    is_primary=img.get("is_primary", False)
                )
                session.add(vi)

            for doc in docs:
                vd_record = VehicleDocument(
                    vehicle_id=v.id,
                    document_type=doc["type"],
                    document_url=doc["url"],
                    document_number=doc.get("num"),
                    expiry_date=doc.get("exp"),
                    status=doc.get("status", "PENDING"),
                    rejection_reason=doc.get("reason"),
                    uploaded_at=now,
                    verified_at=now if doc.get("status") == "VERIFIED" else None,
                    verified_by_id=admin.id if (admin and doc.get("status") == "VERIFIED") else None,
                )
                session.add(vd_record)

            await session.commit()

        print(f"[Vehicles] Successfully seeded {count} vehicles with multi-angle photos and documents.")
    finally:
        if close_session:
            await session.close()

if __name__ == "__main__":
    asyncio.run(seed_vehicles())
