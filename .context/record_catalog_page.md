# Record: catalog_page

## Contents

1. [Spec — searchable/filterable catalog + bag builder](#1-spec--searchablefilterable-catalog--bag-builder)
2. [Layout direction picked](#2-layout-direction-picked)
3. [Component/API plan + player guard](#3-componentapi-plan--player-guard)
4. [Built](#4-built)

---

## 1. Spec — searchable/filterable catalog + bag builder

### Context
Page 2 of the three-page frontend plan (see `record_signup_flow.md` section 1), route locked earlier as `/catalog`. Once the backend prerequisites landed (`record_piece_catalog_route.md`), asked for a loose layout description before proposing directions.

### Discussion points
User gave a fully detailed spec in one pass rather than a loose description:
- Catalog: grid of pieces, searchable by name, filterable by movement_type/movement_distance/movement_cost (→ `action_cost`, confirmed)/summon_cost/archetype/trigger_type/effect_type/role_type. Grouped by archetype, ordered by summon_cost then name within group.
- Left panel: bag-building table, populated by dragging pieces in from the catalog. Columns: Name | Archetype | Summon Cost | Movement | Trigger Type | Quantity. Ordered by summon_cost then name (no archetype grouping).
- King always pinned first row; if the bag has no king, that row reads "Missing King" / N/A across the other cells.
- Enforced: exactly 1 king, max 20 pieces total, max 2 of any one piece.

### Decision
Spec locked as described. Confirmed via the DSL reference doc + `play/bag/crud.py` that every filter either mapped to an existing field or needed the small backend addendum covered in `record_piece_catalog_route.md` section 4.

---

## 2. Layout direction picked

### Context
Presented 4 layout directions per `page_creation_workflow.md`, all keeping both the catalog and the bag table permanently visible (no collapsible drawer — `frontend_structure.md`'s fixed-layout rule).

### Discussion points
Directions 2 and 3 both reversed the user's stated "bag table on the left" placement — flagged explicitly as a deviation in each. User picked **direction 2** anyway: narrow sidebar (search + all filters) on the left, catalog grid in the middle, bag selector + table on the right.

### Decision
Direction 2 locked. Structural note carried into the build: every `RajaDropdown` filter needed a companion "Clear Filters" button, since `RajaDropdown`'s placeholder option renders `disabled` — once a real value is picked, there's no way back to "Any" through the dropdown itself.

---

## 3. Component/API plan + player guard

### Context
Before finalizing the API plan, checked `play/bag/crud.py` and `play/player/crud.py` — every `Bag` route requires a `Player` row (`require_player_access`, 404 if none), but the "auto-create Player on first login" UX was originally slotted for the not-yet-built Account page (page 3).

### Discussion points
Rather than duplicate that guard later or leave `/catalog` broken for first-time visitors, extracted it now as a shared `hooks/useEnsurePlayer.ts` (`GET /players/me` → `POST /players` fallback on a 404-shaped failure, real errors surfaced instead of silently retried) — both `/catalog` and the future `/account` page will consume the same hook.

All other API calls needed already existed (`GET /pieces/full`, `GET /bags`, `POST /bags`, `PUT /bags/{id}/pieces`) — no backend gap this round. Confirmed `read_bags`/`read_bag` both already return each bag's full `pieces` list, so no separate per-bag fetch is needed when switching the selected bag — the already-fetched `GET /bags` array is sufficient, refetched wholesale after any mutation (acceptable at this data size, not optimistically patched).

### Decision
Plan locked as presented (base components, page components, hook, API table) — see the conversation for the full table. No changes requested before build.

---

## 4. Built

### Context
Built via `/build`. `components/table/` didn't exist yet anywhere in the project (no table anywhere in the codebase) — the design-base guide fully specifies `RajaTableContainer`/`RajaTableMessage`'s props, so built them now as the project's first instance of that documented-but-unbuilt slot, rather than skipping the shared chrome or inventing an ad-hoc shape.

### Discussion points
- `PieceFull`/`Bag`/`FilterState` types plus shared constants (`MAX_BAG_SIZE=20`, `MAX_PER_PIECE=2`, `MAX_KING_QUANTITY=1`, `KING_ROLE_TYPE`) and a pure `canAddPieceToBag(piece, bagPieces, catalogByName)` rule function live in `app/(protected)/catalog/types.ts` — shared between the drag-drop handler (`Catalog.tsx`) and the table's per-row increment gating (`BagTable.tsx`), so the cap rules aren't duplicated in two places.
- Drag-and-drop via `@dnd-kit/core`'s `useDraggable` (`PieceCard`) / `useDroppable` (`BagTable`) / `DndContext` (`Catalog.tsx`), per the earlier `dnd-kit` decision (`record_piece_catalog_route.md` section 4).
- King row is structural, not rule-derived: `BagTableRow` checks `piece.role_type === KING_ROLE_TYPE` directly (an earlier draft incorrectly tried to infer "is this the king row" from the `canIncrement` prop, which conflates a structural fact with a rule-based value — caught and fixed before finalizing).
- Bag rule enforcement stays frontend-only per the confirmed-earlier decision; not revisited here.
- Added `/catalog` to `RajaHeader`'s protected nav links, next to `Play`/`Token Builder`.
- Rename/delete-bag UI (routes exist: `update_bag_name`, `delete_bag`) was scoped out of this build — not explicitly asked for; only select + create built, keeping to what was actually requested.

### Decision
Built: `hooks/useEnsurePlayer.ts`; `components/table/{RajaTableContainer,RajaTableMessage}.tsx`; `app/(protected)/catalog/{page.tsx,Catalog.tsx,types.ts}` + `_components/{CatalogFilters,CatalogGrid,PieceCard,BagSelector,BagTable,BagTableRow}.tsx`; one-line nav addition to `RajaHeader.tsx`.

Verified: `tsc --noEmit` clean; `next build` completed successfully with `/catalog` listed as a static route (structural verification only — static generation doesn't execute the live data-fetching flow against a running backend, so the actual drag-drop/rule-enforcement/player-guard behavior is unverified end-to-end; no dev server run, per standing instruction).

Open follow-ups: pages 2's rename/delete-bag UI, and page 3 (Account) — which will reuse `useEnsurePlayer` — remain unbuilt.
