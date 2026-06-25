---
name: Tailwind Audit
description: Process for auditing a page or folder of components against globals.css tokens — produces three numbered lists (extract to component / not implemented / already implemented) in a specific output format
type: feedback
originSessionId: fe94a009-a43b-4729-a893-de80b2b7938d
---
## When to run

Run when the user explicitly names a page or a folder of components (e.g. "tailwind audit on home/page.tsx", "audit the ui/ components for token usage"). Never run speculatively across multiple unrelated pages at once.

---

## Steps

### 1. Read the target and all directly imported components

Read the named file(s) and every component they import. Build a complete picture of every Tailwind class in use across all of them.

### 2. Read `globals.css`

Read `frontend/app/globals.css` to get the current `@theme inline` token definitions. These are the only tokens that exist — do not assume any token is defined unless it appears here.

### 3. Categorise every class

For every Tailwind class found:

**Not implemented** — a raw value that should be (or should become) a named token:
- A colour class that doesn't use a `{project}-*` token (e.g. `text-stone-600`, `bg-gray-100`)
- A spacing, sizing, or layout value used more than once across the page/components that has no token (e.g. `py-32` × 6, `px-8` × 5)
- A value that the design spec says should be tokenised (opacity, z-index, border-radius, font-size, line-height, width, max-width) even if only used once
- A value that conflicts with a spec value (e.g. `opacity-50` when spec says `opacity-disabled: 0.4`)

**Extract to component** — a cluster of classes that always appear together as a fixed structural combination. The test: would a token help if you still had to remember to combine it with the same three other classes every time? If not, the right fix is a component, not a token.
- A value that is never used alone — it always appears paired with the same surrounding structure (e.g. `py-32` always paired with `bg-{project}-*` as an outer section, and `max-w-5xl mx-auto px-8` as an inner wrapper — these form one `{Project}Section` component, not three tokens)
- A layout pattern repeated across multiple locations with the same structure (two-column grid + column inset padding, card shell + padding, etc.)

Rule of thumb: **token** = same value, many different contexts. **Component** = same cluster of values + structure, always together.

**Already implemented** — correctly using a defined `{project}-*` token from `globals.css` (e.g. `bg-{project}-green`, `text-{project}-cream`, `font-{project-font}`).

### 4. Produce the three lists

Output three headed sections in this order:

**List 1 — Extract to component.** Entries follow this format:
```
{n}. `{class-a} {class-b} ...` [× {count} {location-hint}] — {brief explanation of the structural pattern}; → extract to `{ComponentName}`
```

**List 2 — Not implemented (raw values that should be tokens).** Each entry follows this format:
```
{n}. `{tailwind-class}` [× {count} {location-hint}] — {brief explanation}; should be `{--css-variable}` → `{tailwind-token}`
```

**List 3 — Already implemented.** Same file-grouped structure. Each entry: class name — brief explanation of what it does / where it's used.

Rules for all lists:
- Group entries under the file they come from
- Count and location hint only when the class appears more than once
- If no token exists yet, still name the suggested variable and the token it would generate
- If a token exists in globals.css but isn't being used, note it as `(token already exists)`
- If the value is wrong *and* missing a token, note both (e.g. `wrong value AND no token`)
- Omit pure structural utilities (`flex`, `items-center`, `w-full`, `grid`) unless they are part of a repeating structural cluster being flagged for component extraction
- Aim for at least 20 entries across lists 1 and 2 combined

---

## Output format example

```
## Extract to component

**page.tsx**
1. `py-32 bg-{project}-[primary|secondary]` + `w-full max-w-5xl mx-auto px-8` × 6 sections — outer section band + inner content wrapper always appear together; → extract to `{Project}Section`
2. `grid grid-cols-[40%_60%] items-start` + `pl-16` × 3 grid layouts — two-column split with column inset always paired; → extract to `{Project}SplitLayout`

---

## Not implemented (raw values that should be tokens)

**components/layout/{Project}Header.tsx**
3. `px-24` — header horizontal padding; should be `--spacing-header-x` → `px-header`
4. `h-28` — header height; should be `--height-header` → `h-header`
5. `space-x-8` — inner nav links gap; no token

**components/ui/{Project}Button.tsx**
6. `rounded-lg` — border radius; should be `--border-radius-lg` → `rounded-lg` ({project} token)
7. `h-12` — button height; should be `--height-button` → `h-button`
8. `opacity-50` disabled — wrong value AND no token; should be `--opacity-disabled: 0.4` → `opacity-disabled`

---

## Already implemented (correctly using {project} tokens)

**page.tsx**
1. `bg-{project}-cream` — main and section backgrounds
2. `bg-{project}-green` — alternate section backgrounds

**components/ui/{Project}Button.tsx**
3. `bg-{project}-gold` — alt button background
4. `text-{project}-yellow` — button label text
```

---

**How to apply:** Run all steps and present all three lists. Do not make any edits during an audit — findings only. Always read globals.css fresh; never assume a token exists from memory alone.
