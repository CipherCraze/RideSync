import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

# Add backend parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, AsyncSessionLocal, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.vehicle_image import VehicleImage
from app.models.booking import Booking
from app.models.review import Review
from app.models.notification import Notification
from app.models.report import Report
from app.models.honor_score_history import HonorScoreHistory

async def seed_data():
    print("Initializing RideSync Database Seed...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Create Users
        admin_user = User(
            email="admin@ridesync.com",
            phone="+1 (555) 019-2831",
            hashed_password=get_password_hash("admin123"),
            full_name="Alexander Vance (Admin)",
            profile_picture="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
            driving_license_number="DL-US-9920148",
            address="100 Financial Center Blvd, San Francisco, CA",
            bio="Lead Platform Security & Administration Officer at RideSync.",
            honor_score=100,
            is_verified=True,
            is_admin=True,
            is_suspended=False,
        )

        owner_alex = User(
            email="alex.owner@ridesync.com",
            phone="+1 (555) 349-8812",
            hashed_password=get_password_hash("password123"),
            full_name="Alex Morgan",
            profile_picture="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
            driving_license_number="DL-CA-4491023",
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

        # 3. Create Vehicles & Images
        vehicles_data = [
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
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.9,
                "rating_count": 14,
                "images": [
                    "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=80",
                    "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=1200&q=80",
                ],
            },
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
                "is_approved": True,
                "is_available": True,
                "rating_avg": 5.0,
                "rating_count": 8,
                "images": [
                    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80",
                    "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1200&q=80",
                ],
            },
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
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.8,
                "rating_count": 11,
                "images": [
                    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80",
                    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&q=80",
                ],
            },
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
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.95,
                "rating_count": 6,
                "images": [
                    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80",
                ],
            },
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
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.7,
                "rating_count": 9,
                "images": [
                    "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=1200&q=80",
                ],
            },
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
                "is_approved": True,
                "is_available": True,
                "rating_avg": 4.85,
                "rating_count": 22,
                "images": [
                    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=80",
                ],
            },
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
                "is_approved": False,  # Pending Admin Approval
                "is_available": True,
                "rating_avg": 5.0,
                "rating_count": 0,
                "images": [
                    "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=80",
                ],
            },
        ]

        created_vehicles = []
        for vd in vehicles_data:
            imgs = vd.pop("images")
            v = Vehicle(**vd)
            session.add(v)
            await session.commit()
            await session.refresh(v)
            
            for idx, img_url in enumerate(imgs):
                vi = VehicleImage(vehicle_id=v.id, image_url=img_url, is_primary=(idx == 0))
                session.add(vi)
            await session.commit()
            created_vehicles.append(v)

        # 4. Seed Bookings across all statuses
        now = datetime.now(timezone.utc)
        
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

        print("RideSync Database Seed Completed Successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
