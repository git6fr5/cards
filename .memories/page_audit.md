---
name: Page Audit
description: Step-by-step instructions for auditing a specific frontend page — style guide compliance, API validation, component extraction, base component opportunities, Tailwind token usage violations, new token suggestions, and floating component audit
type: feedback
originSessionId: 6fdaad63-ec1e-479c-8e5f-674b420f2a73
---
## When to run

Only run a page audit when the user explicitly names a page (e.g. "audit the dashboard page", "run a page audit on `/account`"). Never run this speculatively across multiple pages at once.

---

## Steps

### 1. Style guide compliance
Read the page file and all components it directly imports. Check each against the style guide memory:
- File order (imports → interfaces → component)
- Handler naming conventions (`handle` prefix for events, plain verb for internal)
- `useState` typing
- `try/catch/finally` pattern in async handlers
- No raw hex codes, no inline CSS variables
- `_components/` used for page-local components (not `components/`)
- Component body order (hooks → state → handlers → effects → return)

Flag every violation with the file and line reference.

### 2. API call validation
For every API call made by the page or its components:
- Confirm the route exists in the backend
- Confirm the HTTP method and path match
- Confirm the request shape matches what the backend expects
- Confirm the response shape matches what the frontend is reading

Flag any mismatches, missing routes, or unhandled response fields.

### 3. Component extraction opportunities
"Page component" means a component that lives in the page's `_components/` subfolder (e.g. `app/(protected)/_components/`). The underscore prefix opts the folder out of Next.js routing.

Read the JSX and flag any sections that are large enough or self-contained enough to extract into a page component. A good candidate:
- Has its own clear responsibility
- Is more than ~20 lines of JSX
- Would be reused within the same page, or makes the parent significantly easier to read

For each candidate, name what the component would be called and what props it would take.

### 4. Base component opportunities
Cross-reference every `<input>`, `<textarea>`, `<select>`, `<button>`, `<a>`, modal pattern, header, footer, or section against the {Project} design system (see design base memory). Flag anywhere a raw HTML element or hand-rolled pattern could be replaced with a `{Project}*` base component.

### 5. Tailwind token usage
Check every class in the page and its components against the tokens defined in `globals.css` under `@theme inline`. Flag anywhere an existing token is not being used but should be — e.g.:
- A raw colour class (`text-green-700`) where a `text-{project}-*` token should be used
- A hardcoded z-index (`z-50`) where `z-modal` exists
- A raw opacity (`opacity-40`) where `opacity-disabled` exists
- A hardcoded width (`w-52`) where `w-sidebar` exists
- A hardcoded max-width (`max-w-sm`) inside a modal where `max-w-modal-sm` exists

Flag every instance with file and line reference — these are not suggestions, they are violations.

### 6. Tailwind config suggestions
Flag any hardcoded values in the page or its components that could be promoted to a named token in `globals.css` under `@theme inline` — repeated spacing values, one-off colours, z-index numbers written inline, fixed widths/heights used in multiple places. Present these as suggestions for the user to approve before adding.

### 7. Fixed layout audit
Scan the page for any components or panels that are collapsible, hidden by default, or toggled into view. Flag each as a soft violation of the fixed layout rule:

> **Fixed layout preference:** Page layout should generally be fixed — panels visible at all times, not collapsible or hidden behind toggles. Flag any pattern where content is hidden or toggled unless the use case clearly justifies it (e.g. a mobile-only off-canvas menu).

For each flagged item: state the component/element, describe the toggle behaviour, and note whether a fixed-split alternative is feasible.

### 8. Floating component audit
Scan `components/` for any components that belong in a page's `_components/` subfolder rather than the shared `components/` directory.

**The rule:** A component should stay in `components/` only if it is a {Project} design system component (`{Project}*.tsx`) or is used by genuinely different, unrelated pages.

**Subpages do not count as different pages.** If a component is shared between a page and its subpages, that is one feature, not two independent pages. Feature-specific components (no `{Project}` prefix) shared only within one feature tree belong in that feature page's `_components/`.

**What counts as "genuinely different pages":** pages under different top-level route groups that are unrelated features (e.g. a dashboard page and a settings page that both need a shared table component).

For each misplaced file:
- State the file path
- State which page's `_components/` it belongs in
- Do not flag {Project} base components (`{Project}*.tsx`) — those are intentionally shared.

---

**How to apply:** Run all 8 steps in order and present findings as a numbered list per step. Do not make any edits during an audit — findings only.
