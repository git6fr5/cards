from __future__ import annotations
from dataclasses import dataclass
from uuid import uuid4
from enum import Enum
from engine.entities.room import Room
from engine.entities.player import Player
from engine.utils.positions import Position
from engine.entities.pieces.attributes import PieceAttributes
from engine.parsers.ability_parser import parse_ability, PieceAbility
from engine.parsers.movement_parser import parse_movement

class PieceType(str, Enum):
    # Action is move.
    UNIT = "UNIT"
    # Action is activate effect.
    BUILDING = "BUILDING" 
    # Action is move, lose if dies, ability triggered by every one of your pieces.
    KING = "KING" 


class Archetype(str, Enum):
    DRAGON = "DRAGON"
    GOBLIN = "GOBLIN"


@dataclass
class Piece:
    player: Player

    piece_id: uuid4
    name: str

    # Eventually make these modifiable as well...
    archetype: Archetype
    piece_type: PieceType
    can_target_own_pieces: bool
    
    movement: set[Position]
    ability: PieceAbility

    attributes: PieceAttributes

    @property
    def is_building(self):
        return self.piece_type == PieceType.BUILDING
    
    @staticmethod
    def create(player: Player, data: dict) -> "Piece":
        return Piece(
            player=player,
            piece_id=uuid4(),
            name=data.get("name"),
            archetype=Archetype[data.get("archetype")],
            piece_type=PieceType[data.get("pieceType")],
            can_target_own_pieces=data.get("can_target_own_pieces"),
            movement=parse_movement(data.get("movement")),
            ability=parse_ability(data.get("ability")),
            attributes=PieceAttributes(
                summon_cost=data.get("attributes").get("summon_cost"),
                action_cost=data.get("attributes").get("action_cost"),
                action_count_per_turn=data.get("attributes").get("action_count_per_turn"),
            )
        )
    
@dataclass
class KingPiece(Piece):
    summoning: set[Position]




