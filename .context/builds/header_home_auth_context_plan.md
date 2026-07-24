# Plan: Unified auth-aware header + simplified home page

## Scope

In: `RajaHeader` unified nav (drop `variant` prop, branch on live auth via new `UserContext`), logo
destination by auth, Sign In/Logout as `RajaButton`, FAQ nav+publicPath removal, Home page
simplification to single centered hero, chrome-only home palette, new
`CurrentUserProvider`/`useCurrentUser` context wired into both layouts.

Out (deferred): merging Catalog's visibility logic beyond route-group gating — stays
`(protected)`-only for now, revisited later.

No backend changes, no ORM, no migration.

## Decisions (locked)

1. `RajaHeader` drops `variant: 'open'|'protected'` entirely — single nav, branches only on
   `useCurrentUser()`.
2. Token Builder link removed from header (dev-only page, still reachable by URL). Catalog link
   kept, gated by a narrow one-purpose `showCatalog?: boolean` prop passed `true` only by
   `(protected)/layout.tsx` — not a reintroduction of the old `variant` prop, just a transitional
   flag until Catalog's own auth logic is revisited.
3. `/faq` has no actual route today (only a dead nav link + `publicPaths` entry) — remove both, no
   page to delete.
4. Home hero: drop `ancient_dragon.png`, replace `raja.svg` `<img>` with literal text "RAJA"
   (`font-serif`, same visual weight as other hero wordmarks). Header's own `raja.svg` logo is
   unchanged (out of scope — that request was "simplify home page" specifically).
5. Sign In / Logout both become actual `RajaButton` instances — `variant="link" href="/auth"` and
   `variant="action" onClick={logout}`, default `alt=false` (already renders
   `bg-raja-chrome-action`/`text-raja-chrome-bg`) — replacing the bespoke pill className and raw
   `<button>`.
6. `(open)/layout.tsx` gets `CurrentUserProvider` **without** the wills `AuthGate` redirect (open
   pages must render logged-out). `(protected)/layout.tsx` gets the same provider; its existing
   per-page auth checks are untouched (out of scope to refactor those now).
7. Commit rolls into the previous `/play`-retirement changes as one commit at build time.

## Frontend — files touched

```
frontend/hooks/useCurrentUser.tsx                          [new]  CurrentUserProvider + useCurrentUser, mirrors wills pattern, sources utils/auth.ts checkSession()
frontend/app/(open)/layout.tsx                              [edit] wrap children in CurrentUserProvider
frontend/app/(protected)/layout.tsx                         [edit] wrap children in CurrentUserProvider
frontend/components/layout/RajaHeader.tsx                   [edit] drop variant prop; useCurrentUser(); logo href by auth; Rules always; Catalog via showCatalog prop; Sign In/Logout as RajaButton
frontend/proxy.config.ts                                    [edit] remove '/faq' from publicPaths
frontend/app/(open)/home/_components/HomeHero.tsx           [edit] single centered panel, strip art, text wordmark, two buttons (Sign In/Go to Account via RajaButton + Rules), chrome tokens only
frontend/app/(open)/home/_components/HomeFeature.tsx        [delete] "Master the Board" section
frontend/app/(open)/home/Home.tsx                           [edit] render HomeHero only
```

Also in scope (found during survey, not in original file list but required by decision 1):
- `frontend/app/(design)/design/` — showcase page demos `RajaHeader`'s `variant` prop per
  `record_layout_shell_and_ui_rename.md` §5; must update to match the new no-variant interface.

## Route inventory (frontend)

| Route | Change |
|---|---|
| `/home` | Simplified hero, chrome-only, auth-aware CTA |
| `/rules` | No content change; now reachable with correct header auth state |
| `/faq` | Nav link + publicPath removed (route never existed) |
| `/account`, `/catalog`, `/token-builder` | No content change; header stops linking Token Builder |

## Slice sequence

1. `useCurrentUser.tsx` hook (standalone, no dependents yet).
2. Wire into both `layout.tsx` files.
3. Rebuild `RajaHeader` against the new hook (logo, Rules, Catalog flag, Sign In/Logout buttons).
4. Update `/design` showcase to match the new `RajaHeader` interface.
5. `proxy.config.ts` — drop `/faq`.
6. `Home.tsx` / `HomeHero.tsx` / delete `HomeFeature.tsx`.

## Dependency chain

Hook → layouts → header → design showcase (consumes header) → home page (independent of header
internals, but sequenced last since it reuses the same `RajaButton` pattern for consistency).

## Risk flags

- `(open)` pages currently assume no session fetch; adding `checkSession()` on every open-route
  mount adds one `/users/me` round trip even for anonymous visitors — acceptable (matches wills),
  but note it's a new network call on the marketing page.
- Removing `variant` prop is a breaking change to `RajaHeader`'s public interface — every caller
  needs updating: `(open)/layout.tsx`, `(protected)/layout.tsx`, and `/design`'s showcase block.
- `showCatalog` prop is a deliberate half-measure per "come back to this" — not the final design.

## Safe cuts (last → first)

1. RajaButton reuse for Sign In/Logout (could stay bespoke className) — cut last resort only,
   explicitly requested.
2. `showCatalog` transitional prop — could instead just delete Catalog from header now and re-add
   later; kept per "keep for now."
3. Chrome-only home palette — already all tokens are chrome/raja-* per audit, minimal actual cut
   surface.
4. Everything else is core to the explicit ask — no further cuts.
