## Contents

1. [Chrome palette has an intentional mauve undertone](#1-chrome-palette-has-an-intentional-mauve-undertone)
2. [Wrong-scope edit: globals.css token values instead of HomeHero's alt flip](#2-wrong-scope-edit-globalscss-token-values-instead-of-homeheros-alt-flip)
3. [Header never had sticky positioning](#3-header-never-had-sticky-positioning)
4. [Auth page was the last surviving mauve-dark surface](#4-auth-page-was-the-last-surviving-mauve-dark-surface)

---

## 1. Chrome palette has an intentional mauve undertone

### Context

Asked whether "purple" seen on the home page was part of the chrome colors. Checked
`globals.css` — `chrome-panel` (`#E1DCE4`), `chrome-border` (`#C4BFC8`), `chrome-muted`
(`#6B6772`), `chrome-text` (`#3D3A42`) all carry a mauve/purple-grey undertone by design; it's
baked into the token set itself, not a stray off-palette color.

### Discussion points

None at this point — factual lookup.

### Decision

No change made here; this was groundwork for the next section's (initially misdirected) fix.

---

## 2. Wrong-scope edit: globals.css token values instead of HomeHero's alt flip

### Context

Follow-up ask ("make it more black text on white") was misread as wanting new hex values for the
shared `chrome-bg`/`chrome-text` tokens globally in `globals.css` — proposed and, after "2" was
given as a terse answer to a scope question, edited `globals.css` (`chrome-bg` → `#F5F5F5`,
`chrome-text` → `#1A1A1A`).

### Discussion points

User reacted sharply ("what the fuck are you doing... you weren't supposed to edit the globals.css")
and clarified the actual ask: on the home page only, swap which *token slot* `HomeHero` uses — bg
should render `chrome-bg`, "RAJA" text should render `chrome-text` — not change what those tokens'
hex values are. `HomeHero` was using `RajaSection alt` (which maps `alt` → `bg-raja-chrome-text`,
a dark background) with `text-raja-chrome-bg` on the heading/tagline (light-on-dark) — the inverse
of the light-bg/dark-text look wanted. The fix was a component-level prop change, not a
design-token-level value change.

### Decision

- Reverted `globals.css` immediately — both `chrome-bg` and `chrome-text` back to their original
  hex values (`#F1EFF2`, `#3D3A42`).
- `HomeHero.tsx`: dropped `alt` from `RajaSection` (bg now defaults to `chrome-bg`), heading
  changed `text-raja-chrome-bg` → `text-raja-chrome-text`, and the tagline (previously
  `text-raja-chrome-bg opacity-muted`, which would've gone invisible — white-on-white — once the
  background flipped light) changed to `text-raja-chrome-muted` to preserve contrast. This last
  change wasn't explicitly requested but was a required consequence of the background flip, not
  scope creep.
- Confirmed via `/quick-edit` gating: single file (`globals.css`), snippet/values already shown
  and confirmed in conversation — both conditions held, so the revert itself didn't need a fresh
  `/build`.

**Lesson for future turns:** when a user names a specific token (e.g. "chrome-bg") as the fix
target, that's identifying *which token to apply where*, not authorization to redefine the token's
value in `globals.css` — token redefinition is a global, blast-radius-wide change and needs to be
proposed explicitly as such, not inferred from a component-level color complaint.

---

## 3. Header never had sticky positioning

### Context

After the HomeHero fix landed (confirmed via screenshot once the user hard-refreshed past a stale
cached page), user separately flagged: header and footer aren't sticky.

### Discussion points

Checked both `RajaHeader.tsx` and `RajaFooter.tsx` (current and pre-today's-edits versions) — no
`sticky`/`top-0`/`z-*` classes ever existed on either. `guides/frontend_design_base.md` documents
Header/Footer as self-positioning ("sticky, z-nav, border"), but this was never actually
implemented. The earlier `record_layout_shell_footer_pin.md` fix solved a different symptom
(footer sitting above the viewport bottom on short pages) via flex-push
(`min-h-screen flex-col` + `<main className="flex-1">`), not `position: sticky` — so footer-at-
bottom-of-short-page already worked; header staying visible while scrolling a long page (e.g.
`/rules`) never did. Found an unused `--z-index-pin: 1` token already defined in `globals.css`
whose name matches this exact purpose.

Proposed making the header `sticky top-0 z-pin`, and explicitly recommended *not* making the
footer `position: sticky` too — that would fight the existing flex-push behavior, pinning it
mid-scroll on long pages instead of letting it sit after content / flush to the bottom on short
ones. User invoked `/build` without answering the two clarifying questions directly; proceeded
with the stated recommended default (header sticky, footer unchanged) per auto-mode bias toward
not blocking on already-flagged defaults — then explicitly asked mid-build to pin the footer too,
overriding that recommendation.

### Decision

`RajaHeader.tsx`: `<header>` className gained `sticky top-0 z-pin`. `RajaFooter.tsx`: `<footer>`
className also gained `sticky bottom-0 z-pin`, per explicit request overriding the flagged
flex-push tradeoff (footer will now pin to viewport bottom mid-scroll on long pages, not just sit
flush after content on short ones).

---

## 4. Auth page was the last surviving mauve-dark surface

### Context

User flagged sign-in as still mauve, and separately asked directly why fixes kept missing
instances of the same pattern instead of catching them all at once. Grepped every `RajaSection alt`
usage app-wide (the `alt` prop maps to `bg-raja-chrome-text`, the mauve-dark token, wherever it's
used as a full-bleed section background) — found exactly one real instance left:
`app/(open)/auth/Auth.tsx`, a page untouched by every prior fix in this session because none of
those fixes were scoped to it.

### Discussion points

Self-diagnosed the actual pattern behind the repeated misses, since asked directly: every fix so
far was scoped to exactly the one component named in the triggering message (`HomeHero`, then
`RajaHeader`/`RajaFooter`), never cross-checked against a grep for the same underlying token
pattern elsewhere in the app. Attributed this to the combination of the global CLAUDE.md hard-stop
build gate (biases toward the smallest literal-scope reading of each request) and caveman-mode
terseness (skips proactively surfacing "this pattern also appears in N other places") — not a
one-off mistake, a structural bias in how requests were being scoped. Also separately confirmed
`auth/admin/page.tsx` (a localhost-only dev bypass tool) uses raw Tailwind colors, not chrome
tokens at all — flagged as a distinct, lower-priority, non-user-facing issue rather than fixed.

### Decision

`Auth.tsx` dropped `alt` from `RajaSection` (bg → `chrome-bg`, matching `HomeHero`). `LoginForm.tsx`
and `SignupForm.tsx`: heading `text-raja-chrome-bg` → `text-raja-chrome-text`; footer prompt text
`text-raja-chrome-bg/60` → `text-raja-chrome-muted`; `RajaTextField`'s `alt` prop removed from every
field (label color was the only thing `alt` controlled there — inputs were already
`chrome-bg`/`chrome-text` regardless). `auth/admin/page.tsx` left as-is, out of scope.
