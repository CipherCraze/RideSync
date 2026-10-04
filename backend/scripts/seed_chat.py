import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.booking import Booking
from app.models.conversation import Conversation
from app.models.message import Message

async def seed_chat(session=None):
    close_session = False
    if session is None:
        session = AsyncSessionLocal()
        close_session = True

    try:
        users = (await session.execute(select(User))).scalars().all()
        user_map = {u.email: u for u in users}

        alex = user_map.get("alex.owner@ridesync.com")
        sarah = user_map.get("sarah.renter@ridesync.com")
        michael = user_map.get("michael.user@ridesync.com")

        if not alex or not sarah:
            print("Required users (alex, sarah) not found. Please seed users first.")
            return

        # Check for existing booking between Sarah and Alex
        bookings = (await session.execute(select(Booking))).scalars().all()
        booking1 = next((b for b in bookings if b.renter_id == sarah.id and b.owner_id == alex.id), None)
        booking_id = booking1.id if booking1 else None

        now = datetime.now(timezone.utc)

        # 1. Conversation between Alex (Owner) and Sarah (Renter)
        conv1 = Conversation(
            user1_id=min(alex.id, sarah.id),
            user2_id=max(alex.id, sarah.id),
            booking_id=booking_id,
            created_at=now - timedelta(days=5),
            updated_at=now - timedelta(hours=1),
        )
        session.add(conv1)
        await session.commit()
        await session.refresh(conv1)

        messages1 = [
            Message(
                conversation_id=conv1.id,
                sender_id=sarah.id,
                content="Hi Alex! I just booked your Tesla Model 3 for next week. Looking forward to the trip!",
                is_read=True,
                created_at=now - timedelta(days=5),
            ),
            Message(
                conversation_id=conv1.id,
                sender_id=alex.id,
                content="Hey Sarah! Welcome! The Tesla is in pristine condition. It'll be fully charged at 100% when you pick it up.",
                is_read=True,
                created_at=now - timedelta(days=4, hours=22),
            ),
            Message(
                conversation_id=conv1.id,
                sender_id=sarah.id,
                content="Awesome! Is keyless entry enabled via the app or will we meet at SFO?",
                is_read=True,
                created_at=now - timedelta(days=3),
            ),
            Message(
                conversation_id=conv1.id,
                sender_id=alex.id,
                content="Keyless mobile unlock is configured! I'll ping you the parking bay number 2 hours prior to arrival.",
                is_read=True,
                created_at=now - timedelta(days=2),
            ),
            Message(
                conversation_id=conv1.id,
                sender_id=alex.id,
                content="Hey Sarah, the car is charged and parked in spot B12 at SFO. Enjoy the ride!",
                is_read=False,
                created_at=now - timedelta(hours=1),
            ),
        ]
        session.add_all(messages1)

        # 2. Conversation between Alex and Michael
        if michael:
            conv2 = Conversation(
                user1_id=min(alex.id, michael.id),
                user2_id=max(alex.id, michael.id),
                booking_id=None,
                created_at=now - timedelta(days=1),
                updated_at=now - timedelta(minutes=30),
            )
            session.add(conv2)
            await session.commit()
            await session.refresh(conv2)

            messages2 = [
                Message(
                    conversation_id=conv2.id,
                    sender_id=michael.id,
                    content="Hey Alex, do you allow pets in the Porsche Macan if kept in a carrier?",
                    is_read=True,
                    created_at=now - timedelta(hours=5),
                ),
                Message(
                    conversation_id=conv2.id,
                    sender_id=alex.id,
                    content="Hi Michael! Small pets in hard carriers are fine, just make sure to vacuum any loose hair before drop-off.",
                    is_read=False,
                    created_at=now - timedelta(minutes=30),
                ),
            ]
            session.add_all(messages2)

        await session.commit()
        print("Seeded conversations and chat messages successfully.")
    finally:
        if close_session:
            await session.close()

if __name__ == "__main__":
    asyncio.run(seed_chat())
