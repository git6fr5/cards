from dataclasses import dataclass
from engine.entities.pieces.piece import Piece
from engine.utils.positions import Position

@dataclass
class Board:
    turn: int = 0
    active_player: int = 0
    pieces: dict[Position, Piece]

    def is_occupied(self, position: Position) -> bool:
        return position in self.pieces
    
    def locate(self, position: Position) -> Piece:
        if position in self.pieces:
            return self.pieces[position]

    def locate_in_pattern(self, center: Position, pattern: set[Position]) -> list[Piece]:
        return [
            piece for piece in self.pieces
            if center.is_within_area_pattern(piece.position, pattern)
        ]

