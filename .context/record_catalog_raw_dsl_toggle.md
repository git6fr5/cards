# Record: Catalog Raw DSL Toggle

## Contents
1. [Raw/translated ability display toggle](#1-rawtranslated-ability-display-toggle)

---

## 1. Raw/translated ability display toggle

### Context
Follow-up to the ability DSL translator ([[record_ability_dsl_translator]]): user wanted a checkbox in the catalog page's side panel (the `<aside>` in `Catalog.tsx` holding `CatalogFilters`) to swap each piece card's ability text between the raw DSL string and the translated human-readable version, using the existing `RajaCheckbox` design-system atom if available.

### Discussion points
None — straightforward extension of an already-reusable component. Surveyed the existing chain first (`Catalog.tsx` → `CatalogFilters.tsx`/`CatalogGrid.tsx` → `PieceCard.tsx` → `PieceDetailCard.tsx` → `RajaAbilityText.tsx`) and confirmed `RajaCheckbox` already exists in `components/ui/`, so no new atom was needed for the control itself.

### Decision
- `RajaAbilityText` gained a `raw?: boolean` prop (default `false`) rather than building a separate raw-DSL component — when `true` it renders the DSL lines verbatim (`font-monospace`, no translation/fallback logic) instead of calling `translateAbility`. Keeps both display modes in the one reusable atom, so the same toggle works wherever the atom is used later, not just the catalog.
- `showRawDsl` state lives in `Catalog.tsx` (the only stateful ancestor) and threads down as a plain boolean prop through `CatalogGrid` → `PieceCard` → `PieceDetailCard` → `RajaAbilityText`'s `raw` prop — no context needed for a single boolean at this depth.
- The checkbox lives in `CatalogFilters.tsx` but as its own `showRawDsl`/`onToggleRawDsl` prop pair, deliberately *not* folded into `FilterState` — `FilterState` is a piece-matching predicate (`matchesFilters`), while this is a display toggle that doesn't hide/show pieces. Rendered behind a `border-t` divider below "Clear Filters" to visually separate it from the actual filter controls.
- Scope stayed catalog-only per the request — the play room's `PieceDetailPanel` (the translator's other existing consumer) was not touched.
