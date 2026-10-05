import asyncio
from datetime import datetime, timezone, timedelta
from app.core.database import engine, AsyncSessionLocal, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.vehicle_image import VehicleImage
from app.models.vehicle_document import VehicleDocument
from app.models.booking import Booking
from app.models.review import Review
from app.models.notification import Notification
from app.models.report import Report
from app.models.honor_score_history import HonorScoreHistory
from app.models.system_config import SystemConfig

async def seed_data():
    print("Initializing RideSync Database Seed...")
    
    # 0. Sync tables - drop and recreate to guarantee complete, updated schema
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Clear existing data to allow fresh, clean, deterministic seeding
        from sqlalchemy import text
        for table in [
            "messages", "conversations", "reports", "reviews", "bookings",
            "vehicle_documents", "vehicle_images", "vehicles", "honor_score_history",
            "notifications", "transactions", "system_configs", "users"
        ]:
            try:
                await session.execute(text(f"DELETE FROM {table}"))
            except Exception:
                pass
        await session.commit()

        # 1. Seed Users
        admin_user = User(
            email="admin@ridesync.com",
            phone="+1 (555) 019-2834",
            hashed_password=get_password_hash("admin123"),
            full_name="Marcus Vance",
            profile_picture="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
            driving_license_number="DL-CA-9921048",
            address="100 Pine Street, San Francisco, CA",
            bio="Platform Safety & Marketplace Operations Lead at RideSync.",
            honor_score=100,
            is_verified=True,
            is_admin=True,
            is_suspended=False,
        )

        owner_alex = User(
            email="alex.owner@ridesync.com",
            phone="+1 (555) 234-5678",
            hashed_password=get_password_hash("password123"),
            full_name="Alex Rivera",
            profile_picture="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
            driving_license_number="DL-CA-1029384",
            address="420 Market Street, San Francisco, CA",
            bio="EV enthusiast and verified RideSync host. I keep my vehicles spotless and pristine.",
            honor_score=98,
            is_verified=True,
            is_admin=False,
            is_suspended=False,
        )

        renter_sarah = User(
            email="sarah.renter@ridesync.com",
            phone="+1 (555) 891-2309",
            hashed_password=get_password_hash("password123"),
            full_name="Sarah Chen",
            profile_picture="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
            driving_license_number="DL-NY-8819230",
            address="150 5th Avenue, New York, NY",
            bio="Product designer travelling frequently for design sprint workshops.",
            honor_score=95,
            is_verified=True,
            is_admin=False,
            is_suspended=False,
        )

        user_michael = User(
            email="michael.user@ridesync.com",
            phone="+1 (555) 441-9920",
            hashed_password=get_password_hash("password123"),
            full_name="Michael Scott",
            profile_picture="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
            driving_license_number="DL-PA-1102934",
            address="1725 Slough Avenue, Scranton, PA",
            bio="Love weekend roadtrips and high performance cars.",
            honor_score=85,
            is_verified=False,
            is_admin=False,
            is_suspended=False,
        )

        user_dave = User(
            email="dave.risky@ridesync.com",
            phone="+1 (555) 773-0091",
            hashed_password=get_password_hash("password123"),
            full_name="David Miller",
            profile_picture="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&q=80",
            driving_license_number="DL-FL-5591024",
            address="700 Ocean Drive, Miami, FL",
            bio="Frequent traveller looking for quick weekend rides.",
            honor_score=68,
            is_verified=False,
            is_admin=False,
            is_suspended=False,
        )

        session.add_all([admin_user, owner_alex, renter_sarah, user_michael, user_dave])
        await session.commit()
        for u in [admin_user, owner_alex, renter_sarah, user_michael, user_dave]:
            await session.refresh(u)

        # 2. Seed Honor Score History
        honor_logs = [
            HonorScoreHistory(
                user_id=owner_alex.id,
                points_change=0,
                previous_score=100,
                new_score=100,
                category="Trusted",
                reason="Baseline Honor Score initialized on registration.",
            ),
            HonorScoreHistory(
                user_id=owner_alex.id,
                points_change=10,
                previous_score=100,
                new_score=100,
                category="Trusted",
                reason="Verified Identity & Driving License Approval.",
            ),
            HonorScoreHistory(
                user_id=renter_sarah.id,
                points_change=5,
                previous_score=90,
                new_score=95,
                category="Trusted",
                reason="Successful completion of rental #101.",
            ),
            HonorScoreHistory(
                user_id=user_dave.id,
                points_change=-15,
                previous_score=83,
                new_score=68,
                category="Warning",
                reason="Late return penalty (-15 points) on booking #84.",
            ),
        ]
        session.add_all(honor_logs)

        # 3. Create 15 Vehicles with Multi-Angle Photos and Compliance Documents
        now = datetime.now(timezone.utc)
        
        vehicles_data = [
            # 1. Tesla Model 3
            {
                "owner_id": owner_alex.id,
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
                "owner_id": owner_alex.id,
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
                "owner_id": renter_sarah.id,
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
                "owner_id": renter_sarah.id,
                "brand": "Rivian",
                "model": "R1T Adventure Package",
                "year": 2024,
                "vehicle_type": "Truck",
                "fuel_type": "Electric",
                "transmission": "Automatic",
                "seats": 5,
                "price_per_day": 175.0,
                "description": "Quad-motor 835 HP electric adventure truck. Features air suspension, Gear Tunnel, built-in air compressor, and Meridian sound system.",
                "pickup_location": "Brooklyn Navy Yard, NY",
                "latitude": 40.7001,
                "longitude": -73.9723,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.95,
                "rating_count": 6,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "NY-R1T-4491", "exp": None, "status": "VERIFIED"},
                    {"type": "PUC", "url": "http://localhost:8000/uploads/documents/sample_puc.pdf", "num": "PUC-4491", "exp": now + timedelta(days=365), "status": "VERIFIED"},
                ]
            },
            # 5. Ford Mustang GT Convertible
            {
                "owner_id": user_michael.id,
                "brand": "Ford",
                "model": "Mustang GT Convertible",
                "year": 2022,
                "vehicle_type": "Convertible",
                "fuel_type": "Petrol",
                "transmission": "Automatic",
                "seats": 4,
                "price_per_day": 110.0,
                "description": "Iconic 5.0L V8 convertible with active valve performance exhaust. Perfect for coastal highway drives with the top down.",
                "pickup_location": "Miami Beach, FL",
                "latitude": 25.7907,
                "longitude": -80.1300,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.7,
                "rating_count": 9,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "FL-MST-9912", "exp": None, "status": "VERIFIED"},
                    {"type": "PUC", "url": "http://localhost:8000/uploads/documents/sample_puc.pdf", "num": "PUC-9912", "exp": now + timedelta(days=120), "status": "VERIFIED"},
                ]
            },
            # 6. Toyota RAV4 Hybrid XSE
            {
                "owner_id": user_michael.id,
                "brand": "Toyota",
                "model": "RAV4 Hybrid XSE",
                "year": 2023,
                "vehicle_type": "SUV",
                "fuel_type": "Hybrid",
                "transmission": "Automatic",
                "seats": 5,
                "price_per_day": 65.0,
                "description": "Ultra-reliable AWD hybrid SUV getting 40 MPG. JBL premium sound, Apple CarPlay, lane tracing assist, and huge cargo space.",
                "pickup_location": "Los Angeles Airport (LAX), CA",
                "latitude": 33.9416,
                "longitude": -118.4085,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.85,
                "rating_count": 22,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "CA-RAV-3819", "exp": None, "status": "VERIFIED"},
                    {"type": "PUC", "url": "http://localhost:8000/uploads/documents/sample_puc.pdf", "num": "PUC-3819", "exp": now + timedelta(days=200), "status": "VERIFIED"},
                ]
            },
            # 7. Mercedes-Benz E 450 Sedan (PENDING)
            {
                "owner_id": user_dave.id,
                "brand": "Mercedes-Benz",
                "model": "E 450 Sedan",
                "year": 2021,
                "vehicle_type": "Sedan",
                "fuel_type": "Petrol",
                "transmission": "Automatic",
                "seats": 5,
                "price_per_day": 130.0,
                "description": "Smooth inline-6 turbo with EQ Boost. Burmester Surround Sound, ambient lighting, dual 12.3-inch screens, and air suspension.",
                "pickup_location": "Fort Lauderdale, FL",
                "latitude": 26.1224,
                "longitude": -80.1373,
                "status": "PENDING",
                "is_approved": False,
                "is_available": True,
                "rating_avg": 5.0,
                "rating_count": 0,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "FL-MBE-5510", "exp": None, "status": "PENDING"},
                    {"type": "PUC", "url": "http://localhost:8000/uploads/documents/sample_puc.pdf", "num": "PUC-5510", "exp": now + timedelta(days=90), "status": "PENDING"},
                ]
            },
            # 8. Audi RS6 Avant
            {
                "owner_id": owner_alex.id,
                "brand": "Audi",
                "model": "RS6 Avant Performance",
                "year": 2023,
                "vehicle_type": "Luxury",
                "fuel_type": "Petrol",
                "transmission": "Automatic",
                "seats": 5,
                "price_per_day": 220.0,
                "description": "591 HP twin-turbo V8 super-wagon. Quattro AWD, dynamic all-wheel steering, Bang & Olufsen 3D sound, and ceramic brakes.",
                "pickup_location": "Silicon Valley, San Jose, CA",
                "latitude": 37.3382,
                "longitude": -121.8863,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 5.0,
                "rating_count": 5,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "CA-RS6-9901", "exp": None, "status": "VERIFIED"},
                    {"type": "PUC", "url": "http://localhost:8000/uploads/documents/sample_puc.pdf", "num": "PUC-9901", "exp": now + timedelta(days=310), "status": "VERIFIED"},
                ]
            },
            # 9. Hyundai Ioniq 5 AWD
            {
                "owner_id": renter_sarah.id,
                "brand": "Hyundai",
                "model": "Ioniq 5 Limited AWD",
                "year": 2023,
                "vehicle_type": "Electric",
                "fuel_type": "Electric",
                "transmission": "Automatic",
                "seats": 5,
                "price_per_day": 78.0,
                "description": "Futuristic retro-modern crossover EV. 320 HP dual motor, ultra-fast 800V charging (10% to 80% in 18 mins), and vehicle-to-load outlet.",
                "pickup_location": "Jersey City, NJ",
                "latitude": 40.7178,
                "longitude": -74.0431,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.9,
                "rating_count": 10,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "NJ-IQ5-4421", "exp": None, "status": "VERIFIED"},
                    {"type": "PUC", "url": "http://localhost:8000/uploads/documents/sample_puc.pdf", "num": "PUC-4421", "exp": now + timedelta(days=260), "status": "VERIFIED"},
                ]
            },
            # 10. Jeep Wrangler Rubicon 4xe
            {
                "owner_id": user_michael.id,
                "brand": "Jeep",
                "model": "Wrangler Rubicon 4xe",
                "year": 2024,
                "vehicle_type": "SUV",
                "fuel_type": "Hybrid",
                "transmission": "Automatic",
                "seats": 5,
                "price_per_day": 125.0,
                "description": "Trail-Rated plug-in hybrid with removable Sky One-Touch power roof, 33-inch all-terrain tires, and Dana 44 heavy duty axles.",
                "pickup_location": "Denver Airport (DEN), CO",
                "latitude": 39.8561,
                "longitude": -104.6737,
                "status": "APPROVED",
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.8,
                "rating_count": 7,
                "images": [
                    {"url": "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=1200&q=80", "angle": "FRONT", "is_primary": True},
                ],
                "documents": [
                    {"type": "RC", "url": "http://localhost:8000/uploads/documents/sample_rc.pdf", "num": "CO-RUB-8832", "exp": None, "status": "VERIFIED"},
                    {"type": "PUC", "url": "http://localhost:8000/uploads/documents/sample_puc.pdf", "num": "PUC-8832", "exp": now + timedelta(days=190), "status": "VERIFIED"},
                ]
            },
            # 11. Chevrolet Corvette Stingray
            {
                "owner_id": owner_alex.id,
                "brand": "Chevrolet",
                "model": "Corvette Stingray 3LT",
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
                    {"type": "PUC", "url": "http://localhost:8000/uploads/documents/sample_puc.pdf", "num": "PUC-1002", "exp": now + timedelta(days=150), "status": "VERIFIED"},
                ]
            },
            # 12. Honda Civic Type R
            {
                "owner_id": user_michael.id,
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
                    {"type": "PUC", "url": "http://localhost:8000/uploads/documents/sample_puc.pdf", "num": "PUC-7719", "exp": now + timedelta(days=220), "status": "VERIFIED"},
                ]
            },
            # 13. Volvo XC90 Recharge (PENDING)
            {
                "owner_id": renter_sarah.id,
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
                    {"type": "PUC", "url": "http://localhost:8000/uploads/documents/sample_puc.pdf", "num": "PUC-4412", "exp": now + timedelta(days=290), "status": "PENDING"},
                ]
            },
            # 14. Mini Cooper S Convertible (REJECTED)
            {
                "owner_id": user_dave.id,
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
                "owner_id": user_michael.id,
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

        # Seed System Configuration for tracking & dynamic accuracy gradient
        import json
        tracking_cfg = {
            "default_masking_buffer_km": 1.5,
            "gradient_near_threshold_km": 2.0,
            "gradient_near_accuracy_km": 0.5,
            "gradient_far_threshold_km": 5.0,
            "gradient_far_accuracy_km": 0.08,
            "gradient_sensitivity": 1.0,
        }
        sys_cfg = SystemConfig(
            key="tracking_config",
            value=json.dumps(tracking_cfg),
            description="Global GPS Privacy and Geofencing Dynamic Gradient Parameters",
            updated_at=now,
        )
        session.add(sys_cfg)
        await session.commit()

        created_vehicles = []
        for idx, vd in enumerate(vehicles_data):
            imgs = vd.pop("images")
            docs = vd.pop("documents")

            # Assign geofence and initial telemetry parameters
            lat = vd.get("latitude", 37.7749)
            lng = vd.get("longitude", -122.4194)
            pickup = vd.get("pickup_location", "San Francisco, CA")
            
            # Vehicles at index 2 (BMW M4) and 8 (Ioniq 5) are marked FLEXIBLE; others CIRCULAR
            if idx in (2, 8):
                vd["geofence_type"] = "FLEXIBLE"
                vd["geofence_radius_km"] = None
                vd["geofence_center_lat"] = None
                vd["geofence_center_lng"] = None
                vd["geofence_center_name"] = "Flexible (Coordinated upon booking)"
            else:
                vd["geofence_type"] = "CIRCULAR"
                vd["geofence_radius_km"] = 25.0 if idx % 2 == 0 else 35.0
                vd["geofence_center_lat"] = lat
                vd["geofence_center_lng"] = lng
                vd["geofence_center_name"] = f"Metropolitan Operating Area ({pickup.split(',')[0].strip()})"

            # Realistic current telemetry (near pickup / center)
            vd["current_latitude"] = lat + (0.003 if idx % 2 == 0 else -0.004)
            vd["current_longitude"] = lng + (0.002 if idx % 2 == 0 else -0.003)
            vd["speed_kmh"] = 42.0 if idx == 1 else 0.0
            vd["battery_or_fuel_level"] = 85.0 - (idx * 2 % 35)
            vd["last_location_update"] = now
            vd["is_geofence_breached"] = False
            vd["breach_distance_km"] = 0.0

            v = Vehicle(**vd)
            session.add(v)
            await session.commit()
            await session.refresh(v)
            
            for item in imgs:
                vi = VehicleImage(
                    vehicle_id=v.id,
                    image_url=item["url"],
                    angle=item.get("angle", "OTHER"),
                    is_primary=item.get("is_primary", False)
                )
                session.add(vi)

            for d in docs:
                vdoc = VehicleDocument(
                    vehicle_id=v.id,
                    document_type=d["type"],
                    document_url=d["url"],
                    document_number=d.get("num"),
                    expiry_date=d.get("exp"),
                    status=d.get("status", "PENDING"),
                    rejection_reason=d.get("reason"),
                    uploaded_at=now,
                    verified_at=now if d.get("status") == "VERIFIED" else None,
                    verified_by_id=admin_user.id if d.get("status") == "VERIFIED" else None,
                )
                session.add(vdoc)

            await session.commit()
            created_vehicles.append(v)

        # 4. Seed Bookings across all statuses
        b1 = Booking(
            renter_id=renter_sarah.id,
            vehicle_id=created_vehicles[0].id,  # Tesla Model 3
            owner_id=owner_alex.id,
            start_date=now - timedelta(days=10),
            end_date=now - timedelta(days=7),
            total_price=255.0,
            status="COMPLETED",
        )

        b2 = Booking(
            renter_id=user_michael.id,
            vehicle_id=created_vehicles[1].id,  # Porsche Macan
            owner_id=owner_alex.id,
            start_date=now - timedelta(days=2),
            end_date=now + timedelta(days=2),
            total_price=780.0,
            status="RENTAL_ACTIVE",
        )

        b3 = Booking(
            renter_id=renter_sarah.id,
            vehicle_id=created_vehicles[4].id,  # Mustang GT
            owner_id=user_michael.id,
            start_date=now + timedelta(days=5),
            end_date=now + timedelta(days=8),
            total_price=330.0,
            status="CONFIRMED",
        )

        b4 = Booking(
            renter_id=user_dave.id,
            vehicle_id=created_vehicles[2].id,  # BMW M4
            owner_id=renter_sarah.id,
            start_date=now + timedelta(days=1),
            end_date=now + timedelta(days=4),
            total_price=480.0,
            status="PENDING",
        )

        session.add_all([b1, b2, b3, b4])
        await session.commit()
        for b in [b1, b2, b3, b4]:
            await session.refresh(b)

        # 5. Seed Reviews
        rev1 = Review(
            booking_id=b1.id,
            reviewer_id=renter_sarah.id,
            reviewee_id=owner_alex.id,
            vehicle_id=created_vehicles[0].id,
            rating=5,
            comment="Alex was an incredible host! The Tesla Model 3 was fully charged, immaculately clean, and super fun to drive.",
            review_type="RENTER_TO_OWNER",
        )

        rev2 = Review(
            booking_id=b1.id,
            reviewer_id=owner_alex.id,
            reviewee_id=renter_sarah.id,
            vehicle_id=None,
            rating=5,
            comment="Sarah took wonderful care of my car and returned it early with a clean interior. 10/10 recommended renter!",
            review_type="OWNER_TO_RENTER",
        )

        session.add_all([rev1, rev2])

        # 6. Seed Notifications
        nots = [
            Notification(
                user_id=owner_alex.id,
                title="Rental Active: Porsche Macan GTS",
                message="Michael Scott has checked in and started his active rental.",
                type="RENTAL_ACTIVE",
                link_url="/booking-requests",
            ),
            Notification(
                user_id=renter_sarah.id,
                title="Booking Request Confirmed",
                message="Your trip request for Ford Mustang GT has been confirmed by Michael Scott.",
                type="BOOKING_ACCEPTED",
                link_url="/my-rentals",
            ),
            Notification(
                user_id=user_dave.id,
                title="Honor Score Updated",
                message="Your Honor Score was adjusted by -15 points due to late vehicle return.",
                type="HONOR_ADJUSTMENT",
                link_url="/profile",
            ),
        ]
        session.add_all(nots)

        # 7. Seed Reports
        rep1 = Report(
            reporter_id=owner_alex.id,
            reported_user_id=user_dave.id,
            reported_vehicle_id=None,
            reason="LATE_RETURN",
            details="User returned the vehicle 4 hours past the agreed return window without notice.",
            status="PENDING",
        )
        session.add(rep1)
        await session.commit()

        # 8. Seed Chat Conversations & Messages
        from scripts.seed_chat import seed_chat
        await seed_chat(session)

        print(f"RideSync Database Seed Completed Successfully! {len(created_vehicles)} vehicles seeded.")

if __name__ == "__main__":
    asyncio.run(seed_data())
