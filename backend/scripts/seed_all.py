import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.seed import seed_data
from scripts.seed_chat import seed_chat

async def seed_all():
    print("=== Starting Full RideSync Deterministic Seed Process ===")
    await seed_data()
    print("=== Full Database Seed Completed Successfully ===")

if __name__ == "__main__":
    asyncio.run(seed_all())
