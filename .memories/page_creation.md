---
name: Page Creation Workflow
description: Step-by-step process for creating a new frontend page when the user names a route path and page name — covers layout selection, component planning, and API validation before any code is written
type: feedback
originSessionId: 9f6589b9-d3a4-40f9-a316-7cdec8630d25
---
When the user asks to create a page, follow this exact process.

**Why:** Pages in this project have strict structural conventions (style_guide.md) and the user wants a guided, deliberate flow — layout chosen before components, components planned before code, backend gaps flagged but never fixed during page creation.

**How to apply:** Any time the user says "create a page", names a route path + page name, or asks to scaffold a new frontend page.

---

## Step 1 — Gather inputs

Ask for the following if not already given:
- **Route path** — where the page lives in the App Router (e.g. `app/(protected)/account/`)
- **Page name** — PascalCase, used for the primary component file (e.g. `AccountDetail`)

If the user has not explained the **purpose** of the page — what it is for, who uses it, what they accomplish on it — ask before proceeding. Purpose is required to make good decisions about layout and components.

---

## Step 2 — Propose layout directions

Once the purpose is clear, ask the user to describe the general layout they have in mind (even loosely — "a list on the left, detail on the right" is enough).

After they describe it, present **4 fleshed-out layout directions** derived from what they described. Each direction should:
- Have a short name (e.g. "Split panel", "Master-detail drawer", "Top-nav with content grid")
- Describe the top-level structure in 2–3 sentences: how the page is divided, where the primary content sits, where secondary panels or controls go
- Call out the key UX tradeoff — what this layout optimises for and what it sacrifices
- Reference relevant {Project} layout components where applicable (`{Project}Section`, `{Project}Modal`, etc.)

Ask the user to pick one before proceeding.

---

## Step 3 — Plan components and API calls

After the user picks a layout, produce a plan covering three areas. Present it clearly before asking for confirmation.

### 3a. Base design components
List every shared `{Project}*` component from `components/ui/`, `components/forms/`, and `components/layout/` that will be used. For each:
- Component name
- Where it appears in the layout

Do not invent new {Project} components — only use what exists. If a needed primitive does not exist in the design system, flag it as a gap.

### 3b. Page components
List every page-specific component that will live in `app/(protected)/{route}/_components/`. For each:
- Component name (no `{Project}` prefix)
- Single-sentence responsibility
- Key props it will receive
- Which base components it builds on

Apply the extraction rules from the page audit memory: a page component is warranted when it has a clear single responsibility, is more than ~20 lines of JSX, or would make the parent significantly easier to read.

### 3c. API calls
List every API call the page will need. For each:
- HTTP method + backend path
- What data is being fetched or mutated
- Which component triggers or consumes it

Then, for each call, **verify it exists** by checking the backend route files. Report one of:
- **Exists** — method + path confirmed, request/response shapes noted
- **Missing** — route does not exist; flag as backend work needed before this page can be completed
- **Partial** — route exists but response shape may not include all fields needed; flag the mismatch

Do not scaffold, stub, or modify any backend code. Backend gaps are flagged only.

---

## Step 4 — Confirm the plan

After presenting the plan, ask:

> "Does this plan look good, or would you like to adjust any components or API calls before I generate the files?"

Do not generate any files until the user explicitly confirms.

---

## Step 5 — Generate files

Once confirmed, generate the following files in order:

### `app/(protected)/{route}/page.tsx`
- Imports the primary component (e.g. `AccountDetail`) and nothing else
- No logic, no JSX beyond `<AccountDetail />`

### `app/(protected)/{route}/{PageName}.tsx`
- `'use client'` if stateful
- File order: imports → interfaces/types → default-exported component
- Component body order: routing/searchParams → `useState` → handlers → `useEffect` → return
- Standard stateful pattern: `error` + `isLoading` states where async calls are made
- Handler naming: `handle` prefix for user events/async actions, plain verb for internal state changes
- Async handlers: `try / catch / finally` — error in catch, loading reset in finally

### `app/(protected)/{route}/_components/{ComponentName}.tsx` (one file per page component)
- Same file and body order as above
- Builds on {Project} base components; no raw `<input>`, `<button>`, `<select>`, etc. unless no {Project} equivalent exists

### Loading and error UI
Every component that makes an async call must render distinct loading and error states — not `null` or nothing:
- Use `<{Project}Loader />` (or equivalent) while `isLoading` is true
- Render an inline error message when `error` is set
Do not generate a component that fetches data but has no loading or error UI.

### Tailwind compliance
- All colours from `globals.css` tokens (`bg-{project}-*`, `text-{project}-*`)
- No raw hex codes, no `var(--...)` CSS variables in className strings
- Use named tokens for z-index (`z-modal`), opacity (`opacity-disabled`), width (`w-modal-md`), etc.
- No new tokens added to `globals.css` without asking the user first
