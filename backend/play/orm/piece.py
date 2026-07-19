from utils.databases import Base
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship


class Piece(Base):
    __tablename__ = "piece"

    id   = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True, index=True)  # unique: one row per catalog piece name; index: lookup by name

    #* one-to-many — every BagPiece entry that references this piece
    bag_pieces = relationship("BagPiece", back_populates="piece")
    #* one-to-many — every GamePlayerPiece snapshot entry that references this piece
    game_player_pieces = relationship("GamePlayerPiece", back_populates="piece")
