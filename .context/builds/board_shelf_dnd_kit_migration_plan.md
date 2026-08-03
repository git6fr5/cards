---
name: Plan — Piece_OnDrag + board/shelf drag migration to @dnd-kit
description: New Piece_OnDrag component; migrate board-square and shelf-slot drag from native HTML5 drag to @dnd-kit, matching the pattern already used in Catalog.tsx
type: plan
---

## Scope

**In:** `Piece_OnDrag` component (duplicate of `Piece_OnBoard`, unwired render logic — just a
distinct name/identity to build on later). Migrate board-square and shelf-slot drag from native
HTML5 `draggable`/`dataTransfer` to `@dnd-kit/core`, reusing the `DndContext`/`useDraggable`/
`useDroppable`/`DragOverlay` pattern already proven in `Catalog.tsx`. `DragOverlay` renders
`Piece_OnDrag`. New `isOver`-driven visual on board squares, additive to the existing click-preview
highlight system. Full removal of the native drag code paths (no dual-support).

**Out (deferred):** Shelf as a drop target (returning a piece board→shelf). Any visual
differentiation *inside* `Piece_OnDrag` itself (it stays a byte-for-byte duplicate of
`Piece_OnBoard` this pass). Extending `@dnd-kit` to the opponent's shelf (already non-draggable,
stays that way).

**First-class:** Click-to-preview (`handleSelectSquare`, shelf-click preview) must keep working
unchanged on elements that are now also `useDraggable` — enforced via `PointerSensor`'s
`activationConstraint`, not by removing click handlers.

**Migration impact:** None — no ORM/backend changes. The wire-level action grammar
(`S{index}@{target}`, `{source}@{target}`, `EOT`) is untouched; this only changes how the client
detects a drag gesture and where the drop-handling logic lives.

**Build order:** frontend-only, single-page area (`play/room`), one vertical slice at a time (see
Slice sequence).

## Decisions (locked)

1. Plan covers both `Piece_OnDrag` creation and the full board+shelf `@dnd-kit` migration, wired
   together (`DragOverlay` uses `Piece_OnDrag`).
2. Click/drag conflict resolved via `PointerSensor` `activationConstraint: { distance:
   DRAG_ACTIVATION_DISTANCE }` — `DRAG_ACTIVATION_DISTANCE` is a named constant (not inlined) so
   it's a one-line tune. Below that pointer-movement threshold, the gesture resolves as a click; at
   or above it, as a drag. Preserves today's click-preview behavior exactly.
3. `DndContext` lives in `PlayRoom.tsx` (owns action-submission state already), wrapping the full
   render tree — same shape as `Catalog.tsx` owning its own `DndContext`.
4. Shelf slots are `useDraggable` only, never `useDroppable` — matches current behavior (shelf has
   never been a drop target). Board squares are both.
5. New `isOver`-based visual is additive and separate from `highlightedSquares`/`selectedSquare` —
   a distinct overlay class layered on `BoardSquare`, not merged into the existing preview-highlight
   logic. Existing system untouched.
6. IDs: board squares keep their natural id = the square string (`"A0"`) for both `useDraggable`
   and `useDroppable` — globally unique already (one shared board). **Shelf slots need a
   namespaced dnd-kit id, `shelf-{ownerIndex}-{index}`** (e.g. `shelf-0-3`) rather than bare
   `S{index}` — both players' `PlayerShelf` instances render slots `S0`-`S6`, and reusing bare
   `S{index}` as the *dnd-kit* id would collide across the two shelves inside one shared
   `DndContext` (dnd-kit requires unique ids per context, even for a disabled/non-owner
   draggable). This is purely an internal wiring detail: `onDragEnd` still parses out the shelf
   index and still submits the exact same `S{index}@{target}` action string as today — no behavior
   change.
7. Native `draggable`/`onDragStart`/`onDragOver`/`onDrop`/`dataTransfer` code fully removed from
   `BoardSquare.tsx` and `PlayerShelf.tsx` once migrated — no fallback period. `onDrop` prop
   threading (`PlayRoom` → `MainPanel` → `Board` → `BoardSquare`) is deleted entirely; drop
   handling centralizes in `PlayRoom`'s single `onDragEnd`.

## Backend structure

None — frontend-only change.

## Route inventory

N/A — no backend routes touched.

## Frontend

```
frontend/app/_components/Piece/
  Piece_OnDrag.tsx                        [new] duplicate of Piece_OnBoard.tsx, renamed identifiers only

frontend/app/(protected)/play/room/
  PlayRoom.tsx                            [edit] add DndContext + sensors, DRAG_ACTIVATION_DISTANCE const,
                                                  activeDragPiece/activeDragSource state, handleDragStart/
                                                  handleDragEnd (absorbs handleDropOnBoard's logic), DragOverlay
                                                  rendering Piece_OnDrag; delete onDrop prop threading
  _components/MainPanel.tsx               [edit] drop onDrop prop (now handled via DndContext at PlayRoom)
  _components/PlayerPanel.tsx             [edit] drop onSelectShelf's drag-adjacent plumbing if now unused
                                                  (kept if still used for click-preview)
  _components/PlayerShelf.tsx             [edit] useDraggable({id:`shelf-${ownerIndex}-${i}`, disabled: !canDrag,
                                                  data:{piece: fullPiece, source:'shelf', shelfIndex:i}}) replacing
                                                  native draggable/onDragStart; remove dataTransfer code

frontend/app/_components/
  Board.tsx                               [edit] drop onDrop prop (BoardSquare becomes self-sufficient droppable)
  BoardSquare.tsx                         [edit] useDraggable({id:square, disabled:!canDrag, data:{piece:fullPiece,
                                                  source:'board'}}) + useDroppable({id:square}) replacing native
                                                  draggable/onDragStart/onDragOver/onDrop; new isOver-driven
                                                  overlay class, additive to existing isSelected/isHighlighted
```

No backend calls change — `PlayRoom.tsx`'s existing `handleSubmitAction`/`utils/api.ts` usage is
reused as-is inside the new `onDragEnd`.

## Slice sequence

1. **`Piece_OnDrag.tsx`** — standalone duplicate of `Piece_OnBoard.tsx`. No wiring, no other file
   touched. Independently testable (`tsc --noEmit`).
2. **Board squares → `@dnd-kit`** — add `DndContext`/`PointerSensor`(`DRAG_ACTIVATION_DISTANCE`) to
   `PlayRoom.tsx`; convert `BoardSquare.tsx` to `useDraggable`+`useDroppable`; `onDragEnd`
   reproduces `handleDropOnBoard`'s `${source}@${target}` submit for board-origin drags;
   `DragOverlay` renders `Piece_OnDrag` for board-sourced drags. Remove `onDrop` prop chain
   (`MainPanel`, `Board`). Click-preview (`handleSelectSquare`) verified still fires on plain
   click.
3. **Shelf slots → `@dnd-kit`** — convert `PlayerShelf.tsx` to `useDraggable` with the namespaced
   `shelf-{ownerIndex}-{index}` id; extend `onDragEnd` to parse shelf-origin drags into the same
   `S{index}@{target}` submit. Click-preview (`handleSelectShelf`) verified still fires.
4. **`isOver` visual** — add the new additive drop-target overlay class to `BoardSquare.tsx`,
   driven by its own `useDroppable().isOver`, independent of `highlightedSquares`/`selectedSquare`.
5. **Cleanup** — grep for any leftover `dataTransfer`/`onDragStart`/`onDragOver`/native-drag
   reference in `play/room/`; delete dead code; final `tsc --noEmit` pass.

## Dependency chain

Slice 1 is fully independent (can ship alone). Slice 2 must land before 3 (shelf's `onDragEnd`
branch extends the same handler slice 2 creates). Slice 4 depends on slice 2 (needs `BoardSquare`
already being a `useDroppable`). Slice 5 depends on 2+3 both landing.

## Risk flags

- **Shelf id collision** (see Decision 6) — caught during planning, resolved via namespacing
  before any code is written.
- **Click/drag activation distance** — too low a `DRAG_ACTIVATION_DISTANCE` risks accidental drags
  on click; too high risks sluggish-feeling drag start. Ships as a named constant specifically so
  this is a one-line tune, not a re-plan.
- **`isActivePlayer`/`isOwn` gating** — must carry over exactly to each `useDraggable`'s `disabled`
  option; a miss here would let a player drag pieces out of turn or drag the opponent's pieces, an
  actual game-rule violation (currently prevented by `canDrag = isActivePlayer && isOwn` gating the
  native `draggable` attribute).
- **`DragOverlay` piece resolution** — `activeDragPiece` must be sourced from `catalogByName`, same
  as today's board/shelf render path; a stale/missing lookup means the overlay silently renders
  nothing mid-drag.

## Safe cuts (last → first)

1. Slice 4 (`isOver` visual) — purely additive polish, cuttable with zero functional loss.
2. Slice 5 (cleanup) — deferrable; dead code left behind is ugly but not broken, just don't ship it
   long-term.
3. Slice 3 (shelf migration) — could stop after slice 2, leaving shelf on native drag and board on
   `@dnd-kit` temporarily. Not recommended (two drag systems coexisting) but technically safe since
   they don't share state.
4. Slice 2 — not cuttable without cutting the whole migration; it's the load-bearing slice.
5. Slice 1 (`Piece_OnDrag`) — not cuttable, it's the explicitly-requested deliverable and everything
   else's `DragOverlay` depends on it existing.
