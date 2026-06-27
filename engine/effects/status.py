from game.enums import EffectOp, Layer, Trigger, BOARD_SIZE
from game.models import EffectStep, Piece, GameState, PlayerState, Modifier

def _summon_cost_mod(
    step: EffectStep,
    targets: list[Piece],
    acting_player: PlayerState,
    state: GameState,
) -> list[str]:
    return _apply_stat_mod(step, targets, attr="summon_cost", label="summon cost")


def _move_count_mod(
    step: EffectStep,
    targets: list[Piece],
    acting_player: PlayerState,
    state: GameState,
) -> list[str]:
    return _apply_stat_mod(step, targets, attr="move_count", label="move count")


def apply_modifier_effect(
    effect_step: EffectStep,
    targets: list[Piece],
    attribute: str,
    label: str,
) -> list[str]:
    log = []

    attribute = str(effect_step.params("attribute", ""))
    if not attribute:
        return log
    
    delta = int(effect_step.params.get("delta", 0))
    turns = int(effect_step.params.get("turns", 99))

    for piece in targets:
        piece.modifiers.append(Modifier(
            attr=attribute, delta=delta, turns_left=duration, source=label,
        ))
        sign = "+" if delta >= 0 else ""
        log.append(f"{piece.name} {label} {sign}{delta} for {duration} turns")
    return log
