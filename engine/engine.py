import json
from game.models import GameState, Piece, PlayerState
from game.context import get_current_game, get_room
from game.enums import Trigger, Layer, Archetype, PieceType, BOARD_SIZE


# ── Action dispatcher ─────────────────────────────────────────────────────────

def process_action(action: dict) -> GameState:
    """
    Entry point for every player action. Called from routes.py after the
    current_game ContextVar has been set for this request.

    action envelope:
      { "type": "SUMMON"|"MOVE"|"ACTIVATE"|"END_TURN",
        "player_id": int,
        "piece_id": int | None,
        "payload": { ... } }
    """
    state = get_current_game()
    action_type = action.get("type", "")
    dispatch = {
        "SUMMON":   _action_summon,
        "MOVE":     _action_move,
        "ACTIVATE": _action_activate,
        "END_TURN": _action_end_turn,
    }
    handler = dispatch.get(action_type)
    if handler is None:
        raise RuntimeError(f"Unknown action type: {action_type!r}")
    handler(action, state)
    return state


# ── Internal helpers ──────────────────────────────────────────────────────────

def _find_piece(piece_id: int, state: GameState) -> tuple[Piece, PlayerState] | None:
    for player in state.players.values():
        for piece in [*player.board.values(), *player.shelf, *player.bag]:
            if piece.piece_id == piece_id:
                return piece, player
    return None


# ── Action handlers ───────────────────────────────────────────────────────────

def _action_summon(action: dict, state: GameState) -> None:
    piece_id = action.get("piece_id")
    payload  = action.get("payload", {})
    row = int(payload.get("row", 0))
    col = int(payload.get("col", 0))

    found = _find_piece(piece_id, state)
    if found is None:
        raise RuntimeError(f"Piece {piece_id} not found")
    piece, owner = found

    if piece.layer != Layer.SHELF:
        raise RuntimeError(f"{piece.name} is not on the shelf")
    if (row, col) in owner.board:
        raise RuntimeError(f"Position ({row},{col}) is already occupied")

    if piece in owner.shelf:
        owner.shelf.remove(piece)
    piece.position = (row, col)
    piece.layer = Layer.BOARD
    owner.board[(row, col)] = piece

    state.log.append(f"Player {owner.player_id} summoned {piece.name} at ({row},{col})")

    from game.triggers import fire_trigger
    state.log.extend(fire_trigger(Trigger.SUMMON, piece, state))


def _action_move(action: dict, state: GameState) -> None:
    piece_id = action.get("piece_id")
    payload  = action.get("payload", {})
    to_row = int(payload.get("to_row", 0))
    to_col = int(payload.get("to_col", 0))

    found = _find_piece(piece_id, state)
    if found is None:
        raise RuntimeError(f"Piece {piece_id} not found")
    piece, owner = found

    if piece.layer != Layer.BOARD or piece.position is None:
        raise RuntimeError(f"{piece.name} is not on the board")

    from_row, from_col = piece.position
    dr = to_row - from_row
    dc = to_col - from_col

    # Validate via 3x3 movement matrix (offset ±1 per axis maps to [0-2])
    mr = dr + 1
    mc = dc + 1
    if not (0 <= mr <= 2 and 0 <= mc <= 2):
        raise RuntimeError(f"{piece.name} cannot move that far in one step ({dr},{dc})")
    if piece.movement[mr][mc] == 0:
        raise RuntimeError(f"{piece.name} cannot move in direction ({dr},{dc})")

    from game.triggers import fire_trigger

    # Capture: check if destination is occupied by an opponent
    for other_player in state.players.values():
        if other_player.player_id == owner.player_id:
            continue
        victim = other_player.board.get((to_row, to_col))
        if victim:
            other_player.board.pop((to_row, to_col))
            victim.is_alive = False
            victim.position = None
            piece.kill_count += 1
            state.log.append(f"{piece.name} captured {victim.name}")
            state.log.extend(fire_trigger(Trigger.KILL, piece, state))
            state.log.extend(fire_trigger(Trigger.DEATH, victim, state))
            break

    # Move piece
    del owner.board[(from_row, from_col)]
    piece.position = (to_row, to_col)
    owner.board[(to_row, to_col)] = piece
    state.log.append(f"{piece.name} moved to ({to_row},{to_col})")
    state.log.extend(fire_trigger(Trigger.MOVE, piece, state))

    # Promotion: player 0 promotes at the far end, player 1 at row 0
    if (owner.player_id == 0 and to_row == BOARD_SIZE - 1) or \
       (owner.player_id == 1 and to_row == 0):
        state.log.append(f"{piece.name} promoted")
        state.log.extend(fire_trigger(Trigger.PROMOTION, piece, state))


def _action_activate(action: dict, state: GameState) -> None:
    piece_id = action.get("piece_id")
    found = _find_piece(piece_id, state)
    if found is None:
        raise RuntimeError(f"Piece {piece_id} not found")
    piece, _ = found

    from game.triggers import fire_trigger
    state.log.extend(fire_trigger(Trigger.ACTIVATE, piece, state))


def _action_end_turn(action: dict, state: GameState) -> None:
    from game.triggers import fire_trigger_on_all
    state.log.extend(fire_trigger_on_all(Trigger.TURN_END, state))
    _tick_modifiers(state)
    _tick_turns(state)
    state.active_player = 1 - state.active_player
    state.turn += 1
    state.log.append(f"Turn {state.turn} — player {state.active_player}'s turn")


# ── Turn ticks ────────────────────────────────────────────────────────────────

def _tick_modifiers(state: GameState) -> None:
    for player in state.players.values():
        for piece in player.board.values():
            _expire_modifiers(piece)


def _expire_modifiers(piece: Piece) -> None:
    # Iterate backwards so popping an expired modifier doesn't shift the
    # indices of entries we haven't visited yet.
    for i in range(len(piece.modifiers) - 1, -1, -1):
        m = piece.modifiers[i]
        m.turns_left -= 1
        if m.turns_left <= 0:
            _reverse_modifier(piece, m)
            piece.modifiers.pop(i)


def _reverse_modifier(piece: Piece, m) -> None:
    """The retrievable reverse function: undoes a Modifier's mutation."""
    setattr(piece, m.attr, getattr(piece, m.attr) - m.delta)


def _tick_turns(state: GameState) -> None:
    for player in state.players.values():
        for piece in player.board.values():
            piece.turns_on_board += 1


# ── Snapshot persistence (async, fire-and-forget) ─────────────────────────────

async def save_snapshot_async(state: GameState) -> None:
    try:
        import game
        from sqlalchemy.orm import Session
        from sqlalchemy import select, delete
        from game.orm.game_snapshot import GameSnapshot

        state_json = _serialize_state(state)
        with Session(game.sqlite_engine) as session:
            session.add(GameSnapshot(
                room_id    = state.room_id,
                turn       = state.turn,
                state_json = state_json,
            ))
            session.commit()

            # Keep only the 5 most recent snapshots per room
            old_ids = session.execute(
                select(GameSnapshot.id)
                .where(GameSnapshot.room_id == state.room_id)
                .order_by(GameSnapshot.id.desc())
                .offset(5)
            ).scalars().all()
            if old_ids:
                session.execute(
                    delete(GameSnapshot).where(GameSnapshot.id.in_(old_ids))
                )
                session.commit()
    except Exception as e:
        print(f"[snapshot] write failed for room {state.room_id}: {e}")


# ── Room initialisation ───────────────────────────────────────────────────────

def _token_def_to_piece(td, owner_id: int, state: GameState) -> Piece:
    from game.parser import parse_dsl
    card_effects = parse_dsl(td.effect_dsl) if td.effect_dsl else []
    return Piece(
        piece_id      = state.next_piece_id(),
        name          = td.name,
        archetype     = Archetype(td.archetype),
        piece_type    = PieceType(td.piece_type),
        body_color    = td.body_color,
        movement      = td.movement,
        effect_grid   = td.effect_grid,
        card_effects  = card_effects,
        raw_effect_dsl= td.effect_dsl or "",
        owner_id      = owner_id,
        summon_cost   = td.summon_cost,
        move_cost     = td.move_cost,
    )


def initialize_room(
    room_id: int,
    p0_token_names: list[str],
    p1_token_names: list[str],
) -> GameState:
    import game
    from sqlalchemy.orm import Session
    from sqlalchemy import select
    from game.orm.token_definition import TokenDefinition
    from game.context import set_room

    state = get_room(room_id)
    if state is None:
        raise RuntimeError(f"Room {room_id} does not exist")

    # Clear existing state (idempotent restart)
    for player in state.players.values():
        player.board.clear()
        player.shelf.clear()
        player.bag.clear()
    state._next_id = 0
    state.turn = 0
    state.active_player = 0
    state.log.clear()

    KING_POSITIONS = {0: (4, 0), 1: (4, 7)}

    with Session(game.sqlite_engine) as session:
        for player_id, token_names in enumerate([p0_token_names, p1_token_names]):
            player = state.players[player_id]
            for i, name in enumerate(token_names):
                td = session.execute(
                    select(TokenDefinition).where(TokenDefinition.name == name)
                ).scalar_one_or_none()
                if td is None:
                    raise RuntimeError(f"Token '{name}' not found")

                piece = _token_def_to_piece(td, player_id, state)

                if i == 0:
                    pos = KING_POSITIONS[player_id]
                    piece.position = pos
                    piece.layer = Layer.BOARD
                    player.board[pos] = piece
                else:
                    piece.layer = Layer.SHELF
                    player.shelf.append(piece)

    state.log.append("Game initialised")
    set_room(state)
    return state


# ── Serialisation ─────────────────────────────────────────────────────────────

def _serialize_state(state: GameState) -> str:
    return json.dumps(_convert(state))


def _convert(obj: object) -> object:
    if isinstance(obj, tuple):
        return list(obj)
    if hasattr(obj, "value"):  # Enum
        return obj.value
    if hasattr(obj, "__dataclass_fields__"):
        return {
            k: _convert(v)
            for k, v in vars(obj).items()
            if not k.startswith("_")
        }
    if isinstance(obj, dict):
        return {
            (f"{k[0]},{k[1]}" if isinstance(k, tuple) else str(k)): _convert(v)
            for k, v in obj.items()
        }
    if isinstance(obj, list):
        return [_convert(i) for i in obj]
    return obj
