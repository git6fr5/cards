# Plan: Ability DSL Translator (reusable)

## Scope
- In: a pure translation function covering the full DSL grammar (trigger/effect/target/zone/filter/pattern), plus a shared `components/ui/` atom that renders it, plus migrating `PieceDetailCard.tsx`'s raw ability `<p>` to use it.
- Out: `PieceToken`'s rim-text engraving (`app/_components/Piece/AbilityText.tsx`) — different purpose (decorative SVG arc text), not touched.
- First-class: full grammar coverage, per-line fallback handling, empty-ability handling.
- No backend/migration impact — `piece.ability` is already the raw DSL string on the wire; nothing server-side changes.
- Build order: util first (independently testable, no JSX), then the atom, then the one migration.

## Decisions (locked)
1. Split: pure translation logic in `frontend/utils/abilityTranslator.ts` (named exports, no JSX) + a thin rendering atom `components/ui/RajaAbilityText.tsx`. Reason: keeps translation testable/reusable outside React and matches the project's existing utils convention.
2. Full grammar coverage in one pass — all 7 trigger conditions, 5 effect ops, 3 target forms, 3 zones, structure+attribute filters, 5 patterns (per `.context/engine_dsl_reference.md`).
3. Per-line fallback: if a line doesn't match any known shape, render that line's raw DSL text styled in the existing `text-raja-chrome-error` token (no new color — reuses the error red already in `globals.css`), so a translation gap is visually obvious rather than silently wrong.
4. Empty ability (`""`) → component renders `null` (nothing), not a placeholder string.
5. Output stays 3-line structured, not collapsed prose: `{ trigger, effect, target }`, each a `{ text, isFallback }` pair — mirrors the DSL's own Trigger/Effect/Target shape so callers can style/lay out each line independently. Pattern tokens (`SQUARE 1`, `CROSS 2`) are kept literal inside the target line, not translated to prose.
6. Filters spelled out in full prose (`ATT:SUMMON_COST<=2` → "summon cost 2 or less"; `ARCHETYPE:DRAGON` → "dragons"), combined into the target sentence.
7. Edge case (flagged, not blocking): a non-empty ability with line count ≠ 3 (structurally malformed — shouldn't occur since the backend parser already validates it, but the TS translator is a separate implementation and could drift). Default: whole raw DSL rendered as a single fallback line, red, rather than crashing.

## Frontend structure
```
frontend/
├── utils/
│   └── abilityTranslator.ts     [new] translateAbility(dsl) → TranslatedAbility | null
│                                       + translateTrigger/Effect/Target/Zone/Filters (internal)
├── components/ui/
│   └── RajaAbilityText.tsx      [new] { dsl, className? } → renders 3 lines via the util
└── app/_components/
    └── PieceDetailCard.tsx      [edit] raw {piece.ability} <p> → <RajaAbilityText dsl={piece.ability} />
```

## Route inventory
None — no backend change.

## Slice sequence
1. `abilityTranslator.ts` — full grammar translation, pure functions, per-line fallback marking.
2. `RajaAbilityText.tsx` — consumes the util, renders 3 lines, red fallback styling via `text-raja-chrome-error`.
3. Migrate `PieceDetailCard.tsx` to use it.

## Dependency chain
Util blocks the atom (atom just renders its output). Atom blocks the migration. Strictly linear, no fan-out.

## Risk flags
- Translator is a from-scratch TS reimplementation of the Python grammar (not a port/shared source) — the two can drift if the DSL grammar changes later and only one side gets updated. Add a code comment pointing at `engine_dsl_reference.md` as the shared source of truth.
- Malformed-line-count edge case (decision 7) — deliberately deferred behavior, not fully speced.
- Filter prose (decision 6) can get long for multi-criterion `WHERE` clauses — no length cap discussed; could wrap awkwardly in narrow layouts (e.g. the 5.5cm piece card). Not blocking, but check visually once built.

## Safe cuts (last → first)
1. Filter prose detail — could fall back to showing raw `WHERE ...` clause untranslated (still 3-line structure intact) if full filter grammar coverage proves too time-heavy.
2. Full pattern/zone coverage — could ship trigger+effect+target skeleton first, treat zone/filter as its own fallback-red segment temporarily.
3. `PieceDetailCard.tsx` migration — the util+atom are still shippable/reusable without this last wiring step, if scope needs to shrink to "component exists" only.
