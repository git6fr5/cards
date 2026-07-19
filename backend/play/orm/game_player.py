from utils.databases import Base
from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship


class GamePlayer(Base):
    __tablename__ = "game_player"

    id = Column(Integer, primary_key=True)
    player_index = Column(Integer, nullable=False)  # 0 or 1 — matches the engine's positional player_id

    game_id = Column(Integer, ForeignKey("game.id", ondelete="CASCADE"), nullable=False, index=True)
    #* many-to-one — the game this player is seated in
    game = relationship("Game", back_populates="players")

    player_id = Column(Integer, ForeignKey("player.id", ondelete="SET NULL"), nullable=True, index=True)  # nullable: seat may be unclaimed until a Player joins
    #* many-to-one — the account-linked Player seated here, once claimed
    player = relationship("Player", back_populates="game_history")
