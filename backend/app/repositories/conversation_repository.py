from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc
from sqlalchemy.orm import selectinload
from app.models.conversation import Conversation
from app.models.message import Message
from app.repositories.base import BaseRepository

class ConversationRepository(BaseRepository[Conversation]):
    def __init__(self, db: AsyncSession):
        super().__init__(Conversation, db)

    async def get_with_details(self, conversation_id: int) -> Optional[Conversation]:
        result = await self.db.execute(
            select(Conversation)
            .options(
                selectinload(Conversation.user1),
                selectinload(Conversation.user2),
                selectinload(Conversation.booking),
                selectinload(Conversation.messages).selectinload(Message.sender),
            )
            .where(Conversation.id == conversation_id)
        )
        return result.scalars().first()

    async def find_between_users(
        self,
        user_a_id: int,
        user_b_id: int,
        booking_id: Optional[int] = None
    ) -> Optional[Conversation]:
        query = select(Conversation).options(
            selectinload(Conversation.user1),
            selectinload(Conversation.user2),
            selectinload(Conversation.messages).selectinload(Message.sender),
        )
        
        user_match = or_(
            and_(Conversation.user1_id == user_a_id, Conversation.user2_id == user_b_id),
            and_(Conversation.user1_id == user_b_id, Conversation.user2_id == user_a_id)
        )

        if booking_id is not None:
            # First attempt to find conversation specifically for this booking
            booking_query = query.where(user_match, Conversation.booking_id == booking_id)
            result = await self.db.execute(booking_query)
            conv = result.scalars().first()
            if conv:
                return conv

        # Otherwise find any conversation between them
        result = await self.db.execute(query.where(user_match).order_by(desc(Conversation.updated_at)))
        return result.scalars().first()

    async def get_user_conversations(self, user_id: int) -> List[Conversation]:
        result = await self.db.execute(
            select(Conversation)
            .options(
                selectinload(Conversation.user1),
                selectinload(Conversation.user2),
                selectinload(Conversation.booking),
                selectinload(Conversation.messages).selectinload(Message.sender),
            )
            .where(or_(Conversation.user1_id == user_id, Conversation.user2_id == user_id))
            .order_by(desc(Conversation.updated_at))
        )
        return list(result.scalars().all())
