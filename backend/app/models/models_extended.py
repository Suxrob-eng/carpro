from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    price = Column(Float, nullable=False)
    changed_at = Column(DateTime, server_default=func.now(), nullable=False)

    car = relationship("Car")

    def __repr__(self):
        return f"<PriceHistory {self.car_id} -> {self.price}>"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info", nullable=False)  # price_drop, new_listing, favorite, system
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship("User")


class DreamGarage(Base):
    __tablename__ = "dream_garage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship("User")
    car = relationship("Car")


class CarBattle(Base):
    __tablename__ = "car_battles"

    id = Column(Integer, primary_key=True, index=True)
    car1_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    car2_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    winner_id = Column(Integer, ForeignKey("cars.id", ondelete="SET NULL"), nullable=True)
    ai_verdict = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    car1 = relationship("Car", foreign_keys=[car1_id])
    car2 = relationship("Car", foreign_keys=[car2_id])
    winner = relationship("Car", foreign_keys=[winner_id])


class OwnershipHistory(Base):
    __tablename__ = "ownership_history"

    id = Column(Integer, primary_key=True, index=True)
    vin = Column(String(50), unique=True, nullable=False, index=True)
    owner_count = Column(Integer, default=1, nullable=False)
    accidents_count = Column(Integer, default=0, nullable=False)
    theft_status = Column(String(50), default="No Record", nullable=False)
    loan_status = Column(String(50), default="Clear", nullable=False)
    import_history = Column(Text, nullable=True)
    mileage_history = Column(JSON, nullable=True)  # List of dicts, e.g. [{"date": "2024-01-01", "mileage": 10000}]
    inspection_records = Column(JSON, nullable=True)


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_type = Column(String(50), default="test_drive", nullable=False)  # test_drive, video_call
    appointment_datetime = Column(DateTime, nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # pending, approved, completed, cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    car = relationship("Car")
    buyer = relationship("User")


class CommunityForumTopic(Base):
    __tablename__ = "community_forum_topics"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(50), nullable=False, index=True)
    model = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    pinned = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    author = relationship("User")
    replies = relationship("CommunityForumReply", back_populates="topic", cascade="all, delete-orphan")


class CommunityForumReply(Base):
    __tablename__ = "community_forum_replies"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("community_forum_topics.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    likes = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    topic = relationship("CommunityForumTopic", back_populates="replies")
    author = relationship("User")
