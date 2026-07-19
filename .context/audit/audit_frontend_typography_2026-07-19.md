# Audit: frontend_typography — whole project

Guide: `guides/frontend_typography.md`. Scope: whole `frontend/` project (all `.tsx` under `app/`, `components/`, plus `app/globals.css` for the token definitions the guide governs).

Rules extracted: three-role naming (serif/sans-serif/monospace, function-named not typeface-named); no 4th family without a concrete gap; serif for editorial/identity/titles only, used sparingly; sans-serif as the default for UI chrome; monospace for numeric/tabular/identifier content; decision heuristic (monospace → serif → sans-serif); anti-patterns (serif on dense data surfaces, monospace on prose, per-call-site badge styling instead of shared atom, unjustified 4th family).

---

## Finding 1 — Only one font-family token exists, named by typeface not function

**Rule:** frontend_typography.md:8 — "Font families are named by **function**, not literal typeface name: `--font-family-serif`, `--font-family-sans-serif`, `--font-family-monospace`."

**Actual** (`app/globals.css:55`):
```css
--font-family-garamond: 'EB Garamond', serif;
```
No `--font-family-sans-serif` or `--font-family-monospace` token exists anywhere in `@theme inline`. `--font-family-garamond` is named after the literal typeface, not a role.

**Reasoning:** No on-record justification. Validity: **0/5**.

---

## Finding 2 — Serif set as the global default, inverting the guide's default-is-sans-serif rule

**Rule:** frontend_typography.md:16 — serif is "used sparingly"; frontend_typography.md:30 — "the default typeface for functional UI text... If content doesn't clearly belong to serif or monospace, it's sans-serif."

**Actual** (`app/globals.css:93-97`):
```css
@layer base {
  body {
    font-family: var(--font-family-garamond);
  }
}
```
This makes the single serif-ish typeface the default for *everything*, including every shared UI atom in `components/ui/` (buttons, text fields, dropdowns, checkboxes, radios, textarea, file upload, date picker — none of them set an explicit font class, confirmed by grep) and non-title UI chrome across pages. Representative call sites that are clearly UI chrome (status/error/empty-state text, not titles or identity content) but render serif:

```tsx
// app/(protected)/token-builder/TokenBuilder.tsx:51
<p className="font-garamond text-sm text-raja-crimson">{error}</p>
// app/(protected)/token-builder/TokenBuilder.tsx:59
<p className="font-garamond text-sm text-raja-grey-muted">No tokens found.</p>
// app/(protected)/play/room/PlayRoom.tsx:110
<p className="font-garamond text-sm text-raja-crimson">{error ?? 'Game not found'}</p>
// app/(protected)/play/room/PlayRoom.tsx:146,149
<p className="font-garamond text-xs text-raja-grey-light ...">{infoText}</p>
<p className="font-garamond text-xs text-raja-crimson">{error}</p>
// app/(protected)/play/room/_components/GameLogPanel.tsx:12,15
<p className="font-garamond text-xs text-raja-grey-muted">No moves yet</p>
<p key={i} className="font-garamond text-xs text-raja-grey-light">...
// app/(protected)/play/room/_components/TurnStatus.tsx:14
<p className="font-garamond text-xs text-raja-grey-muted">{lastOutcome}</p>
// app/(protected)/play/PlayLanding.tsx:34
<p className="font-garamond text-sm text-raja-chrome-error">{error}</p>
```

**Reasoning:** No on-record justification. Validity: **0/5**.

---

## Finding 3 — Uppercase panel/section labels use serif instead of sans-serif

**Rule:** frontend_typography.md:33 ("uppercase small-caps section labels") and :37 ("Sidebar/panel section titles") — both explicitly named as sans-serif use cases.

**Actual:**
```tsx
// app/(protected)/play/room/_components/PlayerPanel.tsx:18
<span className="font-garamond text-xs uppercase tracking-wide text-raja-grey-muted">
// app/(protected)/play/room/_components/GameLogPanel.tsx:8
<span className="font-garamond text-xs uppercase tracking-wide text-raja-grey-muted">
// app/(protected)/play/room/_components/TurnStatus.tsx:10
<span className="font-garamond text-xs uppercase tracking-wide text-raja-grey-muted">
```
These are the exact pattern the guide names as a sans-serif example, styled serif instead.

**Reasoning:** No on-record justification. Validity: **0/5**.

---

## Finding 4 — RajaHeader's new nav links inherit serif, no sans-serif override

**Rule:** frontend_typography.md:35 — "Buttons, nav links, filter controls" → sans-serif.

**Actual** (`components/layout/RajaHeader.tsx:34-44`, from this session's own prior commit):
```tsx
<Link href="/home" className="font-garamond text-xl text-raja-chrome-text tracking-wide">
  Raja
</Link>
<nav className="flex items-center gap-6">
  {links.map((link) => (
    <Link key={link.href} href={link.href} className="text-sm text-raja-chrome-text hover:opacity-90">
      {link.text}
    </Link>
  ))}
  ...
```
The brand/logo `Link` using serif is actually correct per frontend_typography.md:20 ("Logo wordmark"). The nav link list itself has no explicit font class and inherits the global serif default (Finding 2) — should be sans-serif per the nav-links rule.

**Reasoning:** Same systemic root cause as Finding 2, called out separately since it's this session's own new code. Validity: **0/5**.

---

## Finding 5 — No monospace token; only usage relies on Tailwind's default stack

**Rule:** frontend_typography.md:41-50 (monospace role) + :8 (token naming).

**Actual** (`app/(design)/design/DesignShowcase.tsx:96`):
```tsx
Every shared <code className="font-mono text-raja-chrome-action">Raja*</code> component, rendered live...
```
This is the only monospace-styled text in the codebase, and it uses Tailwind's built-in `font-mono` utility rather than a project `--font-family-monospace` token, because no such token exists (Finding 1). The call-site choice itself — monospace for a code/identifier reference — is compliant with the guide's intent; the gap is purely the missing token.

**Reasoning:** Tied to Finding 1. Validity: **0/5** for the missing token; no violation on the content choice itself.

---

## Flagged, not a finding — piece coin engraved text

`app/_components/Piece/NameText.tsx:20` and `app/_components/Piece/AbilityText.tsx:20` both use `font-garamond` for text engraved around a piece coin's edge (identical emboss/engrave rendering technique). `NameText` renders a piece's own name — correctly serif per frontend_typography.md:21 ("item's own name/subject/title"). `AbilityText` renders the piece's ability description, which is less clearly identity content, but both are rendered with the same physical-object engraving technique as a deliberate game-domain aesthetic choice, not generic app UI chrome.

**Reasoning:** Plausible deliberate choice tied to the piece's physical-object art direction, not an oversight. Validity: **3/5** — flagging for awareness, not recommending a change without confirmation.

---

## Compliant (no finding)

- Page-level `h1`/`h2` titles correctly use serif: `PlayLanding.tsx:30` ("Raja"), `Home.tsx:10` ("Raja"), `DesignShowcase.tsx:60,94,117,118` (block titles, page title, font specimen).
- `NameText.tsx` (piece's own name) correctly serif per identity/title rule.
