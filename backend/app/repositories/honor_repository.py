from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.honor_score_history import HonorScoreHistory
from app.repositories.base import BaseRepository

class HonorRepository(BaseRepository[HonorScoreHistory]):
    def __init__(self, db: AsyncSession):
        super().__init__(HonorScoreHistory, db)

    async def get_by_user(self, user_id: int) -> List[HonorScoreHistory]:
        result = await self.db.execute(
            select(HonorScoreHistory)
            .where(HonorScoreHistory.user_id == user_id)
            .order_by(desc(HonorScoreHistory.created_at))
        )
        return list(result.scalars().all())
