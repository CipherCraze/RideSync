from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    reporter_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reported_user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reported_vehicle_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    booking_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    review_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("reviews.id", ondelete="SET NULL"), nullable=True)
    
    reason: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="OPEN", nullable=False, index=True) # OPEN, UNDER_REVIEW, RESOLVED, REJECTED
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reports_filed")
    reported_user = relationship("User", foreign_keys=[reported_user_id])
    reported_vehicle = relationship("Vehicle")
    booking = relationship("Booking")
    review = relationship("Review", back_populates="reports")

    def __init__(self, **kwargs):
        if "description" in kwargs and "details" not in kwargs:
            kwargs["details"] = kwargs.pop("description")
        super().__init__(**kwargs)

    @property
    def description(self) -> str:
        return self.details

    @description.setter
    def description(self, val: str):
        self.details = val
