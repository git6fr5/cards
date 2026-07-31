## Contents

1. [DISCOUNT/INFLATE — permanent summon_cost keyword pair](#discountinflate--permanent-summon_cost-keyword-pair)
2. [Keyword brainstorm grounded in the actual DSL grammar](#keyword-brainstorm-grounded-in-the-actual-dsl-grammar)
3. [AMP → SURGE rename, QUICKEN/HASTE/ENCUMBER added](#amp--surge-rename-quickenhasteencumber-added)
4. [CONVERT ARCHETYPE / MORPH — investigated, deferred](#convert-archetype--morph--investigated-deferred)
5. [6 new cards designed and shipped](#6-new-cards-designed-and-shipped)

---

## DISCOUNT/INFLATE — permanent summon_cost keyword pair

### Context

User proposed condensing a recurring ability shape (`MODIFY SUMMON_COST -N TURNS 99`, "permanent
cheapening") into a new keyword, parallel to the SLOW/STUN/AMP family already established for
`abilityHalfIconTranslator.ts`. Ran `/bullet 20 1` to brainstorm one-word name candidates.

### Discussion points

None — user picked from the generated list without pushback.

### Decision

`DISCOUNT` locked for `MODIFY SUMMON_COST -N TURNS 99`. `INFLATE` (its positive-delta opposite)
proposed and locked later in the same session as part of the wider keyword expansion (section 3).

---

## Keyword brainstorm grounded in the actual DSL grammar

### Context

Asked to think beyond the existing catalog and brainstorm further keywords by reading the actual
grammar (`backend/engine/utils/parsers.py`) rather than pattern-matching off what's already in
`abilityHalfIconTranslator.ts` — user explicitly: "don't look at what exists — look at the parsers
and think about what I could do."

### Discussion points

- Enumerated the full modifiable-attribute surface from `PieceAttributes`
  (`action_count`, `action_cost`, `summon_cost`, `speed_increment`) and the untouched `CONVERT`/
  `SUMMON`/`PUT` effect ops, proposing keyword candidates per axis (action_cost ±, summon_cost
  permanent ±, action_count/speed_increment permanent-duration variants, CONVERT role/archetype
  variants, SUMMON alignment variants, PUT zone variants, KILL-by-target-shape variants).
- User picked `SURGE` (rename of `AMP`), `QUICKEN` (new), and confirmed liking `RECALL`/`BANISH`
  (both `PUT`-based) from the list, without committing to build the PUT-based ones yet.

### Decision

Narrowed scope to the `MODIFY`-based candidates for this build pass: `SURGE`, `QUICKEN`, `HASTE`,
`ENCUMBER`, `DISCOUNT`, `INFLATE`. `RECALL`/`BANISH` explicitly not built — flagged that
`resolver.py:92-96` still no-ops `SUMMON` and `PUT` at resolution time, so any `PUT`-based keyword
would parse but not functionally work yet.

---

## AMP → SURGE rename, QUICKEN/HASTE/ENCUMBER added

### Context

Extending the `SLOW`/`STUN` N-parameterized regex scheme (from the prior session's
`record_modify_keyword_icon_scheme.md`) to cover `action_cost` (previously had no keyword) and to
rename `AMP` for symmetry with the new family.

### Discussion points

- Confirmed via `trap/trapped-king.json:8` (`MODIFY SUMMON_COST -1 TURNS 1 → FRIENDLY SHELF ALL`)
  that a `SUMMON_COST`-on-`SHELF` precedent already existed in the catalog, derisking `INFLATE`'s
  shelf-targeting design.
- No pushback on the final regex/label scheme.

### Decision

`abilityHalfIconTranslator.ts`: `resolveModifyKeyword` now tries 8 regex patterns in order
(`SURGE`, `STUN`, `QUICKEN`, `SLOW`, `HASTE`, `ENCUMBER`, `DISCOUNT`, `INFLATE`), each
`N`-parameterized:
- `SURGE N` ← `ACTION_COUNT +N TURNS 1` (renamed from `AMP`)
- `QUICKEN N` ← `SPEED_INCREMENT +N TURNS 1`
- `HASTE N` / `ENCUMBER N` ← `ACTION_COST ∓N TURNS 1`
- `DISCOUNT N` / `INFLATE N` ← `SUMMON_COST ∓N TURNS 99`

Verified via a Python harness mirroring the TS regex logic against each new card's DSL line, plus
`tsc --noEmit` clean on the file.

---

## CONVERT ARCHETYPE / MORPH — investigated, deferred

### Context

User wanted to lock `CONVERT ARCHETYPE X TURNS 99` as `MORPH`, but flagged themselves that
"archetype <-> trigger nowadays" might break under conversion — asked to investigate before
locking.

### Discussion points

- Found no code-level coupling: `TRIGGER_ATTRIBUTE` (triggers.py) isn't archetype-gated, trigger
  firing in `player.py` fires unconditionally on game events, and `Piece.satisfies_filters`
  (piece.py:165) already correctly honors active `PieceType` conversions for `WHERE ARCHETYPE:X`
  filters — nothing would crash.
- Traced the real concern to `v0.4.md:12`'s house rule: "a piece's archetype implies its ability
  trigger" (BERSERKER→KILL, VANGUARD→PROMOTION, NOMAD→MOVE, TIMEKEEPER→TURNEND, TRAP→DEATH,
  TURRET→ACTIVATE, DEMON→SUMMON, SOLDIER→none), and `v0.4.md:39`'s shared archetype/trigger icon
  scheme built on top of it. A piece's `ability_dsl` trigger line is fixed at authoring time —
  `CONVERT ARCHETYPE` doesn't touch it, so a converted piece keeps its original trigger forever
  while displaying a new archetype icon that implies a different one. Thematic/visual mismatch,
  not a functional bug.

### Decision

Not resolved — deferred out of this build. Open question left in `v0.5.md`: accept the
archetype/trigger-icon mismatch as flavor of temporary/permanent identity-swap cards, or make
`PieceAbility` conversion-aware so the trigger re-derives from the current (possibly converted)
archetype. `MORPH` keyword not added to the translator pending this decision.

---

## 6 new cards designed and shipped

### Context

Original ask: 2 cards each for `HASTE`/`ENCUMBER` (one self-targeting, one area-around), plus 2
for `INFLATE` (one single-target, one all-target) — 6 total, run through
`.context/workflows/card_translation_workflow.md`.

### Discussion points

- `INFLATE`'s archetype/trigger (`TRAP`/`ON DEATH`) was a confident proposal (strong
  `trapped-king.json` precedent) — accepted without back-and-forth.
- `HASTE`/`ENCUMBER`'s archetype/trigger genuinely needed user input (no natural precedent) —
  asked rather than guessed. User specified both as `NOMAD`/`ON MOVE 1` initially (Sprinting
  Nomad self-haste, Weary Nomad aoe-encumber), then for the still-open aoe-HASTE and self-ENCUMBER
  slots: confirmed a `NOMAD` aoe-HASTE piece (mirroring Good News Nomad's shape → Caravan Nomad),
  but redirected self-ENCUMBER to a new `BERSERKER` card, "Grandpa Berserker" — a deliberate
  archetype pivot away from the NOMAD-only pattern I'd been assuming, landing on the existing
  "old man" flavor thread (`Oldman Berserker`) instead.
  Takeaway: don't assume a single keyword's variants all share one archetype — confirm each
  piece's archetype individually rather than extrapolating from its siblings.
- Movement/summon_cost/ability_strength for all 6 were suggested (anchored to sibling cards per
  `summoning_cost_decision_matrix.md`) and confirmed without edits — Caravan Nomad's SC (7) landed
  exactly on Good News Nomad's, used as a sanity check.

### Decision

Shipped 6 catalog files: `nomad/sprinting-nomad.json`, `nomad/weary-nomad.json`,
`nomad/caravan-nomad.json`, `berserker/grandpa-berserker.json`, `trap/inflate-trap.json`,
`trap/inflate-colossus.json`. None wired into any `default_bags/*.txt` — catalog-only, matching
the Colossal Trap precedent, since bag inclusion wasn't specified.

Wrote `.context/v0.5.md` (changelog, mirrors `v0.3.md`/`v0.4.md` style) and
`.context/balance_audit_3.md` (fork of `balance_audit_2.md`'s table + Pending Changes Log format,
scoped to this session's cards/renames).

Verified without touching the DB: `Piece.create()` on all 6 fabricated from their JSON, confirming
trigger/effect/target params and `movement_range` resolve correctly; `python -m json.tool` on all
6 files; `tsc --noEmit` clean on the translator; a Python-side regex mirror confirming each card's
DSL line resolves to the intended Icons2 keyword label.
