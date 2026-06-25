---
name: New Session Context
description: Thin pointer memory directing which files to read at the start of any session, with backend/frontend branching
type: reference
---

# New Session Context

## All Sessions

Always read these files at the start of every session:

- `style_guide.md` — backend and frontend conventions
- `prototype_user_journey.md` — the end-to-end user journey for this project
- `prototype_plan.md` — current codebase state vs the journey (what works, what's partial, what's missing)

## Focus Prompt

If the session focus (backend or frontend) has not been supplied by the user, ask:

> "Is this session focused on the **backend** or **frontend**?"

---

## Backend Context

If the session is backend-focused, also read:

- `resource_creation.md` — guided flow for scaffolding a new backend resource
- `resource_audit.md` — backend audit ruleset (bugs, style, structure)

---

## Frontend Context

If the session is frontend-focused, also read:

- `page_audit.md` — 8-step process for auditing a frontend page
- `page_creation.md` — guided flow for scaffolding a new frontend page
- `tailwind_audit.md` — process for auditing Tailwind token usage against globals.css
- `design_base.md` — spec for shared design system components
- `design_brief.md` — colour palette, feel, and design style for this project
