from dataclasses import dataclass, field
from engine.entities.player import Player
from engine.entities.board import Board

@dataclass
class Room:

    room_id: int
    players: list[Player] = field(default_factory=dict)
    board: Board

    log: list[str] = field(default_factory=list)