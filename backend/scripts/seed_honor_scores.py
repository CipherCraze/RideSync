import asyncio
import os
import sys
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.honor_score_history import HonorScoreHistory

async def seed_honor_scores(session=None):
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

        if not alex or not sarah or not dave:
            print("Required users not found. Please seed users first.")
            return

        now = datetime.now(timezone.utc)
        honor_logs = [
            HonorScoreHistory(
                user_id=alex.id,
                points_change=0,
                previous_score=100,
                new_score=100,
                category="Trusted",
                reason="Baseline Honor Score initialized on registration.",
                reference_type="REGISTRATION",
                created_at=now,
            ),
            HonorScoreHistory(
                user_id=alex.id,
                points_change=10,
                previous_score=100,
                new_score=100,
                category="Trusted",
                reason="Identity & Driving License verification approved.",
                reference_type="VERIFICATION",
                created_at=now,
            ),
            HonorScoreHistory(
                user_id=sarah.id,
                points_change=5,
                previous_score=90,
                new_score=95,
                category="Trusted",
                reason="Punctual vehicle return and checkout on trip #101.",
                reference_type="BOOKING",
                reference_id=1,
                created_at=now,
            ),
            HonorScoreHistory(
                user_id=dave.id,
                points_change=-15,
                previous_score=83,
                new_score=68,
                category="Warning",
                reason="Confirmed late vehicle return without notice.",
                reference_type="REPORT",
                reference_id=1,
                created_at=now,
            ),
        ]

        session.add_all(honor_logs)
        await session.commit()
        print(f"Seeded {len(honor_logs)} honor score history logs successfully.")
    finally:
        if close_session:
            await session.close()

if __name__ == "__main__":
    asyncio.run(seed_honor_scores())
