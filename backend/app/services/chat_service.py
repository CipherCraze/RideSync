from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.message_repository import MessageRepository
from app.repositories.user_repository import UserRepository
from app.repositories.booking_repository import BookingRepository
from app.services.notification_service import NotificationService
from app.schemas.chat import (
    ConversationResponse,
    ConversationDetailResponse,
    MessageResponse,
)
from app.schemas.user import UserResponse

class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.conv_repo = ConversationRepository(db)
        self.msg_repo = MessageRepository(db)
        self.user_repo = UserRepository(db)
        self.booking_repo = BookingRepository(db)
        self.notification_service = NotificationService(db)

    async def get_or_create_conversation(
        self,
        current_user_id: int,
        recipient_id: int,
        booking_id: Optional[int] = None
    ) -> Conversation:
        if current_user_id == recipient_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot start a conversation with yourself."
            )

        recipient = await self.user_repo.get(recipient_id)
        if not recipient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipient user not found."
            )

        # If booking_id provided, check if booking exists
        if booking_id:
            booking = await self.booking_repo.get(booking_id)
            if booking and current_user_id not in [booking.renter_id, booking.owner_id]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized for this booking's chat."
                )

        existing = await self.conv_repo.find_between_users(current_user_id, recipient_id, booking_id)
        if existing:
            return existing

        # Create new conversation
        new_conv = await self.conv_repo.create({
            "user1_id": min(current_user_id, recipient_id),
            "user2_id": max(current_user_id, recipient_id),
            "booking_id": booking_id,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })
        return await self.conv_repo.get_with_details(new_conv.id)

    async def send_message(
        self,
        conversation_id: int,
        sender_id: int,
        content: str
    ) -> Message:
        conversation = await self.conv_repo.get_with_details(conversation_id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found."
            )

        if sender_id not in [conversation.user1_id, conversation.user2_id]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to send messages in this conversation."
            )

        # Create message
        msg = await self.msg_repo.create({
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "content": content.strip(),
            "is_read": False,
            "created_at": datetime.now(timezone.utc),
        })

        # Update conversation updated_at
        await self.conv_repo.update(conversation, {
            "updated_at": datetime.now(timezone.utc)
        })

        # Notify recipient
        recipient_id = conversation.user2_id if sender_id == conversation.user1_id else conversation.user1_id
        sender = await self.user_repo.get(sender_id)
        sender_name = sender.full_name if sender else "A RideSync user"

        snippet = content.strip()[:80] + ("..." if len(content.strip()) > 80 else "")
        await self.notification_service.notify(
            user_id=recipient_id,
            type="MESSAGE_RECEIVED",
            title=f"New message from {sender_name}",
            message=snippet,
            payload={
                "conversation_id": conversation_id,
                "sender_id": sender_id,
                "message_id": msg.id,
            },
            link_url=f"/chat?conversation_id={conversation_id}",
        )

        return msg

    async def get_messages(
        self,
        conversation_id: int,
        user_id: int,
        limit: int = 100
    ) -> List[Message]:
        conv = await self.conv_repo.get(conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found.")

        if user_id not in [conv.user1_id, conv.user2_id]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this conversation."
            )

        return await self.msg_repo.get_by_conversation(conversation_id, limit=limit)

    async def get_conversation(
        self,
        conversation_id: int,
        user_id: int
    ) -> ConversationDetailResponse:
        conv = await self.conv_repo.get_with_details(conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found.")

        if user_id not in [conv.user1_id, conv.user2_id]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this conversation."
            )

        other = conv.user2 if conv.user1_id == user_id else conv.user1
        unread = await self.msg_repo.get_unread_count_in_conversation(conversation_id, user_id)
        messages = await self.msg_repo.get_by_conversation(conversation_id)

        last_msg = messages[-1] if messages else None
        last_msg_resp = MessageResponse.model_validate(last_msg) if last_msg else None

        return ConversationDetailResponse(
            id=conv.id,
            user1_id=conv.user1_id,
            user2_id=conv.user2_id,
            booking_id=conv.booking_id,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            user1=UserResponse.model_validate(conv.user1) if conv.user1 else None,
            user2=UserResponse.model_validate(conv.user2) if conv.user2 else None,
            other_user=UserResponse.model_validate(other) if other else None,
            last_message=last_msg_resp,
            unread_count=unread,
            messages=[MessageResponse.model_validate(m) for m in messages],
        )

    async def mark_read(self, conversation_id: int, user_id: int) -> int:
        conv = await self.conv_repo.get(conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found.")

        if user_id not in [conv.user1_id, conv.user2_id]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this conversation."
            )

        return await self.msg_repo.mark_conversation_as_read(conversation_id, user_id)

    async def get_user_conversations(self, user_id: int) -> List[ConversationResponse]:
        conversations = await self.conv_repo.get_user_conversations(user_id)
        results = []
        for conv in conversations:
            other = conv.user2 if conv.user1_id == user_id else conv.user1
            unread = await self.msg_repo.get_unread_count_in_conversation(conv.id, user_id)
            messages = conv.messages or []
            last_msg = messages[-1] if messages else None
            last_msg_resp = MessageResponse.model_validate(last_msg) if last_msg else None

            results.append(
                ConversationResponse(
                    id=conv.id,
                    user1_id=conv.user1_id,
                    user2_id=conv.user2_id,
                    booking_id=conv.booking_id,
                    created_at=conv.created_at,
                    updated_at=conv.updated_at,
                    user1=UserResponse.model_validate(conv.user1) if conv.user1 else None,
                    user2=UserResponse.model_validate(conv.user2) if conv.user2 else None,
                    other_user=UserResponse.model_validate(other) if other else None,
                    last_message=last_msg_resp,
                    unread_count=unread,
                )
            )
        return results

    async def get_total_unread_count(self, user_id: int) -> int:
        return await self.msg_repo.get_unread_count_for_user(user_id)
