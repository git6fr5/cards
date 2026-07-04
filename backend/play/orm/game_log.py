from utils.databases import Base
from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship


class GameLog(Base):
    __tablename__ = "game_log"

    id = Column(Integer, primary_key=True)
    move_number = Column(Integer, nullable=False)
    input = Column(String(255), nullable=False)

    game_id = Column(Integer, ForeignKey("game.id", ondelete="CASCADE"), nullable=False, index=True)
    #* many-to-one — the game this logged input belongs to
    game = relationship("Game", back_populates="logs")
