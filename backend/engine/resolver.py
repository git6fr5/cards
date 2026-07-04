from __future__ import annotations
from typing import TYPE_CHECKING

from engine.entities.piece import Piece
from engine.enums.triggers import TriggerCondition, TRIGGER_ATTRIBUTE
from engine.enums.targets import TargetStep, TargetType
from engine.enums.effects import EffectStep, EffectOperation, PERMANENT_TURNS
from engine.enums.zone import Zone
from engine.enums.alignment import Alignment
from engine.game import game

if TYPE_CHECKING:
    from engine.entities.player import Player


def fire_trigger(condition: TriggerCondition, piece: Piece, defender: Piece | None = None) -> None:
    trigger_step = piece.ability.trigger_step
    if trigger_step.condition != condition:
        return

    if condition != TriggerCondition.ACTIVATE:
        attribute_name = TRIGGER_ATTRIBUTE[condition]
        piece.attributes.set(attribute_name, piece.attributes.get(attribute_name) + 1)

        filters = trigger_step.params["filters"]
        if not piece.satisfies_filters(filters):
            return

        value = trigger_step.params["value"]
        if value == 0 or piece.attributes.get(attribute_name) % value != 0:
            return

    targets = resolve_targets(piece.ability.target_step, piece, defender)
    apply_effect(piece.ability.effect_step, targets)


def resolve_targets(target_step: TargetStep, piece: Piece, defender: Piece | None) -> list[Piece]:
    if target_step.target_type == TargetType.SELF:
        return [piece]

    if target_step.target_type == TargetType.DEFENDER:
        return [defender] if defender is not None else []

    if target_step.target_type != TargetType.ZONE:
        return []

    params = target_step.params
    alignment: Alignment = params["alignment"]
    zone: Zone = params["zone"]["zone"]
    count: int = params["count"]
    filters: dict = params["filters"]

    if zone == Zone.BOARD:
        candidates = game.board.all_within_pattern(piece.position, params["zone"]["positions"])
    elif zone == Zone.SHELF:
        candidates = list(piece.player.shelf) + list(_opponent(piece.player).shelf)
    elif zone == Zone.BAG:
        # BAG:SEE:N resolves as BAG:N — the "see" count is intentionally unused (decision #7).
        candidates = list(piece.player.bag) + list(_opponent(piece.player).bag)
    else:
        candidates = []

    candidates = [
        c for c in candidates
        if _matches_alignment(c, alignment, piece.player) and c.satisfies_filters(filters)
    ]

    if len(candidates) <= count:
        return candidates
    return game.rng.sample(candidates, count)


def apply_effect(effect_step: EffectStep, targets: list[Piece]) -> None:
    operation = effect_step.operation
    params = effect_step.params

    if operation == EffectOperation.KILL:
        for target in targets:
            position = game.board.position_of(target)
            if position is not None:
                del game.board.pieces[position]

    elif operation == EffectOperation.MODIFY:
        for target in targets:
            target.attributes.modify(params["attribute"], params["delta"], params["turns"], source="ability")

    elif operation == EffectOperation.CONVERT:
        turns = params.get("turns", PERMANENT_TURNS)
        for target in targets:
            target.piecetype.convert(params["type_field"], params["convertedtype"], turns, source="ability")

    elif operation == EffectOperation.SUMMON:
        print(f"[ability] SUMMON not yet implemented — no-op ({len(targets)} target(s))")

    elif operation == EffectOperation.PUT:
        print(f"[ability] PUT not yet implemented — no-op ({len(targets)} target(s))")


def _matches_alignment(candidate: Piece, alignment: Alignment, owner: "Player") -> bool:
    if alignment == Alignment.FRIENDLY:
        return candidate.player is owner
    if alignment == Alignment.ENEMY:
        return candidate.player is not owner
    return True  # Alignment.ANY


def _opponent(player: "Player") -> "Player":
    return game.players[(player.player_id + 1) % 2]
