# Record: Piece Icon Card v2

## Contents
1. [New isolated icon-card view: layout rework](#1-new-isolated-icon-card-view-layout-rework)
2. [Border revert, bigger center block with action_cost × pattern × distance](#2-border-revert-bigger-center-block-with-action_cost--pattern--distance)
3. [True-center the pattern icon](#3-true-center-the-pattern-icon)
4. [King override: Crown icon in the center block](#4-king-override-crown-icon-in-the-center-block)
5. [Bump center icon sizes](#5-bump-center-icon-sizes)
6. [Repeat mps icons by action_count, drop movement_distance](#6-repeat-mps-icons-by-action_count-drop-movement_distance)
7. [Two-row center block, smaller name text](#7-two-row-center-block-smaller-name-text)
8. [Strip archetype word from displayed name](#8-strip-archetype-word-from-displayed-name)
9. [mps icon in archetype color](#9-mps-icon-in-archetype-color)
10. [Merge trigger count/filters under the trigger icon](#10-merge-trigger-countfilters-under-the-trigger-icon)
11. [Summon cost to top-right, drop bottom corners](#11-summon-cost-to-top-right-drop-bottom-corners)

---

## 1. New isolated icon-card view: layout rework

### Context
User wanted a second, alternative iconographic card view for `/catalog`, building on the ideas in
the existing `PieceIconCard.tsx` (see [[record_ability_icon_view]]) but reworking the corner/center
layout around two rules established in the recent archetype rework
([[record_dragon_archetype_rework]]): archetype implies trigger, and `action_cost` implies movement
distance. Both rules mean information the old card renders explicitly (trigger icon inside the
ability line, a standalone action-cost corner) is now redundant and can be dropped or repurposed.
Explicit requirement: build as a new component (`PieceIconCard2`) with its own local subcomponents,
so it can be edited freely without touching or risking the existing `PieceIconCard`.

### Discussion points
- Whether "movement in the center" meant the full 7×7 `MovementBoard` grid (as used by
  `PieceDetailCard`) or the old card's compact one-row indicator — user confirmed the compact
  one-row style, and further simplified it by dropping the `Footprints` icon prefix ("implied").
- Whether to wire the new card into the catalog's `abilityViewMode` toggle immediately or leave it
  standalone for review first — user confirmed wiring it in now, as a 4th toggle option.
- Rare case: a trigger DSL line carrying a `WHERE` filter (e.g. `ON KILL 3 WHERE ...`). Old card
  rendered the filter chips inline next to the trigger icon; new card has no room for that next to
  a bare archetype icon. User decided: filter chips stack vertically downward from the top-right
  corner (the same corner holding the trigger count number), rather than being dropped or moved
  elsewhere.

### Decision
Built `frontend/app/_components/PieceIconCard2.tsx` as a fully self-contained component (own local
`Chip`/`ChipRow`, own trigger-corner parsing) — no edits to `PieceIconCard.tsx` or
`abilityTranslatorIcons.ts`. Reuses `translateAbilityToIcons` (read-only) for effect/target chip
rows and to source the trigger line's already-computed chip shape (`[icon, count?, '(',
...filterChips, ')'?]`), rather than re-parsing the DSL grammar a second time — a
`splitTriggerCorner` helper reads that shape to pull out the count and filter chips separately.

Layout, 4.5cm square card, 3px border now colored via `ARCHETYPES[archetype].color` (inline
`style`, matching the existing per-piece dynamic-color precedent already used by
`RajaArchetypeIcon`'s `color` prop) instead of the old fixed `border-raja-orange`:
- Top-left: archetype icon only (doubles as the trigger icon, always rendered since archetype
  exists independent of ability).
- Top-right: trigger count number (blank if implied-1, `ON ACTIVATE`, or no ability), with any rare
  `WHERE`-filter chips stacked vertically below it.
- Bottom-left: summon-cost icon (`SquareArrowDown`, unchanged from the old card's convention).
- Bottom-right: summon-cost number.
- Removed entirely vs the old card: the action-cost corner, and the duplicate bottom-right
  archetype icon.
- Center: compact movement indicator — pattern icon + distance number, no `Footprints` prefix.
- Bottom orange block: effect + target chip rows only (trigger row dropped — implied by the
  top-left corner already).

Wired in as a 4th `abilityViewMode` value, `'icons2'` (label "Icons v2"):
`frontend/app/(protected)/catalog/types.ts` (type union),
`frontend/app/(protected)/catalog/_components/CatalogFilters.tsx` (radio option),
`frontend/app/(protected)/catalog/_components/PieceCard.tsx` (render branch).

Verified: `tsc --noEmit` clean on all touched/new files (one pre-existing unrelated `.next` cache
error on `(protected)/play/page.js` ignored, same as prior sessions). No dev server started, no DB
access — respects both standing bans.

---

## 2. Border revert, bigger center block with action_cost × pattern × distance

### Context
Follow-up feedback on `PieceIconCard2` only (no other file touched) after seeing the first pass:
the archetype-colored border read worse than expected, and the center movement indicator was both
too small and missing `action_cost` — despite `action_cost` implying movement distance (the house
rule from the archetype rework), the user still wanted it visible here, composed together with the
pattern and distance as a single readable unit.

### Discussion points
- Open question from the first pass (glyph vs lucide icon for a multiply symbol) — resolved: lucide.
  User extended this to a general preference for the component: prefer lucide icons over literal
  unicode glyph characters for anything rendered directly by `PieceIconCard2`'s own code (as
  opposed to text labels it passes through unmodified from the shared `abilityTranslatorIcons`
  chip data, which is out of scope here per the component's isolation goal).

### Decision
In `frontend/app/_components/PieceIconCard2.tsx` only:
- Border: reverted to fixed `border-raja-orange`, dropped the archetype-color inline `style` prop
  entirely (archetype color stays on the top-left corner icon fill only, via lucide's `color` prop
  — not a Tailwind class, same precedent as `RajaArchetypeIcon`).
- Center block: now four tokens in a row — `{action_cost}` `×` (lucide `X` icon, `size=16`)
  `{PatternIcon}` (lucide, `size=28`, the visually largest/anchor element) `{movement_distance}` —
  sized up overall (`text-sm` labels, `size=28` pattern icon) from the original single-pair
  `size=14`/`text-xs` indicator.

Verified: `tsc --noEmit` clean (same pre-existing unrelated `.next` error on
`(protected)/play/page.js` ignored). No dev server started, no DB access.

---

## 3. True-center the pattern icon

### Context
User flagged, from a screenshot, that the pattern icon (e.g. the castle on Reaper Demon) wasn't
sitting at the card's true horizontal center.

### Discussion points
None — root cause was clear from the layout code: the center row was a plain `flex justify-center`
over 4 unequal children (`action_cost`, `×` on the icon's left; `distance` alone on its right) — the
*group* centered on the card, but the heavier left side pushed the icon itself off-center within
that group. Reported as root cause + fix, held per the hard-stop rule until `/build`.

### Decision
Swapped the center row's `flex` to a 3-column grid (`grid-cols-[1fr_auto_1fr]`) in
`frontend/app/_components/PieceIconCard2.tsx`: middle column holds only the pattern icon (grid
always centers a fixed middle column independently of the outer columns' content), left column
holds `action_cost` + the `×` icon right-aligned, right column holds `distance` left-aligned. The
icon now lands on the card's actual center regardless of flanking content width.

Verified: `tsc --noEmit` clean (same pre-existing unrelated `.next` error ignored). No dev server
started, no DB access.

---

## 4. King override: Crown icon in the center block

### Context
Kings still carry a real `movement_type` (e.g. `SQUARE 1`), so the center block's pattern icon was
rendering a chess-queen-shaped icon for King pieces too — same icon `PATTERN_ICONS.SQUARE` uses for
every other square-mover. User wanted Kings visually distinct here: the existing King-role icon
(`Crown`, already `PIECE_TYPES.KING.Icon` in `archetypes.ts`) instead, and a bit bigger than the
regular pattern icon.

### Discussion points
None — single unambiguous swap. Per the standing `/quick-edit` exception, a snippet was shown and
confirmed before applying (condition: single file, snippet already presented).

### Decision
In `frontend/app/_components/PieceIconCard2.tsx`: added `isKing = piece.role_type ===
KING_ROLE_TYPE` (imported from the local `./types` re-export, same source `CatalogGrid.tsx` uses).
Center block's grid middle column now renders `Crown` (`size={36}`, imported directly from
`lucide-react` rather than through `PIECE_TYPES`, since only the icon itself was needed) when
`isKing`, else the existing `PatternIcon` (`size={28}`) — flanking `action_cost ×` / `distance`
unchanged.

Verified: `tsc --noEmit` clean (same pre-existing unrelated `.next` error ignored). No dev server
started, no DB access.

---

## 5. Bump center icon sizes

### Context
Follow-up sizing pass: bump every movement-pattern icon in the center block up to the size the
Crown icon was already at, then bump Crown a little further past that, keeping the King/non-King
size gap the sizes had before.

### Discussion points
None — direct sizing request via `/build`.

### Decision
In `frontend/app/_components/PieceIconCard2.tsx`'s center block: `PatternIcon` `size` `28` → `36`
(matches the old Crown size), `Crown` `size` `36` → `44`.

Verified: `tsc --noEmit` clean (same pre-existing unrelated `.next` error ignored). No dev server
started, no DB access.

---

## 6. Repeat mps icons by action_count, drop movement_distance

### Context
Further rework of the center block's content, not just its sizing: instead of a single
movement-pattern icon flanked by `action_cost ×` on one side and `movement_distance` on the other,
show the movement-pattern icon ("mps") repeated `action_count` times, each repetition scaled down
as a set, followed by `action_cost` alone as a trailing number.

### Discussion points
- Whether `movement_distance` disappearing from this row was intentional — confirmed yes:
  `movement_distance = action_cost` is a standing game rule (established back in the archetype
  rework, [[record_dragon_archetype_rework]] part 1), so displaying both was redundant; dropping
  `movement_distance` here loses no information a player couldn't already read off `action_cost`.
- Whether King repeats too (King's `action_count` is always 1 in practice per game rules, but
  should the code special-case it anyway) — confirmed no special-case: same repeat-by-`action_count`
  logic applies uniformly, using `Crown` as its "mps" and its own base size, purely so the render
  path stays consistent rather than King being a silent exception that only differs by accident of
  current data.
- Scale rule, precisely: **not** a per-icon shrink (each subsequent icon isn't smaller than the
  last) — the whole set shares one scale factor, chosen by the total count: 1 icon → scale 1, 2
  icons → scale 0.8 (both), 3 icons → scale 0.6 (all three). Confirmed as a linear
  `1 − 0.2×(N−1)` rule, floored at `0.2` for larger `N` (no upper bound on `N` given, since
  `action_count` this high doesn't occur under current game rules, but the floor keeps it
  non-degenerate if it ever does).
- Units clarified: lucide's `size` prop is plain pixels — the same unit every icon size in this
  component has used throughout.

### Decision
In `frontend/app/_components/PieceIconCard2.tsx`: dropped the `X` (multiply) icon import and the
`action_cost ×` / `movement_distance` display entirely. Added `MpsIcon` (`Crown` for Kings, else
`PatternIcon`), `mpsCount = max(action_count, 1)`, `mpsScale = max(1 − 0.2×(mpsCount−1), 0.2)`, and
`mpsSize = round(baseSize × mpsScale)` where `baseSize` is `44` for Kings / `36` otherwise (the
sizes section 5 had just set). Center block now renders `mpsCount` copies of `MpsIcon` at
`mpsSize` in a plain centered flex row, followed by `piece.attributes.action_cost` as a trailing
number — the earlier 3-column true-center grid (section 3) is no longer needed now that there's no
lone icon to center against asymmetric flanking content.

Verified: `tsc --noEmit` clean (same pre-existing unrelated `.next` error ignored). No dev server
started, no DB access.

---

## 7. Two-row center block, smaller name text; catalog sub-order by action_count

### Context
Two small follow-ups landed in the same `/build`: split the center block's single row (icons then
trailing number) into two stacked rows — `action_cost` on top, the mps icon row centered below it —
and shrink the name label slightly. Alongside that, a `CatalogGrid.tsx` ordering gap from section
2's chess-rank sort: pieces sharing both King/movement-pattern rank and `summon_cost` had no
`action_count`-aware tiebreak.

### Discussion points
None — both were direct, unambiguous asks, reported as plan-only until `/build` per the standing
hard-stop rule (no edits fired on the interjected mid-turn ordering note either, until confirmed).

### Decision
`frontend/app/_components/PieceIconCard2.tsx`: center block's flex row became `flex-col` — top row
`action_cost` (`text-sm`, unchanged styling), bottom row the existing `mpsCount`-copies-of-`MpsIcon`
row. Name `<p>` font size `text-sm` → `text-xs`.

`frontend/app/(protected)/catalog/_components/CatalogGrid.tsx`: per-group sort comparator gained an
`action_count` tiebreak between `pieceOrderRank` and `summon_cost` — within a King/movement-pattern
tier, lower `action_count` now sorts first.

Verified: `tsc --noEmit` clean on both files (same pre-existing unrelated `.next` error ignored). No
dev server started, no DB access.

---

## 8. Strip archetype word from displayed name

### Context
Most piece names embed their archetype word somewhere (prefix or suffix — "Berserker King",
"Reaper Demon", "Royal Berserker"), which reads as redundant now that the top-left corner already
shows the archetype icon. User wanted the archetype word stripped from the on-card name, regardless
of which side of the name it sits on: "Berserker King" → "King".

### Discussion points
User's first phrasing of the example was inverted ("Berserker King" → "Berserker") and immediately
self-corrected via an interrupted/redone message to the intended direction ("Berserker King" →
"King", i.e. strip the archetype word, keep the rest) — built against the corrected example.

### Decision
In `frontend/app/_components/PieceIconCard2.tsx`: added `displayName(piece, archetypeName)` — a
word-boundary, case-insensitive regex removes the archetype's display name
(`ARCHETYPES[archetype].name`) from `piece.name` wherever it appears, collapses/trims the
remaining whitespace, and falls back to the full original name if stripping would leave an empty
string. Name `<p>` now renders `displayName(piece, archetype.name)` instead of `piece.name`.

Verified: `tsc --noEmit` clean (same pre-existing unrelated `.next` error ignored). No dev server
started, no DB access.

---

## 9. mps icon in archetype color

### Context
The mps icon row (section 6) was still plain `text-raja-chrome-text`, matching every other icon on
the card. User wanted it recolored to the piece's archetype color, same as the top-left corner icon
already is.

### Discussion points
None — single-line swap, confirmed via `/quick-edit`'s snippet-first fallback (snippet shown, then
`/build`).

### Decision
In `frontend/app/_components/PieceIconCard2.tsx`: `MpsIcon`'s `className="text-raja-chrome-text"`
→ `color={archetype.color}` (same lucide `color`-prop pattern the top-left corner icon already
uses) — applies to both the movement-pattern icon and King's `Crown`, since both render through the
shared `MpsIcon` variable.

Verified: `tsc --noEmit` clean (same pre-existing unrelated `.next` error ignored). No dev server
started, no DB access.

---

## 10. Merge trigger count/filters under the trigger icon

### Context
Trigger count and any rare `WHERE`-filter chips were living in their own top-right corner, visually
disconnected from the archetype icon (top-left) that they actually describe — the trigger icon and
its count/filters read as two unrelated pieces of info. User wanted them merged into one vertical
stack under the trigger icon itself.

### Discussion points
Initial phrasing read ambiguous (kept saying "top right" while also asking for it to move) —
resolved as: relocate the existing top-right vertical-stack layout to sit under the icon in the
top-left corner, leaving top-right empty.

### Decision
In `frontend/app/_components/PieceIconCard2.tsx`: collapsed the separate top-left (`archetype.Icon`
only) and top-right (`triggerCount` + `filterChips`) corner blocks into a single top-left
`flex-col` stack — icon, then count, then filter chips, all vertically centered in one corner. The
top-right corner is now unused.

Verified: `tsc --noEmit` clean (same pre-existing unrelated `.next` error ignored). No dev server
started, no DB access.

---

## 11. Summon cost to top-right, drop bottom corners

### Context
With top-right freed up by section 10's merge, user wanted `summon_cost` moved there from
bottom-right, and the bottom-left `SquareArrowDown` summon-cost icon dropped entirely rather than
moved — leaving both bottom corners empty.

### Discussion points
None — direct, unambiguous relocation/removal.

### Decision
In `frontend/app/_components/PieceIconCard2.tsx`: removed the bottom-left `SquareArrowDown` block
and its now-unused import; removed the bottom-right `summon_cost` block and re-added it as a new
top-right block (same `flex h-7 w-7 items-center justify-center` styling, just repositioned).

Verified: `tsc --noEmit` clean (same pre-existing unrelated `.next` error ignored). No dev server
started, no DB access.
