from datetime import datetime, timezone
from sqlalchemy import String, Boolean, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    brand: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    model: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    vehicle_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    fuel_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    transmission: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    seats: Mapped[int] = mapped_column(Integer, nullable=False)
    price_per_day: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    pickup_location: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    status: Mapped[str] = mapped_column(String(20), default="DRAFT", nullable=False, index=True) # DRAFT, PENDING, APPROVED, REJECTED
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    rating_avg: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)
    rating_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="vehicles")
    images = relationship("VehicleImage", back_populates="vehicle", cascade="all, delete-orphan")
    documents = relationship("VehicleDocument", back_populates="vehicle", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="vehicle", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="vehicle", cascade="all, delete-orphan")

