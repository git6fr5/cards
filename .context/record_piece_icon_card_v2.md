# Record: Piece Icon Card v2

## Contents
1. [New isolated icon-card view: layout rework](#1-new-isolated-icon-card-view-layout-rework)
2. [Border revert, bigger center block with action_cost × pattern × distance](#2-border-revert-bigger-center-block-with-action_cost--pattern--distance)
3. [True-center the pattern icon](#3-true-center-the-pattern-icon)
4. [King override: Crown icon in the center block](#4-king-override-crown-icon-in-the-center-block)

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
