from datetime import datetime
from uuid import uuid4

from utils.databases import Base
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship


class Game(Base):
    __tablename__ = "game"

    id = Column(Integer, primary_key=True)
    seed = Column(Integer, nullable=False)
    is_game_over = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    room = Column(UUID(as_uuid=True), nullable=False, unique=True, default=uuid4, index=True)  # external room identifier looked up by the frontend

    #* one-to-many — the (for now, exactly two) GamePlayer seats at this game
    players = relationship("GamePlayer", back_populates="game", cascade="all, delete-orphan")
    #* one-to-many — ordered raw-input log used to replay/reconstruct this game's state
    logs = relationship("GameLog", back_populates="game", cascade="all, delete-orphan")
    #* one-to-many — outstanding/claimed invites to fill this game's seats
    invites = relationship("GameInvite", back_populates="game", cascade="all, delete-orphan")

    winner_player_id = Column(Integer, ForeignKey("player.id", ondelete="SET NULL"), nullable=True)  # nullable: unset until the game ends
    #* many-to-one — the player who won this game, set once the game ends
    winner = relationship("Player", back_populates="games_won")
