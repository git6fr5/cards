---
name: Record — Project Rename
description: Rename of project brand token from "Kingkiller" to "Raja"
type: record
---

## Contents

1. [Rename decision and execution](#1-rename-decision-and-execution)

---

## 1. Rename decision and execution

### Context

Project brand prefix was `Kingkiller` — used as the Tailwind design-token prefix (`kingkiller-*` in `globals.css`), and as the `{Project}` prefix on every shared design-system component (`KingkillerButton`, `KingkillerHeader`, etc. in `components/forms/` and `components/layout/`). User asked to rename the project. First proposed target was "Kaeli", then corrected mid-discussion to "Raja" before any code was touched.

### Discussion points

- Initial ask ("Kaeli") was scoped as a docs-only vs. code question: renaming touched 43 files across Tailwind tokens, component names/props, and 3 `.context/` docs. Per project convention (code edits gated behind explicit `/build`), the assistant split the response — offered to rename docs immediately, held code changes for `/build`.
- User corrected the target name to "Raja" before any files were touched — no rework needed, correction landed before execution.
- `/build` was then invoked, classified as frontend-only (styling/design tokens + existing component edits), guides loaded per `run_build.md` (`general_rules`, `frontend_structure`, `creating_frontend_components`, `frontend_design_base`, `tailwind_rules`).

### Decision

Renamed `kingkiller` → `raja` (lowercase, tokens/classes) and `Kingkiller` → `Raja` (capitalized, component/type names) across all 43 matched files: `globals.css` tokens, every component in `card-builder`, `token-builder`, `play`, `_components/`, the `(open)` route group, and all 13 shared `components/forms/` and `components/layout/` atoms — plus the 3 `.context/` docs referencing the old name. The 9 `Kingkiller*.tsx` files were `git mv`'d to `Raja*.tsx`. Verified zero remaining `kingkiller` references (case-insensitive) and a clean `tsc --noEmit` typecheck.

Commit was explicitly deferred — user asked to hold until a second piece of in-flight work (fleshing out the design brief direction via `/plan`) is also finished, so both land together.
