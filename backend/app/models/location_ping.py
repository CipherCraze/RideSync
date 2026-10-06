from datetime import datetime, timezone
from sqlalchemy import Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class LocationPing(Base):
    __tablename__ = "location_pings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vehicle_id: Mapped[int] = mapped_column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    speed_kmh: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    battery_or_fuel_level: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    
    is_geofence_breached: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    breach_distance_km: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="location_pings")
    booking = relationship("Booking", back_populates="location_pings")
