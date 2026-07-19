from utils.databases import Base
from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship


class Player(Base):
    __tablename__ = "player"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)  # unique: one Player per User
    #* one-to-one — the accounts.User this player wraps. Cross-package: play depends on accounts, one-directional (no back_populates on User).
    user = relationship("User", uselist=False)

    #* one-to-many — the decks this player has built. Cascade: bags deleted when the player is deleted.
    bags = relationship("Bag", back_populates="player", cascade="all, delete-orphan")
    #* one-to-many — every seat this player has occupied across games
    game_history = relationship("GamePlayer", back_populates="player")
