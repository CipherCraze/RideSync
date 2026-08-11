from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.notification_repository import NotificationRepository

class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.notification_repo = NotificationRepository(db)

    async def notify(
        self,
        user_id: int,
        title: str,
        message: str,
        notification_type: str,
        link_url: Optional[str] = None
    ):
        return await self.notification_repo.create({
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notification_type,
            "link_url": link_url,
            "is_read": False,
        })

    async def get_user_notifications(self, user_id: int) -> List:
        return await self.notification_repo.get_by_user(user_id)

    async def mark_read(self, notification_id: int, user_id: int) -> bool:
        return await self.notification_repo.mark_as_read(notification_id, user_id)

    async def mark_all_read(self, user_id: int) -> bool:
        return await self.notification_repo.mark_all_as_read(user_id)
