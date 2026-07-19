# Audit: `components` (guides/creating_frontend_components.md) — 2026-07-19

**Trigger:** user report — footer appears higher than viewport bottom on `/home` and `/rules`, with unstyled blank space below it.

**Scope:** `app/layout.tsx`, `app/(open)/layout.tsx`, `app/(protected)/layout.tsx`, `components/layout/*.tsx` (5 files), `components/ui/*.tsx` (8 files).

---

## Finding 1 — Route shell has no height-establishing wrapper, so Footer isn't pinned to viewport bottom

**Rule (guides/creating_frontend_components.md:82):**
> `layout.tsx` constraint: layout files only set up shared UI shell (nav, wrappers)... Every route-group `layout.tsx` must render `{Project}Header` and `{Project}Footer` from `components/layout/` as the shared UI shell — not sketched per-page.

**Violating code:**

`app/layout.tsx:14-17`
```tsx
<body>
  <PieceFilterDefs />
  {children}
</body>
```

`app/(open)/layout.tsx:6-17` and `app/(protected)/layout.tsx:5-18` (identical shape):
```tsx
return (
  <>
    <RajaHeader variant="open" />
    {children}
    <RajaFooter>...</RajaFooter>
  </>
);
```

Grepped all three layout files plus `RajaHeader.tsx`, `RajaFooter.tsx`, `RajaSection.tsx` for `min-h-screen`, `flex-col`, `mt-auto` — zero matches anywhere in the shell chain.

**Effect:** `body` has no `min-height`/flex structure and `RajaFooter` has no `mt-auto`/`flex-1` sibling to push against. When page content (Header + page body) is shorter than the viewport, `RajaFooter` renders immediately after the content instead of at the bottom of the viewport — it sits "higher than it's supposed to be," and the remaining viewport space below it is unstyled (compounds with the separately-found missing `body { background-color }` in `globals.css`, so that gap also renders plain white).

**Rule reference caveat:** the guide's `layout.tsx` constraint mandates *that* Header/Footer render from the route-group shell, but doesn't spell out the height mechanism — this finding reads that omission as the shell being incomplete relative to its own stated purpose ("shared UI shell"), not a literal one-line rule violation. Flagging as the audit's top finding since it's the direct root cause of what you reported.

## Reasoning (Step 5)

No comment, prior record, or `.context/` entry documents this as a deliberate choice. Not found in `record_home_page_design.md`, `record_rules_page_build.md`, or any other record. **Justification rating: 0.**

## Everything else in scope — clean

- Props interfaces: all 13 files use `{ComponentName}Props` naming exactly — compliant.
- No inline `style={{...}}` in any scoped file.
- No raw hex in `className` strings.
- No arrow-function default exports.
- No `={true}` boolean-prop violations.
- `alt` boolean is first prop where applicable (`RajaHeader`, `RajaFooter`, `RajaSection`, `RajaButton`, `RajaCheckbox`, `RajaRadio`, `RajaLoader`).
- `'use client'` correctly present only on components using hooks/browser APIs (form inputs); layout shells (`RajaHeader`, `RajaSection`, `RajaFooter`) correctly omit it except `RajaHeader` (uses `useRouter`, correctly marked).

---

## Suggested fix (not applied — audit is read-only)

Establish the flex-column shell once at the root, since `body` can only be styled from `app/layout.tsx`:

1. `app/layout.tsx` — `<body className="min-h-screen flex flex-col">`.
2. `app/(open)/layout.tsx` and `app/(protected)/layout.tsx` — wrap `{children}` in `<main className="flex-1">` (or add `mt-auto` directly to the `<RajaFooter>` call) so Footer is pushed to the bottom on short pages, flush after content on tall ones.

Combine with the earlier-flagged missing `body { background-color: var(--color-raja-chrome-bg); }` in `globals.css` — same symptom cluster, same fix pass.

Say "build it" / "fix it" / `/build` to apply.
