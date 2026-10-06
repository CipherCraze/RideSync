"""
RideSync Shared Setup: Demo User Accounts
Seeds demo accounts for Admin, Owner, Renter, and test community members.
"""

import asyncio
import os
import sys
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User

DEMO_USERS = [
    {
        "email": "admin@ridesync.com",
        "phone": "+1 (555) 019-2834",
        "hashed_password": get_password_hash("admin123"),
        "full_name": "Marcus Vance",
        "profile_picture": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
        "driving_license_number": "DL-CA-9921048",
        "address": "100 Pine Street, San Francisco, CA",
        "bio": "Platform Safety & Marketplace Operations Lead at RideSync.",
        "honor_score": 100,
        "is_verified": True,
        "is_admin": True,
        "is_suspended": False,
    },
    {
        "email": "alex.owner@ridesync.com",
        "phone": "+1 (555) 234-5678",
        "hashed_password": get_password_hash("password123"),
        "full_name": "Alex Rivera",
        "profile_picture": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
        "driving_license_number": "DL-CA-1029384",
        "address": "420 Market Street, San Francisco, CA",
        "bio": "EV enthusiast and verified RideSync host. I keep my vehicles spotless and pristine.",
        "honor_score": 98,
        "is_verified": True,
        "is_admin": False,
        "is_suspended": False,
    },
    {
        "email": "sarah.renter@ridesync.com",
        "phone": "+1 (555) 891-2309",
        "hashed_password": get_password_hash("password123"),
        "full_name": "Sarah Chen",
        "profile_picture": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
        "driving_license_number": "DL-NY-8819230",
        "address": "150 5th Avenue, New York, NY",
        "bio": "Product designer travelling frequently for design sprint workshops.",
        "honor_score": 95,
        "is_verified": True,
        "is_admin": False,
        "is_suspended": False,
    },
    {
        "email": "michael.user@ridesync.com",
        "phone": "+1 (555) 441-9920",
        "hashed_password": get_password_hash("password123"),
        "full_name": "Michael Scott",
        "profile_picture": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
        "driving_license_number": "DL-PA-1102934",
        "address": "1725 Slough Avenue, Scranton, PA",
        "bio": "Love weekend roadtrips and high performance cars.",
        "honor_score": 85,
        "is_verified": False,
        "is_admin": False,
        "is_suspended": False,
    },
    {
        "email": "dave.risky@ridesync.com",
        "phone": "+1 (555) 773-0091",
        "hashed_password": get_password_hash("password123"),
        "full_name": "David Miller",
        "profile_picture": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&q=80",
        "driving_license_number": "DL-FL-5591024",
        "address": "700 Ocean Drive, Miami, FL",
        "bio": "Frequent traveller looking for quick weekend rides.",
        "honor_score": 68,
        "is_verified": False,
        "is_admin": False,
        "is_suspended": False,
    }
]

async def seed_users(session=None):
    close_session = False
    if session is None:
        session = AsyncSessionLocal()
        close_session = True

    try:
        created = []
        for u_data in DEMO_USERS:
            stmt = select(User).filter(User.email == u_data["email"])
            existing = (await session.execute(stmt)).scalar_one_or_none()
            if not existing:
                u = User(**u_data)
                session.add(u)
                created.append(u_data["email"])

        if created:
            await session.commit()
            print(f"[Users] Successfully seeded {len(created)} accounts: {created}")
        else:
            print("[Users] All demo user accounts already present.")
    finally:
        if close_session:
            await session.close()

if __name__ == "__main__":
    asyncio.run(seed_users())
