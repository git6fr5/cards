---
name: Resolver Trigger-Wiring Plan
description: Scoped map-out of what engine/resolver.py needs to implement to wire up piece triggers, and the open design gaps blocking it
type: project
---

## Table of contents

1. [What resolver.py needs to implement](#1-what-resolverpy-needs-to-implement)
2. [Confirmed decisions](#2-confirmed-decisions)
3. [Updated implementation plan](#3-updated-implementation-plan)
4. [Implementation — 2026-07-04](#4-implementation--2026-07-04)

---

## 1. What resolver.py needs to implement

### Context

`engine/entities/player.py` already has 9 commented-out `fire_trigger(condition, piece,
defender=None)` calls (in `summon()` and `act()`), stubbed out earlier in the session so the
game loop would run without crashing. `engine/resolver.py` is the file the codebase's own
restructure plan designates as the single home for trigger/effect/target resolution logic
(per `.context/engine_restructure_plan.md`: "resolution logic in `engine/resolver.py`, kept
commented" — a deliberate decision, not an oversight). Its current contents are a stale stub:
a function named `is_triggered` (wrong name — nothing calls that; the real call sites expect
`fire_trigger`) that just `return False`s, plus a large block of commented-out code left over
from an earlier architecture (`Room.get_current()`, a `Layer` enum, `board.get_position()`,
`p.satisfies_filter()`, `board.locate_in_pattern()` — none of which exist under those names in
the current codebase). The user asked for a scoped plan of what resolver.py specifically needs,
with no code edits yet.

### Discussion points

None — this was a single request-and-response exchange (map-out requested, map-out delivered).
No back-and-forth occurred within this range; the substantial content is the plan itself and the
open questions it surfaced, captured below.

### Decision

No implementation decisions were made — this produced a scoped plan, not code. The plan:

**Three functions resolver.py needs:**
- `fire_trigger(condition, piece, defender=None) -> None` — per-piece check, matching what
  `player.py` already calls. Special-cases `ACTIVATE` (no counter/filter); every other
  condition checks `piece.satisfies_filters(...)` then compares
  `piece.attributes.get(TRIGGER_ATTRIBUTE[condition])` against the trigger's threshold value.
- `resolve_targets(target_step, piece, defender) -> list[Piece]` — maps `TargetType.SELF` →
  `[piece]`, `DEFENDER` → `[defender]` or `[]`, `LAYER` → dispatches on the layer's `Zone`
  (`BOARD` via `game.board.all_within_pattern`, `SHELF`/`BAG` via `piece.player.shelf`/`.bag`
  or the opponent's), filtered by alignment + `satisfies_filters`, capped at `count`.
- `apply_effect(effect_step, targets) -> None` — maps `KILL` (remove via
  `game.board.position_of` + `del`), `MODIFY` (`target.attributes.modify(...)`), `CONVERT`
  (`target.piecetype.convert(...)`). `SUMMON`/`PUT` are not fully specifiable yet (see open
  questions).

**Stale references to fix while writing it:** `Room.get_current()` → `from engine.game import
game`; `Layer` → `Zone`; `board.get_position(piece)` → `piece.position` /
`game.board.position_of(piece)`; `p.satisfies_filter` → `piece.satisfies_filters` (plural);
`board.locate_in_pattern` → `board.all_within_pattern` (renamed earlier this session);
`p.player_id` → `piece.player.player_id`; the old `TargetType.PATTERN`/`RANDOM`/`ALL` branches
don't exist in the current 3-value enum (`SELF`/`DEFENDER`/`LAYER`) and describe a superseded
grammar.

**Open questions — all resolved; see [section 2](#2-confirmed-decisions).**

---

## 2. Confirmed decisions

1. **Counter-increment ownership** → inlined into `fire_trigger`, as its first step (before the
   filter/modulo check), since it already has the condition and the piece. `ACTIVATE` has no
   counter to increment.
2. **Counter-check semantics** → **modulo "every Nth"**: `attribute % value == 0`. Also updated
   in [engine_dsl_reference.md](engine_dsl_reference.md) and [notes.md](notes.md) — both
   previously carried conflicting `>=`-threshold / consumed-on-fire wording.
3. **`distance_total` → `distance_moved_count`** — fixed:
   `TRIGGER_ATTRIBUTE[TriggerCondition.MOVE]` in
   [engine/enums/triggers.py](../engine/enums/triggers.py) now points at the real
   `PieceAttributes` field. No longer a blocker.
4. **`PROMOTION` detection** → added inline in `Player.act()`'s move branch (mirrors the
   existing commented KILL/DEATH pair), not inside resolver.py. A piece promotes when it lands
   on the rank opposite its own king's `KING_START` row (`FAR_RANK = {0: BOARD_HEIGHT - 1, 1:
   0}`). Kept commented alongside the other 9 stubbed `fire_trigger(...)` calls until
   resolver.py is live.
5. **`SUMMON` effect under-specification** → **deferred**. Placement grammar still needs design
   work; not attempted in this pass.
6. **`PUT` bare-defaults-to-SHELF parser gap** → **deferred**. Parser-level, not resolver.py;
   not attempted in this pass.
7. **`BAG:SEE:N` semantics** → resolved by *not* giving `SEE` distinct semantics right now:
   `BAG:SEE:N` resolves identically to picking `N` random pieces directly from the bag (i.e.
   behaves as `BAG:N`). The grammar/parser is unchanged — `SEE` still parses — but resolution
   ignores the distinction. Revisit if/when the bag gains real ordering.
8. **Selection when `count < candidates`** → **random-N** (`random.sample`, capped at available
   candidates), matching the old dead code's approach even though its `RANDOM` target type no
   longer exists. Applies uniformly to every `LAYER` target, including the `BAG` case in #7.

---

## 3. Updated implementation plan

With the above resolved, `KILL`/`MODIFY`/`CONVERT` effects and `SELF`/`DEFENDER`/board-`LAYER`/
`SHELF`-`LAYER`/`BAG`-`LAYER` targeting can all be implemented and tested now. Order of work:

1. ✅ `engine/enums/triggers.py` — `TRIGGER_ATTRIBUTE[MOVE]` fixed (decision #3).
2. `engine/entities/player.py` `act()` — add the far-rank check after a piece moves, commented
   out like its neighbors:
   ```python
   FAR_RANK = {0: Board.BOARD_HEIGHT - 1, 1: 0}
   if target.y == FAR_RANK[self.player_id]:
       # fire_trigger(Trigger.PROMOTION, piece)
   ```
3. `engine/resolver.py` — replace the stale `is_triggered` stub with three live functions:
   - `fire_trigger(condition, piece, defender=None) -> None` — increments the counter for
     `condition` first (skip for `ACTIVATE`), then checks `piece.satisfies_filters(...)` and
     `attribute % value == 0`, then calls `resolve_targets` and `apply_effect`.
   - `resolve_targets(target_step, piece, defender) -> list[Piece]` — `SELF` → `[piece]`;
     `DEFENDER` → `[defender]` or `[]`; `LAYER` dispatches on `Zone`: `BOARD` via
     `game.board.all_within_pattern`, `SHELF`/`BAG` via `piece.player.shelf`/`.bag` or the
     opponent's (per alignment) — filtered by `satisfies_filters`, then random-N capped at
     `count` (decisions #7, #8).
   - `apply_effect(effect_step, targets) -> None` — `KILL` (remove via `game.board.position_of`
     + `del`), `MODIFY` (`target.attributes.modify(...)`), `CONVERT`
     (`target.piecetype.convert(...)`). `SUMMON`/`PUT` intentionally left unimplemented
     (decisions #5, #6).
4. Uncomment the 9 `fire_trigger(...)` call sites already sitting in `player.py`, plus the new
   `PROMOTION` call from step 2, once resolver.py compiles against them.

**Still deferred, not blocking:** `SUMMON` target/placement grammar, `PUT` bare-argument
default.

---

## 4. Implementation — 2026-07-04

### Context

Continuation of this same plan, in one session: the 8 open questions from section 1 were
resolved with the user first (captured in section 2), then a concrete implementation plan
was designed and reviewed in Plan mode (spawning an Explore agent to re-verify the current
file contents hadn't drifted, and a Plan agent to work out exact function bodies against
those confirmed decisions), and finally the plan was approved and executed end-to-end:
`engine/resolver.py` rewritten, `Player.act()` wired for `PROMOTION`, and the 9 previously
commented `fire_trigger(...)` call sites turned live. The underlying outcome: the engine's
piece-ability DSL now actually resolves at runtime (not just parses) for every trigger
condition and for `KILL`/`MODIFY`/`CONVERT` effects across `SELF`/`DEFENDER`/`BOARD`/
`SHELF`/`BAG` targeting.

### Discussion points

- The Plan agent's design surfaced two additional decision points not covered by the
  original 8 open questions, and these were put to the user directly (via
  `AskUserQuestion`) rather than assumed:
  - **`SUMMON`/`PUT` no-op behavior** — offered "silent no-op" (recommended) vs. "raise
    loudly." User picked a third option they specified themselves: **print a no-op notice
    to the terminal** — visible during play without crashing the interactive loop on a real
    catalog piece (Baby Dragon/Dragon Prince both fire `SUMMON` on promotion).
  - **`CONVERT`-without-`TURNS` default value** — `PieceType.convert()` requires a `turns`
    argument, but the DSL's permanent-conversion form parses to no `"turns"` key at all.
    Offered "bare `99` fallback" (recommended, matching the existing "TURNS 99 ≈ permanent"
    MODIFY convention) vs. "named constant." User chose the **named constant** —
    `PERMANENT_TURNS = 99` added to `engine/enums/effects.py` — over the bare magic number.
  - Both of these were genuine pushback on the Plan agent's default recommendation, not
    just confirmations.
- The Plan agent also flagged, unprompted, two additional gaps that were *not* decided or
  implemented this pass, only documented as known follow-ups: `ON ACTIVATE` + `BOARD`-layer
  targeting can't center on an empty clicked tile (no live bug today — the one catalog
  building ability targets `DEFENDER`); and `CONVERT ... TURNS N` never expires because
  `loop.py`'s `next_turn()` only decays `PieceAttributeModifier`s, never
  `PieceTypeConverter.turns_left`.

### Decision

Implemented and verified in this session:

- `engine/enums/effects.py` — added `PERMANENT_TURNS = 99`.
- `engine/resolver.py` — full rewrite: `fire_trigger`, `resolve_targets`, `apply_effect`
  live per the section 2/3 design, plus the two new decisions above (`PERMANENT_TURNS`
  fallback for bare `CONVERT`; `print(...)` no-ops for `SUMMON`/`PUT`). A private
  `_opponent(player)` helper was inlined in `resolver.py` (no `Player.opponent` property
  added — only one call site needs it today) using the existing `(player_id + 1) % 2`
  convention already present in `loop.py`'s `next_turn()`.
- `engine/entities/player.py` — added the `fire_trigger` import and `FAR_RANK` constant,
  uncommented all 9 existing `fire_trigger(...)` calls as-is (no signature changes needed),
  and inserted the new `PROMOTION` check in `act()`'s move branch, after the `MOVE` calls
  and before the capture (`if target_piece:`) split.
- Verified via: `py_compile` + plain import; standalone in-memory smoke scripts for modulo
  gating, `KILL` via `DEFENDER`, `CONVERT` with/without `TURNS`, `BOARD`-layer targeting
  with random-N capping, and `PROMOTION` firing correctly (and not firing on non-far-rank
  moves); and a live `python -m engine.loop` run that summoned a real catalog piece
  (Goblin Bomber), which also exercised the Goblin King's real `ON SUMMON` ability
  end-to-end (a `BOARD`-layer `MODIFY` effect) with no crash. No pytest suite exists for
  `engine/` — confirmed via the Explore agent — so this in-memory smoke-script approach is
  the standing verification method for this package until one exists.
- Known follow-ups, deliberately left unaddressed: `ON ACTIVATE` + `BOARD`-layer centering
  on empty tiles; `CONVERT ... TURNS N` non-expiry; `SUMMON`/`PUT` placement grammar
  (already deferred per decisions #5/#6).
