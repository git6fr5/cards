from datetime import datetime

from utils.databases import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship


class Bag(Base):
    __tablename__ = "bag"

    id         = Column(Integer, primary_key=True)
    name       = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    player_id = Column(Integer, ForeignKey("player.id", ondelete="CASCADE"), nullable=False, index=True)  # index: bags-by-player lookup
    #* many-to-one — the player who built this deck
    player = relationship("Player", back_populates="bags")

    #* one-to-many — this bag's piece entries. Cascade: entries deleted when the bag is deleted.
    bag_pieces = relationship("BagPiece", back_populates="bag", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("player_id", "name", name="uq_bag_player_name"),
    )


class BagPiece(Base):
    __tablename__ = "bag_piece"

    id       = Column(Integer, primary_key=True)
    quantity = Column(Integer, nullable=False, default=1)

    bag_id = Column(Integer, ForeignKey("bag.id", ondelete="CASCADE"), nullable=False, index=True)  # index: entries-by-bag lookup
    #* many-to-one — the deck this entry belongs to
    bag = relationship("Bag", back_populates="bag_pieces")

    piece_id = Column(Integer, ForeignKey("piece.id", ondelete="CASCADE"), nullable=False, index=True)  # index: entries-by-piece lookup
    #* many-to-one — the catalog piece this entry references
    piece = relationship("Piece", back_populates="bag_pieces")

    __table_args__ = (
        UniqueConstraint("bag_id", "piece_id", name="uq_bag_piece_bag_piece"),
    )
