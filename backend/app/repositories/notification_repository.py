from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc
from app.models.notification import Notification
from app.repositories.base import BaseRepository

class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: AsyncSession):
        super().__init__(Notification, db)

    async def get_by_user(self, user_id: int, limit: int = 50) -> List[Notification]:
        result = await self.db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(desc(Notification.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_as_read(self, notification_id: int, user_id: int) -> bool:
        await self.db.execute(
            update(Notification)
            .where(Notification.id == notification_id, Notification.user_id == user_id)
            .values(is_read=True)
        )
        await self.db.commit()
        return True

    async def mark_all_as_read(self, user_id: int) -> bool:
        await self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id)
            .values(is_read=True)
        )
        await self.db.commit()
        return True
