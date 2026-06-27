from typing import NamedTuple
from engine.tools import positions

class Position(NamedTuple):
    x: int
    y: int

    def displacement(self, target: "Position") -> "Position":
        return Position(x=target.x-self.x, y=target.y-self.y)