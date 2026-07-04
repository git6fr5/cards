from __future__ import annotations
import random
from contextvars import ContextVar
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
    rng: random.Random = field(default_factory=random.Random)

    @property
    def active_player(self) -> Player:
        return self.players[self.active_player_index]


# Holds the active Game per (async) context, so multiple games can be
# reconstructed concurrently in one process without sharing state — same
# guarantee backend/utils/databases.py's current_session ContextVar gives
# per-request DB sessions.
_current_game: ContextVar[Game] = ContextVar("current_game")


def set_current_game(new_game: Game) -> None:
    _current_game.set(new_game)


def get_current_game() -> Game:
    return _current_game.get()


class _GameProxy:
    def __getattr__(self, name):
        return getattr(_current_game.get(), name)

    def __setattr__(self, name, value):
        setattr(_current_game.get(), name, value)


# Module-level handle — existing `from engine.game import game` call sites
# keep working unchanged, now resolving against the context-scoped Game.
game = _GameProxy()
