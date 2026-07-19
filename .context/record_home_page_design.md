# Record: Home Page Design

## Contents
1. [Home page visual spruce-up](#1-home-page-visual-spruce-up)
2. [Two-column hero and secondary section redesign (2026-07-19)](#2-two-column-hero-and-secondary-section-redesign-2026-07-19)

---

## 1. Home page visual spruce-up

### Context
`Home.tsx` (`frontend/app/(open)/home/Home.tsx`) was a bare landing page — plain `div`, flat `bg-raja-chrome-bg`, header + tagline + two link buttons, no texture or visual identity. Two board texture assets (`board_tex_0.png`, `board_tex_1.png`) had already been added to `frontend/public/` but were unwired anywhere in the app. Goal was to give the home page some visual presence using what's already in the design system, without adding new components or scope.

### Discussion points
User asked to keep it simple. Initial proposal (before `/build`) included optional extras — `RajaFooter`, an additional "How to Play" CTA linking to `.context/how_to_play_artist_brief.md`. User's "keep it simple" scoped these out before build started — final instruction to `/build` explicitly excluded footer and extra CTAs.

### Decision
Rebuilt `Home.tsx` to:
- Wrap content in `RajaSection alt` (same structural shell `PlayLanding.tsx` uses) instead of a raw `div`, for consistency with the rest of the chrome domain.
- Apply `board_tex_0.png` as a background image via `bg-[url('/board_tex_0.png')] bg-cover bg-center bg-blend-multiply` — blend-multiplied against the section's own dark `alt` background color so header/button contrast stays intact, no separate overlay `div` needed.
- Bump header to `text-4xl tracking-wide` with `alt` for hierarchy against the darker backdrop.
- Tagline switched to `text-raja-chrome-bg opacity-muted` (token-backed opacity) for legibility on the dark section, replacing the low-contrast `text-raja-chrome-muted`.
- Buttons unchanged — existing `RajaButton variant="link"` styling already reads fine against the new background.

Footer and additional CTAs explicitly deferred per user's "keep it simple" — not on the roadmap, just descoped for this pass.

---

## 2. Two-Column Hero and Secondary Section Redesign (2026-07-19)

### Context
User called the home page ugly and shared a chess.com reference screenshot (two-column hero, big pill CTA, mirrored secondary "lessons" section with a diagonal floating-tile graphic). Header nav was explicitly excluded from scope since Raja's nav already lives in the top header. Goal was to lift the *structural* pattern from the reference — column split, hierarchy, secondary teaser section — without pulling any of its colors or typography, which are distinct to the Raja brand.

### Discussion points
User corrected the initial framing up front: "use only my existing chrome colours and typography... should not be pulled from the reference." This locked the constraint before `/plan` started — no new tokens, no new fonts, structural cues only.

During `/plan` scoping, asked whether to keep the existing tiled multiply-blend `board_tex` background treatment or source a new board asset for a literal panel. User confirmed the asset already existed in `public/` (`board_tex_0.png`) and to keep the tiled multiply-blend treatment as-is, just boxed into a hero panel instead of full-bleed.

Secondary section copy was sourced from `rules/_components/OverviewPanel.tsx` (the "How to Play" turn-step copy) rather than written fresh, tailored down for a landing page with a "View Full Rules" link to `/rules`.

### Decision

Split `Home.tsx` into two page-local components under `_components/`:

- `HomeHero.tsx` — two-column: boxed `board_tex_0.png` panel (multiply-blend on `bg-raja-chrome-text`, bordered/rounded) left, `font-serif` h1 + tagline + CTA row right. `RajaSection alt` for the dark chrome shell. CTA hierarchy: `Play` as the default filled `RajaButton` (`alt={false}` → `bg-raja-chrome-action`), `Sign In` as `alt` ghost/panel variant — no `RajaButton` component changes needed since variant only controls `<Link>` vs `<button>`, not color.
- `HomeFeature.tsx` — mirrored two-column: adapted turn-step copy + `View Full Rules` link left, diagonal floating tile cluster (4 images capped per plan's risk note: `coin_border_king`, `ancient_dragon`, `goblin_warrior`, `goblin_bomber`) positioned via Tailwind arbitrary values (`rotate-[Ndeg]`, percentage offsets) right — no inline `style`, per `general_rules.md`.

`Home.tsx` reduced to composing `<HomeHero /><HomeFeature />`. No backend, no ORM, no new design tokens — plan and build both confirmed token-only usage against `globals.css`.
