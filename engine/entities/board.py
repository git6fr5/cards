from __future__ import annotations
from dataclasses import dataclass, field
from typing import ClassVar
from engine.entities.piece import Piece
from engine.utils.positions import Position

@dataclass
class Board:

    BOARD_WIDTH: ClassVar[int] = 7
    BOARD_HEIGHT: ClassVar[int] = 7

    pieces: dict[Position, Piece] = field(default_factory=dict)

    def is_within_bounds(self, position: Position) -> bool:
        return 0 <= position.x < self.BOARD_WIDTH and 0 <= position.y < self.BOARD_HEIGHT

    def is_occupied(self, position: Position) -> bool:
        return position in self.pieces

    def locate(self, position: Position) -> Piece:
        if position in self.pieces:
            return self.pieces[position]
        
    def position_of(self, piece: Piece) -> Position | None:
        return next((pos for pos, occupant in self.pieces.items() if occupant is piece), None)

    def locate_in_pattern(self, center: Position, pattern: set[Position]) -> list[Piece]:
        return [
            piece for piece in self.pieces
            if center.is_within_area_pattern(piece.position, pattern)
        ]
