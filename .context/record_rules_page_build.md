# Record: /rules page build

## Contents

1. [Scoping the page — /faq vs /rules mixup](#1-scoping-the-page--faq-vs-rules-mixup)
2. [Content scope — mechanics only, not the artist production brief](#2-content-scope--mechanics-only-not-the-artist-production-brief)
3. [Layout — Central Board Motif, single viewport, no interactivity](#3-layout--central-board-motif-single-viewport-no-interactivity)
4. [Building the movement diagrams as real grids](#4-building-the-movement-diagrams-as-real-grids)
5. [Revision — Overview/Movements split, animated ability sequence](#5-revision--overviewmovements-split-animated-ability-sequence)
6. [Engine-grounded rewrite — tabs, real abilities, edited copy](#6-engine-grounded-rewrite--tabs-real-abilities-edited-copy)
7. [Numbered-list pass](#7-numbered-list-pass)
8. [Real 7x7 boards, mana copy fix, overflow root cause](#8-real-7x7-boards-mana-copy-fix-overflow-root-cause)
9. [Header nav, button styling, gold/silver piece system, animated movement diagrams](#9-header-nav-button-styling-goldsilver-piece-system-animated-movement-diagrams)
10. [Abilities become a single animated board, 1s tick everywhere](#10-abilities-become-a-single-animated-board-1s-tick-everywhere)
11. [Abilities reverted to the static row](#11-abilities-reverted-to-the-static-row)

---

## 1. Scoping the page — /faq vs /rules mixup

**Context:** This was the session's original stated goal (from the very first message: "the goal of this session is to build the '/rules' page"), reached after a detour through frontend structure/typography audits and fixes. `/plan` was invoked noting "page_creation" to route through `page_creation_workflow.md`.

**Discussion points:** First `/plan` invocation named `frontend/app/(open)/faq/page.tsx` — user corrected immediately to `frontend/app/(open)/rules/page.tsx`, redone from Step 1.

**Decision:** Route is `app/(open)/rules/page.tsx`, component `Rules.tsx`.

---

## 2. Content scope — mechanics only, not the artist production brief

**Context:** `.context/how_to_play_artist_brief.md` is the only available content source — a 7-section brief mixing genuine game mechanics (§1 Overview, §2 Movements, §3 Abilities, §4 Zones, §5 Piece Roles) with artist/production-process content (§6 what a piece must visually communicate, §7 what's needed from the artist next).

**Discussion points:** Proposed that §1-5 describe stable core mechanics usable now even though specific archetypes/pieces aren't designed yet, while §6-7 are production-brief content, not player-facing rules. User confirmed, explicitly trimming to §1-5 ("trim anything that is 'for an artist'").

**Decision:** Page covers Overview, Movements, Abilities, Zones, Piece Roles only. §6 and §7 excluded entirely.

**Also flagged, not fixed:** `frontend/proxy.config.ts`'s `publicPaths` has `'rules'` without a leading slash (`'/rules'` expected) — as-is, the edge proxy won't treat the new `/rules` route as public. Left untouched since it's the user's own actively-open file and outside this build's confirmed scope; needs a one-character fix for the page to actually be reachable without auth.

---

## 3. Layout — Central Board Motif, single viewport, no interactivity

**Context:** Per `page_creation_workflow.md`, asked for a loose layout idea before proposing directions. User wanted one compact page, no tabs/dropdowns/dynamic content, everything visible at once, sections fitting together "like a puzzle" in one viewport.

**Discussion points:** Presented 4 layout directions (Modular Grid Poster, Two-Column Ledger, Central Board Motif, Compact Card Row). User picked Central Board Motif — center cell doing double duty as Overview + Movements, Zones/Roles flanking it, Abilities spanning full width below (2-row grid: `[Zones | Center | Roles]` then `[Abilities]`).

**Decision:** No page-fit height enforcement (no `h-screen`/`calc()` shell) — deliberately kept scoped to just the new `_components/` files rather than touching the shared `(open)/layout.tsx` flex structure, since Home.tsx (same route group) intentionally wants natural scrolling and forcing an exact-viewport shell there risked regressing it. Instead built Rules compact by construction (small text, tight gaps, small diagram cells) so it fits comfortably on typical viewports without scroll, accepting this isn't a pixel-exact guarantee on every screen size.

---

## 4. Building the movement diagrams as real grids

**Context:** The brief's movement examples (`SQUARE 1`, `FORWARD 1`, `CROSS 2`, `DIAGONAL 2`) are ASCII box-drawing tables in the source doc — not directly reusable as real UI.

**Decision:** Built `MovementDiagram` as a generic component (`pattern` + `distance` props) that computes a highlighted-cell grid algorithmically (Chebyshev distance for `square`, single-column for `forward`, orthogonal-only for `cross`, equal-magnitude diagonal for `diagonal`) rather than hardcoding each diagram. Center panel shows 3 representative diagrams (Square 1, Cross 2, Diagonal 2) rather than all 4 brief examples, to fit the compact layout. Grid sizing uses Tailwind's native `grid-cols-3`/`grid-cols-5` (both stock classes, no arbitrary values) since diagrams only ever need distance 1 or 2. All new components are server components — no `'use client'` anywhere, no hooks, no state; the whole page is static content.

---

## 5. Revision — Overview/Movements split, animated ability sequence

**Context:** After the first pass was built (Overview + 3 movement diagrams merged into one center panel), user asked for two changes before committing: split Overview into its own top row separate from Movements, and give the Abilities worked example ("on promotion, kill an adjacent enemy") a visual 4-state board sequence instead of just grammar text — moves → promotes → triggers → resolves.

**Discussion points:** Proposed a concrete design before touching files (per the standing hard-stop rule — no edits without an explicit trigger): a 3×3 `BoardState` component with `friendly`/`enemy`/`promoted`/`promoted-trigger`/`killed` cell kinds, reusing the same bordered-cell visual language as `MovementDiagram`, with the accent (`chrome-action`) color marking the promoted piece and a thicker accent border marking the trigger pulse — deliberately reusing the existing accent-color-as-highlight convention rather than introducing new tokens (gold/star glyphs, etc.). User confirmed by invoking `/build` directly without further adjustment.

**Decision:** `RulesCenterPanel.tsx` removed; replaced by `OverviewPanel.tsx` (full-width top row, text only) and `MovementsPanel.tsx` (the 3 diagrams alone, kept in the center grid slot). `Rules.tsx` restructured to 3 rows: Overview → `[Zones | Movements | Roles]` → Abilities. New `BoardState.tsx` renders one 3×3 snapshot + caption; `AbilitiesPanel.tsx` renders 4 of them in sequence with `→` connectors between, keeping the `TRIGGER`/`EFFECT`/`TARGET` grammar block and the resolved-sentence caption both above and below the sequence respectively. `tsc --noEmit` clean after the revision.

---

## 6. Engine-grounded rewrite — tabs, real abilities, edited copy

**Context:** User walked back the earlier "no hidden content, no tabs" constraint from Step 3 of the page-creation workflow, asking instead for: movement patterns observable by flicking through tabs; 5 real ability examples (least to most complex) also tab-switchable, each with its own board-state sequence; copy rewritten as more descriptive full sentences (brief was intentionally terse, page can go further without going overboard); the `/edit` checklist applied to all page copy; and the actual `backend/engine/` code read first so content reflects how the game really works, not just the design brief's placeholder examples.

**Discussion points:** Dispatched a research agent into `backend/engine/` before touching any files (per the standing hard-stop rule, still no edits without an explicit trigger). Findings that changed the build:
- `SQUARE` movement is actually `CROSS ∪ DIAGONAL` rays scaled by distance (queen-style), not a filled Chebyshev-distance blob. The already-shipped `MovementDiagram` component had this wrong, so fixed it in the same pass (`isCross`/`isDiagonal` helpers, `square` = union of both) rather than shipping a diagram that visually contradicts the real engine.
- `FORWARD` is a single hardcoded `(0,1)` offset with no per-player mirroring, so it doesn't actually always advance toward each player's own promotion rank. Copy was written to avoid asserting "forward always advances toward the enemy" since that's only true for one player as implemented.
- Several catalog abilities are currently non-functional: `EffectOperation.SUMMON`/`PUT` are no-ops, and `TriggerCondition.TURNEND` is never fired anywhere in the loop. Baby Dragon, Dragon Prince, and Ancient Dragon all rely on one of these broken paths, so none of the 5 chosen examples use them, to avoid publishing rules copy that promises interactions the shipped engine doesn't actually perform. The 5 picked (Goblin Warrior, Goblin Bomber, Goblin Pit, Goblin Cheerleader, Dragon King) are all fully functional today and happen to form a natural complexity ramp: single kill → periodic/self-harming kill → activation debuff with duration → AoE buff with a structural filter → off-board permanent economy effect via the King's shared-trigger mechanic.

**Decision:**
- New `TabGroup.tsx` (`'use client'`, local `useState`) is the shared tab-switcher, used by both `MovementsPanel` (4 tabs: Square/Forward/Cross/Diagonal) and `AbilitiesPanel` (5 tabs, one per ability). Overview/Zones/Roles stay static, full content visible, since the walked-back constraint was scoped to Movements and Abilities specifically.
- `BoardState.tsx`'s `CellKind` union extended (`friendly-trigger`, `building`, `building-trigger`, `stunned`, `buffed`) to cover the 5 abilities' different mechanics (a building activating, a stun landing, an AoE buff hitting multiple cells at once) beyond the original promotion-kill-only vocabulary.
- New `AbilityExample.tsx` renders one ability's full breakdown (trigger/effect/target text, the raw-style DSL block, the board sequence, the resulting sentence) and introduces a `SequenceStep` union of `'board'` (renders `BoardState`) vs `'chip'` (a small text pill) since Dragon King's last step is an off-board shelf discount that doesn't fit the 3×3 board metaphor.
- Overview, Zones, and Roles copy rewritten as fuller, more descriptive full sentences grounded in the research (uniform-random bag draws, shelf cap of 5, mana ramping by 1 per turn, the King's shared-trigger mechanic), while staying short enough for the compact layout.
- Ran the `/edit` checklist across every file in the page: no em-dashes or filler words were present to begin with, but found and split 3 compound sentences joined by "and" (rule 7, one idea per sentence) in the Overview, Cross movement description, and King role description, plus tightened one passive-ish phrase in the Dragon King ability's effect text.
- `tsc --noEmit` clean after the full rewrite.

---

## 7. Numbered-list pass

**Context:** User asked for everything that can reasonably be a numbered list to become one.

**Decision:** Converted 5 things: Zones (Bag/Shelf/Board), Roles (Unit/Building/King), the Trigger/Effect/Target block in each ability tab, each ability's board-state sequence captions (Moves → Promotes → Triggers → Resolves, etc., now prefixed 1/2/3/4), and Overview's turn structure (mana grows, then spend it) split out of prose into 2 explicit numbered steps. All use real `<ol>`/`<li>` with `list-none` and a manually rendered `font-monospace` number, rather than relying on the browser's native `::marker`, since several of these lists have `flex` layout on the `<li>` itself (list-style markers render unreliably combined with `display: flex` on the same element across browsers). Left the raw DSL block (`ON PROMOTION` / `KILL` / `ENEMY CROSS:1`) and the single-pattern movement tab descriptions alone, since neither is actually a list of separate items. `tsc --noEmit` clean.

---

## 8. Real 7x7 boards, mana copy fix, overflow root cause

**Context:** User screenshotted the actual rendered page. Two things surfaced: a real horizontal-overflow bug (Zones/Roles panels and the Abilities tab bar were clipped at the viewport edges, only the last board-state in a sequence was visible), and a mana-copy inaccuracy caught by re-reading the rendered text: the Overview said "your mana grows by one, then spend it," which conflates the engine's two separate pools (`total_mana` ramps by 1 per turn, `current_mana` then refills to that new total, so a player has their *entire* total available each turn, not just the +1). Separately, the user asked for the ability example boards to always show a real 7x7 board instead of the cropped 3x3 corner used before, and for the Goblin Pit DSL's `-99` to display as `-∞` (a frontend-only cosmetic swap, since `-99` is a "swamp any real action count" magnitude trick, not a meaningful number to a reader).

**Discussion points:** Diagnosed the overflow root cause before touching anything: `grid-cols-[1fr_2fr_1fr]` in `Rules.tsx` doesn't let columns shrink below their content's intrinsic width by default (CSS Grid's implicit `min-width: auto` on grid items), so when Movements' tab content was wide, the whole grid, and the page, got dragged wider than the viewport. The user's separate ask for full 7x7 example boards would have made this strictly worse (49 cells instead of 9), so both were fixed together rather than sequenced.

**Decision:**
- `Rules.tsx`'s 3-column grid changed to `grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]`, the standard fix that lets grid tracks actually shrink instead of forcing overflow.
- `BoardState.tsx` redesigned from a flat 9-cell array to a sparse `{ row, col, kind }[]` over a real 7x7 grid (49 cells, `grid-cols-7`, everything unlisted defaults to empty), with smaller cells (`h-5 w-5`) to stay as compact as possible. Added `king`/`king-trigger` `PieceKind`s.
- All 5 ability sequences rewritten with real board coordinates instead of an arbitrary corner: Goblin Warrior's promotion now happens on row 6, the real far rank for player 0 (`FAR_RANK = {0: 6, 1: 0}` from the engine research). Dragon King's sequence places the King at its actual documented start square `(3, 0)` reacting to a kill that happens elsewhere on the board `(2, 5)`/`(2, 6)`, visually demonstrating that the King's shared-trigger mechanic isn't proximity-based, something the old cropped view couldn't show at all.
- `AbilityExample.tsx`'s sequence row got `overflow-x-auto` plus `shrink-0` on each step as a safety-net scroll container, since 4 real 7x7 boards in a row will still be wide even after the grid fix.
- Overview's turn structure corrected to 3 explicit steps: total mana grows by 1, current mana refills to that new total, then you spend it. Exact wording for step 3 ("You spend your mana to summon or move pieces") came directly from the user.
- Goblin Pit's DSL display changed from `MODIFY ACTION_COUNT -99 TURNS 3` to `MODIFY ACTION_COUNT -∞ TURNS 3`. Display-only; no other `-99` occurrences existed in the page's copy.
- `tsc --noEmit` clean, no em-dashes/raw hex/inline styles introduced.

---

## 9. Header nav, button styling, gold/silver piece system, animated movement diagrams

**Context:** Several requests landed in quick succession, some mid-turn while a prior one was still being built: reorder the site nav to Home/Rules/FAQ/Sign In with Sign In styled as a white-on-orange pill; make all button text uppercase and bold (a shared-component change, not page-scoped); a user screenshot caught that the Goblin Bomber sequence's "Moves 1/2/3 of 3" captions weren't actually showing the piece move, plus a request for directional arrows; a follow-up screenshot asked for kings to always be present on every board and for the friend/enemy `P`/`E` letters to become a role+color system (`P` = focus piece, `A` = any other piece, `K` = king, colored gold vs silver per owner); and finally, the movement-pattern diagrams should become full 7x7 boards with the piece centered, animating through distance 1→2→3 on a 500ms tick instead of showing one fixed distance per tab.

**Discussion points:** Each of these landed as a "show snippet, don't touch files" round per the standing hard-stop rule, since none arrived with an explicit `/build`. While drafting the gold/silver snippet, caught a real design gap before writing any ability data: Goblin Warrior's "Triggers" step needs to show a piece that's simultaneously promoted (permanent bold) and pulsing (transient trigger border), which the first draft's single `status` enum couldn't represent. Fixed by switching `BoardMark`'s piece variant to independent `emphasized`/`pulse`/`dimmed` booleans before writing any of the 5 abilities' data, rather than propagating the limitation and having to redo it.

**Decision:**
- `RajaButton.tsx`: base classes' `font-medium` → `font-bold uppercase tracking-wide`. This is the shared `components/ui/` atom, so it cascades to every button site-wide (Home, PlayLanding, TokenBuilder, DesignShowcase), not just this page.
- `RajaHeader.tsx`: `NAV_LINKS` reordered to Home/Rules/FAQ/Sign In (dropped the old Rules/Sign In/Play list entirely), with a new `pill?: boolean` flag on `NavLink` so Sign In renders as `bg-raja-chrome-action` with `text-raja-chrome-bg` (the palette's palest token, standing in for "white" without introducing a raw hex or reaching into a different token domain) while the rest stay plain text links.
- `BoardState.tsx` fully redesigned: `BoardMark` is now a discriminated union of `piece` (`role: 'focus' | 'other' | 'king'`, `owner: 'gold' | 'silver'`, plus the 3 independent booleans), `arrow` (`direction`), and `killed`. Exported `BOTH_KINGS` constant (`(3,0)` gold, `(3,6)` silver, the engine's real King start squares) gets spread into every sequence step across all 5 abilities so kings are always present, not just in the Dragon King example. Piece/king colors use `raja-gold`/`raja-steel`, the same game-domain tokens the actual piece-coin rendering system uses elsewhere in the app.
- All 5 ability sequences rewritten: Goblin Warrior, Bomber, and Cheerleader's movers now actually change board position step to step (previously Bomber and Cheerleader's "Moves 1/2/3 of 3" states were bugged, showing the same coordinates 3 times), each with an `arrow` mark on the next cell in its path. Goblin Pit's building now uses the same `focus`/`other` role system as units, since the new letter scheme only has 3 letters total, no separate building glyph.
- `MovementDiagram.tsx` converted to a `'use client'` component: fixed 7x7 board, piece fixed at center `(3,3)`, `distance` is now internal `useState` cycling 1→2→3→1... every 500ms via `setInterval`. `MovementsPanel.tsx`'s `TABS` dropped the static `distance` field entirely. Since `TabGroup` only mounts the active tab's content, only one diagram animates at a time.
- `tsc --noEmit` clean, no stray references to the old `BoardPiece`/`PieceKind`/`CellKind` types, no raw hex, no em-dashes, no remaining `-99`.

---

## 10. Abilities become a single animated board, 1s tick everywhere

**Context:** User wanted the Abilities examples to stop showing every step side by side and instead animate through them like `MovementDiagram` already does, with a specific frame-splitting principle: a "Moves" step becomes 2 frames (plain position, then the same position with its arrow), and a "Resolves" step (or any step with a kill) becomes 2 frames (kill mark shown, then the board with that piece cleared). The principle had to apply uniformly across all 5 abilities without hand-authoring each one twice. Also asked for every animation on the page, including the movement diagrams, to tick every 1 second instead of the movement diagrams' existing 500ms.

**Decision:** Rather than duplicating each ability's frame data by hand, `AbilityExample.tsx` now derives the frame list generically from the existing step data via `expandFrames`: any step whose `marks` contain an `arrow` mark splits into (marks without the arrow, then marks with it); any step containing a `killed` mark splits into (marks with it, then marks with it filtered out). Steps with neither stay a single frame. This means the underlying `ABILITIES` data in `AbilitiesPanel.tsx` didn't need to change at all, the splitting is entirely a function of what's already there. `AbilityExample` became `'use client'` with its own `useState`/`useEffect` cycling `frameIndex` every 1000ms (`TICK_MS`), looping via modulo back to frame 0. The caption (`"{stepNumber}. {caption}"`) updates in lockstep since it's derived from the current frame. The old horizontal row of all steps plus `→` connectors, and the `overflow-x-auto`/`shrink-0` overflow safety net that came with it, are both gone entirely: only one board (or chip) renders at a time now, so that overflow risk no longer exists for this component. `MovementDiagram.tsx`'s `TICK_MS` changed from 500 to 1000 to match. `tsc --noEmit` clean.

---

## 11. Abilities reverted to the static row

**Context:** User reconsidered the animated-board change from section 10 ("abilities can go back to state -> state -> state") and asked to revert Abilities specifically back to the static horizontal row, while leaving `MovementDiagram` animated.

**Decision:** `AbilityExample.tsx` reverted to a plain server component (no `'use client'`, no `useState`/`useEffect`, no `expandFrames` a/b splitting): each step in `sequence` renders as its own `BoardState`/chip in a row connected by `→`, with the `overflow-x-auto`/`shrink-0` scroll safety net restored since it's a multi-board row again. `BoardState.tsx` and `AbilitiesPanel.tsx`'s ability data were untouched, since the `marks`/`BoardMark`/`BOTH_KINGS`/gold-silver system from section 9 has nothing to do with the animation mechanism itself. `tsc --noEmit` clean.
