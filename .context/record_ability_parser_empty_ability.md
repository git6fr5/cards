# Record: Ability Parser — Empty Ability Handling

## Contents
1. [Empty ability crash fix](#1-empty-ability-crash-fix)

---

## 1. Empty ability crash fix

### Context
`GET /pieces/full` (`backend/play/piece/crud.py`) threw a 500 while packing a piece with no
`ability` set. `parse_ability_types` → `Piece.load_ability` → `parse_ability`
(`backend/engine/utils/parsers.py`) unconditionally requires exactly 3 non-empty lines
(Trigger/Effect/Target) and raised `ValueError: ... Found 0 valid lines instead.` for any piece
whose ability string is empty or missing. This surfaced while inspecting `dragon-prince.json`'s
`ability` field (a valid 3-line ability), but the actual failing piece was a different catalog
entry with no ability at all — the DSL had no code path for "this piece just has no ability,"
even though `TriggerCondition.NONE`, `EffectOperation.NONE`, and `TargetType.NONE` already exist
in the enums specifically for that case.

### Discussion points
None — root cause was unambiguous once the trace and the parser were read together: the NONE
enum variants existed but were unreachable from `parse_ability`'s entry point (the individual
line-parsers' `if not parts` empty-guards are also currently dead code, since `"".split(" ")`
returns `['']`, not `[]` — not touched here, out of scope for this fix).

### Decision
Added an early return in `parse_ability` (`backend/engine/utils/parsers.py`): if the stripped
ability DSL yields zero lines, return a `PieceAbility` built from the three existing `NONE`
variants instead of falling through to the 3-line-count `ValueError`. Verified via `py_compile`
and a standalone call to `parse_ability("")` (pure-logic package, no DB) confirming it now
resolves to `TriggerCondition.NONE` / `EffectOperation.NONE` / `TargetType.NONE` cleanly.
