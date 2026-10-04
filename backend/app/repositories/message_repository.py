from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, and_, or_
from sqlalchemy.orm import selectinload
from app.models.message import Message
from app.models.conversation import Conversation
from app.repositories.base import BaseRepository

class MessageRepository(BaseRepository[Message]):
    def __init__(self, db: AsyncSession):
        super().__init__(Message, db)

    async def get_by_conversation(self, conversation_id: int, limit: int = 100) -> List[Message]:
        result = await self.db.execute(
            select(Message)
            .options(selectinload(Message.sender))
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_conversation_as_read(self, conversation_id: int, recipient_id: int) -> int:
        result = await self.db.execute(
            update(Message)
            .where(
                Message.conversation_id == conversation_id,
                Message.sender_id != recipient_id,
                Message.is_read == False
            )
            .values(is_read=True)
        )
        await self.db.commit()
        return result.rowcount

    async def get_unread_count_for_user(self, user_id: int) -> int:
        result = await self.db.execute(
            select(func.count(Message.id))
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                or_(Conversation.user1_id == user_id, Conversation.user2_id == user_id),
                Message.sender_id != user_id,
                Message.is_read == False
            )
        )
        return result.scalar() or 0

    async def get_unread_count_in_conversation(self, conversation_id: int, recipient_id: int) -> int:
        result = await self.db.execute(
            select(func.count(Message.id))
            .where(
                Message.conversation_id == conversation_id,
                Message.sender_id != recipient_id,
                Message.is_read == False
            )
        )
        return result.scalar() or 0
