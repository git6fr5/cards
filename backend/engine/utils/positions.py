from typing import NamedTuple

class Position(NamedTuple):
    x: int
    y: int

    def displacement(self, target: "Position") -> "Position":
        return Position(target.x - self.x, target.y - self.y)

    def scale(self, scalar: int) -> "Position":
        return Position(self.x * scalar, self.y * scalar)

    def translate(self, offset: "Position") -> "Position":
        return Position(self.x + offset.x, self.y + offset.y)

def scale_pattern(positions: set[Position], scalar: int) -> set[Position]:
    scaled = set()
    for i in range(1, scalar + 1):
        for position in positions:
            scaled.add(position.scale(i))
    return scaled
