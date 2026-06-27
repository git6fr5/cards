from game.enums import Trigger
from game.models import ParsedEffect, Piece, GameState


def fire_trigger(
    trigger: Trigger,
    source_piece: Piece,
    state: GameState,
) -> list[str]:
    log: list[str] = []
    owner = state.players.get(source_piece.owner_id)
    if owner is None:
        return log

    for effect in source_piece.card_effects:
        if not _match_trigger(effect, trigger):
            continue
        if effect.target is None:
            continue

        # Lazy imports break the effects ↔ triggers circular dependency
        from game.targeting import resolve_targets
        from game.effects import apply_effect

        targets = resolve_targets(effect.target, source_piece, owner, state)
        for step in effect.steps:
            log.extend(apply_effect(step, targets, owner, state))

    return log


def fire_trigger_on_all(trigger: Trigger, state: GameState) -> list[str]:
    log: list[str] = []
    # Snapshot board pieces before iterating (effects may mutate the board mid-loop)
    all_board_pieces: list[Piece] = []
    for player in state.players.values():
        all_board_pieces.extend(list(player.board.values()))

    for piece in all_board_pieces:
        log.extend(_fire_with_turn_guard(trigger, piece, state))

    return log


def _fire_with_turn_guard(
    trigger: Trigger,
    source_piece: Piece,
    state: GameState,
) -> list[str]:
    log: list[str] = []
    owner = state.players.get(source_piece.owner_id)
    if owner is None:
        return log

    for effect in source_piece.card_effects:
        if not _match_trigger(effect, trigger):
            continue
        # ON TURN END N: piece must have survived at least N turns
        if trigger == Trigger.TURN_END and effect.trigger_n is not None:
            if source_piece.turns_on_board < effect.trigger_n:
                continue
        if effect.target is None:
            continue

        from game.targeting import resolve_targets
        from game.effects import apply_effect

        targets = resolve_targets(effect.target, source_piece, owner, state)
        for step in effect.steps:
            log.extend(apply_effect(step, targets, owner, state))

    return log


def _match_trigger(effect: ParsedEffect, trigger: Trigger) -> bool:
    return effect.trigger == trigger
