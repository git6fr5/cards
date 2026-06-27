from typing import NamedTuple
from enum import Enum

class Position(NamedTuple):
    x: int
    y: int

    def displacement(self, target: "Position") -> "Position":
        return Position(target.x - self.x, target.y - self.y)

    def scale(self, scalar: int) -> "Position":
        return Position(self.x * scalar, self.y * scalar)

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

def scale_pattern(positions: set[Position], scalar: int) -> set[Position]:
    scaled = set()
    for i in range(1, scalar + 1):
        for position in positions:
            scaled.add(position.scale(i))
    return scaled