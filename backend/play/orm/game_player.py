from utils.databases import Base
from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship


class GamePlayer(Base):
    __tablename__ = "game_player"

    id = Column(Integer, primary_key=True)
    player_index = Column(Integer, nullable=False)  # 0 or 1 — matches the engine's positional player_id
    player_user_id = Column(Integer, nullable=True)  # future FK to a user table; no accounts yet, always null for now

    game_id = Column(Integer, ForeignKey("game.id", ondelete="CASCADE"), nullable=False, index=True)
    #* many-to-one — the game this player is seated in
    game = relationship("Game", back_populates="players")
