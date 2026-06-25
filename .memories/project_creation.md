---
name: Project Creation Workflow
description: Step-by-step process for planning a new project from scratch — purpose, user journey, frontend structure, backend packages, resources, and database models — culminating in a written prototype_plan.md
type: feedback
originSessionId: d47ae07b-963b-42c9-9e4a-800de44da8d3
---
When the user asks to plan or create a new project, follow this exact process in order. Do not skip steps or merge them. Do not generate any files until the final step.

**Why:** Good architecture decisions require understanding purpose before structure, and structure before implementation. Rushing to code before the plan is solid creates debt that compounds quickly.

**How to apply:** Any time the user says "set up a new project", "plan a project", or "run project creation".

---

## Step 0 — Install memories

Before anything else, install the shared memory files from the repo into Claude's memory system for this project. The memory files live in `.memories/` in the repo root.

Run the following, replacing `{absolute-project-path}` with the project's absolute path and `{encoded-path}` with the path encoded as hyphens replacing slashes (e.g. `/Users/foo/Projects/myapp` → `-Users-foo-Projects-myapp`):

```bash
mkdir -p ~/.claude/projects/{encoded-path}/memory
cp .memories/* ~/.claude/projects/{encoded-path}/memory/
```

Confirm the files are in place before proceeding. The project now has the full style guide, design base, audit rules, and workflow memories active.

Then remind the user of the one-time setup steps required before the backend will run:

> **Before the backend will work, you need to:**
> 1. Copy `backend/.env.example` → `backend/.env` and fill in your `DATABASE_URL`
> 2. Set `DATABASE_URL` in `backend/.env` — Alembic reads this automatically via `alembic/env.py`
> 3. Run `alembic upgrade head` from inside `backend/` once your DB is ready
> 4. Copy `frontend/.env.example` → `frontend/.env` and fill in `NEXT_PUBLIC_API_URL`
> 5. Do a global find-and-replace: `Project` → `YourProjectName` in component files, `project-` → `yourname-` in Tailwind tokens

---

## Step 1 — Purpose

Ask the user:

> "What is the purpose of this project? Describe what it does, who uses it, and what problem it solves."

Wait for a clear answer before proceeding. If the answer is vague, ask one follow-up to clarify the core value proposition.

---

## Step 2 — Prototype user journey

Ask the user:

> "Walk me through the prototype user journey. What does a user do from the moment they land on the site to the moment they've accomplished their goal? Be as specific as you can — list the steps sequentially."

Record this carefully. It will be used to validate every subsequent decision.

---

## Step 3 — Frontend structure

Ask the user to map out their frontend pages:

> "List out the pages you know you need. For each page, tell me:
> - The route path (e.g. `/dashboard`, `/projects/[id]`)
> - Whether it's **open** (public, no auth required) or **protected** (authenticated users only)
> - One sentence on what the user does on this page"

Remind them of the App Router structure from the style guide:
```
/app/
    (open)/         -> Public marketing pages
    (protected)/    -> Authenticated app pages
```

---

## Step 4 — Suggested frontend pages

After the user lists their pages, review their list against the purpose (Step 1) and user journey (Step 2). Present **20 pages they might want to consider** that are not already in their list. For each suggestion:
- Route path
- Open or protected
- One sentence on why it would be useful given their stated purpose and journey

Group suggestions by theme (e.g. "Auth & onboarding", "Core app", "Admin & settings", "Marketing"). Ask the user to pick any they want to add before moving on.

---

## Step 5 — Backend packages

Explain the package architecture from the style guide before asking:

> **Backend architecture note:** The backend is a modular monolith — one FastAPI app, several packages, clean boundaries. Each package owns a domain (e.g. `accounts`, `markup`, `glossary`). Packages communicate through well-defined interfaces, not by importing each other's internal route logic. Cross-package ORM relationships are **one-directional only** — the dependent package holds the FK and relationship; the depended-on package's model is never modified. This means package boundaries are a design decision: once set, changing them is expensive.

Then ask:

> "Map out your backend packages. For each package, give it a name and one sentence describing the domain it owns. Think in terms of bounded contexts — what groups of functionality are cohesive enough to live together, and distinct enough to be kept separate?"

Wait for their answer.

---

## Step 6 — Resources per package

For each package the user named, ask them to list the resources (ORM models + CRUD route folders) they can think of:

> "For each package, list the resources you know you'll need. A resource is a noun that has its own database table and set of CRUD routes (e.g. `Account`, `Project`, `Document`). You don't need to define columns yet — just names."

Present this as a table or grouped list as they fill it in.

---

## Step 7 — Suggested packages and resources

After the user lists their packages and resources, review everything against the purpose (Step 1), user journey (Step 2), and frontend structure (Steps 3–4). Present:

**3 packages they might want to consider** — packages that seem missing or that would benefit from being split out. For each:
- Suggested package name
- Domain it would own
- Why you're suggesting it given their stated purpose and journey

**20 resources they might want to consider** — resources not already in their list. For each:
- Resource name
- Which package it belongs in
- One sentence on why it would be useful

Ask the user to adopt any before moving on.

---

## Step 8 — Database models

Ask the user to map out their database in detail:

> "Now define your database models. For each model, tell me:
> - **Model name** (PascalCase singular)
> - **Which package** it belongs to (this determines which `orm/` folder it goes in)
> - **Fields**: name, type, nullable (yes/no), unique (yes/no), and any note on why unique/indexed
> - **Relationships**: related model, cardinality (one-to-many / many-to-one / one-to-one / many-to-many), cascade delete (yes/no), and whether the related model is in a different package
> - **Soft-deletable?** (adds `is_archived` boolean)
>
> You don't need to be exhaustive yet — cover what you know and we'll fill gaps next."

As they list models, flag any cross-package relationships immediately and ask which package should depend on the other (the dependent holds the FK; the depended-on model is not modified).

---

## Step 9 — Gap analysis and model suggestions

After the user defines their models, review everything against the purpose, user journey, frontend structure, packages, and resources. Produce two things:

**Gaps:** Point out any models that appear to be missing based on what the frontend pages or user journey require. For each gap:
- What's missing and why you think it's needed
- Which package it would belong to
- What the frontend page or journey step that requires it is

**5 model suggestions:** Additional models the user would likely find useful, even if not strictly required by the journey as stated. For each:
- Model name and package
- What it enables
- Why it's worth considering now rather than adding later

Ask the user to adopt any gaps or suggestions before the final step.

---

## Step 10 — Write prototype_plan.md

Once the user has finalised all decisions, write the plan into `memory/prototype_plan.md`. Use this exact structure:

```
---
name: Prototype Plan
description: Full project plan — purpose, frontend structure, backend packages and resources, and database models
type: project
---

## Purpose

{1–3 sentences from Step 1}

---

## Frontend Plan

### Website Structure

| Route | Auth | Description |
|---|---|---|
| ... | open/protected | ... |

### Additional Decisions

{Any page-level decisions made in Steps 3–4, e.g. pages added after suggestions, route naming choices, layout decisions}

---

## Backend Plan

### Packages

| Package | Domain |
|---|---|
| ... | ... |

### Resources per Package

**{package-name}/**
- `Resource` — one sentence
- `Resource` — one sentence

*(repeat for each package)*

### Additional Decisions

{Any backend decisions made in Steps 5–7, e.g. packages added after suggestions, cross-package dependency directions, resources added after suggestions}

---

## Database Plan

### Models — {package-name}

**{ModelName}**
- Fields: {field list with types, nullable, unique}
- Relationships: {related model, cardinality, cascade, cross-package?}
- Soft-deletable: yes/no

*(repeat for each model, grouped by package)*

### Additional Decisions

{Any model-level decisions made in Steps 8–9, e.g. models added after gap analysis, cross-package dependency directions confirmed, suggestions adopted}
```

After writing the file, also update `memory/prototype_user_journey.md` with the journey from Step 2, formatted as a numbered step list with role labels where applicable.

---

## Step 11 — Design brief

Ask the user three questions:

> 1. **Colour palette** — What colours do you want to use? List as many or as few as you like (hex codes, colour names, or descriptions like "warm amber and off-white").
> 2. **Feel** — How should the product feel? (e.g. modern, retro, minimal, playful, serious, editorial, brutalist)
> 3. **Design style** — Describe the overall design style in a few sentences. Think about typography choices, density, use of whitespace, imagery style, and any references or inspirations.

Then write the answers into `memory/design_brief.md` using this structure:

```
---
name: Design Brief
description: Colour palette, feel, and design style for this project
type: project
---

## Colour Palette

{User's colour descriptions, with hex codes where given}

## Feel

{User's feel keywords}

## Design Style

{User's description of the overall design style}
```
