from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.chat import (
    ConversationResponse,
    ConversationDetailResponse,
    ConversationCreate,
    MessageResponse,
    MessageCreate,
    ChatUnreadCountResponse,
)
from app.services.chat_service import ChatService
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["Chat & Messaging"])

@router.get("/conversations", response_model=List[ConversationResponse])
async def get_my_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    return await service.get_user_conversations(current_user.id)

@router.post("/conversations", response_model=ConversationDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_or_find_conversation(
    conv_in: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    conv = await service.get_or_create_conversation(
        current_user_id=current_user.id,
        recipient_id=conv_in.recipient_id,
        booking_id=conv_in.booking_id,
    )
    return await service.get_conversation(conv.id, current_user.id)

@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    return await service.get_conversation(conversation_id, current_user.id)

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: int,
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    messages = await service.get_messages(conversation_id, current_user.id, limit=limit)
    return [MessageResponse.model_validate(m) for m in messages]

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: int,
    message_in: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    msg = await service.send_message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=message_in.content,
    )
    return MessageResponse.model_validate(msg)

@router.put("/conversations/{conversation_id}/read", status_code=status.HTTP_200_OK)
async def mark_conversation_as_read(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    count = await service.mark_read(conversation_id, current_user.id)
    return {"message": f"{count} messages marked as read"}

@router.get("/unread-count", response_model=ChatUnreadCountResponse)
async def get_total_unread_chat_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ChatService(db)
    count = await service.get_total_unread_count(current_user.id)
    return {"unread_count": count}
