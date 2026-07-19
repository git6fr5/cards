# Record: Layout shell + components/ui rename

## Contents

1. [Frontend structure audit](#1-frontend-structure-audit)
2. [Scoping fixes 1 & 2, deferring fix 3](#2-scoping-fixes-1--2-deferring-fix-3)
3. [RajaHeader: heading atom vs nav bar conflict](#3-rajaheader-heading-atom-vs-nav-bar-conflict)
4. [Nav variant driven by route group, not live Context](#4-nav-variant-driven-by-route-group-not-live-context)
5. [/design relocated out of (open) to avoid double chrome](#5-design-relocated-out-of-open-to-avoid-double-chrome)

---

## 1. Frontend structure audit

**Context:** Ran `/audit frontend_structure` scoped to "the layout" ahead of building the `/rules` page, to catch structural drift before adding a new route. Audited `frontend/app/layout.tsx`, `frontend/components/layout/`, and route-group folders against `guides/frontend_structure.md`.

**Discussion points:** None — audit ran clean, findings written to `.context/audit/audit_frontend_structure_2026-07-19.md`.

**Decision:** Three findings surfaced:
1. `components/` had `forms/` + `layout/`, missing the guide's `ui/`/`table/` domain split.
2. No route-group `layout.tsx` rendered a shared `{Project}Header`/`{Project}Footer` shell — `RajaHeader` was instead imported ad hoc inside `Home.tsx`.
3. No session/Context pattern (`checkSession()` + `UserContext.Provider`) implemented anywhere.

User chose to fix 1 and 2 immediately; 3 is deferred until the backend auth context (being built in parallel) lands.

---

## 2. Scoping fixes 1 & 2, deferring fix 3

**Context:** `/plan` was run to scope findings 1 and 2 into an atomic, buildable plan. Surveyed the actual pages (`Home.tsx`, `PlayLanding.tsx`, `PlayRoom`, `TokenBuilder`, `/design`) and found none of them look like nav-bar pages today — all full-bleed, self-contained designs. Forcing a persistent Header/Footer shell wasn't just a file-structure fix, it was a visual design change, so it needed explicit decisions rather than silent compliance.

**Discussion points:** Flagged that Home's hero currently *is* `RajaHeader` (used as a big heading), and that `/design` already demos `RajaHeader`/`RajaFooter` inline — either could double up with a new shared shell. User answered directly: add nav to `RajaHeader`, make it auth-aware between protected/open, exclude `table/` (no table component exists yet), and exclude `/design` from double chrome.

**Decision:** Locked scope — rename `components/forms/` → `components/ui/`; rebuild `RajaHeader` as the persistent nav; add `(open)/layout.tsx` and `(protected)/layout.tsx` shells; relocate `/design` to its own route group. Deliverable: plan only, no timeline.

---

## 3. RajaHeader: heading atom vs nav bar conflict

**Context:** Before drafting the file tree, noticed `RajaHeader` as it existed was a plain `<h2>` section-heading atom (`text`, optional `em` for an emphasized substring) — used inline for things like Home's "Raja" hero text and demoed in `/design` explicitly as a heading component, not a nav bar.

**Discussion points:** Raised this as a real single-responsibility conflict before locking the plan — layering nav-bar behavior (logo, links, auth-aware options) onto the same component via a `variant` prop would leave `text`/`em` meaningless whenever `variant` was set, i.e. one component doing two unrelated jobs. Offered two options: overload `RajaHeader` with a `variant` prop where `undefined` falls back to old heading behavior, or split into a new `RajaNav.tsx` and leave `RajaHeader` untouched. Recommended the split.

**Decision:** User rejected both middle-ground options — old heading functionality is "irrelevant now," so `RajaHeader` was fully overridden rather than overloaded: `text`/`em`/`alt` removed entirely, replaced by `variant?: 'open' | 'protected'` (defaults to `'open'`). No backward-compat shim. This meant `Home.tsx`'s hero and `/design`'s heading demos both had to be rewritten to not depend on the removed props.

---

## 4. Nav variant driven by route group, not live Context

**Context:** User wanted `RajaHeader` to "check Context to see if authenticated and swap nav options" between protected and open — but that's exactly the session/Context pattern (fix 3), which is explicitly deferred until the backend auth context lands. Needed to reconcile the request with the sequencing the user had already set.

**Discussion points:** Found `frontend/proxy.config.ts` / `frontend/proxy.ts` already edge-gate `(protected)` routes before render (reads `publicPaths`, checks the session cookie server-side ahead of the app). This meant route-group placement is already a reliable authenticated/unauthenticated signal today, without needing `UserContext` at all.

**Decision:** `RajaHeader`'s `variant` is passed statically by whichever group layout renders it (`(open)/layout.tsx` → `variant="open"`, `(protected)/layout.tsx` → `variant="protected"`) rather than read from a live Context. This fully decouples fix 2 from fix 3 — wiring `RajaHeader` to real session state (e.g. showing the user's display name) stays deferred to when fix 3 lands.

**Also flagged (not fixed, out of scope):** `proxy.config.ts`'s `publicPaths` has `'rules'` without a leading slash (`'/rules'` expected) — directly relevant to whether the upcoming `/rules` page is actually treated as public, but left untouched per the hard-stop rule against editing outside an explicit build scope.

---

## 5. /design relocated out of (open) to avoid double chrome

**Context:** `/design` (the component showcase page) already renders `RajaHeader`/`RajaFooter` inline as demo blocks. Once `(open)/layout.tsx` wraps every page in that group with a real nav shell, `/design` would render chrome twice — once from the group layout, once from its own demo content.

**Discussion points:** None — user confirmed exclusion (answer "3. yes") without further back-and-forth.

**Decision:** Moved `app/(open)/design/` → `app/(design)/design/`, a new top-level route group with no `layout.tsx`. URL stays `/design` (route groups don't affect the path). Its `RajaHeader` demo block was rewritten to show the `open`/`protected` nav variants instead of the removed heading props; two other spots using `RajaHeader` as a plain section-heading label inside the `RajaSection` demo were replaced with inline `<h2>` markup carrying the same visual style.
