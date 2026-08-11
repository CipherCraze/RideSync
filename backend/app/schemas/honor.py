from datetime import datetime
from pydantic import BaseModel, ConfigDict

class HonorScoreHistoryResponse(BaseModel):
    id: int
    user_id: int
    points_change: int
    previous_score: int
    new_score: int
    category: str
    reason: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class HonorScoreAdjustment(BaseModel):
    user_id: int
    points_change: int
    reason: str
