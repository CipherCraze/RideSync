from datetime import datetime, timezone
from sqlalchemy import String, Boolean, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    auth_provider: Mapped[str] = mapped_column(String(50), default="local", nullable=False)
    google_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    profile_picture: Mapped[str | None] = mapped_column(Text, nullable=True)
    driving_license_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    honor_score: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_suspended: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    vehicles = relationship("Vehicle", back_populates="owner", cascade="all, delete-orphan")
    bookings_as_renter = relationship("Booking", foreign_keys="Booking.renter_id", back_populates="renter")
    bookings_as_owner = relationship("Booking", foreign_keys="Booking.owner_id", back_populates="owner")
    reviews_given = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    reviews_received = relationship("Review", foreign_keys="Review.reviewee_id", back_populates="reviewee")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    reports_filed = relationship("Report", foreign_keys="Report.reporter_id", back_populates="reporter")
    honor_history = relationship("HonorScoreHistory", back_populates="user", cascade="all, delete-orphan")
    conversations_as_user1 = relationship("Conversation", foreign_keys="Conversation.user1_id", back_populates="user1")
    conversations_as_user2 = relationship("Conversation", foreign_keys="Conversation.user2_id", back_populates="user2")
    messages_sent = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
