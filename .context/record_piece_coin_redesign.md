---
name: Piece Coin Redesign
description: Redesigning PieceToken as an embossed "challenge coin" (metallic SVG filter look) and splitting it into a Piece/ component folder
type: project
---

## Table of contents

1. [Coin aesthetic — technique selection](#1-coin-aesthetic--technique-selection)
2. [SVG emboss filter recipe](#2-svg-emboss-filter-recipe)
3. [Piece/ folder restructure and implementation plan](#3-piece-folder-restructure-and-implementation-plan)

---

## 1. Coin aesthetic — technique selection

### Context
Four Amazon "challenge coin" product listings (Saint Michael Archangel, Medieval Knight, Viking Warrior, Tree of Life — all antique-metal medallions with engraved relief art, a rim inscription, and enamel highlights) were shared as the target look for the game's `PieceToken` component, which currently renders as a flat Tailwind circle (solid `bg-*` fill + a flat-colored Lucide icon, see `frontend/app/_components/PieceToken.tsx`).

### Discussion points
Three tiers of implementation were laid out, trading fidelity against cost/perf:
1. **Baked static image assets** — cheapest, matches the reference photos exactly since those are literal photos of stamped metal, but loses the icon-driven/re-themeable architecture.
2. **SVG emboss filter (real-time, vector)** — `feDiffuseLighting`/`feSpecularLighting` lift a flat icon into relief, layered over a CSS metallic gradient; stays scalable and keeps the existing `archetype.Icon`-driven component structure; performant enough for many simultaneous board tokens.
3. **Full 3D (react-three-fiber + PBR metal material + env map)** — most realistic/dynamic (real specular highlights, physical tilt), but too heavy to render once per board square.

### Decision
Tier 2 (SVG emboss + metallic CSS gradient) for the board's many-instance token rendering, since it's the only option that's both performant at scale and keeps the current icon-driven component API. Tiers 1/3 were noted as better suited to a future single "inspect piece" hero view, not pursued further in this session.

---

## 2. SVG emboss filter recipe

### Context
Concrete filter chain worked out to make a flat Lucide icon read as engraved/embossed metal: `feGaussianBlur` (blurs `SourceAlpha` into a pseudo height-map) → `feDiffuseLighting` + `feSpecularLighting` (each with a `feDistantLight`, giving matte relief shading plus a metallic specular highlight) → `feColorMatrix` (tints the diffuse pass gold/silver/bronze) → `feComposite`/`feBlend` (clips to the icon's silhouette and combines the two lighting passes). Paired with a CSS `conic-gradient`/`radial-gradient` base plus inset `box-shadow` for the coin's beveled rim, and an SVG `<textPath>` around a hidden circular `<path>` for the rim inscription.

### Discussion points
None — this was presented as a worked recipe and accepted as the basis for the following implementation plan without pushback. One implementation constraint surfaced during the recipe write-up: the icon fed into the filter must have solid/flat fill (filter reads alpha, not color), and `feDistantLight`'s `azimuth`/`elevation` must stay visually consistent with the CSS gradient's highlight position, or the coin reads as lit from two different directions at once.

### Decision
Adopted as-is; carried forward into the file/component plan in section 3 as `lightSource.ts` (a single shared source for the light-angle constants) specifically to prevent the CSS and SVG halves of the effect from drifting apart.

---

## 3. Piece/ folder restructure and implementation plan

### Context
Beyond the visual technique, the user wants `PieceToken.tsx` to become the first component in `frontend/app/_components/` split into its own folder (`Piece/`) with small, single-responsibility helper files — establishing a new convention, since the shared `_components/` dir is currently flat and only page-scoped `_components/` dirs exist elsewhere (holding multiple *different* components, not one component's internals). A Plan agent was dispatched to work out the concrete file breakdown and wiring, confirming along the way: 5 existing importers (`BoardSquare.tsx`, `TokenDisplay.tsx`, `TokenBuilder.tsx`, `TokenGrid.tsx`, `PlayerShelf.tsx`) all use the same props and must keep working unchanged; `BoardSquare.tsx`/`TokenGrid.tsx` render many `size="sm"` tokens at once, so any SVG filter must be defined once in the DOM, not per-instance; `frontend/app/layout.tsx` is the only layout in the tree and is a trivially small server component.

### Discussion points
- Granularity of the split: landed on 6 files (`PieceToken.tsx`, `metalThemes.ts`, `lightSource.ts`, `PieceFilterDefs.tsx`, `RingText.tsx`, `index.ts`) — the upper end of a suggested 3-6 file range, justified by `RingText`'s nontrivial SVG arc-geometry/id logic and `lightSource.ts` existing specifically to stop the light-angle numbers duplicating across the CSS and SVG halves. Deliberately not fragmented further (not a 15-file subsystem).
- `archetype.color`'s role had to be redecided: previously the icon's flat fill color, it's demoted to an accent/enamel role only (e.g. ring-text glyph color) because flatly coloring the icon would fight the new relief/emboss look and effectively cancel the effect. `bodyColor` becomes the coin's *material* (indexes `METAL_THEMES` directly) instead.
- Where to mount the shared filter `<defs>` once: decided on `frontend/app/layout.tsx` (root, inside `<body>`) since it's the only layout in the tree and the defs component is static/hook-free, so the root layout doesn't need to become a client component.
- Size contract: `sm` (32px) hides the ring text entirely (can't legibly fit arced text that small) but still gets the emboss filter applied — the only size-conditional branch in the whole feature, kept localized to `RingText.tsx`.

### Decision
Plan approved and written to `~/.claude/plans/purring-nibbling-tower.md`: new `frontend/app/_components/Piece/` folder per the 6-file breakdown above, `<PieceFilterDefs />` mounted once in root `layout.tsx`, all 5 importers switched to `@/app/_components/Piece`, old flat `PieceToken.tsx` deleted. Verification scoped to `tsc --noEmit` + `next build` + a grep for stale import paths (no dev server, no DB — standing constraints), with actual visual correctness (gradient angle, relief legibility, ring text) explicitly left for the user to check in a browser.

**Outstanding:** implementation has not happened yet. Two "implement" requests in this session were both declined because the session is configured no-edits — needs a session with edits enabled to actually execute the plan.
