# Record: Ability Icon View

## Contents
1. [Icon reservation and gap analysis](#1-icon-reservation-and-gap-analysis)
2. [Plan: architecture and chip-composition decisions](#2-plan-architecture-and-chip-composition-decisions)
3. [Implementation and verification](#3-implementation-and-verification)
4. [Visual feedback pass](#4-visual-feedback-pass)
5. [Corner layout: no-circle cost stacks, flush movement block, action_count fix](#5-corner-layout-no-circle-cost-stacks-flush-movement-block-action_count-fix)

---

## 1. Icon reservation and gap analysis

### Context
User wanted to reserve a set of lucide icons for game mechanics (triggers, effects, patterns, zones, misc) as prep for a third catalog card view — a fully iconographic rendering of a piece's ability, alongside the existing raw-DSL and translated-text views. Gave a large batch of icon assignments plus a worked example (Dragon Queen's corner layout and middle ability display) and asked for a gap analysis against the full DSL grammar before building anything.

### Discussion points
Cross-referenced the user's list against `.context/engine_dsl_reference.md`'s full grammar and the current `archetypes.ts`. Found gaps: `TURNEND` trigger, `PUT`/`MODIFY`/`CONVERT` effects, turn-duration, `SELF`/`DEFENDER` target markers, alignment colors beyond "friendly=green", the `NONE` pattern, `CANNIBAL`/`PACIFIST` role types, and comparator glyphs. User resolved all of them in the next message (Timer for TURNEND/duration, CornerRightDown for PUT, Pencil for MODIFY/CONVERT, User/House for UNIT/BUILDING, Shield for DEFENDER, SELF = no icon by convention, Dot for NONE pattern, Ghost+light-blue for Warlock) except `CANNIBAL`/`PACIFIST` (left on the placeholder) and comparator icons (deferred to build-time judgment).

### Decision
No code changes at this stage — pure discussion/gap-finding. Confirmed via a quick Node check that every proposed lucide icon name actually exists in the installed `lucide-react` package before treating any of them as available.

---

## 2. Plan: architecture and chip-composition decisions

### Context
Given the scope (new icon-mapping module, a new card component, a 3-way view-mode control replacing the existing raw/text checkbox, and a corner-layout change specific to icon mode), ran `/plan` rather than building ad hoc. User's explicit requirement — "the changes to the way the card renders should only be for this icon mode... a whole new card component might be warranted" — became the core architectural constraint: `PieceDetailCard.tsx` and `RajaAbilityText.tsx` stay completely untouched.

### Discussion points
The plan draft extrapolated two things beyond the user's single Dragon Queen example, flagged explicitly for correction: (1) an attribute→icon composition scheme reusing each `*_count` attribute's corresponding trigger-condition icon, and cost attributes (`summon_cost`, `action_cost`, `action_count`) as a concept-icon + `Gem` pair; (2) alignment colors for `ENEMY` (red, reusing the existing `raja-crimson` hex) and `ANY` (no color override) — the user had only specified friendly=green. Both were confirmed correct as drafted ("6 and 8 are right") without changes.

### Decision
Plan saved to `.context/builds/ability_icon_view_plan.md`. Key locked decisions: new `IconChip`/`IconLine`/`IconAbility` types (discriminated union — a line is either a chip sequence or fallback text, never both) living in a new `abilityTranslatorIcons.ts`; a new `PieceIconCard.tsx` component with its own corner layout (duplicating the outer frame rather than sharing an abstraction with `PieceDetailCard`, since there are only 2 consumers and a shared "card shell" would be premature); the raw/text/icons toggle becomes a 3-option `RajaRadio` instead of the existing boolean `RajaCheckbox`.

---

## 3. Implementation and verification

### Context
Built in the plan's slice order: `archetypes.ts` icon/color updates → `abilityTranslatorIcons.ts` (data tables + `translateAbilityToIcons`) → `PieceIconCard.tsx` → catalog wiring (`AbilityViewMode` type, `RajaRadio` swap, `PieceCard` branching between the two card components).

### Discussion points
- Fixed a live (not hypothetical) latent bug while touching `archetypes.ts`: `PIECE_TYPES` had no entries at all for `CANNIBAL`/`PACIFIST`, despite both role types being used by real catalog pieces (confirmed via grep) — any code path doing `PIECE_TYPES[role_type].Icon` for those pieces would have thrown on `undefined`. Added both as explicit entries on the shared `ChessPawn` placeholder, closing the crash risk while still respecting the "defer visual differentiation" decision.
- Verified `abilityTranslatorIcons.ts` with a throwaway `tsx` script (run from inside `frontend/` so the `@/` path alias resolved) against Dragon Queen, Ancient Dragon, and Black Dragon — all three produced the expected chip sequences (e.g. Dragon Queen's target line: `Handbag(green) ( Flame(red) SquareArrowDown Gem ≤ 1 )`, matching the user's own worked example exactly). Script deleted after.
- A `tsc --noEmit` run surfaced one pre-existing, unrelated error (`.next/types/validator.ts` complaining about a missing `play/page.tsx`) — confirmed via `git log --diff-filter=D` that this deletion predates the session and isn't part of any commit made during it; not caused by this work.

### Decision
Shipped per plan, no scope cuts needed. `PieceDetailCard.tsx` and `RajaAbilityText.tsx` remain byte-for-byte untouched by this build, satisfying the user's isolation requirement.

---

## 4. Visual feedback pass

### Context
User reacted to the shipped icon view ("looks reallyyy good") with five concrete refinements: render `ALL` as a pill instead of lowercase "all"; render the `99`/`-99` magic-number convention (used for MODIFY deltas) as an infinity glyph instead of the literal number; separate distinct `WHERE` criteria with an explicit "&" chip (keeping "or" for alternatives within one criterion); put the archetype icon back in the bottom-right corner (undoing the plan's decision to replace it with the movement-pattern display); and move the movement-pattern display to a new bottom-center slot, sandwiched between the bottom-left/bottom-right corners the same way the name sandwiches between the top corners — styled as an orange block with white icons/text.

### Discussion points
- The `ALL` pill: tried reusing the existing `RajaBadge` atom first, but its `neutral` tone uses the identical `bg-raja-chrome-panel` token as the card's own background — the pill would render with zero visible contrast, just floating text. Rather than fight a Tailwind class-specificity conflict by appending an overriding background via `className` (unpredictable which `bg-*` utility wins in the compiled stylesheet), built the pill directly inline with a contrasting `bg-raja-chrome-border` token.
- Infinity formatting: added a shared `formatNumber()` helper (99→'∞', -99→'-∞', else passthrough) applied everywhere a numeric chip label is generated — trigger count, MODIFY delta, MODIFY/CONVERT turns, `ATT:` comparator values, target count — not just the one MODIFY-delta case the user had visibly noticed, since the instruction ("99 / -99 -> infinity symbol") read as a general formatting rule rather than a single call-site fix.
- The "&" separator: restructured `translateFilterChips` to build each `WHERE` criterion's chips into its own array first, then join distinct criteria with an `&` chip — while the existing "or" separator for multiple values *within* one criterion (e.g. `ARCHETYPE:DRAGON|GOBLIN`) was left untouched, since that's a different kind of join (alternatives, not distinct filters).
- Corner-layout reversal (archetype back to bottom-right, movement to bottom-center): the new bottom-center block's `left-11 right-11` inset (44px) was sized to clear the bottom-left cluster's actual rendered width (a 14px icon + a 28px cost circle + gap ≈ 44px), wider than the `left-8 right-8` (32px) used for the name row up top — a judgment call since the top corners are single-icon-width narrower than the new bottom corners' icon+circle clusters.

### Decision
All five applied to `abilityTranslatorIcons.ts` (pill flag on `IconChip`, `formatNumber`, criterion-joining `&`) and `PieceIconCard.tsx` (archetype icon restored to bottom-right, movement block moved to bottom-center with `bg-raja-orange` + `text-raja-chrome-bg` for the "white" icons). Re-verified the three logic changes (pill, infinity, `&`) against Dragon Queen, Ancient Dragon, and a synthetic multi-criterion case via another throwaway `tsx` script — all matched expectations, script deleted after.

---

## 5. Corner layout: no-circle cost stacks, flush movement block, action_count fix

### Context
Two follow-ups from an in-browser screenshot (Goblin Warrior), explicitly scoped to icon mode only: (1) drop `RajaCostCircle` for the summon/action cost corners in favor of a plain icon+number vertical stack — summon cost (bottom-left) as number-above-icon, action cost (top-right) as icon-above-number, in both cases with the icon anchored at the actual card corner; (2) the bottom-center movement block had a visible grey gap below it against the border, unlike the corner icons which sat flush. Separately, the user noticed Dragon Priest's `MODIFY ACTION_COUNT +1 TURNS 1` was rendering as `Footprints + Gem + 1` — the `Gem` (cost) icon paired with a value that isn't a cost at all, just a count.

### Discussion points
- Root cause of the movement-block gap: `bottom-0.5` plus `h-7` reads as an imperceptible ~2px sliver next to a small corner icon, but the same 2px gap running the *full width* of a wide bar is much more visually obvious — fixed by switching to `bottom-0` (flush against the border) and bumping height to `h-9` for more visual weight.
- `action_count`'s `Gem` pairing was a leftover from treating it identically to `action_cost` in the original chip-composition plan (decisions 6/8, confirmed at the time without this concrete example to check against) — corrected to match the same "bare concept-icon, no `Gem`" pattern already used for the other `*_count` attributes (`kill_count`, `death_count`, etc.), since `action_count` is a quantity of extra actions, not currency being spent.
- A verification script (`frontend/scratch_test_dp.ts`) was interrupted mid-run by the user; left the fix to rest on the type-check (a one-line removal, same pattern as five already-verified sibling attributes) rather than re-attempting the script.

### Decision
`PieceIconCard.tsx`: both cost corners rebuilt as `flex-col` stacks (icon + plain `<span>` number, no `RajaCostCircle`) instead of icon-beside-circle rows; `RajaCostCircle` import removed from this file entirely (unused now). Movement block: `bottom-0.5 h-7` → `bottom-0 h-9`. `abilityTranslatorIcons.ts`: `ACTION_COUNT` entry in `ATTRIBUTE_ICON_CHIPS` changed from `[Footprints, Gem]` to `[Footprints]`. A stray scratch file left behind by the interrupted verification attempt was cleaned up.
