from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class HonorScoreHistory(Base):
    __tablename__ = "honor_score_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    points_change: Mapped[int] = mapped_column(Integer, nullable=False)
    previous_score: Mapped[int] = mapped_column(Integer, nullable=False)
    new_score: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="Trusted", nullable=False)  # Trusted, Good, Warning, Restricted
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    reference_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reference_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="honor_history")

    def __init__(self, **kwargs):
        if "old_score" in kwargs and "previous_score" not in kwargs:
            kwargs["previous_score"] = kwargs.pop("old_score")
        if "change" in kwargs and "points_change" not in kwargs:
            kwargs["points_change"] = kwargs.pop("change")
        if "category" not in kwargs and "new_score" in kwargs:
            score = kwargs["new_score"]
            if score >= 95:
                kwargs["category"] = "Trusted"
            elif score >= 80:
                kwargs["category"] = "Good"
            elif score >= 60:
                kwargs["category"] = "Warning"
            else:
                kwargs["category"] = "Restricted"
        super().__init__(**kwargs)

    @property
    def old_score(self) -> int:
        return self.previous_score

    @old_score.setter
    def old_score(self, val: int):
        self.previous_score = val

    @property
    def change(self) -> int:
        return self.points_change

    @change.setter
    def change(self, val: int):
        self.points_change = val
