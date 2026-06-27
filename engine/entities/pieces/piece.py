from __future__ import annotations
from dataclasses import dataclass
from engine.enums import Archetype, PieceType

from tools.positions import Position
from room import Room
from player import Player

from attributes import PieceAttributes
from parsers.ability_parser import parse_ability, PieceAbility

@dataclass
class Piece:

    piece_id: int
    player_id: int

    name: str

    # eventually make these modifiable as well...
    archetype: Archetype
    can_target_own_pieces: bool
    piece_type: PieceType
    
    movement: set[Position]
    
    attributes: PieceAttributes
    ability: PieceAbility
    
    raw_ability_dsl: str

    def get_player(self, room: Room) -> Player:
        return room.players.get(self.player_id)
    
    def parse_ability(self):
        self.ability = parse_ability(self.raw_ability_dsl)

    @property
    def is_building(self):
        return self.piece_type == PieceType.BUILDING
    

class KingPiece(Piece):
    summoning: set[Position]




