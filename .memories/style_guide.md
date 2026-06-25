---
name: Project Style Guide
description: Comprehensive conventions for backend (FastAPI/SQLAlchemy) and frontend (Next.js) code structure, component design, ORM models, routing, CRUD system, and general rules
type: feedback
originSessionId: aea5fe02-9dff-43e2-98b2-7174fe2f4e50
---
## Project Layout

- Split into `/backend` and `/frontend`
- `.venv` and git repo live at project root
- Each side has its own `Dockerfile`, `.dockerignore`, `.env`

---

## Backend

**Stack:** FastAPI. Entry point: `backend/main.py`. Run: `cd backend && fastapi dev main.py`
**DB:** Supabase (credentials in `backend/.env`). **Migrations:** Alembic (`backend/alembic/`, `backend/alembic.ini`)

**Architecture:** Modular monolith — one webapp, several packages, clean boundaries.

**Package structure:**
```
/backend/
    (package-name)/
        (route-folder)/
            crud.py               -> All basic CRUD routes
            (other-routes).py     -> Additional route files
            tools.py              -> Helper functions meeting the extraction threshold
                                     (may be expanded to a tools/ folder with subtool modules if tools.py becomes unwieldy)
            tests/                -> 1:1 mirror of route files by name
                                     Run: python -m (package-name).(route-folder).tests.xxx
```

**Package structure rules:**
- The tools file in a route folder must be named `tools.py` exactly — not `helpers.py`, `utils.py`, or anything else.
- A package-level `tools.py` (at the package root) is only valid if its helpers are genuinely shared across multiple route folders in that package. Single-folder helpers belong in that folder's own `tools.py`.
- No intermediate `routes/` subdirectory between the package root and route folders — route folders sit directly under `(package-name)/`.
- Each route file defines exactly one `router` variable. Never multiple routers in one file.
- Every route file's `router` must be registered via `app.include_router(...)` in `main.py` or the package's `__init__.py`. A defined but unregistered router is a bug.
- Package `__init__.py` files only contain router imports and `__all__` declarations — no function or class definitions, no business logic.
- The only files permitted at `backend/` root are `main.py` and `alembic.ini`. No other freestanding modules.
- `main.py` only configures the app, registers routers, and sets up middleware — no route handlers or business logic inside it.

**`infer.py` — inference route files:**
- A route folder gets an `infer.py` when it contains routes that trigger LLM generation, vector embedding, or similarity projection. Pure data CRUD stays in `crud.py`; inference operations go in `infer.py`.
- Routes in `infer.py` must use inference verbs: `generate_*` for LLM text output, `embed_*` for vector embedding, `project_*` for similarity projection or weight computation. CRUD verbs (`create_`, `read_`, `update_`, `delete_`) must never appear in `infer.py` route function names.
- The router is `router = APIRouter()` with no prefix — the prefix is applied in `__init__.py` alongside the crud router.
- Route order within `infer.py` follows the pipeline: `generate_*` routes first, then `embed_*`, then `project_*`. Batch variants immediately follow their single counterpart.
- Batch route naming: `batch_{verb}_{resource}_{thing}` — same verb convention applies.
- Pipeline dependency rule: each stage must 422 if the prior stage's output is missing. An `embed_*` route must 422 if the text it would embed is null. A `project_*` route must 422 if the embeddings it would project are null. Never silently skip or fall back to recomputing a prior stage inline.
- HTTP methods: use POST for `generate_*` routes (non-deterministic LLM output). Use PUT for `embed_*` and `project_*` routes (deterministic given existing inputs — running them again produces the same result).
- `infer.py` may import from the folder's own `tools.py` and from `inference/` modules. It must not import from other route files.

**Standard utils at `/backend/utils/`:**
- `databases.py` — wrapper class + decorators for DB session context per API call
- `websockets.py` — wrapper around websocket management
- `errors.py` — helpers for HTTPExceptions and precondition errors. Contains:
  - `assert_preconditions(checks, errors)` — takes `list[tuple[bool, int, str]]` and an `errors` dict; raises `HTTPException` for the first truthy condition. The third element is either an `errors` dict key (looked up automatically) or a raw string message (passed through as-is).
  - `runtime_conditions(checks, errors)` — same shape but raises `RuntimeError`; used with `RUNTIME_ERRORS`

**Never reimplement** functionality that already exists in `databases.py`, `errors.py`, or `websockets.py` — always use the existing utility. All DB access must go through the `databases.py` wrapper and decorators (`create_resource`, `read_resource`, `update_resource`, `delete_resource`) — never use raw SQLAlchemy `Session` instances or `session.query(...)` (which is 1.x style; use `select(Model).where(...)`).

**Tool function constraints (`tools.py`):**
- Tool functions must not import or raise `HTTPException`, return `Response` objects, or reference `Request`. Signal failure via plain Python exceptions or return values; the route converts them to HTTP.
- Tool function signatures must not include `Depends(...)`, `Request`, or `Response` — these make functions untestable outside FastAPI.
- Tool function names must be descriptive verb phrases (`process_point`, `match_clauses`) — they must not mirror HTTP/CRUD verb names (`create_point`, `get_clause`, `delete_item`). CRUD-style names belong only in route handlers.
- Never append `_service` to function names — the name itself should be self-evident; `_service` is a naming crutch.

**Route file order:**
1. All imports at top (except those that must be inside a function)
2. FastAPI router — always `APIRouter()` with no prefix in the route file itself; the resource prefix (e.g. `/playbooks`) is applied by the package's `__init__.py`
3. `RUNTIME_ERRORS` magic variable (if necessary)
4. `ERRORS` magic variable (e.g. `{"session_not_active": "..."}`)
5. Pydantic models — two-tier naming:
   - Operation-specific (single handler): `{Action}{Resource}Request` / `{Action}{Resource}Response` — action is a verb matching the operation (e.g. `CreateClauseRequest`, `SearchClauseResponse`, `BatchUpdateVectorResponse`).
   - Shared resource representation (returned by multiple handlers — create, read, update): `{Resource}Response` with no action prefix (e.g. `ClauseResponse`, `ExampleResponse`).
- Use two blank lines between sections, no comment separators

**Import ordering:** within the imports block, group as standard library → third-party (`fastapi`, `sqlalchemy`, `pydantic`, etc.) → internal (project modules). Separate each group with a single blank line. Never mix groups or omit blank lines between them. No unused imports — every import must be referenced somewhere in the file.

**Route decorator requirements:**
- Every route decorator (`@router.get`, `@router.post`, `@router.put`, `@router.delete`, etc.) must include `response_model=` specifying a Pydantic `*Response` model. No decorator may omit `response_model`.

**Error handling in routes:**
- Never raise `HTTPException` directly in a route file. Always use `assert_preconditions` from `utils/errors.py`.
- Never raise `RuntimeError` directly in a route file. Always use `runtime_conditions` from `utils/errors.py`.
- `from fastapi import HTTPException` must not appear in route files — it belongs only in `utils/errors.py`.
- `assert_preconditions` takes a list of `(condition, status_code, error_key_or_message)` tuples and the route's `ERRORS` dict. Pass the `ERRORS` dict so error messages stay centralised.
- Any DB read that can return `None` (e.g. record not found) must be guarded before accessing attributes — never access `.id`, `.name`, etc. on the result of `DatabaseConnection.get(...)` or `.scalar_one_or_none()` without a prior `None` check via `assert_preconditions`.
- Service functions that can return `None` on a miss must have their return value None-checked in the calling route before use.
- Route handlers that call non-trivial external/I/O service functions must wrap them in try/except so a 500 stack trace does not reach the client.
- Route handlers must return a Pydantic `*Response` model, never a raw SQLAlchemy ORM object or `dict` — returning an ORM object can leak unmapped fields or crash on lazy-loaded relationships.
- `ERRORS` dict values must be complete sentences, not fragments like `"not found"` or `"invalid"`.
- Magic strings must not be duplicated across files — define once and import. The `ERRORS` dict is the standard place for error messages. Exception: `ERRORS` dict keys and values are intentionally file-local and may repeat across different files.

**Route handler isolation:**
- Never call one route handler from inside another. Route handlers are HTTP entry points, not reusable functions — calling them internally bypasses session management, adds overhead, and obscures data flow.
- If two handlers share a DB query, write it inline in each. If the shared logic is substantial enough to extract (meets the `tools.py` threshold), move it to `tools.py`.
- Never import a route function from another route file and invoke it directly.

**CRUD system — route naming and order within crud.py:**
1. `create_{resource}` — `@router.post("/")`
   - Always call `DatabaseConnection.flush()` after `add()` and before `return` so the DB-assigned `id` is populated on the returned object.
   - a. `batch_create_{resource}` — takes an array of the `Create{Resource}Request` model; call `flush()` once after the loop, before `return`
2. `read_{resource}` — `@router.get("/{resource_id}")`
   - a. `read_{resource}_by_{column}` — `@router.get("/{column_name}/{column_value}")`
   - b. `search_{resource}_by_{column/relationship}` — use `.ilike()` etc for strings
3. `update_{resource}_{column}` — `@router.put("/{resource_id}/{column}")`
4. `delete_{resource}`
   - a. `batch_delete_{resource}` — takes an array of ids

**Reading a resource inside a route for another resource:**
- `{Resource}Response` always lives in `{resource}/crud.py` — this is the authoritative definition
- A consuming route file (e.g. `{other_resource}/{resource}.py`) imports it: `from {package}.{resource}.crud import {Resource}Response`
- Never redefine the same response model in a consuming file
- The consuming file's route file name matches the resource being read (e.g. `points.py` reads points, `instructions.py` reads instructions)

**Search route URL paths:**
- The path uses `/search/{column}` where `{column}` is the column or attribute being searched on (e.g. `/search/vector`, `/search/name`).
- When searching via a column on a related model, use a two-segment path: `/search/{related_model_resource}/{column}` — `{related_model_resource}` is the related model's resource name, `{column}` is the column on that model (e.g. `/search/example/vector` to search clauses via example embeddings).

**When asked to create a CRUD, always ask:**
1. Are there any special requirements for the creation of this resource?
2. What columns should be used to read this resource?
3. What columns should be used to search for this resource?
4. What columns should be updatable?
5. Should there be a batch create route?
6. Should there be a batch delete route?

**LLM model selection via environment variables:**
- Never hardcode a model mode in a function call.
- Each inference module declares a module-level constant resolved from the env var at import time:
  ```python
  GENERATION_MODE = GenerationMode[os.getenv("GENERATION_MODE", "OpenAI")]
  ```
- Public inference functions (`generate_text`, `generate_model`, `embed`, `extract_answer`, etc.) do NOT accept a `mode` parameter — they use the module-level constant directly.
- Internal model-loading helpers (`get_generation_model`, `get_embed_model`, etc.) may keep a `mode` parameter since they are called internally with the constant.
- Tool functions that call inference do NOT pass `mode=` at all.
- Env variable names: `GENERATION_MODE`, `EMBEDDING_MODE`, `EXTRACTION_MODE`, `CATEGORISATION_MODE`, `TOKEN_MODE`. Value is the enum member name (e.g. `GENERATION_MODE=OpenAI`).

**Python style:**
- No XML docstrings ever. Ask before adding any docstring.
- During audits: when flagging a docstring or comment for removal, always quote its full text in the audit output so the user can decide whether to keep it.
- Comments and docstrings that begin with `Note: ` are user-approved — do NOT flag these during audits or suggest removing them.
- If the user decides to keep a comment or docstring after it has been flagged, prefix it with `Note: ` so it is not flagged again.
- Concise and pythonic; descriptive variable names (never shorten `payload` to `p`). Exception: single-letter loop variables in list comprehensions and lambdas are permitted (e.g. `[x for x in items]`, `lambda p: p.name`).
- All function parameters and return types must be type-annotated — both for route handlers and tool functions. No bare untyped parameters.
- No mutable default arguments — never `def f(items: list = [])` or `def f(opts: dict = {})`. Python shares these across calls.
- No unpythonic patterns: avoid manual index loops (`for i in range(len(...))` — use `enumerate`); avoid `if x == True` or `if x == False` (use `if x` / `if not x`); avoid redundant `else` after `return`.
- Don't extract logic into `tools.py` unless it meets the threshold: more than 3 lines and duplicated across multiple handlers, genuinely useful to test in isolation, or already has a test. Logic below this threshold stays inline.
- Encapsulation and single responsibility — flag any function that does more than one distinct thing (e.g. validates input AND calls an external API AND writes to the DB in one body).
- No logging unless explicitly asked. No `print(...)`, `logging.*`, or `logger.*` calls in route or service files.
- No hardcoded credentials, secrets, tokens, or connection-string credentials outside `.env` files. Flag any string literal that looks like one.
- No N+1 queries — never run a DB query inside a loop over a collection fetched from the DB. Use `joinedload`, a batch query, or a single `select(...).where(col.in_(...))`.

---

## Frontend

**Stack:** Next.js (App Router). Run: `cd frontend && npm run dev`. Entry: `app/page.tsx`

**App Router structure:**
```
/app/
    (open)/         -> Public marketing
    (protected)/    -> Authenticated app
```

**Per-page folder:**
```
/app/(protected)/account/
    page.tsx        -> Imports Account from Account.tsx only
    Account.tsx
    _components/    -> Page-specific components (underscore = not a route)
```
The underscore prefix on `_components/` is intentional in Next.js — it opts the folder out of routing. This is different from the root `components/` folder. Always use `_components/` for page-local components, never plain `components/`.

**Root `components/` — shared design system, three domains:**
```
components/
    ui/             -> Design building blocks ({Project}Button, {Project}Input, {Project}Card, etc.)
    layout/         -> Structural shells ({Project}Header, {Project}Footer, {Project}Section, {Project}Modal, etc.)
    table/          -> Generic table system
```
Everything in `components/` is prefixed with the project name. See **{Project} prefix convention** below.
Page-specific components live in `_components/` and build on these base components wherever possible.

**{Project} prefix convention:**
All shared design system components are prefixed with the project name — `{Project}Button`, `{Project}Input`, `{Project}Header`, etc. This is the signal that a component is a shared design system atom, not a page component. Page-specific components in `_components/` are never prefixed.

**Component design:**
- Very granular; small pieces; components abstract lots of logic
- A button exposes `onClick` and `alt boolean` — all style changes from `alt` via variables at top, not multiple conditional checks
- State-swapping changes clearly grouped at top
- Component functions and their containing files must be PascalCase (`AccountCard.tsx`, not `accountCard.tsx` or `account-card.tsx`).
- The props interface for a component must be named `{ComponentName}Props` (e.g. `ButtonProps` for `Button`) — never generic names like `Props`, `IProps`, or `ComponentProps`.
- Props interfaces must not be exported unless explicitly consumed by another file.
- Default exports must use named function syntax: `export default function MyComponent()` — never anonymous arrow function defaults like `export default () => {}`.
- Any component using `useState`, `useEffect`, event handlers, or browser APIs must have `'use client'` as its first line.
- Type/interface definitions must live between imports and the component function — never inside the component body or after the export.
- Types used by more than one component must live in a dedicated types file, not inline in one of the consumers.
- A single-file component does not need its own subfolder. Don't create folders inside `components/` that contain only one `.tsx` file with no supporting files.
- Components should be small and granular. A component rendering more than one distinct UI concern should delegate to sub-components.
- No inline `style={{...}}` attributes in JSX — all styling must use Tailwind classes.
- Boolean props use shorthand syntax: `disabled`, not `disabled={true}`.
- Complex conditional logic (more than one operator) in JSX must be extracted to a named variable before the return statement — never embed complex ternaries or `&&` chains directly in JSX.

**Component file order:**
1. `'use client'` directive (if client component)
2. Imports: external first (react, next/*), then internal via `@` alias (`@/components/...`, `@/utils/...`)
3. Interfaces/types between imports and component
4. Default-exported function component (PascalCase)

**Inside component body:**
a. Routing/searchParams hooks and derived values
b. `useState` declarations grouped together
c. Handler functions
d. `useEffect`s
e. Return statement (JSX)

**useState:**
- Type explicitly when not trivially inferred: `useState<Contact[]>([])`, `useState<string | null>(null)`
- Primitives initialized to primitives: infer — `useState('')`, `useState(true)`
- Never mutate state in place. No `state.push(...)`, `state.key = value`, or any direct property write on a state variable. Always create a new reference via the setter.
- `useState` calls must be grouped together, not interleaved with handlers or `useEffect` calls.

**Standard stateful pattern (any async component):**
```ts
const [error, setError] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(true);
```

**Handler naming:**
- Plain verb for internal actions: `addContact`, `removeContact`
- `handle` prefix for user events / async server actions: `handleFileUpload`, `handleCreateSession`
- Handler functions that close over state or setters must be defined inside the component body. Handlers that reference nothing from the component should be moved to `utils/`.

**Async handlers:** `try / catch / finally` — set error in catch (`err instanceof Error ? err.message : 'An error occurred'`), reset loading in finally. Handlers must be consistently `async/await` — never mix `.then()` chains with `await` in the same function.

**useEffect:**
- Always include a dependency array (the second argument) unless a `Note: ` comment explicitly justifies omitting it.
- Every state variable or prop referenced inside the effect body must appear in the dependency array — omitting one causes the effect to close over a stale value.

**JSX rendering:**
- Every element produced by `.map(...)` in JSX must have a stable, unique `key` prop.
- Components that fetch data must render distinct loading UI and error UI — never just `null` or nothing on failure or while loading.
- Never use a type assertion (`data as User`) to bypass `null | undefined` when the underlying value may genuinely be null — that masks runtime crashes. Guard properly.

**Standard utils at `/frontend/utils/`:**
- `api.ts` — backend request helpers; always use these
- `auth.ts` — auth validation helpers; always use these
- `styles.ts` — shared style helpers
- All backend requests must go through `utils/api.ts`. Never call `fetch(...)` or `axios(...)` directly from a component.
- The backend URL must only appear in `utils/api.ts` — no hardcoded backend URLs in components or other util files.
- Auth validation must use `utils/auth.ts` — never reimplement auth checks inline.
- API call construction, auth checks, and shared style helpers must live in `utils/` — never inline inside a component.
- Files in `frontend/utils/` must use named exports only — no `export default`.

**SSR safety:** never access `window` or `document` directly in a component body — this crashes during server-side rendering. Either place the access inside a `useEffect` or guard it with `typeof window !== 'undefined'`.

**Route group boundaries:** authenticated routes must live inside `(protected)/`, public marketing routes inside `(open)/`. Pages must not sit directly under `/app/` or in the wrong group.

**`page.tsx` constraint:** `page.tsx` only imports and renders its named page component. No logic, hooks, or JSX beyond that single render.

**`layout.tsx` constraint:** layout files only set up shared UI shell (nav, wrappers). No page-specific API calls or content that only applies to one page.

**Tailwind version: v4.** Projects use `tailwindcss@^4` and `@tailwindcss/postcss`. There is no `tailwind.config.mjs` — all design tokens live in `globals.css` inside an `@theme inline` block. Never use raw hex codes in components (no `text-[#abc123]` or `bg-[#...]` in className strings — colors must come from theme tokens). In style props where a utility class is not possible, use `var(--color-{project}-*)` — these are auto-exposed on `:root` by the `inline` keyword.

**Fonts** must be imported only in `app/globals.css` (or via `next/font` declarations referenced from there) — never `import { Font } from 'next/font/...'` in a component file.

**If you see a `tailwind.config.js` or `tailwind.config.mjs` in a project, flag it to the user:** the project is on Tailwind v3 and should be upgraded to v4, with tokens moved into `globals.css` under `@theme inline`.

**`globals.css` — what it contains:**
1. `@import "tailwindcss"` (v4 directive — replaces the three `@tailwind` directives from v3)
2. Font imports (Google Fonts or `next/font` CSS variables)
3. `@theme inline { ... }` block with all design tokens
4. Any global element overrides (e.g. third-party library class patches)

**`@theme inline` — token naming and generated utilities:**
CSS variable prefix determines the utility group Tailwind v4 generates automatically:

| Variable prefix | Generated utilities | Example |
|---|---|---|
| `--color-*` | `bg-*`, `text-*`, `border-*`, `ring-*`, etc. | `--color-{project}-green` → `bg-{project}-green` |
| `--font-size-*` | `text-*` | `--font-size-sm` → `text-sm` |
| `--font-family-*` | `font-*` | `--font-family-newsreader` → `font-newsreader` |
| `--opacity-*` | `opacity-*` | `--opacity-disabled` → `opacity-disabled` |
| `--width-*` | `w-*` | `--width-sidebar` → `w-sidebar` |
| `--max-width-*` | `max-w-*` | `--max-width-modal-md` → `max-w-modal-md` |
| `--z-index-*` | `z-*` | `--z-index-modal` → `z-modal` |
| `--border-radius-*` | `rounded-*` | `--border-radius-md` → `rounded-md` |
| `--spacing-*` | `p-*`, `m-*`, `gap-*`, `py-*`, etc. | `--spacing-section-y` → `py-section-y` |
| `--line-height-*` | `leading-*` | `--line-height-normal` → `leading-normal` |

**Token set to define:**
- Colors — all `{project}-*` tokens with hex values → `bg-{project}-green`, `text-{project}-cream`, etc.
- `--border-radius-none/sm/md/lg` in px → `rounded-md`
- `--font-size-xs` through `--font-size-xl` in rem → `text-sm`
- `--line-height-tight/normal/loose` → `leading-normal`
- Font families — via `next/font` CSS variables
- `--opacity-disabled: 0.4`, `--opacity-muted: 0.6` → `opacity-disabled`
- `--width-sidebar: 13rem` → `w-sidebar`
- `--max-width-modal-sm/md/lg` → `max-w-modal-sm`, `max-w-modal-md`, `max-w-modal-lg`
- `--z-index-dropdown: 10`, `--z-index-modal: 50`, `--z-index-toast: 60` → `z-modal`

**Focus ring:** use Tailwind ring utilities — `ring-2 ring-{project}-black` — not a CSS variable.

**Fixed layout preference (soft rule):** Page layout should generally be fixed — panels and sections visible at all times, not collapsible or hidden behind toggles. Where a fixed split is feasible, prefer it. Flag any use of collapsible drawers, hidden panels, or toggle-to-reveal patterns during page audits and creation planning.

---

## Database / ORM

**ORM:** SQLAlchemy 2.0 `DeclarativeBase`. `Base` lives in `databases.py` and must always be imported from there — never define your own `Base` or import it from elsewhere.

**Models per file:** generally each model in its own file. A file may define more than one model only when there is clear hierarchical ownership of one model over the other (a child with no independent identity outside its parent) or when the additional model is a thin junction table. In those cases, the dependent or junction model shares the parent's file. Outside these two exceptions, multiple `DeclarativeBase` subclasses in one file should be flagged.

**Model file imports order:**
1. `Base` from databases
2. Column types and `ForeignKey` from sqlalchemy
3. `relationship` from sqlalchemy.orm

**Naming:** Class: PascalCase singular (`Account`). `__tablename__`: lowercase singular (`"account"`).

**ORM comment rules (separate from route-file rules):**
- `#*` prefix for relationship descriptions: must explicitly state the cardinality (`one-to-one`, `one-to-many`, `many-to-many`), the role, and the junction table if applicable. A prose description alone without an explicit cardinality label is not enough.
- Inline or preceding `#` comments for column rationale (`unique=True`, `index=True`) — no `Note:` prefix required; these are not flagged during audits
- The `Note:` prefix convention applies only to route/Python files, not ORM files. In ORM model files, plain `#` and `#*` comments are always permitted and must never be flagged.

**Columns:**
- `id = Column(Integer, primary_key=True)` — Integer IDs, not UUIDs. The `id` column must be the first column defined in the model body.
- Strings always have explicit length, default `String(255)` — never bare `Column(String)`.
- `nullable` always set explicitly — every `Column(...)` declares `nullable=True` or `nullable=False`.
- `unique=True` and `index=True` where lookups are frequent; inline comment explaining why.
- Boolean with `nullable=False` always has explicit `default`.
- Boolean columns must be named as affirmative predicates: `is_active`, `has_permission`, `is_archived` — never bare nouns like `active`, `archived`, or `permission`.
- Column attribute names must be `snake_case` — never `camelCase` or `PascalCase`.
- Data columns are ordered non-nullable first, nullable second, within the model's own data column block (before the FK section).
- Date/time values must use `Column(DateTime, ...)` — never a `String` for something whose name implies a timestamp or date.
- For DB-generated defaults (timestamps, counters), use `server_default=` — Python-side `default=` is only set when inserting via the ORM, not for DB-generated values.
- Soft deletes: `is_archived` boolean column. Soft-delete columns must always be named `is_archived` — never `is_deleted`, `deleted_at`-as-flag, or `archived`. Any model described as soft-deletable but missing `is_archived = Column(Boolean, nullable=False, default=False)` is a bug.
- Columns whose name semantically represents an enum (`_type`, `_status`, `_state`) must use a Python `Enum` class with `Column(Enum(...))`, not a bare `String` with free-text values.
- Data columns must never appear below a `relationship(...)` in the same model — once the FK/relationship block begins, no more data columns.

**Relationships:**
- Never use `backref` — always explicit `back_populates`
- **Same-package models:** always `back_populates` on both sides
- **Cross-package models:** one-directional only — the dependent package holds the FK and relationship, the depended-on package's model is not modified. The direction is a design decision: ask the user which package should depend on the other before implementing.
- Attribute named after its role from this side (e.g. `testaments_created`, `witnessing`) — never generic names like `accounts`, `items`, or `related`.
- Precede each relationship with `#*` comment: what they represent, cardinality, junction table if applicable
- One-to-one: `uselist=False`
- Child deleted with parent: `cascade="all, delete-orphan"`. When this cascade is set, the corresponding `ForeignKey` must also have `ondelete="CASCADE"` so DB-level deletes behave consistently with ORM cascades.
- When a model has more than one FK to the same related table, the relationship must declare `foreign_keys=[...]` — otherwise SQLAlchemy raises `AmbiguousForeignKeysError`.
- Many-to-many junction tables must still follow all column, FK, and naming conventions — explicit `nullable`, integer PKs, and indexed FK columns.

**Foreign Keys:**
- Naming: `<related_table>_id` (e.g. `testament_id`)
- Target: lowercase table name + `.id`. The `ForeignKey("table.column")` string must reference a real table and column — verify the target exists.
- Place FK column directly above the relationship it backs (no blank line between — they read as a pair)
- FK columns at bottom of column list, grouped with relationships
- Separated from model's own data columns
- FK columns used in joins or lookups should carry `index=True`. Unindexed FKs that are used in queries are flagged.

**Timestamps:** No `created_at`/`updated_at` unless explicitly asked. Use `Column(DateTime, nullable=False)`.

**File placement and naming:**
- Model files must live in `(package-name)/orm/` — never at the package root, in a routes folder, or elsewhere.
- The file name must match the model class name in `snake_case` (`Testament` → `testament.py`, `BeneficiaryAllocation` → `beneficiary_allocation.py`). Mismatches are flagged.

**Model contents:**
- Models are data containers — they must not have side effects. Model methods that do more than compute a derived value from existing attributes are flagged.
- Never use `select(...)`, `session.query(...)`, or any DB call inside a model file.
- `@property` and `hybrid_property` are not added unless explicitly requested.
- `__repr__` is not added unless explicitly requested.

**Migrations / Alembic:**
- Every model file must be reachable from the import chain in `alembic/env.py` (directly imported, or via a package `__init__`) — otherwise `--autogenerate` will not detect it.
- Migrations are written by the user unless explicitly asked.

**Circular imports between model files:** if two model files import each other for type hints, both must use `from __future__ import annotations` and a `TYPE_CHECKING` guard for the cross-imports — never an unguarded circular import.

---

## General Rules

- Code: concise, short, legible variable names
- Single responsibility always
- Ask before adding any comment to code
- Migrations: only the user writes these unless explicitly asked — remind user at end if ORM changes require one
- API versioning: v1, v2, etc. Error schema in `api.ts` matching HTTPException shape
- Auth: check per page; user provides middleware if needed
- Testing: no pytest runners or blanket coverage — specific tests on request, run as `python -m ...`
- Secrets: `load_dotenv` in `main.py`; for tests run outside app, `load_dotenv` again

---

## Artefacts

Artefacts are leftover patterns from a previous system or decision that must be corrected when auditing or revisiting an existing resource. When reviewing any CRUD file, check for all of the following.

**1. Null organisation_id for default scope**
Resources may have been scaffolded with `organisation_id` nullable (NULL meaning globally scoped). The current decision is to use a "default organisation" record instead — `organisation_id` is non-nullable on every resource. Flag any `organisation_id = Column(..., nullable=True)` or any `Optional[int]` / `int | None` on `organisation_id` in Pydantic models.

**2. Split read-all + read-by-ids routes**
Resources may have two separate read routes: `GET /` (read all) and `POST /by-ids` (read by ID list). The correct pattern is a single `GET /` with an optional `ids: list[int] | None = Query(None)` parameter. Flag any `POST /by-ids` route and its associated request model; they should be folded into the read-all route.

**3. Missing clone route**
Resources that are intended to be duplicated from a global (default org) scope into an organisation scope should have a `create_{resource}_clone` route (`POST /{resource_id}/clone`) with a `Clone{Resource}Request` body containing `organisation_id: int`. Check the prototype plan to determine whether a resource is duplicable — library primitive resources (`DigitalRole`, `DigitalRoleQuestion`, etc.) are; junction and runner resources are not. Flag any duplicable resource that is missing this route.

**Why:** These artefacts accumulate when system-wide decisions (org scoping strategy, read-all API shape, cloneability) are made after initial scaffolding. Catching them during review prevents inconsistent behaviour across resources.

**How to apply:** When auditing any existing CRUD file, check all three. When asked to critique a CRUD, always run this checklist even if the user does not explicitly mention it.

---

**Why:** This is the user's established, opinionated style guide for all projects in this workspace. Deviating from it will cause friction and require corrections.

**How to apply:** Follow every convention here by default. When a task would violate a rule (e.g. adding a comment, abstracting code, creating a new component without asking where it goes, building a CRUD without asking the standard questions), pause and ask first.
