from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def get_unverified_users(self) -> List[User]:
        result = await self.db.execute(
            select(User).where(User.driving_license_number.is_not(None), User.is_verified == False)
        )
        return list(result.scalars().all())

    async def get_average_honor_score(self) -> float:
        result = await self.db.execute(select(func.avg(User.honor_score)))
        avg = result.scalar()
        return round(float(avg), 1) if avg is not None else 100.0
