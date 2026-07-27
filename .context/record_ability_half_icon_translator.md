# Record: Ability Half-Icon Translator

## Contents
1. [Selective icon/raw-DSL hybrid for the effect/target lines](#1-selective-iconraw-dsl-hybrid-for-the-effecttarget-lines)
2. [Zone "From X" wording, filter back to human-readable](#2-zone-from-x-wording-filter-back-to-human-readable)
3. [MODIFY keyword pills, drop redundant BOARD label](#3-modify-keyword-pills-drop-redundant-board-label)
4. [Alignment-colored zone pills and pattern icon](#4-alignment-colored-zone-pills-and-pattern-icon)
5. [Split "From" out of the pill, filter moves to a corner as icons](#5-split-from-out-of-the-pill-filter-moves-to-a-corner-as-icons)

---

## 1. Selective icon/raw-DSL hybrid for the effect/target lines

### Context
The bottom orange ability block on `PieceIconCard2` (see [[record_piece_icon_card_v2]]) used the
full-icon translator (`abilityTranslatorIcons.ts`) for its effect/target rows. User's read after
looking at it again: icons are great for space and glance-value, but an all-icon line gets hard to
parse once too many concepts stack up — wanted to selectively choose, per DSL construct, which stay
icons and which fall back to non-icon text. Walked the full inventory of every icon conversion
currently made (33 distinct mappings, enumerated on request) and marked each yes/no.

### Discussion points
- First pass built the "no" cases as full human-readable prose, reusing
  `abilityTranslator.ts`'s `translateEffect()`/`translateFilterSentence()` (adding `export` to
  four previously-internal pieces to do so). Immediately corrected: the non-icon portions should
  be the **raw DSL tokens**, not translated prose — reverted the new exports (unused once the
  design changed) and rewrote the translator to emit uppercase raw tokens instead.
- Target line's zone text for `SHELF`/`BAG` keeps the existing numeric/`ALL`-pill count chip
  alongside the raw zone token (unchanged from the full-icon version) — the spec's "no" only
  covered the *zone icon* itself, not count display, which was never on the list of items to
  change. `BOARD`'s raw zone keyword (`"BOARD"`) drops the `PATTERN:...` segment from its own text
  entirely, since that portion is already the icon + distance number right after it — showing it
  twice would be redundant.

### Decision
New `frontend/utils/abilityHalfIconTranslator.ts`, exporting `translateAbilityHalfIcon(dsl):
HalfIconAbility | null` (`{ effect: IconLine; target: IconLine }`, same `IconLine`/`IconChip` shape
`abilityTranslatorIcons.ts` uses, imported as a type — zero rendering changes needed downstream,
`PieceIconCard2`'s existing `Chip`/`ChipRow` render it unchanged). Self-contained — no dependency
on `abilityTranslator.ts`. Per-construct rules, from the numbered inventory:
- Effect `KILL`/`SUMMON <alignment>` — icon only, unchanged from the full-icon translator.
- Effect `PUT`/`MODIFY`/`CONVERT` — lead icon (`CornerRightDown`/`Pencil`/`Pencil`) + the raw
  tokens after the keyword, uppercase, space-joined (e.g. `MODIFY HEALTH -3 TURNS 2` → icon +
  `"HEALTH -3 TURNS 2"`).
- Target `SELF`/`DEFENDER` — unchanged (no icon / `Shield`).
- Target zone `SHELF`/`BAG` — raw zone token as text (e.g. `"SHELF"`, `"BAG:SEE"`) + existing
  numeric/`ALL` count chip.
- Target zone `BOARD` — raw `"BOARD"` keyword as text, followed by the pattern icon + raw distance
  number, unchanged from the full-icon translator + count chip.
- Target `WHERE` filter — raw filter tokens joined as-is (e.g. `"WHERE ATT:SUMMON_COST<=2"`),
  appended as a trailing text chip.

`frontend/app/_components/PieceIconCard2.tsx`: bottom orange block's `ability` now sourced from
`translateAbilityHalfIcon(piece.ability)` instead of `translateAbilityToIcons(...)`. Trigger corner
untouched — still reads `translateAbilityToIcons(...).trigger` via the existing
`triggerChips`/`splitTriggerCorner` helpers, since triggers were confirmed fine as full-icon
("denoted by archetype" already).

Verified: `tsc --noEmit` clean across both touched/new files (same pre-existing unrelated `.next`
error on `(protected)/play/page.js` ignored). No dev server started, no DB access.

---

## 2. Zone "From X" wording, filter back to human-readable

### Context
Two refinements on top of section 1's raw-token design: the raw `BAG:SEE:0` zone token read too
cryptically as pure raw text (dropping the `SEE`/depth segment is fine, but the bare keyword alone
lost the "this is a source/pool" sense a reader gets from "From your bag" in the full prose
version) — wanted a `"From "` prefix kept on the zone keyword. Separately, decided the target
line's `WHERE` filter specifically should go back to human-readable prose rather than raw tokens —
unlike the zone/effect raw-token choices, a filter clause like `ATT:SUMMON_COST<=2` reads
meaningfully worse as raw tokens than as words, since it's a full boolean condition rather than a
single keyword.

### Discussion points
None — two direct, scoped tweaks.

### Decision
In `frontend/utils/abilityHalfIconTranslator.ts`: zone text for `SHELF`/`BAG` now `"From
${zoneSegments[0]}"` (`"From SHELF"`, `"From BAG"` — drops the `:SEE:0` segment same as before, just
adds the prefix). `BOARD`'s zone text unchanged (still bare `"BOARD"`, no `"From"` — matches the
original human translator's own convention of never using "from" for the board). Target's `WHERE`
filter switched from raw joined tokens back to `translateFilterSentence()`'s human sentence
(`"Where the piece has summon cost less than or equal to 2"`-style), which required re-adding
`export` to that one function in `abilityTranslator.ts` (reverting the revert from section 1) —
everything else (effect `PUT`/`MODIFY`/`CONVERT`, zone keyword, count, pattern+distance icon) stays
raw/icon, untouched.

Verified: `tsc --noEmit` clean on both files (same pre-existing unrelated `.next` error ignored). No
dev server started, no DB access.

---

## 3. MODIFY keyword pills, drop redundant BOARD label

### Context
Two more scoped additions: three specific `MODIFY ACTION_COUNT ... TURNS 1` patterns are
recognizable game-status keywords (extra-action buff, skip-turn debuff, minus-one-action debuff),
so the raw-token text for those three exact lines should render as a named pill instead — same
pill styling `ALL` already uses. Separately, the target `BOARD:PATTERN:...` zone's leading `"BOARD"`
text chip is redundant once the pattern icon sits right next to it — pattern implies board, so drop
the label.

### Discussion points
None — direct, unambiguous.

### Decision
In `frontend/utils/abilityHalfIconTranslator.ts`: added `MODIFY_KEYWORDS`, a lookup from the exact
raw remaining-tokens string to a keyword — `"ACTION_COUNT +1 TURNS 1"` → `AMP`,
`"ACTION_COUNT -99 TURNS 1"` → `STUN`, `"ACTION_COUNT -1 TURNS 1"` → `SLOW`. `MODIFY`'s case split
out from the shared `PUT`/`CONVERT` branch: keeps the `Pencil` icon regardless, but renders a pill
chip (`{ label: keyword, pill: true }`) when the line matches one of the three, else the same raw
joined-token text as before. (Positive-delta key corrected from a bare `1` to `+1` after the DSL's
actual grammar was double-checked; pill-label wording briefly considered dropping the `Pencil` icon
and going pill-only, reverted — `Pencil` + pill reads better; `ADRENALINE` renamed to `AMP`.)
Target zone `BOARD` branch no longer pushes a `"BOARD"` label chip —
just the pattern icon + distance number.

Verified: `tsc --noEmit` clean (same pre-existing unrelated `.next` error ignored). No dev server
started, no DB access.

---

## 4. Alignment-colored zone pills and pattern icon

### Context
Target zone text (`"From SHELF"`/`"From BAG"`) and the `BOARD` pattern icon were plain, uncolored.
User wanted both to carry alignment meaning visually — zone text as pills (matching the `MODIFY`
keyword/`ALL` pill style), colored green/red/grey for friendly/enemy/any; pattern icon colored
green/red/black for the same three.

### Discussion points
None — but implementation surfaced that `PieceIconCard2.tsx`'s `Chip` subcomponent's pill branch
never actually read `chip.color` at all (only the non-pill icon branch did), so pills had no way to
be colored before this. Also: rather than adding a new grey/black color constant, reused the
file's existing `ALIGNMENT_COLORS` map as-is — its `ANY: undefined` entry already falls back to
the card's default text color, which functions as "grey" on a pill and "black" on an icon without
needing two separate hardcoded values for what's the same underlying "no override" case.

### Decision
`frontend/utils/abilityHalfIconTranslator.ts`: `translateTargetHalfIcon` now resolves
`alignmentColor = ALIGNMENT_COLORS[alignmentToken]` once and applies it — `SHELF`/`BAG`'s zone
label chips gained `pill: true` and `color: alignmentColor`; `BOARD`'s pattern icon chip gained
`color: alignmentColor`.

`frontend/app/_components/PieceIconCard2.tsx`: `Chip`'s pill branch now applies `chip.color` via
inline `style` (`text-raja-chrome-text` class stays as the fallback for colorless pills like
`AMP`/`STUN`/`SLOW`/`ALL`, which are unaffected since they never set `color`).

Verified: `tsc --noEmit` clean on both files (same pre-existing unrelated `.next` error ignored).
No dev server started, no DB access.

---

## 5. Split "From" out of the pill, filter moves to a corner as icons

### Context
Two follow-ups: the `"From BAG"`/`"From SHELF"` pill (section 4) had the whole phrase inside the
pill — user wanted only the zone keyword (`BAG`/`SHELF`) pilled, `"From"` as plain text alongside
it. Separately, the target `WHERE` filter's human-readable sentence (re-added in section 2) was
overflowing the card in testing (see screenshot in conversation) — user decided filters should go
back to pure icon symbols entirely, and move out of the bottom orange block into their own spot: a
dedicated corner, stacked vertically upward.

### Discussion points
None — two direct, unambiguous asks in one message.

### Decision
`frontend/utils/abilityHalfIconTranslator.ts`: zone chips for `SHELF`/`BAG` now push two separate
chips — `{ label: 'From' }` (plain) then `{ label: zoneSegments[0], pill: true, color:
alignmentColor }` (pilled). `translateTargetHalfIcon` no longer touches filters at all — dropped
its `translateFilterSentence()` call and the now-dead `filterParts` destructure entirely; reverted
`export` on `translateFilterSentence` in `abilityTranslator.ts` (unused again, third flip on this
one function across the session — human-readable clearly isn't the right fit for this spot).

Filter rendering moved to `frontend/app/_components/PieceIconCard2.tsx` instead, as pure icon
chips, mirroring the trigger corner's existing pattern: a new `targetFilterChips(ability)` reads
the *full-icon* translator's already-computed `translateAbilityToIcons(ability).target` chips
(unchanged, never edited) and slices out whatever sits between the `'('`/`')'` sentinel chips —
same extraction shape `splitTriggerCorner` already used for the trigger corner, just applied to
target instead of trigger. Rendered in a new bottom-right corner, `flex-col-reverse` so chips stack
upward from the bottom edge instead of downward.

Verified: `tsc --noEmit` clean on both files (same pre-existing unrelated `.next` error ignored).
No dev server started, no DB access.
