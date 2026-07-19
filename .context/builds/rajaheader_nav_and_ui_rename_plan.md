# Plan: RajaHeader nav rebuild + components/ui rename

Fixes findings 1 and 2 from `.context/audit/audit_frontend_structure_2026-07-19.md`. Finding 3 (session/Context pattern) deferred until backend auth context lands.

## Scope

**In:** rename `components/forms/` → `components/ui/`; rebuild `RajaHeader` as a nav bar (`variant: 'open' | 'protected'`, default `'open'`); new `(open)/layout.tsx` and `(protected)/layout.tsx` shared shells; drop `Home.tsx`'s old heading use of `RajaHeader`; relocate `/design` out of `(open)` into its own route group so it doesn't get double chrome; update `/design`'s demo block for the new `RajaHeader` API.

**Out / deferred:** `components/table/` (no table component exists yet — skip); wiring `RajaHeader`'s variant to live session state via `UserContext` (fix 3, blocked on backend auth context landing); building an actual `/auth` sign-in page (pre-existing gap — `Home.tsx` already links `/auth` with nothing there; not introduced by this plan); exact nav link copy/ordering — finalized at build time from the route inventory below.

**Migration impact:** none (frontend-only, no ORM).

**Build order:** `ui/` rename first (independent, lowest risk) → `RajaHeader` rebuild → group layouts → `Home.tsx`/`design` cleanup last (they depend on the rebuilt `RajaHeader`).

## Decisions (locked)

1. `components/forms/` → `components/ui/` (matches guide's `ui/` domain; its own example names `{Project}Button`). All 5 importers updated. `table/` not created.
2. `RajaHeader` becomes nav-only: `variant?: 'open' | 'protected'`, defaults to `'open'` when omitted. Old `text`/`em`/`alt` props removed entirely — old heading behavior is irrelevant now.
3. No live auth check yet. Variant is passed statically by whichever group layout renders it — `proxy.ts`/`proxy.config.ts` already edge-gates `(protected)` routes before render, so group placement is a safe signal today. Real session-driven variant is fix 3.
4. `Home.tsx` drops `RajaHeader` (was hero text) — replaced with a plain `<h1>` for "Raja", since heading behavior no longer exists on the component.
5. `/design` moves from `app/(open)/design/` → `app/(design)/design/` (new top-level route group; URL unchanged — groups don't affect the path) so it stays outside the new `(open)` shell. Its `RajaHeader` demo block is rewritten to show the two nav variants instead of the removed heading behavior.

## Frontend structure

```
frontend/
├── app/
│   ├── (open)/
│   │   ├── layout.tsx                 [new]        renders RajaHeader variant="open" + {children} + RajaFooter
│   │   ├── page.tsx                   [exists]
│   │   ├── home/
│   │   │   ├── page.tsx               [exists]
│   │   │   └── Home.tsx               [edit]        drop RajaHeader hero → plain <h1>
│   ├── (design)/                      [new group]
│   │   └── design/
│   │       ├── page.tsx               [move]
│   │       └── DesignShowcase.tsx     [move + edit]  update RajaHeader demo block
│   ├── (protected)/
│   │   ├── layout.tsx                 [new]        renders RajaHeader variant="protected" + {children} + RajaFooter
│   │   ├── play/
│   │   │   ├── PlayLanding.tsx        [edit]        import path only (@/components/ui/RajaButton)
│   │   │   └── room/_components/
│   │   │       ├── InviteLink.tsx     [edit]        import path only
│   │   │       └── ActionInput.tsx    [edit]        import path only
│   │   ├── token-builder/             [unchanged]
├── components/
│   ├── ui/                            [renamed from forms/, 8 files, content unchanged]
│   ├── layout/
│   │   ├── RajaHeader.tsx             [edit]        full rewrite: variant prop, nav links per variant
│   │   ├── RajaFooter.tsx             [unchanged]
│   │   ├── RajaLoader.tsx             [unchanged]
│   │   ├── RajaModal.tsx              [unchanged]
│   │   ├── RajaSection.tsx            [unchanged]
```

## Route inventory (nav link candidates — exact copy decided at build)

| Route | Group | Exists? | Candidate nav slot |
|---|---|---|---|
| `/`, `/home` | open | yes | logo/brand link |
| `/rules` | open | no — this session's actual target | nav link, once built |
| `/faq` | open | no | maybe, low priority |
| `/auth` | open | no page yet | "Sign In" — pre-existing dead link |
| `/play` | protected | yes | "Play" |
| `/token-builder` | protected | yes | "Token Builder" |
| — | protected | — | "Logout" → `utils/auth.ts:logout()` |

## Slice sequence

1. **`ui/` rename** — `git mv components/forms components/ui`; update 5 importers (`Home.tsx`, `PlayLanding.tsx`, `DesignShowcase.tsx`, `InviteLink.tsx`, `ActionInput.tsx`); grep confirms zero remaining `@/components/forms` references.
2. **`RajaHeader` rebuild** — new `RajaHeaderProps` (`variant?: 'open' | 'protected'`), nav markup + links per variant table above.
3. **Group layouts** — `(open)/layout.tsx` and `(protected)/layout.tsx`, each rendering `RajaHeader` + `{children}` + `RajaFooter`.
4. **Home + design cleanup** — `Home.tsx` hero → plain `<h1>`; relocate `design/` to `(design)/`; rewrite its `RajaHeader` demo block.

## Dependency chain

`ui/` rename is independent. `RajaHeader` rebuild blocks both group layouts (they render it). Group layouts block `Home.tsx` cleanup (removing its own header only makes sense once the shell exists). `/design` relocation is independent but should land after step 2 so its demo block reflects the final API.

## Risk flags

- `Home.tsx`'s "Sign In" button already points to `/auth`, which doesn't exist — pre-existing, not this plan's bug, but the new open-variant nav will surface a second dead link to the same place.
- Route inventory includes `/rules`, which doesn't exist yet — this session's actual downstream target; open-variant nav will link to it once built, 404 until then if added early.
- `proxy.config.ts` has `'rules'` in `publicPaths` missing its leading slash (`'/rules'` expected) — not touched by this plan, flagged since it's adjacent and directly affects whether `/rules` is actually treated as public by the proxy.
- Relocating `design/` changes its folder path — `DesignShowcase.tsx` uses `@/` aliasing throughout, no relative imports beyond its own folder, so this should resolve cleanly.

## Safe cuts (last → first)

1. `/design` relocation to `(design)/` — could stay under `(open)` and just accept double chrome temporarily.
2. `RajaHeader` variant-per-group wiring in layouts — could ship `RajaHeader` rebuilt but not yet mounted in either layout.
3. `components/ui/` rename — could stay as `forms/` a while longer; purely a compliance fix, no functional dependency on the rest.
