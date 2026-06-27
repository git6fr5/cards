import random
from game.enums import Layer, Selection, FilterKey, CompareOp
from game.models import TargetSpec, EffectFilter, Piece, GameState, PlayerState


def resolve_targets(
    spec: TargetSpec,
    acting_piece: Piece,
    acting_player: PlayerState,
    state: GameState,
) -> list[Piece]:
    if spec.selection == Selection.SELF:
        return [acting_piece]

    if spec.selection == Selection.MATRIX:
        return _resolve_matrix(spec.matrix or [], acting_piece.position, state)

    candidates = _collect_from_layers(spec.layers, state)
    candidates = _apply_filters(candidates, spec)

    if spec.selection == Selection.ALL:
        return candidates

    n = spec.n or 1

    if spec.selection == Selection.RANDOM:
        return random.sample(candidates, min(n, len(candidates)))

    if spec.selection == Selection.MOST_EXPENSIVE:
        return sorted(candidates, key=lambda p: p.summon_cost, reverse=True)[:n]

    if spec.selection == Selection.LEAST_EXPENSIVE:
        return sorted(candidates, key=lambda p: p.summon_cost)[:n]

    if spec.selection == Selection.SPECIFIC:
        return candidates  # SPECIFIC relies on a name filter already applied

    return []


def _collect_from_layers(layers: list[Layer], state: GameState) -> list[Piece]:
    pieces: list[Piece] = []
    for player in state.players.values():
        for layer in layers:
            if layer == Layer.BOARD:
                pieces.extend(player.board.values())
            elif layer == Layer.SHELF:
                pieces.extend(player.shelf)
            elif layer == Layer.BAG:
                pieces.extend(player.bag)
    return pieces


def _apply_filters(pieces: list[Piece], spec: TargetSpec) -> list[Piece]:
    for f in spec.filters:
        pieces = [p for p in pieces if _check_filter(p, f)]
    return pieces


def _check_filter(piece: Piece, f: EffectFilter) -> bool:
    if f.key == FilterKey.ARCHETYPE:
        return piece.archetype.value.upper() == f.value.upper()

    # Modifiers mutate the base attribute directly, so reads are effective values.
    attr_map: dict[FilterKey, int] = {
        FilterKey.SUMMON_COST:    piece.summon_cost,
        FilterKey.MOVEMENT_COST:  piece.move_cost,
        FilterKey.MOVEMENT_COUNT: piece.move_count,
    }
    piece_val = attr_map.get(f.key)
    if piece_val is None:
        return True

    try:
        filter_val = int(f.value)
    except ValueError:
        return True

    if f.op == CompareOp.EQ:  return piece_val == filter_val
    if f.op == CompareOp.LT:  return piece_val < filter_val
    if f.op == CompareOp.GT:  return piece_val > filter_val
    if f.op == CompareOp.LTE: return piece_val <= filter_val
    if f.op == CompareOp.GTE: return piece_val >= filter_val
    return True


def _resolve_matrix(
    matrix: list[list[int | None]],
    origin: tuple[int, int] | None,
    state: GameState,
) -> list[Piece]:
    if origin is None or not matrix:
        return []

    result: list[Piece] = []
    for dr in range(3):
        for dc in range(3):
            if len(matrix) > dr and len(matrix[dr]) > dc and matrix[dr][dc]:
                row = origin[0] + (dr - 1)
                col = origin[1] + (dc - 1)
                for player in state.players.values():
                    piece = player.board.get((row, col))
                    if piece:
                        result.append(piece)
    return result
