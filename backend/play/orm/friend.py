import enum
from datetime import datetime

from utils.databases import Base
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship


class FriendStatus(enum.Enum):
    pending  = "pending"
    accepted = "accepted"
    declined = "declined"


class Friend(Base):
    __tablename__ = "friend"

    id           = Column(Integer, primary_key=True)
    status       = Column(Enum(FriendStatus), nullable=False, default=FriendStatus.pending)
    created_at   = Column(DateTime, nullable=False, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)

    requester_player_id = Column(Integer, ForeignKey("player.id", ondelete="CASCADE"), nullable=False, index=True)  # index: outgoing-requests lookup
    #* many-to-one — the player who sent this friend request
    requester = relationship("Player", foreign_keys=[requester_player_id], back_populates="friend_requests_sent")

    recipient_player_id = Column(Integer, ForeignKey("player.id", ondelete="CASCADE"), nullable=False, index=True)  # index: incoming-requests lookup
    #* many-to-one — the player who received this friend request
    recipient = relationship("Player", foreign_keys=[recipient_player_id], back_populates="friend_requests_received")

    __table_args__ = (
        UniqueConstraint("requester_player_id", "recipient_player_id", name="uq_friend_requester_recipient"),
    )
