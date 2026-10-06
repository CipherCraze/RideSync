from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    renter_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    vehicle_id: Mapped[int] = mapped_column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    
    status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False, index=True)
    payment_status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False) # PENDING, PAID, REFUNDED
    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Permitted Operational Geofence Radius Joint Agreement (Person 2)
    permitted_radius_km: Mapped[float | None] = mapped_column(Float, default=25.0, nullable=True)
    proposed_radius_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    radius_proposal_by: Mapped[str | None] = mapped_column(String(50), nullable=True) # OWNER or RENTER
    radius_proposal_status: Mapped[str | None] = mapped_column(String(50), default="NONE", nullable=True) # NONE, PENDING, ACCEPTED, REJECTED
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    renter = relationship("User", foreign_keys=[renter_id], back_populates="bookings_as_renter")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="bookings_as_owner")
    vehicle = relationship("Vehicle", back_populates="bookings")
    reviews = relationship("Review", back_populates="booking", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="booking", cascade="all, delete-orphan")
    location_pings = relationship("LocationPing", back_populates="booking")
