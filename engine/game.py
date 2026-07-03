from __future__ import annotations
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    # Annotations only — no runtime import, so entities can import `game` freely.
    from engine.entities.board import Board
    from engine.entities.player import Player


@dataclass
class Game:
    board: Board | None = None
    players: list[Player] = field(default_factory=list)
    turn_count: int = 0
    active_player_index: int = 0


# The singleton game state.
game = Game()
