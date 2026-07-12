# Record: Home Page Design

## Contents
1. [Home page visual spruce-up](#1-home-page-visual-spruce-up)

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
