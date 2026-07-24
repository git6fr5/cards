## Contents

1. [Landing the deferred session/Context pattern via wills precedent](#1-landing-the-deferred-sessioncontext-pattern-via-wills-precedent)
2. [Unifying RajaHeader off the open/protected variant split](#2-unifying-rajaheader-off-the-openprotected-variant-split)
3. [Simplifying the home page to a single auth-aware hero](#3-simplifying-the-home-page-to-a-single-auth-aware-hero)

---

## 1. Landing the deferred session/Context pattern via wills precedent

### Context

`record_layout_shell_and_ui_rename.md` (§3–4) had already identified that `RajaHeader` needed to
be auth-aware, but explicitly deferred wiring it to live session state ("fix 3") until "the backend
auth context lands" — at the time, `RajaHeader`'s `variant: 'open' | 'protected'` was instead
passed statically by whichever route-group layout rendered it, since `proxy.ts`/`proxy.config.ts`
already gated `(protected)` routes server-side and that was a reliable-enough signal for that
moment.

This session confirmed `utils/auth.ts` (`checkSession()`, `CurrentUser`) already exists in cards —
the deferred backend piece has landed — so fix 3 was finally unblocked. Asked to check a sibling
project (`/Users/Development/Web/wills/frontend/app/(protected)/layout.tsx`) for a working
reference implementation, and cross-checked it against
`guides/creating_frontend_components.md` ("Layout session/Context pattern": layout does one
`checkSession()` call, wraps `children` in `UserContext.Provider`, header reads via `useContext`
instead of its own fetch) — wills' `useCurrentUser.tsx` (`CurrentUserProvider` + `useCurrentUser`)
matches that guide exactly.

### Discussion points

Wills' `(protected)/layout.tsx` pairs the provider with an `AuthGate` that redirects to `/auth` on
no session. Flagged that cards can't copy this wholesale: `(open)/layout.tsx` must still render for
logged-out visitors (home, rules), so only the provider was ported, not the redirect gate.
No pushback — confirmed directly.

### Decision

Ported `CurrentUserProvider`/`useCurrentUser` from wills into `frontend/hooks/useCurrentUser.tsx`
verbatim (same shape: `{ user, isLoading }` context value, one `checkSession()` call on mount).
Wired into both `(open)/layout.tsx` and `(protected)/layout.tsx` — `(open)` without any redirect
gate, `(protected)`'s existing per-page auth checks left untouched (out of scope to refactor those
now).

---

## 2. Unifying RajaHeader off the open/protected variant split

### Context

With live auth state available, the `variant='open'|'protected'` prop that drove `RajaHeader`'s nav
list became redundant — the header could instead branch on the real `user` value from context,
regardless of which route group rendered it. This also directly fixed a bug found while tracing
`/play` in this session's earlier work: nav previously offered a static "Play" link; the header can
now decide the logo's destination (`/home` vs `/account`) from real auth state instead.

### Discussion points

Scoped link-by-link rather than assuming a clean merge:
- **Token Builder** (dev-only page) — dropped from the header entirely, still reachable by URL.
- **Catalog** — has deck-building functionality that only makes sense authed. Rather than making it
  globally "show whenever authed" (a bigger behavioral change), explicitly kept it gated to
  protected-layout pages only, via a narrow `showCatalog?: boolean` prop passed `true` only by
  `(protected)/layout.tsx` — called out as a deliberate half-measure ("come back to this in a bit"),
  not a reintroduction of the old multi-purpose `variant` prop.
- **FAQ** — confirmed dead (no route exists under `(open)/faq`, only a nav link + a `publicPaths`
  entry) — link and the `publicPaths` entry both removed; nothing to delete on disk.
- **Sign In / Logout** — noticed `RajaButton`'s default (`alt=false`) styling
  (`bg-raja-chrome-action`/`text-raja-chrome-bg`) was already pixel-identical to the bespoke pill
  className Sign In was using inline. Replaced both Sign In (`variant="link"`) and Logout
  (`variant="action"`, previously a raw `<button>`) with actual `RajaButton` instances instead of
  duplicating styling — direct application of the design guide's "build on base components" rule.

### Decision

`RajaHeader` no longer takes `variant`; it reads `useCurrentUser()` directly. Interface is now
`{ showCatalog?: boolean; className?: string }`. Logo href is `user ? '/account' : '/home'`. Rules
link always renders. Catalog renders only when `showCatalog` is passed. Sign In/Logout render as
`RajaButton`, conditioned on `!isLoading && (user ? ... : ...)`.

This is a breaking change to `RajaHeader`'s public props — the `/design` showcase
(`DesignShowcase.tsx`) demoed `RajaHeader variant="open"|"protected"` per
`record_layout_shell_and_ui_rename.md` §5, and had no `CurrentUserProvider` in its route group
(`(design)` has no `layout.tsx`). Updated the showcase block to the new props and wrapped it in its
own local `CurrentUserProvider` so the demo doesn't crash on `useCurrentUser` being called outside a
provider.

---

## 3. Simplifying the home page to a single auth-aware hero

### Context

Home previously had two full-width sections: `HomeHero` (two-column, dragon art, CTA row) and
`HomeFeature` ("Master the Board" turn-order explainer with three piece-art images). Asked to
reduce this to one centered panel with exactly two buttons.

### Discussion points

Asked whether "remove all icons" included the `raja.svg` wordmark image itself (used both in the
hero and, separately, in the header logo) — clarified as home-page-only scope: the header's own
logo image is unrelated to "simplify the home page" and stays as-is; only the hero's copy of
`raja.svg` becomes literal text "RAJA".

### Decision

- Deleted `HomeFeature.tsx` entirely; `Home.tsx` now renders only `HomeHero`.
- `HomeHero.tsx` rewritten: single centered `RajaSection alt` panel, `ancient_dragon.png` removed,
  `raja.svg` `<img>` replaced with a `font-serif` "RAJA" heading, all colors are `raja-chrome-*`
  tokens (no other palette). Button 1 is auth-conditional — "Sign In" (unauth) vs "Go to Account"
  (authed), both via `RajaButton variant="link"`; Button 2 is a fixed "Rules" link
  (`RajaButton variant="link" alt`).
