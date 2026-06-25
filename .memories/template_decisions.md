---
name: Template Project Decisions
description: Resolved structural and tooling decisions for the template project, established 2026-05-11
type: project
originSessionId: d47ae07b-963b-42c9-9e4a-800de44da8d3
---
Decisions made to align the template with the canonical project style (primarily playbook-helper-2 and wills).

**Why:** The template is being built as a quick-scaffolding base for new projects. These decisions fix discrepancies identified between wills, playbook-helper-2, and the template.

**How to apply:** When scaffolding or modifying the template, follow these decisions exactly. Do not revert to the old template defaults.

---

## Directory structure

- **Alembic location:** `alembic/` and `alembic.ini` live inside `backend/`, not at the project root.
- **Dockerfile location:** One `Dockerfile` inside `backend/`, one inside `frontend/`. Not at the project root.
- **`seed/` directory:** Present at the project root (alongside `backend/` and `frontend/`).
- **`webscraper/` module:** Not included in the template.

## Frontend

- **Language:** TypeScript (follow wills). Use `tsconfig.json`, not `jsconfig.json`. Component files are `.tsx`.
- **Tailwind version:** v4. Tokens live in `app/globals.css` under `@theme inline`. Use `@tailwindcss/postcss` in `postcss.config.mjs`. No `tailwind.config.mjs`.
- **`components.json`:** Remove. This is a shadcn/ui CLI config file — neither wills nor playbook-helper-2 use shadcn/ui. It was a scaffolding leftover.

## Tooling / IDE

- **VSCode `settings.json`:** Must exclude `__pycache__` from the file tree (follow playbook-helper-2 and template, not wills).

## Component and token prefix

- **Design system prefix:** `project-` for Tailwind tokens (e.g. `project-black`, `project-accent`) and `Project` for component names (e.g. `ProjectButton`, `ProjectLoader`). These are literal placeholder names, not a project-specific word. When using the template, do a global find-and-replace of `project-` → `{yourname}-` and `Project` → `{YourName}` in components/ and tailwind.config.mjs.
