from __future__ import annotations
from dataclasses import dataclass, field
from math import gcd
from typing import ClassVar
from engine.entities.piece import Piece
from engine.enums.patterns import Patterns
from engine.utils.positions import Position

@dataclass
class Board:

    BOARD_WIDTH: ClassVar[int] = 7
    BOARD_HEIGHT: ClassVar[int] = 7

    pieces: dict[Position, Piece] = field(default_factory=dict)

    def is_within(self, position: Position) -> bool:
        return 0 <= position.x < self.BOARD_WIDTH and 0 <= position.y < self.BOARD_HEIGHT

    def is_occupied(self, position: Position) -> bool:
        return position in self.pieces

    def locate(self, position: Position) -> Piece:
        if position in self.pieces:
            return self.pieces[position]
        
    def position_of(self, piece: Piece) -> Position | None:
        return next((pos for pos, occupant in self.pieces.items() if occupant is piece), None)

    def all_within_pattern(self, center: Position, pattern: set[Position]) -> list[Piece]:
        return [
            piece for piece in self.pieces.values()
            if Patterns.is_within(center, piece.position, pattern)
        ]

    def path_blocked(self, origin: Position, target: Position) -> bool:
        dx, dy = target.x - origin.x, target.y - origin.y
        steps = gcd(abs(dx), abs(dy))
        if steps == 0:
            return False

        unit = Position(dx // steps, dy // steps)
        for i in range(1, steps):
            if self.is_occupied(origin.translate(unit.scale(i))):
                return True
        return False
