from datetime import datetime
from pydantic import BaseModel, ConfigDict

class TransactionCreate(BaseModel):
    booking_id: int
    amount: float
    status: str

class TransactionResponse(BaseModel):
    id: int
    booking_id: int
    amount: float
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
