from utils.databases import Base
from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint
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

    #* one-to-many — this seat's resolved piece snapshot, taken from its Bag at seat-fill time. Cascade: entries deleted when the seat is deleted.
    resolved_pieces = relationship("GamePlayerPiece", back_populates="game_player", cascade="all, delete-orphan")


class GamePlayerPiece(Base):
    __tablename__ = "game_player_piece"

    id       = Column(Integer, primary_key=True)
    quantity = Column(Integer, nullable=False, default=1)

    game_player_id = Column(Integer, ForeignKey("game_player.id", ondelete="CASCADE"), nullable=False, index=True)  # index: entries-by-seat lookup
    #* many-to-one — the seat this resolved piece entry belongs to
    game_player = relationship("GamePlayer", back_populates="resolved_pieces")

    piece_id = Column(Integer, ForeignKey("piece.id", ondelete="CASCADE"), nullable=False, index=True)  # index: entries-by-piece lookup
    #* many-to-one — the catalog piece this entry references
    piece = relationship("Piece", back_populates="game_player_pieces")

    __table_args__ = (
        UniqueConstraint("game_player_id", "piece_id", name="uq_game_player_piece_seat_piece"),
    )
