from engine.enums import EffectOp, Layer, Trigger, BOARD_SIZE
from engine.models import EffectStep, Piece, GameState, PlayerState, Modifier

def do_kill(
    step: EffectStep,
    targets: list[Piece],
    acting_player: PlayerState,
    state: GameState,
) -> list[str]:
    
    log = []
    for piece in targets:
        if not piece.is_alive:
            continue
        _remove_from_board(piece, state)
        piece.is_alive = False
        log.append(f"{piece.name} was killed")
        # Lazy import breaks the effects ↔ triggers circular dependency
        from engine.triggers import fire_trigger
        log.extend(fire_trigger(Trigger.DEATH, piece, state))
    return log


def _remove_from_board(piece: Piece, state: GameState) -> None:
    owner = _find_owner(piece, state)
    if owner and piece.position is not None and piece.position in owner.board:
        del owner.board[piece.position]
    piece.position = None
    piece.layer = Layer.SHELF

def _find_owner(piece: Piece, state: GameState) -> PlayerState | None:
    return state.players.get(piece.owner_id)
