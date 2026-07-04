from enum import Enum
from dataclasses import dataclass

from engine.utils.positions import Position

@dataclass
class Patterns(frozenset, Enum):
    CROSS = frozenset({
        Position(0, 1), Position(-1, 0),
        Position(1, 0), Position(0, -1),
    })
    DIAGONAL = frozenset({
        Position(-1, 1), Position(1, 1),
        Position(-1, -1), Position(1, -1),
    })
    FORWARD = frozenset({Position(0, 1)})
    SQUARE = CROSS | DIAGONAL
    NONE = frozenset({})

    @staticmethod
    def is_within(origin: Position, target: Position, positions: set[Position]) -> bool:
        return origin.displacement(target) in positions
