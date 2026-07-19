# Home Page Redesign — Plan

## Scope
**In:** `app/(open)/home/Home.tsx` redesign — two-column hero, mirrored secondary "How to Play" section with floating tile graphic, CTA hierarchy.
**Out:** header/footer (nav stays top, untouched), `/rules` page itself, backend, any new color/font tokens (hard constraint — brand tokens only, structural cues from chess.com reference but not its palette/typography).
**Migration impact:** none. **Build order:** single page, no dependency on other in-flight work.

## Decisions (locked)
1. Page-local `_components/` under `app/(open)/home/` — single-use page, per `frontend_structure.md` convention.
2. Hero keeps existing tiled multiply-blend `board_tex_0.png` treatment — reuse, no new asset.
3. Secondary section copy adapted from `rules/_components/OverviewPanel.tsx` (7×7 board, bag-draw, turn steps) — shortened, home-tailored headline, links to `/rules` for full detail.
4. Secondary visual: diagonal floating tile cluster using `coin_border_king.png`, `coin_border_unit.png`, `ancient_dragon.png`, `goblin_bomber.png`, `goblin_warrior.png` — rotated/offset via Tailwind arbitrary-value classes (`rotate-[Ndeg]`, positioning), not inline `style` (general_rules: no inline style).
5. CTA hierarchy: "Play" = `variant="link"` `href="/play"` `alt={false}` (filled action pill — already the default RajaButton look, no component change needed). "Sign In" = `variant="link"` `href="/auth"` `alt={true}` (ghost/panel).

## Backend structure
None — no routes, no ORM, no API calls. Pure presentational.

## Route inventory
N/A — no backend touched.

## Frontend
```
app/(open)/home/
├── page.tsx          [exists, unchanged]
├── Home.tsx           [edit] — composes HomeHero + HomeFeature
├── _components/
│   ├── HomeHero.tsx    [new]
│   └── HomeFeature.tsx [new]
```
- **HomeHero.tsx** — 2-col: left = board_tex panel; right = `font-serif` h1 "Raja" + tagline + CTA row (Play/Sign In per decision 5). Wraps in `RajaSection`.
- **HomeFeature.tsx** — mirrored 2-col: left = `font-serif` h2 + adapted turn-step copy + ghost "View Full Rules" → `/rules`; right = floating tile cluster (relative container, 3-4 absolute-positioned rotated tiles, capped per risk below).
- **Home.tsx** — replaces current single centered block with `<HomeHero /><HomeFeature />` stack.
- No `utils/api.ts` or `utils/auth.ts` changes.

## Slice sequence
1. Build `HomeHero.tsx` — layout + CTA hierarchy.
2. Build `HomeFeature.tsx` — copy adaptation + tile cluster.
3. Wire both into `Home.tsx`.
4. Token audit pass — confirm zero raw hex, zero new `@theme` entries, only existing `raja-*`/`raja-chrome-*` tokens used.

## Dependency chain
HomeHero + HomeFeature build independently → both feed into Home.tsx wiring (step 3 blocked on 1+2) → step 4 gates completion.

## Risk flags
- Tile cluster can look cluttered — cap at 3-4 tiles, use existing `opacity-muted`/`opacity-disabled` tokens for depth, not new values.
- Board panel needs fixed aspect container (`aspect-square` or similar) so `board_tex` doesn't distort across viewport widths.
- Arbitrary Tailwind values (`rotate-[Ndeg]`) for tile geometry are layout-only, not color/spacing-token violations.
- Fixed-layout soft rule: no collapsible/hidden content introduced — compliant.

## Safe cuts (last → first)
1. Floating tile cluster — drop first, HomeFeature falls back to text-only.
2. HomeFeature section entirely — ship hero redesign alone.
3. CTA hierarchy change — revert to two equal-weight link buttons.
4. Board panel treatment — keep exactly as today (lowest risk, already working).

## Guides loaded (Step 0 orientation)
`general_rules.md`, `frontend_structure.md`, `creating_frontend_components.md`, `frontend_design_base.md`, `tailwind_rules.md`, `frontend_typography.md`.
