from sqlalchemy import Boolean, Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class VehicleImage(Base):
    __tablename__ = "vehicle_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vehicle_id: Mapped[int] = mapped_column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    angle: Mapped[str | None] = mapped_column(String(50), nullable=True) # FRONT, REAR, SIDE_LEFT, SIDE_RIGHT, INTERIOR, DASHBOARD, OTHER
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    vehicle = relationship("Vehicle", back_populates="images")

