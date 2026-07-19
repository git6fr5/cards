import enum
from datetime import datetime

from utils.databases import Base
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import relationship


class GameInviteStatus(enum.Enum):
    pending = "pending"
    claimed = "claimed"


class GameInvite(Base):
    __tablename__ = "game_invite"

    id         = Column(Integer, primary_key=True)
    status     = Column(Enum(GameInviteStatus), nullable=False, default=GameInviteStatus.pending)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    game_id = Column(Integer, ForeignKey("game.id", ondelete="CASCADE"), nullable=False, index=True)  # index: invites-by-game lookup
    #* many-to-one — the game this invite grants a seat in
    game = relationship("Game", back_populates="invites")

    inviter_player_id = Column(Integer, ForeignKey("player.id", ondelete="CASCADE"), nullable=False, index=True)  # index: sent-invites lookup
    #* many-to-one — the player who sent this invite
    inviter = relationship("Player", foreign_keys=[inviter_player_id], back_populates="game_invites_sent")

    invitee_player_id = Column(Integer, ForeignKey("player.id", ondelete="CASCADE"), nullable=False, index=True)  # index: received-invites lookup
    #* many-to-one — the player invited to claim a seat
    invitee = relationship("Player", foreign_keys=[invitee_player_id], back_populates="game_invites_received")
