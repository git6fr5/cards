from engine.enums import EffectOp, Layer, Trigger, BOARD_SIZE
from engine.models import EffectStep, Piece, GameState, PlayerState, Modifier
from engine.effects.kill import do_kill


def apply_effect(
    step: EffectStep,
    targets: list[Piece],
    acting_player: PlayerState,
    state: GameState,
) -> list[str]:
    dispatch = {
        EffectOp.KILL: do_kill,
        EffectOp.SUMMON:          summon_effect,
        EffectOp.PUT:             put_effect,
        EffectOp.MODIFIER: ,
    }
    handler = dispatch.get(step.op)
    if handler is None:
        return [f"[warn] unknown effect op: {step.op}"]
    return handler(step, targets, acting_player, state)

