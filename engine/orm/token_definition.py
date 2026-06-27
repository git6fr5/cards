from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, Integer, String, Text, JSON


class GameBase(DeclarativeBase):
    pass


class TokenDefinition(GameBase):
    __tablename__ = "token_definition"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    name        = Column(String(255), unique=True, nullable=False)
    archetype   = Column(String(64),  nullable=False)
    piece_type  = Column(String(64),  nullable=False)
    body_color  = Column(String(64),  nullable=False)
    movement    = Column(JSON,        nullable=False)   # [[int,...],...]
    effect_grid = Column(JSON,        nullable=False)   # [[str|null,...],...]
    effect_dsl  = Column(Text,        nullable=True)    # card ability DSL; null = no abilities
    summon_cost = Column(Integer,     nullable=False, default=1)
    move_cost   = Column(Integer,     nullable=False, default=1)
