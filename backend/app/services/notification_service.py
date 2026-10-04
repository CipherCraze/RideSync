import json
from typing import Optional, List, Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.notification_repository import NotificationRepository

class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.notification_repo = NotificationRepository(db)

    async def notify(
        self,
        user_id: int,
        type: Optional[str] = None,
        title: Optional[str] = None,
        message: Optional[str] = None,
        payload: Optional[Dict[str, Any] | str] = None,
        link_url: Optional[str] = None,
        notification_type: Optional[str] = None,
        notif_type: Optional[str] = None,
        **kwargs
    ):
        """
        Reusable notification service for all modules (Chat, Bookings, GPS, Honor, Admin).
        Interface: notify(user_id, notif_type/type, title, message, payload=..., link_url=...)
        Supports legacy/alternate kwargs seamlessly.
        """
        # Handle cases where positional arguments might be (user_id, title, message, notification_type)
        if type and not title and not message and (notification_type or notif_type):
            final_title = type
            final_message = notification_type or notif_type
            final_type = "SYSTEM_ALERT"
        else:
            final_type = type or notif_type or notification_type or kwargs.get("type") or kwargs.get("notif_type") or "SYSTEM_ALERT"
            final_title = title or kwargs.get("title", "Notification")
            final_message = message or kwargs.get("message", "")

        final_link = link_url or kwargs.get("link_url")

        payload_json_str = None
        if payload is not None:
            if isinstance(payload, str):
                payload_json_str = payload
            else:
                payload_json_str = json.dumps(payload)

        return await self.notification_repo.create({
            "user_id": user_id,
            "title": final_title,
            "message": final_message,
            "type": final_type,
            "link_url": final_link,
            "payload_json": payload_json_str,
            "is_read": False,
        })

    async def get_user_notifications(self, user_id: int, limit: int = 50) -> List:
        return await self.notification_repo.get_by_user(user_id, limit=limit)

    async def get_unread_count(self, user_id: int) -> int:
        return await self.notification_repo.get_unread_count(user_id)

    async def mark_read(self, notification_id: int, user_id: int) -> bool:
        return await self.notification_repo.mark_as_read(notification_id, user_id)

    async def mark_all_read(self, user_id: int) -> int:
        return await self.notification_repo.mark_all_as_read(user_id)
