## Contents

1. [PieceMovement migration and caller blast radius](#piecemovement-migration-and-caller-blast-radius)
2. [Type hint cleanup on Piece and PieceMovement](#type-hint-cleanup-on-piece-and-piecemovement)

---

## PieceMovement migration and caller blast radius

### Context

`Piece.movement` was refactored from a raw `set[Position]` to a `PieceMovement` dataclass
(`movement_pattern: Patterns`, `movement_distance: int`) wrapping a `get_positions(speed_increment)`
method, so movement range can be computed dynamically off `PieceAttributes.speed_increment` instead
of being a fixed precomputed set. `Piece.load_movement` was updated to return `PieceMovement`, and a
new `Piece.movement_range` property was added to expose `self.movement.get_positions(self.attributes.get("speed_increment"))`.

The refactor was in progress but not yet complete: `Piece.create` also uses `load_movement` to build
`KingPiece.summoning` (the king's summon-range pattern), so that field silently became a
`PieceMovement` too, while its type annotation and every caller still assumed the old
`set[Position]` contract.

### Discussion points

- Asked whether Python supports a cast-to-list overload (like a C++ operator) for `PieceMovement`.
  Answer: no direct cast hook — `list(x)` only works via `__iter__` (or `__len__`+`__getitem__`).
  Adding `__iter__` would work for `for pos in movement` / `list(movement)`, but only at the default
  `speed_increment=0` since `__iter__` takes no args — flagged as a real limitation, not added since
  no caller was shown to need it.
- Traced blast radius of the incomplete migration via grep on `.summoning` and `.movement` usage:
  - `engine/entities/player.py:49` and `engine/agent/dumb.py:31` — both call
    `Patterns.is_within(king.position, position, king.summoning)`, which expects
    `positions: set[Position]` and does `target in positions`. Passing a `PieceMovement` object here
    would have raised `TypeError` (not iterable / no `__contains__`).
  - `engine/entities/player.py:154` — `for offset in piece.movement:` iterated the field directly,
    same shape bug, same exception.
  - `play/piece/tools.py:16` — `positions = Piece.load_movement(movement)` then used `in positions`
    checks lower in `compute_movement_grid`, same shape bug.
- Minimal-fix approach agreed: call `.get_positions()` at each of the four call sites rather than
  adding `__iter__` to `PieceMovement`, since the call sites already had a natural place to invoke
  the method and this avoids the default-only-speed_increment limitation of an `__iter__` shortcut.

### Decision

Completed the migration rather than just flagging it:
- `KingPiece.summoning` type annotation changed from `set[Position]` to `PieceMovement` to match
  what `Piece.create` actually constructs.
- Hoisted the inline `scale_pattern` import in `PieceMovement.get_positions` to the top-level
  `engine.utils.positions` import (already imported in that file for `Position`), and added the
  missing `speed_increment: int` type hint.
- Updated all four callers to call `.get_positions()` on the `PieceMovement` before using it as a
  position set: `player.py:49`, `player.py:154`, `dumb.py:31`, `tools.py:16`.
- Verified with `python -m py_compile` on all four touched files (no DB access involved — pure-logic
  `engine` package, per the project's no-DB-touch rule).

---

## Type hint cleanup on Piece and PieceMovement

### Context

Follow-up quick scan of `piece.py` for other stale/wrong type hints beyond the `PieceMovement`
migration above, prompted by confirming `get_positions`'s actual return type against
`scale_pattern`'s signature (`set[Position]`, not `list[Position]` — no cast-to-list overload
exists in Python without adding `__iter__`, which was deliberately not added).

### Discussion points

- `Piece.piece_id: uuid4` — `uuid4` is the generator function, not a type; every other field in the
  file correctly names a class, so this was a copy-paste-shaped mistake, not intentional.
- `Piece.player: Player` had no `| None`, but `Piece.create(data, player: Player | None = None)`
  already permits and passes through `player=None` — the field annotation didn't match what the one
  constructor actually allows.
- `PieceType.get`'s `-> Enum` return hint (imprecise vs. `RoleType | Archetype`) was flagged but
  scoped out as minor/skip — not touched.

### Decision

- `piece_id: uuid4` → `piece_id: UUID` (added `UUID` to the `uuid` import).
- `player: Player` → `player: Player | None`, matching `Piece.create`'s actual contract.
- `get_positions(self, speed_increment: int = 0)` → added `-> set[Position]` return hint.
- Verified with `python -m py_compile`.
