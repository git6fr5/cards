# Record: Piece Detail Card Redesign

## Contents
1. [Scope and shared-component discovery](#1-scope-and-shared-component-discovery)
2. [Layout spec](#2-layout-spec)
3. [Implementation](#3-implementation)
4. [Layout polish: name and movement-board centering](#4-layout-polish-name-and-movement-board-centering)

---

## 1. Scope and shared-component discovery

### Context
User asked to redesign "the cards for the pieces in the /catalog page," suspecting the component is reused elsewhere. Traced the chain: `/catalog` renders `Catalog.tsx` → `CatalogGrid.tsx` → `PieceCard.tsx` (page-local drag wrapper) → shared `app/_components/PieceDetailCard.tsx`. Confirmed `PieceDetailCard` is also used by the play room's `PieceDetailPanel.tsx` (inspect panel), so any change here is shared, not catalog-only.

### Discussion points
None — straightforward trace, confirmed via grep before proposing any change.

### Decision
Edit the shared `PieceDetailCard.tsx` directly (not the page-local `PieceCard.tsx` wrapper), since that's the actual card renderer both consumers depend on.

---

## 2. Layout spec

### Context
User gave six requirements in one message: no splash art (drop the `PieceToken` render), replace the archetype pill with a colored icon sized to match the cost circles, move action cost to the top-right corner, shrink the card to a clean small footprint, add a 3px orange border, and make the name uppercase/bold.

### Discussion points
- Dimension instruction was self-contradictory ("80px tall by 50px high") — clarified as portrait orientation. Revised mid-build to real-world units (4cm tall x 2.5cm wide via a `--width-piece-card` token), then again after the token-based width visibly failed to apply in-browser while the arbitrary-value height did — landed on 5.5cm wide x 8cm tall, both as arbitrary bracket values (`w-[5.5cm] h-[8cm]`), no token.
- Corner assignment was ambiguous — clarified as the *same* archetype icon duplicated in both top-left and bottom-right corners (not two different icons).
- Summon cost placement (unstated) was clarified as bottom-left, leaving action cost top-right, archetype icon top-left and bottom-right.
- Movement board and ability text fit at this size was flagged as a concern at the original 50x80px estimate; user opted to defer — "I'll check after" — rather than resolve sizing in this pass. The later switch to 2.5cm x 4cm (~94px x ~151px) gives meaningfully more room than the original px guess.

### Decision
Final corner layout: archetype icon (top-left), action cost circle (top-right), summon cost circle (bottom-left), archetype icon again (bottom-right, duplicate). Name centered, uppercase, bold. Card sized 2.5cm wide x 4cm tall. Movement board + ability text kept as-is in the middle, explicitly left for the user to visually reassess in-browser (no dev server available in this session per standing constraint) before any further sizing pass.

---

## 3. Implementation

### Context
Built directly on the `/build` router (frontend-only, styling-tagged): loaded `general_rules.md`, `frontend_structure.md`, `creating_frontend_components.md`, `frontend_design_base.md`, `tailwind_rules.md`, `frontend_typography.md`. Confirmed via `.shared-paths` that none of the touched files are copybara-shared.

### Discussion points
- No existing "orange" design token — added `--color-raja-orange` and a new `--width-piece-card` token to `globals.css` (`tailwind_rules.md` requires tokenizing width; color tokens follow the existing named-hue pattern rather than raw hex in a component). `--width-piece-card` was set to `50px` initially, then updated to `2.5cm` when the user corrected the dimensions mid-build.
- `RajaArchetypePill` (text pill) wasn't reusable for an icon-only corner treatment — rather than overload it, added a new shared atom `components/ui/RajaArchetypeIcon.tsx` (same `ARCHETYPES` color/Icon lookup, sized to match `RajaCostCircle`'s `h-7 w-7`). `RajaArchetypePill` itself was left untouched since it's still used by `BagTableRow.tsx`.
- `RajaCostCircle` had no `className` escape hatch (needed to absolutely-position it in a card corner) — added one, additive/optional, so the existing `BagTableRow.tsx` caller is unaffected.
- Card height isn't in `tailwind_rules.md`'s must-tokenize list (only width/max-width are), so height was left as an inline arbitrary value (`h-[4cm]`) rather than a token.

### Decision
Rewrote `PieceDetailCard.tsx`: removed the `PieceToken`/`RajaArchetypePill` render, switched the container to `relative w-piece-card h-[4cm] border-[3px] border-raja-orange`, and absolutely-positioned the four corner elements with the name/movement-board/ability text stacked in between. Verified with `tsc --noEmit` (no dev server, no DB, per standing constraints) — visual correctness (whether the middle content fits legibly) is explicitly left for the user to check in-browser.

---

## 4. Layout polish: name and movement-board centering

### Context
Two follow-up visual fixes once the user could actually see the card in-browser (final size settled at 5.5cm × 8cm per §2): the piece name needed to sit centered both horizontally and vertically within the top icon row (it was pinned to the top edge of that band), and the movement board needed to stay perfectly centered in the card regardless of whether ability text was present below it — it was visibly shifting upward whenever a piece had (non-empty) ability text, because both were flex children of the same centered column and got treated as one combined block.

### Discussion points
None on the name fix — straightforward. On the movement board: root cause was that `MovementBoard` and `RajaAbilityText` were both normal-flow children of a `flex flex-col justify-center` container, so `justify-center` centered the *combined* stack, not the board alone — the more ability text there was, the further the board itself drifted from true center.

### Decision
Name: gave the absolutely-positioned name `<p>` a fixed `h-7` (matching the corner icons' height) plus `flex items-center justify-center`, so it centers within that top band on both axes instead of just horizontally via `text-center`.

Movement board: pulled it out of the flex flow entirely into its own `absolute inset-0 flex items-center justify-center` layer (with matching `px-1 pt-7 pb-7` so it still respects the corner-icon margins) — this centers it in the full card independent of anything else. Ability text now lives in a separate `absolute inset-x-1 bottom-7` layer, anchored to the bottom and growing upward with its own content, instead of sharing a flex stack with the board. The container itself dropped its now-unused `flex flex-col items-center justify-center gap-0.5` classes since nothing is in normal flow anymore. Known follow-on risk (not yet hit): a long enough ability text block (e.g. a fallback line plus a filter line) could grow upward far enough to visually collide with the board — left for a future visual check rather than pre-solved.
