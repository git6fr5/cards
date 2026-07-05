# PieceToken → Challenge-Coin Refactor

## Context

`PieceToken` currently renders as a flat Tailwind circle (solid `bg-*` fill + a flat-colored icon). We want it to look like a physical "challenge coin": an antique metal base (gold/steel), the archetype icon rendered as embossed/engraved relief (via an SVG lighting filter, not a flat fill), and a curved text ring around the rim. The filter recipe (`feGaussianBlur` → `feDiffuseLighting`+`feSpecularLighting` → `feColorMatrix` tint → `feComposite`/`feBlend`) was scoped out separately — see [record_piece_coin_redesign.md](record_piece_coin_redesign.md) for the full design discussion and rationale. This plan covers where the code lives and how it's wired in.

This is also the first component in `app/_components/` broken into its own folder (`Piece/`) with small, single-responsibility helper files, establishing a new convention for components with several moving parts (today the shared `_components/` dir is flat; only page-scoped dirs like `token-builder/_components/` exist, and those hold multiple *different* components, not one component's internals).

Confirmed constraints:
- 5 existing importers (`BoardSquare.tsx`, `TokenDisplay.tsx`, `TokenBuilder.tsx`, `TokenGrid.tsx`, `PlayerShelf.tsx`) all use `PieceToken` with the same props (`archetype`, `pieceType`, `bodyColor`, `size`) — this public API must not break.
- `BoardSquare.tsx` and `TokenGrid.tsx` render many `size="sm"` (32px) tokens simultaneously on screen at once — any SVG filter must be defined **once** in the DOM, not per-instance.
- `frontend/app/layout.tsx` is the only layout in the tree and is trivially small (no providers, server component).

## File breakdown — `frontend/app/_components/Piece/`

| File | Responsibility |
|---|---|
| `PieceToken.tsx` | Main component. Renders the metal-base div (gradient + bevel `box-shadow` from the active `MetalTheme`), the archetype icon with `filter: url(#{theme.filterId})`, and `<RingText>`. Keeps today's `SIZE_CLASSES`/`ICON_CLASSES` maps. Same required props; adds one **optional** `ringText?: string` (defaults to `archetype.name`) — additive, non-breaking. |
| `metalThemes.ts` | `MetalTheme` interface + `METAL_THEMES: Record<BodyColor, MetalTheme>` (gradient stops, rim highlight/shadow colors, `filterId`, diffuse/specular tint). Adding a metal later (e.g. bronze) = one new entry, nothing else touched. |
| `lightSource.ts` | Single source of truth for `LIGHT_AZIMUTH`/`LIGHT_ELEVATION` (feeds `feDistantLight`) plus the matching CSS highlight-position helper, so the SVG filter and the CSS gradient never drift to different implied light angles. |
| `PieceFilterDefs.tsx` | Mounted-once, hook-free component. Renders a visually-hidden `<svg><defs>` and loops over `METAL_THEMES` to emit one `<filter id={theme.filterId}>` chain per metal. Stays a server component. |
| `RingText.tsx` | Curved label: invisible circle `<path>` + `<text><textPath>`, using `useId()` for a per-instance path id. Returns `null` when `size === 'sm'` (32px can't legibly fit arced text) — this is the one size-branch in the whole feature. |
| `index.ts` | Barrel: `export { default } from './PieceToken';` |

## Wiring

- Mount `<PieceFilterDefs />` once in `frontend/app/layout.tsx`, inside `<body>` before `{children}`. Safe because the defs are static/config-driven with no hooks, so the root layout stays a server component; guarantees exactly one `<filter>` per metal theme exists regardless of how many tokens render.
- `bodyColor` indexes `METAL_THEMES` directly (the coin's *material*). `archetype.color` is demoted from "icon fill" to an accent/enamel role (e.g. ring-text glyph color) — it must NOT feed the emboss filter's diffuse/specular tint, since a flat-colored icon fill would fight the relief look and undo the emboss effect.

## Migration

Standardize all 5 importers on the barrel path `@/app/_components/Piece` (this also fixes `BoardSquare.tsx`'s current relative import, the one inconsistent case):
- `BoardSquare.tsx`: `'./PieceToken'` → `'./Piece'`
- `TokenDisplay.tsx`, `TokenBuilder.tsx`, `TokenGrid.tsx`, `PlayerShelf.tsx`: `@/app/_components/PieceToken` → `@/app/_components/Piece`

No prop-shape changes at any call site. Delete the old flat `frontend/app/_components/PieceToken.tsx` after the folder replaces it — don't leave both.

## Out of scope

- `ManaToken.tsx` — separate, simpler component, untouched.
- `size: 'sm' | 'md' | 'lg'` contract is preserved exactly; emboss filter applies at all 3 sizes unconditionally (cheap `filter:` reference), only ring text is size-gated.

## Verification (no dev server, no DB — per standing constraints)

1. `cd frontend && npx tsc --noEmit` — confirms new files type-check and all updated import paths resolve.
2. `npm run build` — one-shot production compile (not a dev server); confirms `PieceFilterDefs` in the root layout doesn't break the server-component boundary and the app still builds.
3. `grep -rn "_components/PieceToken'" frontend/app` — expect zero hits after migration (catches any missed import, including the old relative one).
4. Out of scope for automated verification: actually confirming the emboss filter/ring-text/gradient look right visually — that requires running `npm run dev` and inspecting `BoardSquare` (sm), `PlayerShelf` (md), and `TokenDisplay` (lg) in a browser.

## Status

Implemented — all 5 importers standardized on `@/app/_components/Piece`, the flat `PieceToken.tsx` removed, and `PieceFilterDefs` mounted in `frontend/app/layout.tsx`.
