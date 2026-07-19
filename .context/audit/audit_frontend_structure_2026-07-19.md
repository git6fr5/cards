# Audit: frontend_structure — scope "the layout"

Guide: `guides/frontend_structure.md` (+ cross-referenced `guides/creating_frontend_components.md` where frontend_structure.md line 35 explicitly points there for the layout session/Context pattern).

Scope: `frontend/app/layout.tsx`, `frontend/components/layout/`, route-group folders (`(open)/`, `(protected)/`).

---

## Finding 1 — `components/` missing `ui/` and `table/` domains

**Rule:** frontend_structure.md:22-28 — root `components/` must split into three domains: `ui/`, `layout/`, `table/`.

**Actual:**
```
frontend/components/
├── forms/
├── layout/
```

`ui/` and `table/` don't exist. `forms/` is not one of the three named domains.

**Reasoning:** No comment or on-record decision found justifying the `forms/` domain in place of `ui/`/`table/`. Validity: **1/5**.

---

## Finding 2 — No route-group `layout.tsx` renders shared `RajaHeader`/`RajaFooter`

**Rule:** creating_frontend_components.md:82 (referenced from frontend_structure.md:35) — "Every route-group `layout.tsx` must render `{Project}Header` and `{Project}Footer` from `components/layout/` as the shared UI shell — not sketched per-page."

**Actual:** No `layout.tsx` exists under `(open)/` or `(protected)/` — only the root `app/layout.tsx`. `RajaHeader` is instead imported directly inside a page component:

```tsx
// app/(open)/home/Home.tsx
import RajaHeader from '@/components/layout/RajaHeader';
...
<RajaHeader alt text="Raja" className="font-garamond text-4xl tracking-wide" />
```

`RajaFooter` isn't used anywhere outside the `/design` showcase page.

**Reasoning:** No justification found. Validity: **0/5**.

---

## Finding 3 — Layout session/Context pattern not implemented

**Rule:** creating_frontend_components.md:84-90 (referenced from frontend_structure.md:35) — layout should call `checkSession()` once and share the user via a `UserContext.Provider`; pages/`{Project}Header` read the cached user via `useContext` instead of re-checking.

**Actual:** `app/layout.tsx` only renders `PieceFilterDefs` and `children` — no session fetch, no context provider:

```tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PieceFilterDefs />
        {children}
      </body>
    </html>
  );
}
```

`checkSession()` exists in `utils/auth.ts` but has zero call sites under `app/`. No `(protected)/layout.tsx` exists to gate the authenticated route group at all.

**Reasoning:** No on-record justification. Plausible this is simply not-yet-wired given the project's early stage (no other page calls `checkSession` either). Validity: **2/5**.

---

## Compliant (no finding)

- `components/layout/{RajaHeader,RajaFooter,RajaLoader,RajaModal,RajaSection}.tsx` — all correctly use the `Raja` project prefix per convention.
- `page.tsx` files inspected (`home`, `design`, `play`) correctly only import + render their page component, no extra logic.
- Route group boundaries (`(open)` vs `(protected)`) are respected — no pages sit directly under `/app/`.
