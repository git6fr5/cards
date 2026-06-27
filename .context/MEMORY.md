# Memory Index

- [Template Project Decisions](template_decisions.md) — Resolved structural/tooling decisions for the template: alembic in backend/, Dockerfiles in backend/ and frontend/, seed/ present, TypeScript frontend, Tailwind v4 via globals.css, no shadcn/ui, __pycache__ excluded in VSCode
- [Project Style Guide](style_guide.md) — Full backend (FastAPI/SQLAlchemy) + frontend (Next.js/Tailwind v4) conventions: structure, ORM models, component design, routing, CRUD system, general rules
- [Design Base](design_base.md) — Spec for shared design system components in components/ui/, components/forms/, components/layout/ — props, variants, layout rules, universal conventions
- [Overview Audit](overview_audit.md) — Full audit ruleset: Backend Bugs/Style/Structure (20+16+16 rules), Frontend Bugs/Style/Structure (15×3 rules), ORM Bugs/Style/Structure (15×3 rules)
- [Resource Audit](resource_audit.md) — Scoped audit process for a single routes resource folder: 6 output sections (findings, dependencies, ERRORS dict, Pydantic models, endpoints, tools)
- [Tailwind Audit](tailwind_audit.md) — Process for auditing a page or folder against globals.css tokens; produces extract-to-component / not-implemented / already-implemented lists
- [Page Audit](page_audit.md) — 8-step process for auditing a frontend page: style compliance, API validation, component extraction, base component opportunities, Tailwind tokens, fixed layout, floating components
- [Page Creation Workflow](page_creation.md) — Guided flow for scaffolding a new frontend page: gather inputs, propose layouts, plan components + API calls, confirm, then generate
- [Resource Creation Workflow](resource_creation.md) — Guided flow for scaffolding a new backend resource: ORM questions, CRUD questions, recommendations, then generate files
- [Prototype User Journey](prototype_user_journey.md) — Full end-to-end user journey (to be defined per project)
- [Prototype Plan](prototype_plan.md) — Codebase state vs journey: what works, what's partial, what's missing (to be defined per project)
- [Project Notes](notes.md) — Key design decisions and project-specific notes not obvious from the code
- [Project Creation Workflow](project_creation.md) — 11-step guided flow for planning a new project: purpose, user journey, frontend pages, backend packages, resources, database models, gap analysis, design brief, then writes prototype_plan.md and design_brief.md
- [Design Brief](design_brief.md) — Colour palette, feel, and design style for this project (to be defined per project)
- [Timeline Creation Workflow](timeline_creation_workflow.md) — Guided flow for generating a project timeline: read codebase state, gather inputs, draft structured plan, confirm, then save
- [Update Memory Workflow](update_memory.md) — How to merge a memory file from another project into this one: additions, conflict resolution, orphan flagging, diff summary
