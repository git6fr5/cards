## Contents

1. [Board/shelf/catalog shared one render path](#boardshelfcatalog-shared-one-render-path)
2. [Reorg into app/_components/Piece/, three named variants](#reorg-into-app_componentspiece-three-named-variants)
3. [Catalog view-mode options collapsed to Card/Shelf/Board](#catalog-view-mode-options-collapsed-to-cardshelfboard)

---

## Board/shelf/catalog shared one render path

### Context

While breaking down `/play` for a gameplay-feedback upgrade, asked whether the board, shelf, and
catalog each had their own piece-rendering path. They didn't: `BoardSquare.tsx`, `PlayerShelf.tsx`,
and the catalog's `PieceCard.tsx` all rendered the same `PieceIconCard2` component, differing only
in the `ownerIndex`/`className` props passed in. `PieceIconCard2` itself had no location-aware
branching. This meant any board-only feedback (move-just-happened glow, effect-proc flash,
stun/slow overlay) had no place to hook in without also touching shelf and catalog rendering.

### Discussion points

None — this was a direct answer to a factual question, not a design decision yet.

### Decision

Confirmed no separate path existed. Flagged that a board-specific wrapper/variant would be needed
before any board-only feedback work could start — this became the trigger for the reorg below.

---

## Reorg into app/_components/Piece/, three named variants

### Context

Given the single-path finding above, decided to split the shared card into three explicitly named
components living together in `app/_components/Piece/` (a folder that already existed, holding the
unrelated token-builder rendering system — `PieceToken`, `RingBorder`, `AbilityText`, etc.).

### Discussion points

- Checked whether anything in the existing `Piece/` folder was unused before touching it. It
  wasn't — `PieceToken.tsx` is consumed by `token-builder/`, `PieceFilterDefs.tsx` by
  `app/layout.tsx`. Left every existing file in that folder untouched.
- Ran an exhaustive grep for every consumer of `PieceIconCard2`, `PieceDetailCard`,
  `PieceIconCard` (v1), and `PieceMovementIcon` before moving anything, to size the full blast
  radius: `BoardSquare.tsx`, `PlayerShelf.tsx`, `PieceDetailPanel.tsx`, catalog's `PieceCard.tsx`,
  catalog's `Catalog.tsx`/`CatalogGrid.tsx`/`CatalogFilters.tsx`/`types.ts`, plus a stale code
  comment in `abilityHalfIconTranslator.ts` referencing `PieceIconCard2` by name.
- `PieceIconCard` (v1, icon-mode predecessor to `PieceIconCard2`) had no remaining reason to exist
  once the catalog's view-mode list was being collapsed (see next section) — confirmed its only
  consumer was the catalog toggle being replaced, then deleted it outright rather than moving it.
- `BoardSquare.tsx` was pointed at the new `Piece_OnBoard` (not `Piece_OnShelf`) on the reasoning
  that the whole point of the split was to give the board its own hook — `PlayerShelf.tsx` kept
  `Piece_OnShelf`.

### Decision

- `git mv`'d and renamed: `PieceMovementIcon.tsx` → `Piece/PieceMovementIcon.tsx` (no rename),
  `PieceIconCard2.tsx` → `Piece/Piece_OnShelf.tsx` (component/props renamed to match), `PieceDetailCard.tsx`
  → `Piece/Piece_Card.tsx` (component/props renamed to match). Fixed each file's now-one-level-deeper
  relative import of `../types`.
- Created `Piece/Piece_OnBoard.tsx` as a byte-for-byte duplicate of `Piece_OnShelf.tsx` (renamed
  identifiers only) — an explicit starting point for board-specific feedback work, not yet
  differentiated.
- Deleted `PieceIconCard.tsx` (v1) entirely — no remaining consumer.
- Updated every consumer found in the blast-radius grep to the new paths/names, including the
  stale comment in `abilityHalfIconTranslator.ts`.
- Verified with `tsc --noEmit` clean (one unrelated pre-existing error in `.next/types/validator.ts`
  about a nonexistent `play/page.js`, predates this change and is a stale generated-types artifact).

---

## Catalog view-mode options collapsed to Card/Shelf/Board

### Context

The catalog's ability-view-mode radio (`CatalogFilters.tsx`) previously had four options: `dsl`
(raw DSL text), `text` (translated text, both rendered via `PieceDetailCard`), `icons` (v1 card),
`icons2` (v2 card). Given the rename/consolidation above, asked to replace this with exactly three
options matching the new component names: Card, Shelf, Board.

### Discussion points

- This drops the raw-DSL-vs-translated-text distinction that the old `text`/`dsl` options exposed
  (both used to render the same `Piece_Card`/`PieceDetailCard`, differing only by its
  `showRawDsl` flag). The three-option instruction was explicit and exact, so proceeded without
  stopping to confirm — flagging here that the raw-DSL debug view is no longer reachable from the
  catalog toggle; `Piece_Card`'s `showRawDsl` prop still exists and defaults to `false`, just isn't
  wired to anything now.
- `PieceIconCard` (v1, the old `icons` option) had no replacement slot in the new three-option
  set — this is why it was deleted rather than moved (see previous section).

### Decision

- `catalog/types.ts`: `AbilityViewMode` narrowed from `'dsl' | 'text' | 'icons' | 'icons2'` to
  `'card' | 'shelf' | 'board'`.
- `CatalogFilters.tsx`: `ABILITY_VIEW_MODE_OPTIONS` replaced with `Card`/`Shelf`/`Board`.
  `Catalog.tsx`'s `useState<AbilityViewMode>` default and `CatalogGrid.tsx`'s prop default both
  changed from `'text'` to `'card'`.
  `PieceCard.tsx` (catalog's own drag-wrapper component — kept its file name, only its render
  branch rewritten) now switches on `shelf`/`board`/else-`card` to pick `Piece_OnShelf` /
  `Piece_OnBoard` / `Piece_Card`.
- Open question left for the user: whether the raw-DSL debug view needs to come back somewhere
  (e.g. a separate toggle inside the Card mode) now that it's no longer a top-level option.
