from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, model_validator

class HonorScoreHistoryResponse(BaseModel):
    id: int
    user_id: int
    points_change: int
    previous_score: int
    new_score: int
    change: Optional[int] = None
    old_score: Optional[int] = None
    category: str
    reason: str
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def populate_aliases(self):
        if self.change is None:
            self.change = self.points_change
        if self.old_score is None:
            self.old_score = self.previous_score
        return self

class HonorScoreAdjustment(BaseModel):
    user_id: int
    points_change: Optional[int] = None
    delta: Optional[int] = None
    reason: str
    reference_type: Optional[str] = "ADMIN_MANUAL"
    reference_id: Optional[int] = None

    @model_validator(mode="before")
    @classmethod
    def resolve_delta(cls, values):
        if isinstance(values, dict):
            if "points_change" not in values and "delta" in values:
                values["points_change"] = values["delta"]
            elif "delta" not in values and "points_change" in values:
                values["delta"] = values["points_change"]
        return values

    @model_validator(mode="after")
    def validate_change(self):
        if self.points_change is None and self.delta is None:
            raise ValueError("points_change or delta is required")
        if self.points_change is None:
            self.points_change = self.delta
        if self.delta is None:
            self.delta = self.points_change
        return self

class HonorScoreResponse(BaseModel):
    user_id: int
    honor_score: int
    category: str
