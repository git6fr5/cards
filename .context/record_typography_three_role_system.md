# Record: Typography three-role system

## Contents

1. [Typography audit surfaces the token gap](#1-typography-audit-surfaces-the-token-gap)
2. [Font selection — Lavishly Yours rejected for UI chrome](#2-font-selection--lavishly-yours-rejected-for-ui-chrome)
3. [Applying the fix across the codebase](#3-applying-the-fix-across-the-codebase)

---

## 1. Typography audit surfaces the token gap

**Context:** Ran `/audit frontend_typography` (whole project, after user clarified the shorthand — it wasn't in the skill's mapping table despite the guide file existing) to check font usage against `guides/frontend_typography.md`'s three-role system (serif/sans-serif/monospace, function-named tokens).

**Discussion points:** None — audit ran clean, findings written to `.context/audit/audit_frontend_typography_2026-07-19.md`.

**Decision:** Found the project had exactly one font token, `--font-family-garamond` (named by typeface, not role), with `body` defaulting to it globally — meaning every UI atom in `components/ui/` and most status/error/label text across the app rendered serif by default, inverting the guide's "sans-serif is default for UI chrome" rule. Five findings total, including the just-built `RajaHeader`'s own nav links (self-flagged). One item flagged but not treated as a violation: `AbilityText.tsx`'s engraved piece-ability text, kept serif as a plausible deliberate game-art choice matching `NameText.tsx`'s identity styling.

---

## 2. Font selection — Lavishly Yours rejected for UI chrome

**Context:** User proposed three Google Fonts to fill the role tokens: Lavishly Yours (sans-serif), Playfair Display (serif), Major Mono Display (monospace).

**Discussion points:** Flagged that Lavishly Yours is a cursive/calligraphy script font (Google's own category: Feeling → Expressive → Fancy), not a sans-serif — and the guide's sans-serif role is explicitly for dense, fast-scanned UI text (buttons, labels, error messages). Assigning it to that role would make things like `TokenBuilder.tsx`'s error text or the uppercase panel labels barely legible. Offered options: keep it anyway, reassign it to an accent/serif role, or pick a different sans-serif.

**Decision:** User replaced the sans-serif pick with DM Sans; Lavishly Yours was dropped entirely, not used anywhere. Final set: serif = Playfair Display, sans-serif = DM Sans, monospace = Major Mono Display.

---

## 3. Applying the fix across the codebase

**Context:** `/build` (no plan step — same-session direct build off the just-locked font decisions and the standing audit findings).

**Discussion points:** While loading `guides/frontend_design_base.md` for this build, found it explicitly confirms the three-token naming (`--font-family-serif/sans-serif/monospace`) matching the audit exactly, and that `components/ui/` (not a separate `forms/`) is spec-correct — validating the prior session's rename. Also surfaced a separate, unrelated spec conflict: the guide's canonical `{Project}Header` uses `alt?: boolean` + a hardcoded nav list, not the `variant: 'open' | 'protected'` prop `RajaHeader` was built with last session. Left untouched — out of scope for a typography-only build, flagged for a future pass.

**Decision:** 
- `globals.css`: replaced the EB Garamond import with a combined Google Fonts import for all three families; replaced `--font-family-garamond` with `--font-family-serif`, `--font-family-sans-serif`, `--font-family-monospace`; flipped `body`'s base font-family from garamond to `var(--font-family-sans-serif)`.
- Every `font-garamond` call site reclassified per the guide's decision heuristic: page titles, logo wordmark, and piece-name/ability engraved text → `font-serif`; buttons, nav links, panel/section labels, status/error/empty-state text → `font-sans-serif` (added explicitly even where it's now the default, matching the guide's own canonical footer example).
- The one `font-mono` usage (a `<code>` tag in `/design`'s intro copy) switched to the project's `font-monospace` token.
- `/design`'s Typography block rewritten from a single Garamond specimen into three specimens (one per role), and two `RajaSection` demo headings that were missing a font class entirely gained `font-serif`.
- `tsc --noEmit` clean after all edits.
