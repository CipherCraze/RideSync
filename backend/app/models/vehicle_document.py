from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class VehicleDocument(Base):
    __tablename__ = "vehicle_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vehicle_id: Mapped[int] = mapped_column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    document_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # RC, PUC, SERVICE_RECORD, INSURANCE
    document_url: Mapped[str] = mapped_column(Text, nullable=False)
    document_number: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g., Registration No., Policy No.
    expiry_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)  # Required for PUC, Insurance
    
    status: Mapped[str] = mapped_column(String(20), default="PENDING", nullable=False, index=True)  # PENDING, VERIFIED, REJECTED
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="documents")
    verified_by = relationship("User", foreign_keys=[verified_by_id])
