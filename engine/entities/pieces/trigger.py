from engine.effects import apply_effect
from engine.entities.pieces.piece import Piece
from enum import Enum
from dataclasses import dataclass
from typing import Callable
import random

class TriggerCondition(str, Enum):
    TURNEND = "TURNEND"
    MOVE = "MOVE"
    KILL = "KILL"
    DEATH = "DEATH"
    SUMMON = "SUMMON"
    PROMOTION = "PROMOTION"
    NONE = ""


@dataclass
class TriggerStep:
    condition: TriggerCondition
    params: dict[str, str | int]


TRIGGER_THRESHOLD: dict[TriggerCondition, str] = {
    TriggerCondition.TURNEND: "turns_on_board",
    TriggerCondition.MOVE: "distance_total",
    TriggerCondition.KILL: "kill_count",
    TriggerCondition.DEATH: "death_count",
    TriggerCondition.SUMMON: "summon_count",
    TriggerCondition.PROMOTION: "promotion_count",
}

class TargetType(str, Enum):
    SELF = "SELF"
    DEFENDER = "DEFENDER"   # The unit receiving the damage/kill
    RANDOM = "RANDOM"
    ALL = "ALL"
    PATTERN = "PATTERN"
    NONE = ""

class Alignment(str, Enum):
    ALLY = "ALLY"
    ENEMY = "ENEMY"
    # ANY = "ANY"

@dataclass
class TargetStep:
    target_type: TargetType
    params: dict[str, str | int | dict]  # Can hold sub-filters or limits

def initiate_trigger(condition: TriggerCondition, piece: Piece, defender: Piece | None):
    if piece.ability.trigger_step.condition == condition:
        filters = piece.ability.trigger_step.params["filters"]
        threshold_value = piece.ability.trigger_step.params["value"]

        if not piece.satisfies_filters(filters):
            return

        attribute = piece.attributes.get(TRIGGER_THRESHOLD[condition])
        if not attribute % threshold_value == 0:
            return

        targets = resolve_targets(piece.ability.target_step, piece, target)

        targets = resolve_targets(effect.target, piece, owner, state)
        for step in effect.steps:
            apply_effect(step, targets, owner, state)


def resolve_targets(target_step: TargetStep, piece: Piece, defender: Piece | None):
    target_step = target_step.target_type
    filters = target_step.params["filters"]
    filters = target_step.params["filters"]

    if target_step == TargetType.SELF:
        return [piece]
    elif target_step == TargetType.DEFENDER and defender:
        return [defender]
    elif target_step == TargetType.PATTERN:
        alignment = target_step.params["alignment"]
        pattern = target_step.params["patter"]
        return viable_in_pattern(piece.player_id, board.get_position(piece), pattern, alignment)
    elif target_step == TargetType.RANDOM:
        alignment = target_step.params["alignment"]
        layer = target_step.params["layer"]
        count = target_step.params["count"]
        viable_pieces = get_viable_pieces(piece.player_id, layer, alignment, filters)
        count = min(count, len(viable_pieces))
        return random.sample(viable_pieces, count)
    elif target_step == TargetType.ALL:
        alignment = target_step.params["alignment"]
        layer = target_step.params["layer"]
        return get_viable_pieces(piece.player_id, layer, alignment, filters)
        


def get_viable_pieces(player_id: int, layer: Layer, alignment: Alignment, filters: dict):
    if alignment == Alignment.ENEMY:
        player_id = (player_id+1)%2
    
    room: Room = Room.get_current()
    player = any(p.player_id == player_id for p in room.players)

    pieces_in_layer = []
    if player:
        if layer=Layer.BOARD:
            pieces_in_layer= [p for p in board.pieces if p.player_id == player_id]
        elif layer=Layer.SHELF:
            pieces_in_layer= player.shelf
        elif layer=Layer.BAG:
            pieces_in_layer= player.bag
        
    return [p for p in pieces_in_layer if p.satisfies_filter(filters)]


def viable_in_pattern(player_id, center, pattern, alignment, filters):
    if alignment == Alignment.ENEMY:
        player_id = (player_id+1)%2
    pieces_in_pattern = board.locate_in_pattern(center, pattern)
    aligned_pieces = [p for p in pieces_in_pattern if p.player_id == player_id]
    filtered_pieces = [p for p in aligned_pieces if p.satisfies_filter(filters)]
    return filtered_pieces