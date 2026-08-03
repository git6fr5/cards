## Contents

1. [Piece_OnDrag scoping — hard-stop, then narrowing the ask](#piece_ondrag-scoping--hard-stop-then-narrowing-the-ask)
2. [Native drag vs @dnd-kit feasibility](#native-drag-vs-dnd-kit-feasibility)
3. [/plan: locked decisions for the migration](#plan-locked-decisions-for-the-migration)
4. [/build: execution, matched the plan exactly](#build-execution-matched-the-plan-exactly)
5. [2026-07-31: board overflow fix — tile size as a globals.css token](#2026-07-31-board-overflow-fix--tile-size-as-a-globalscss-token)

---

## Piece_OnDrag scoping — hard-stop, then narrowing the ask

### Context

Following the [[piece_component_reorg]] work (splitting the shared piece card into
`Piece_OnBoard`/`Piece_OnShelf`/`Piece_Card`), asked for a fourth variant: `Piece_OnDrag`. Global
`CLAUDE.md` enforces a hard stop — no file writes/edits outside an explicit `/build` (or "build
it"/"fix it") — so this was scoped as a plan-only response first rather than built immediately.

### Discussion points

- Investigated where a drag-preview component would actually plug in before proposing anything:
  catalog's `Catalog.tsx` already has a `@dnd-kit` `DragOverlay` rendering a bare
  `PieceMovementIcon` (not a full card); board/shelf use native HTML5 `draggable`/`dataTransfer`
  with no custom ghost at all (browser default element-snapshot).
  - Asked "what does this mean" on the resulting scoping question (catalog-only vs also
    board/shelf) — answered by explaining the two drag mechanisms concretely rather than assuming
    the shorthand landed.
- User's "just a duplicate of Piece_OnBoard for now" narrowed scope to file-creation only, but
  still no `/build` trigger was given at that point — held the stop.

### Decision

Held off building until explicit trigger. This surfaced the real follow-up question (native drag
vs `@dnd-kit` for board/shelf), addressed next.

---

## Native drag vs @dnd-kit feasibility

### Context

Asked directly: can board and shelf use `@dnd-kit` (like catalog already does)?

### Discussion points

- Confirmed technically straightforward: `@dnd-kit/core` is already a dependency, used by
  `Catalog.tsx`/`PieceCard.tsx`/`BagTable.tsx`. Board squares and shelf slots have no dependency on
  the native drag APIs that would block a swap.
- Flagged the real cost: `PlayRoom.tsx`'s `handleDropOnBoard` logic would need to move into a
  central `onDragEnd`, `BoardSquare`/`PlayerShelf` would need `useDraggable`/`useDroppable`, and a
  `DndContext` would need to wrap the render tree — a real refactor, not a drop-in.
- User chose "first 2" (create `Piece_OnDrag` + do the migration) — triggering `/plan` rather than
  `/build` directly, since this was now a multi-file structural change worth locking decisions on
  first.

### Decision

Scoped as a `/plan`-worthy feature: both the new component and the drag-system migration, bundled.

---

## /plan: locked decisions for the migration

### Context

`/plan` surveyed the actual current code (not assumed) before asking anything: catalog's `@dnd-kit`
patterns (`useDraggable`/`useDroppable`/`DragOverlay`/`snapCenterToCursor` modifier,
`BagTable.tsx`'s single-id `useDroppable`), and the play-room's native drag (`BoardSquare.tsx`
drag+drop combined, `PlayerShelf.tsx` drag-source-only, click-preview coexisting with drag on both).

### Discussion points

- Click/drag conflict: no existing `@dnd-kit` usage in this codebase combines a click handler with
  a draggable on the same element (catalog cards are drag-only). Resolved via `PointerSensor`'s
  `activationConstraint.distance`, kept as a named constant per explicit request ("make the
  activation constraint a constant I can amend easily").
- Shelf id collision, found during drafting (not asked as a question — flagged and resolved
  directly): both players' `PlayerShelf` instances render slots `S0`-`S6`; reusing that as the
  dnd-kit `id` would collide inside one shared `DndContext` (dnd-kit requires unique ids, even for
  a disabled non-owner draggable). Resolved by namespacing the *dnd-kit* id as
  `shelf-{ownerIndex}-{index}`, while the actual submitted action string stays `S{index}@{target}`
  unchanged — purely internal wiring, no behavior change, so this didn't need a re-ask.
- Confirmed narrow scope on five points by numbered plain-text answers: shelf stays
  drag-source-only (never a drop target), `isOver` visual is additive/separate from the existing
  `highlightedSquares`/`selectedSquare` system (not merged into it), ids otherwise reuse today's
  strings, `DndContext` lives in `PlayRoom.tsx`, and native drag code is fully removed with no
  fallback period.

### Decision

Plan saved to `.context/builds/board_shelf_dnd_kit_migration_plan.md` — 5 vertical slices
(`Piece_OnDrag` standalone → board migration → shelf migration → `isOver` visual → cleanup), with
slice 1 and slice 2 marked as not safely cuttable (1 is the explicit deliverable; 2 is load-bearing
for everything after it).

---

## /build: execution, matched the plan exactly

### Context

Built all 5 slices in one pass (no incremental review requested between slices). No plan
deviations surfaced during implementation.

### Discussion points

- `useDraggable` can't be called inside a raw `.map()` callback (hooks rule) — `PlayerShelf.tsx`
  needed a new `ShelfSlot` sub-component per slot to host the hook legally. `BoardSquare.tsx`
  didn't need an equivalent split since it was already its own component instantiated via JSX in
  `Board.tsx`'s `.map`, not a raw function call.
  - Confirmed the earlier "shelf-`{ownerIndex}`-`{index}`" data type used in `ShelfSlot`'s
    `useDraggable` config; the `shelfIndex` field the plan sketched in `data` turned out redundant
    once `handleDragEnd` re-derives it from the `id` via `SHELF_DRAG_ID_PATTERN` regex — dropped to
    avoid two sources of truth for the same number.
- Matched catalog's existing `DragOverlay` styling precedent (`modifiers={[snapCenterToCursor]}`)
  for the new board/shelf overlay too, for visual consistency — not an explicit ask, a direct
  extension of the one precedent in the codebase.
- `dropAnimation`'s validity-based null-out (catalog's `dropWasValidRef` pattern) wasn't ported —
  catalog knows drop validity synchronously (client-side business logic); board/shelf validity
  only resolves after the async `POST /actions/{room}` round-trip, so there's nothing synchronous
  to key the animation off. Left as dnd-kit's default animation.

### Decision

All 5 slices shipped together: `Piece_OnDrag.tsx` (new), `BoardSquare.tsx` and `PlayerShelf.tsx`
migrated to `useDraggable`/`useDroppable`, `PlayRoom.tsx` gained `DndContext`/`DragOverlay`/
`DRAG_ACTIVATION_DISTANCE` and absorbed `handleDropOnBoard` into `handleDragEnd`, `Board.tsx`/
`MainPanel.tsx` had the now-dead `onDrop` prop chain removed. Verified with `tsc --noEmit` clean
(the one remaining error, `.next/types/validator.ts` referencing a nonexistent `token-builder`
page module, is a stale generated-types artifact unrelated to this change — same class of
pre-existing noise seen during the prior reorg build).

---

## 2026-07-31: board overflow fix — tile size as a globals.css token

### Context

Screenshot of `/play/room` flagged the 7x7 board not fitting the game panel — bottom rows crowded
against the game-log tooltip bar. Root cause: `BoardSquare.tsx` sized every square with a hardcoded
`w-[4.5cm] h-[4.5cm]`, fixed regardless of viewport or panel height, while the surrounding panel
(`h-[85vh]`) scales with viewport — no tie between the two. The same `4.5cm` literal was found
duplicated across five other files (`PlayerShelf.tsx` x3 slot states, `Piece_OnDrag.tsx`,
`Piece_OnBoard.tsx`, `Piece_OnShelf.tsx`) — all needed to stay in lockstep, since the dragged-piece
ghost must visually match the board/shelf slot it drops into.

### Discussion points

- User asked, alongside the fit fix, to also make tile size a `globals.css` design token — this
  aligned directly with the project's `tailwind_rules.md` spec, which requires `width` to be
  tokenized even when a value is used only once (this one was used six times).
- Chose a single shared token (`--tile-size`) rather than a per-file value: tokenizing only
  `BoardSquare` and leaving the other five on raw `4.5cm` would have silently reintroduced a
  drag-ghost/drop-target size mismatch the moment either value changed independently.
- Sizing formula picked to keep the token itself responsive rather than just renaming the same
  fixed cm value: `clamp(2.5rem, min(6vw, 8vh), 4.5cm)` — floors at 2.5rem so pieces stay legible on
  small viewports, scales via `vw`/`vh` to fit the panel, and caps at the original `4.5cm` so it
  doesn't blow up oversized on ultra-wide monitors.
- `Piece_Card.tsx`'s `5.5cm x 8cm` (the larger catalog/sidebar card, not a board/shelf tile) was
  deliberately left untouched — out of scope, not a reported problem, and not the same value class.

### Decision

Added `--tile-size` / `--width-tile` / `--height-tile` to `globals.css`'s `@theme inline` block,
generating `w-tile`/`h-tile` utilities per the project's existing `--width-sidebar` → `w-sidebar`
convention. Swapped all six `w-[4.5cm] h-[4.5cm]` call sites to `w-tile h-tile`. Verified via
`grep` (no `4.5cm` left) and `tsc --noEmit` (clean aside from the same pre-existing stale
`.next/types` noise). Visual confirmation in-browser not done — dev server is off-limits per global
`CLAUDE.md`.
