from sqlalchemy import Column, Integer, Text, DateTime
from sqlalchemy.sql import func
from game.orm.token_definition import GameBase


class GameSnapshot(GameBase):
    __tablename__ = "game_snapshot"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    room_id    = Column(Integer, nullable=False, index=True)
    turn       = Column(Integer, nullable=False)
    state_json = Column(Text,    nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
