# Parser consolidation plan (EXECUTED)

## Context
Pulled all DSL parsing out of the per-concept enum files into one `engine/utils/parsers.py`,
because the DSL is a single language whose parsers are more coupled to each other than to
their enums (`parse_ability` orchestrates the line parsers; `parse_filters` is shared;
`parse_layer` is part of target parsing). Enum modules became pure types.

## Result
- **`engine/utils/parsers.py`** (new): `parse_ability`, `parse_trigger_line`,
  `parse_effect_line`, `parse_target_line`/`parse_layer`, `parse_pattern` (was
  `parse_movement`), `parse_filters`; module-level `COMPARATORS` and `CONVERTIBLE_TYPES`;
  top-level `from engine.entities.piece import PieceAbility`.
- **`enums/{triggers,effects,targets,patterns}.py`**: stripped to pure types
  (enum + `Step` dataclass / `Patterns` enum).
- **`entities/piece.py`**: keeps `PieceAbility`; `load_ability`/`load_movement` are
  static methods that **lazy-import** from `parsers` (breaks the `piece↔parsers` cycle —
  `piece` has no module-level `parsers` import).
- **`utils/filters.py`** deleted (its `parse_filters` moved into `parsers.py`).

## Cycle rule
`PieceAbility` lives in `piece.py`; `parsers.py` imports it top-level; the cycle is avoided
by `piece.py` having **no module-level** `parsers` import (both parser uses are
function-local). Verified both import orders.

## Follow-on work done after consolidation
- `parse_filters` stores comparator **functions** (`operator.le`, via `COMPARATORS`) and
  uppercases structure values.
- `PieceType`/`PieceTypeConverter` conversion overlay: `get` returns the enum always
  (converted enum if active+unexpired, else `getattr(self, name)`); `convert` stores an
  `Enum`; typed/keyed correctly (`dict[str, PieceTypeConverter]`).
- `Piece.satisfies_filters` implemented (structure via `piecetype.get(key).value`, honoring
  conversions; attributes via stored comparator + modifier-aware `attributes.get`).
- Role properties (`is_building`, `can_capture_allies`, `can_capture_enemies`) route
  through `piecetype.get("roletype")`; `can_target_own_pieces` bool replaced by
  `RoleType` (UNIT/CANNIBAL/PACIFIST) and `player.act` capture check updated.
- `EffectOperation.CONVERT` added; `parse_effect_line` handles
  `CONVERT <field> <value>` and `CONVERT <field> <value> TURNS <n>`, resolving the value
  to its enum via `CONVERTIBLE_TYPES`.

Verified throughout: `py_compile`, both import orders, parser/filters/conversion checks,
`load_pieces()` returns the 4 catalog pieces.
