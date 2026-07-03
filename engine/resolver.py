# from engine.effects.apply import apply_effect  # TODO: effect application home
from engine.entities.piece import Piece
from enum import Enum
from dataclasses import dataclass
from typing import Callable
import random

from engine.enums.triggers import TriggerStep, TriggerCondition

def is_triggered(condition: TriggerCondition, piece: Piece, defender: Piece | None):
    return False
#     trigger_step = piece.ability.trigger_step

#     if trigger_step.condition != condition:
#         return

#     filters = trigger_step.params["filters"]
#     if not piece.satisfies_filters(filters):
#         return

#     value = trigger_step.params["value"]
#     attribute = piece.attributes.get(trigger_step.params["attribute"])
#     if not attribute % value == 0:
#         return

#     target_step = piece.ability.target_step
#     targets = resolve_targets(target_step, piece, defender)

#     effect_step = piece.ability.effect_step
#     apply_effect(effect_step, targets)


# def resolve_targets(target_step: TargetStep, piece: Piece, defender: Piece | None):
#     target_step = target_step.target_type
#     filters = target_step.params["filters"]
#     filters = target_step.params["filters"]

#     if target_step == TargetType.SELF:
#         return [piece]
#     elif target_step == TargetType.DEFENDER and defender:
#         return [defender]
#     elif target_step == TargetType.PATTERN:
#         alignment = target_step.params["alignment"]
#         pattern = target_step.params["patter"]
#         return viable_in_pattern(piece.player_id, board.get_position(piece), pattern, alignment)
#     elif target_step == TargetType.RANDOM:
#         alignment = target_step.params["alignment"]
#         layer = target_step.params["layer"]
#         count = target_step.params["count"]
#         viable_pieces = get_viable_pieces(piece.player_id, layer, alignment, filters)
#         count = min(count, len(viable_pieces))
#         return random.sample(viable_pieces, count)
#     elif target_step == TargetType.ALL:
#         alignment = target_step.params["alignment"]
#         layer = target_step.params["layer"]
#         return get_viable_pieces(piece.player_id, layer, alignment, filters)



# def get_viable_pieces(player_id: int, layer: Layer, alignment: Alignment, filters: dict):
#     if alignment == Alignment.ENEMY:
#         player_id = (player_id+1)%2

#     room: Room = Room.get_current()
#     player = any(p.player_id == player_id for p in room.players)

#     pieces_in_layer = []
#     if player:
#         if layer=Layer.BOARD:
#             pieces_in_layer= [p for p in board.pieces if p.player_id == player_id]
#         elif layer=Layer.SHELF:
#             pieces_in_layer= player.shelf
#         elif layer=Layer.BAG:
#             pieces_in_layer= player.bag

#     return [p for p in pieces_in_layer if p.satisfies_filter(filters)]


# def viable_in_pattern(player_id, center, pattern, alignment, filters):
#     if alignment == Alignment.ENEMY:
#         player_id = (player_id+1)%2
#     pieces_in_pattern = board.locate_in_pattern(center, pattern)
#     aligned_pieces = [p for p in pieces_in_pattern if p.player_id == player_id]
#     filtered_pieces = [p for p in aligned_pieces if p.satisfies_filter(filters)]
#     return filtered_pieces
