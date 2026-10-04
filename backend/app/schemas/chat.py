from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.schemas.user import UserResponse

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    is_read: bool
    created_at: datetime
    sender: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)

class ConversationCreate(BaseModel):
    recipient_id: Optional[int] = None
    participant_id: Optional[int] = None
    booking_id: Optional[int] = None

    @model_validator(mode="before")
    @classmethod
    def resolve_recipient(cls, values):
        if isinstance(values, dict):
            if "recipient_id" not in values and "participant_id" in values:
                values["recipient_id"] = values["participant_id"]
            elif "participant_id" not in values and "recipient_id" in values:
                values["participant_id"] = values["recipient_id"]
        return values

    @model_validator(mode="after")
    def validate_recipient(self):
        if self.recipient_id is None and self.participant_id is None:
            raise ValueError("recipient_id or participant_id is required")
        if self.recipient_id is None:
            self.recipient_id = self.participant_id
        if self.participant_id is None:
            self.participant_id = self.recipient_id
        return self

class ConversationResponse(BaseModel):
    id: int
    user1_id: int
    user2_id: int
    booking_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    user1: Optional[UserResponse] = None
    user2: Optional[UserResponse] = None
    other_user: Optional[UserResponse] = None
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse] = []

class ChatUnreadCountResponse(BaseModel):
    unread_count: int
