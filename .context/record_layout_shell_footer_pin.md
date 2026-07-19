# Record: Layout Shell Footer Pinning Fix

## Contents
1. [Footer not pinned to viewport bottom on short pages](#1-footer-not-pinned-to-viewport-bottom-on-short-pages)

---

## 1. Footer not pinned to viewport bottom on short pages

### Context
While reviewing the redesigned home page (see `record_home_page_design.md`), user noticed a visual bug: the footer sat higher than the bottom of the viewport on `/home`, with unstyled blank white space below it, and flagged the same symptom on `/rules`. First pass (before audit) found half the cause — `body` in `globals.css` had no `background-color`, so any gap below short content rendered plain white. User then asked to run `/audit` against whichever guide was relevant, without naming it.

### Discussion points
Resolved the audit target to `guides/creating_frontend_components.md` (shorthand `components`) — it's the guide holding the `layout.tsx` constraint ("every route-group `layout.tsx` must render `{Project}Header` and `{Project}Footer`... as the shared UI shell"). The audit found the deeper root cause: no file in the shell chain (`app/layout.tsx`, `app/(open)/layout.tsx`, `app/(protected)/layout.tsx`, `RajaFooter.tsx`, `RajaSection.tsx`) established a `min-h-screen`/`flex-col` structure, so `RajaFooter` had nothing to push it to the bottom on pages shorter than the viewport. Noted this as a gap relative to the guide's stated intent ("shared UI shell") rather than a literal one-line rule violation, since no guide spells out the height mechanism explicitly. No prior record or comment justified the omission — rated 0.

### Decision
Fixed both symptoms in one pass:
- `app/layout.tsx` — `body` gets `className="flex min-h-screen flex-col"`, establishing the shell height at the one place that can style `body`.
- `app/(open)/layout.tsx` and `app/(protected)/layout.tsx` — `{children}` wrapped in `<main className="flex-1">` so the footer is pushed to the bottom of the viewport on short pages and sits flush after content on tall ones.
- `globals.css` — `body` gets `background-color: var(--color-raja-chrome-bg)` so the flex-filled gap (when a page is exactly viewport height with no bottom section) reads as chrome background, not default white.

Fixes both route groups identically since the bug was systemic to the shared shell, not page-specific.
