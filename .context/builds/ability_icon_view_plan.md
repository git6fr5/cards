# Plan: Ability Icon View

## Scope
- In: a third view mode for the catalog card ("Icons") alongside the existing raw-DSL and translated-text modes, built as its own component so the other two modes stay byte-identical.
- In: `frontend/utils/abilityTranslatorIcons.ts` — icon/color lookup tables + a `translateAbilityToIcons(dsl)` function mirroring `abilityTranslator.ts`'s shape/fallback conventions.
- In: `archetypes.ts` updates — Warlock icon `Skull`→`Ghost`, color → light blue; `PIECE_TYPES` gets real icons for `KING`/`UNIT`/`BUILDING`.
- Out (this pass): `CANNIBAL`/`PACIFIST` role icons — stay on the current `ChessPawn` placeholder, despite being live in the catalog.
- Out: wiring the icon mode into the play room's `PieceDetailPanel` — scoped to the catalog page only, matching how the raw/text toggle was scoped.
- No backend/migration impact.

## Decisions (locked)
1. New module `abilityTranslatorIcons.ts`: exports icon lookup tables (`TRIGGER_ICONS`, `EFFECT_ICONS`, `ZONE_ICONS`, `PATTERN_ICONS`, `ALIGNMENT_COLORS`) and `translateAbilityToIcons(dsl): IconAbility | null`.
2. Output shape — new types, not reusing `TranslatedAbility` (that one's string-based; icons need actual component references):
   ```ts
   interface IconChip { Icon?: LucideIcon; color?: string; label?: string; }
   type IconLine = { kind: 'chips'; chips: IconChip[] } | { kind: 'fallback'; text: string };
   interface IconAbility { trigger: IconLine; effect: IconLine; target: IconLine; }
   ```
   Discriminated union for the fallback case (per `frontend_design_base.md`'s variant-component rule) — a line is either a chip sequence or raw fallback text, never both.
3. New component `PieceIconCard.tsx`, not a third branch in `PieceDetailCard.tsx` — duplicates the outer frame (border/dimensions/name position) rather than sharing a "card shell" abstraction. Rationale: only 2 consumers, corner/middle content differs substantially, avoids a premature shared abstraction for ~6 duplicated lines.
4. Icon-mode-only corner layout (differs from `PieceDetailCard`'s corners):
   - Top-left: archetype icon alone (unchanged from today).
   - Top-right: action-cost circle + small `Footprints` badge (was: cost circle alone).
   - Bottom-left: summon-cost circle + small `SquareArrowDown` badge (was: cost circle alone).
   - Bottom-right: movement pattern display — `Footprints` + pattern icon (`ChessQueen`/`ChessRook`/`ChessPawn`/`ChessBishop`/`Dot`) + distance number (was: duplicate archetype icon).
5. Middle ability display, 3 chip-rows (trigger/effect/target), mirroring the text translator's structure:
   - Trigger: condition icon, count label only when N≠1 (same omit-at-1 convention as the text version).
   - Effect: operation icon, colored via `ALIGNMENT_COLORS` when the operation carries an alignment (`SUMMON`, `CONVERT`).
   - Target: zone icon colored by alignment/possession, `WHERE` filter rendered as trailing chips in `(` `)` label-chips — structure criteria as the matching archetype/role icon, attribute criteria as concept-icon pairs (see #6).
6. Attribute→icon composition (confirmed): `summon_cost` → `SquareArrowDown`+`Gem`; `action_cost`/`action_count` → `Footprints`+`Gem`; the `*_count`/`turns_on_board` attributes reuse their corresponding trigger-condition icon alone (no `Gem`) since they're counts, not costs — `kill_count` → `Swords`, `death_count` → `Skull` (count stays `Skull` even though the Warlock archetype itself moves to `Ghost`), `promotion_count` → `SquareArrowUp`, `summon_count` → `SquareArrowDown`, `turns_on_board` → `Timer`, `distance_moved_count` → `Footprints`, `actions_performed_count` → `Footprints`.
7. Comparators render as plain unicode glyphs (`<`, `≤`, `>`, `≥`, `=`) as label-only chips (no `Icon`) — lucide has no literal comparator icons.
8. Alignment colors (confirmed): `FRIENDLY` = green (`#16A34A`, matches Goblin's existing archetype green), `ENEMY` = red (`#8C2E22`, the existing `raja-crimson` value), `ANY` = neutral (no color override, default text color).
9. Catalog control swaps from `RajaCheckbox` (`showRawDsl: boolean`) to `RajaRadio` (3 options: DSL / Text / Icons) — state renamed `abilityViewMode: 'dsl' | 'text' | 'icons'`, threaded the same path (`Catalog.tsx` → `CatalogGrid` → `PieceCard`), branching at `PieceCard` between `<PieceDetailCard raw={mode==='dsl'} />` and `<PieceIconCard />`.

## Frontend structure
```
frontend/
├── utils/
│   └── abilityTranslatorIcons.ts   [new] icon/color tables + translateAbilityToIcons()
├── utils/archetypes.ts             [edit] Warlock → Ghost/light-blue; PIECE_TYPES KING/UNIT/BUILDING icons
├── app/_components/
│   └── PieceIconCard.tsx           [new] icon-mode card, own corner layout + chip rows
└── app/(protected)/catalog/
    ├── Catalog.tsx                 [edit] showRawDsl → abilityViewMode
    ├── _components/CatalogFilters.tsx  [edit] RajaCheckbox → RajaRadio (3 options)
    ├── _components/CatalogGrid.tsx     [edit] thread abilityViewMode
    └── _components/PieceCard.tsx       [edit] branch PieceDetailCard vs PieceIconCard
```
`PieceDetailCard.tsx` and `RajaAbilityText.tsx` — untouched, per the requirement that raw/text stay pixel-identical.

## Route inventory
None.

## Slice sequence
1. `archetypes.ts` icon/color updates (small, self-contained, unblocks everything downstream that renders these icons).
2. `abilityTranslatorIcons.ts` — pure data + translation function, verified standalone (same `tsx`-script approach as the text translator) before any JSX touches it.
3. `PieceIconCard.tsx` — consumes both of the above.
4. Catalog wiring — `RajaRadio` swap + `abilityViewMode` thread + `PieceCard` branch.

## Dependency chain
Icon/color data → translator function → card component → catalog wiring. Linear.

## Risk flags
- Decisions 6 and 8 were extrapolations past the single worked example (Dragon Queen) — confirmed correct by the user, but worth a visual check once rendered.
- `CANNIBAL`/`PACIFIST` staying on `ChessPawn` is a visible gap on live catalog data (Warlock pieces), not hypothetical.
- Corner-layout duplication between `PieceDetailCard` and `PieceIconCard` means a future corner-layout change has to be applied twice.

## Safe cuts (last → first)
1. Attribute concept-icon pairing (decision 6) — could fall back to a single generic "cost" or "count" icon instead of composed pairs, if the visual gets too busy.
2. Filter chips in the target line — could ship target zone-icon only first, defer the parenthetical filter-chip rendering.
3. Corner layout changes (decision 4) — could ship the icon-mode middle content first with the unchanged corner layout, add the new corner treatment as a follow-up.
