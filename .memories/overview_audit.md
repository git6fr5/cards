---
name: Overview Audit
description: Full audit ruleset — Backend Bugs/Style/Structure (20+16+16 rules), Frontend Bugs/Style/Structure (15×3 rules), ORM Bugs/Style/Structure (15×3 rules), and presentation format
type: feedback
originSessionId: aea5fe02-9dff-43e2-98b2-7174fe2f4e50
---

# Project Audit Instructions

Use this document to audit the codebase against the project style guide. Work through each section independently. For every finding, quote the offending code and state the rule it violates. For comments/docstrings flagged for removal, always quote the full text so the user can decide.

---

## Backend

### Bugs

1. **ORM object returned without Pydantic model** — Route handlers must return a Pydantic `*Response` model, not a raw SQLAlchemy object. Returning an ORM object directly can leak unmapped fields or crash on lazy-loaded relationships. Flag routes whose return type is an ORM class or `dict`.

2. **`None` not handled before attribute access** — If a DB read returns `None` (e.g. record not found), the route must raise an appropriate HTTP error before accessing any attribute on the result. Flag any handler that accesses `.id`, `.name`, etc. on the result of a query without a prior `None` check.

3. **Direct `session` use without the wrapper** — All DB access must go through the `databases.py` wrapper/decorators, not raw SQLAlchemy session calls. Flag any route importing or instantiating a session directly. Every `create_*`, `read_*`, `update_*`, `delete_*` route must use the `create_resource`, `read_resource`, `update_resource`, and `delete_resource` decorators from `utils/databases.py`.

4. **SQLAlchemy 1.x `session.query()` style** — This project uses SQLAlchemy 2.0. All queries must use `select(Model).where(...)` style. Flag any use of `session.query(...)`.

5. **`search_*` route not using `ilike()`** — Search routes that match on string columns must use `.ilike()` for case-insensitive matching. Flag search routes using `.filter(col == value)` or `.like()` on a user-supplied string.

6. **Logging statements** — No logging unless explicitly added by request. Flag every `logging.*`, `logger.*`, or `print(...)` call in route and service files.

7. **Secrets not loaded for tests** — Any test file that runs outside the app (via `python -m ...`) must call `load_dotenv()` itself. Flag test files that call any env-dependent code without a local `load_dotenv`.

8. **Hardcoded credentials or secrets** — Flag any string literal that looks like a key, token, password, or connection URL containing credentials outside of `.env` files.

9. **Service returns used without None check in route** — If a service function can return `None` on a miss, the calling route must check for it before proceeding. Flag routes that call a service and use its return value directly without guarding.

10. **N+1 query in a loop** — Flag any route or service that runs a DB query inside a loop over a collection fetched from the DB. Relationships needed after a bulk fetch should use `joinedload` or be fetched in a single query.

11. **Mutable default argument** — Flag any function signature using a mutable default (e.g. `def f(items: list = [])`). Python shares these across calls.

12. **Unhandled exception reaching the client** — Service functions that call external APIs or perform I/O must be wrapped in try/except in the route handler. Flag route handlers that call non-trivial service functions without any error handling, which would expose 500 stack traces to clients.

13. **`batch_delete_*` not using a single query** — Batch deletes should delete in a single `DELETE WHERE id IN (...)` query, not in a loop of individual deletes. Flag batch delete handlers that loop.

14. **`create_*` route missing `flush()` after `add()`** — Every `create_*` route must call `DatabaseConnection.flush()` after `add()` and before `return` so the DB-assigned `id` is populated on the returned object. For `batch_create_*`, `flush()` must be called once after the loop, before `return`. Flag any create handler that returns without flushing.

---

### Style

1. **Direct `HTTPException` raise in a route file** — Route files must never raise `HTTPException` directly. All HTTP error raises must go through `assert_preconditions` from `utils/errors.py`. Flag any `raise HTTPException(...)` in a route file and any `from fastapi import HTTPException` import in a route file.

2. **Direct `RuntimeError` raise in a route file** — Route files must never raise `RuntimeError` directly. Use `runtime_conditions` from `utils/errors.py` instead. Flag any bare `raise RuntimeError(...)` in a route file.

3. **XML docstrings** — Flag every function or class with a docstring using XML tags (e.g. `<param>`, `<returns>`). Quote the full docstring text.

4. **Unapproved comments/docstrings** — Flag every comment or docstring that does not begin with `Note: `. Quote the full text. Do not flag `Note: `-prefixed comments.

5. **Variable name shortening** — Flag any variable name that is a single letter or an obvious abbreviation of a meaningful noun (e.g. `p` for `payload`, `s` for `session`, `r` for `response`). **Exception:** single-letter loop variables in list comprehensions and lambda expressions are permitted (e.g. `[x for x in items]`, `lambda p: p.name`).

6. **Tool function naming** — Tool functions in `tools.py` must be named as descriptive verb phrases that describe the operation (`process_point`, `match_clauses`, `calculate_similarity`). They must not mirror HTTP-verb CRUD names (`create_point`, `get_clause`, `delete_item`) — those belong only in route handlers. Flag tool functions with HTTP-verb names.

7. **Tool file naming** — The tools file in a route folder must be named `tools.py`. Flag any file in the tools position named differently (e.g. `helpers.py`, `utils.py`) or named after a specific domain operation.

8. **Unpythonic patterns** — Flag: manual index loops instead of `enumerate`, `if x == True/False` instead of `if x` / `if not x`, `range(len(...))` iterations, redundant `else` after `return`.

9. **Under-threshold extraction** — Do not extract logic into `tools.py` unless it meets the threshold in Structure 7: more than 3 lines and duplicated across multiple handlers, genuinely useful to test in isolation, or already has a test. Logic that does not meet this threshold must stay inline. Flag extracted functions that do not meet the threshold, and flag inline logic that does.

10. **Single-responsibility violations** — Flag any function that does more than one distinct thing (e.g. validates input AND calls an external API AND writes to the DB in the same body).

11. **Missing or wrong Pydantic model suffixes** — Two-tier naming convention applies:
    - **Operation-specific models** (used by a single handler): `{Action}{Resource}Request` / `{Action}{Resource}Response`, where the action is a verb matching the operation (e.g. `CreateTestamentRequest`, `SearchWitnessResponse`, `BatchUpdateBeneficiaryResponse`).
    - **Shared resource representations** (returned unchanged by multiple handlers such as create, read, and update): `{Resource}Response` only, with no action prefix (e.g. `TestamentResponse`, `BeneficiaryResponse`).
    Flag: any `*Request` model missing an action prefix; any response model that is operation-specific but lacks an action prefix; any shared resource response model that adds an action prefix.

12. **Missing type annotations** — All route handler and tool function parameters and return types must be annotated. Flag functions with missing annotations on any parameter or the return type.

13. **Import organization** — Imports must be ordered: standard library → third-party (fastapi, sqlalchemy, pydantic) → internal. Each group separated by a blank line. Flag files that mix groups or omit blank lines between them.

14. **Unused imports** — Flag any import that is not referenced anywhere in the file.

15. **`ERRORS` dict values not full sentences** — Values in the `ERRORS` dict are user-visible error messages and must be complete sentences. Flag short fragments like `"not found"` or `"invalid"`.

16. **Magic strings duplicated across files** — An error message or constant string appearing in more than one file must be defined once (in the `ERRORS` dict or a shared constant) and imported. Flag duplicated string literals. **Exception:** `ERRORS` dict keys and values are intentionally file-local and may be duplicated across files — do not flag them.

17. **Route function name does not match CRUD convention** — Route handler names in `crud.py` must follow the CRUD pattern (`create_*`, `batch_create_*`, `read_*`, `read_*_by_*`, `search_*_by_*`, `update_*_*`, `delete_*`, `batch_delete_*`). Non-crud route files may use any descriptive verb-phrase name that reflects the operation. Flag any handler in a `crud.py` file whose name deviates; do not flag handlers in other route files.

18. **`_service` suffix on function names** — Function names must be descriptive enough to stand alone. Appending `_service` (e.g. `process_testament_service`) is a naming crutch — it adds no meaning and signals the name itself isn't descriptive enough. Flag any function whose name ends in `_service` and suggest a rename that makes the operation self-evident.

19. **Missing `response_model` on route decorator** — Every route decorator (`@router.get`, `@router.post`, `@router.put`, `@router.delete`, etc.) must include a `response_model=` argument. Flag any decorator that omits it.

20. **Search route URL does not follow path convention** — Search routes must use `/search/{column}` where `{column}` is the column or attribute being searched on (e.g. `/search/name`). When searching via a column on a related model, the path must be `/search/{related_model_resource}/{column}`. Flag any search route whose path does not end with the column name, or that omits the related model segment when searching across a relationship.

21. **CRUD verb in route function whose body calls inference functions** — A route function that uses a CRUD verb (`update_*`, `create_*`, etc.) but whose body calls inference functions (`generate_text`, `embed`, `generate_model`, `directional_projection`, or similar) is misnamed and misplaced. It must use an inference verb and live in `infer.py`. Flag any such route.

22. **CRUD verb in `infer.py` route function name** — Route functions in `infer.py` must use inference verbs (`generate_*`, `embed_*`, `project_*`). Flag any route in `infer.py` whose function name uses a CRUD verb (`create_*`, `read_*`, `update_*`, `delete_*`).

---

### Structure

1. **Route file section order** — Each route file must follow: imports → router definition → `RUNTIME_ERRORS` (if any) → `ERRORS` dict → Pydantic models → route handlers. Flag any file where these appear out of order or separated by comment banners instead of two blank lines.

2. **Router prefix convention** — `crud.py` must define `router = APIRouter()` with no prefix. The resource prefix (e.g. `/testaments`) must be applied in the package's `__init__.py` via `APIRouter(prefix="...")`. Other route files follow the same convention — no prefix on the file's own router, prefix set in `__init__.py`. Flag any `crud.py` whose router carries a prefix directly.

3. **CRUD route order within `crud.py`** — Routes must appear in this order: `create_*`, `batch_create_*`, `read_*`, `read_*_by_*`, `search_*_by_*`, `update_*_*`, `delete_*`, `batch_delete_*`. Flag any route out of this order.

4. **HTTP concerns in tools file** — Tool functions must not import or raise `HTTPException`, return `Response` objects, or reference `Request`. Signal failure via a plain Python exception or return value; the route converts it to HTTP. Flag any `HTTPException` raised inside `tools.py`.

5. **Tool functions with FastAPI dependencies in their signature** — Flag any tool function whose signature includes `Depends(...)`, `Request`, or `Response` — these make the function untestable outside FastAPI.

6. **Route files importing logic from other route files** — Shared logic must live in `tools.py`, not be imported from a sibling route file. Flag any import of a handler or helper defined in another route file. **Exception:** admin route files (`admin.py`) may freely import Pydantic models, prompt constants, and magic variables from anywhere in the project — do not flag these.

7. **`tools.py` missing or improperly populated** — Any logic that is more than 3 lines long and is duplicated across multiple handlers, would be genuinely useful to test in isolation, or already has a test, should live in the route folder's `tools.py`. Flag duplicated multi-line logic that has not been extracted, and flag extracted functions that do not meet this threshold.

8. **Router not registered in main.py or package `__init__.py`** — Every route file's router must be included via `app.include_router(...)`. Flag router variables that are defined but never registered.

9. **Multiple routers in one file** — Each route file must define exactly one `router` variable. Flag files with more than one.

10. **`__init__.py` containing logic** — Package `__init__.py` files must only contain router imports and `__all__` declarations, not business logic. Flag any `__init__.py` with function or class definitions.

11. **Test file placement and naming** — Test files must live in a `tests/` folder inside the route folder and mirror the route file name exactly. Flag test files placed elsewhere or named differently.

12. **Misuse of standard utils** — If a route or tool function reimplements something already in `utils/databases.py`, `utils/errors.py`, or `utils/websockets.py`, flag it and point to the existing util.

13. **Freestanding files at the backend root** — The only files permitted at `backend/` root are `main.py` and `alembic.ini`. Flag any other freestanding module file there.

14. **`main.py` containing route logic** — `main.py` must only configure the app, register routers, and set up middleware. Flag any route handler or business logic defined directly in `main.py`.

15. **Intermediate `routes/` layer inside a package** — Route folders must sit directly under `(package-name)/` (e.g. `{package}/{resource}/crud.py`). An intermediate `routes/` directory violates the package layout. Flag any package that has a `routes/` subdirectory containing the route folders instead of the route folders sitting at the package root.

16. **Package-level `tools.py`** — A `tools.py` at the package root is only valid if its helpers are genuinely shared across multiple route folders in that package. Flag any package-level `tools.py` whose functions are only used by a single route folder — those helpers should live in that folder's own `tools.py`.

17. **Inference-type routes in `crud.py`** — If a route folder contains routes that perform LLM generation, embedding, or similarity projection, those routes must live in `infer.py`, not `crud.py`. Flag any route in `crud.py` whose body calls inference functions.

18. **Inference tools in `tools.py` with no `infer.py`** — If a route folder's `tools.py` contains inference tool functions (LLM generation, embedding, projection) but the folder has no `infer.py`, flag it if at least one inference route is needed to expose those tools.

19. **`infer.py` router not registered in `__init__.py`** — If `infer.py` exists in a route folder, its router must be registered in the folder's package `__init__.py` alongside the crud router. Flag any `infer.py` whose router is defined but not registered.

---

## Frontend

### Bugs

1. **Missing error state in async components** — Any component that makes an async call must declare `const [error, setError] = useState<string | null>(null)`. Flag components that perform async work without this state.

2. **Missing loading state in async components** — `const [isLoading, setIsLoading] = useState(true)` is required for any async component. Flag async components with no loading state.

3. **Error not set in catch block** — Every `try/catch` handler must set `error` state using `err instanceof Error ? err.message : 'An error occurred'`. Flag catch blocks that swallow errors or use a different shape.

4. **Loading not reset in `finally`** — Loading state must be reset in `finally`, not in `try` or `catch`. Flag handlers that reset loading elsewhere.

5. **Not using `api.ts` helpers** — All backend requests must go through `utils/api.ts`. Flag any `fetch(...)` or `axios(...)` call that bypasses it.

6. **Not using `auth.ts` helpers** — Auth validation must use `utils/auth.ts`. Flag components that re-implement auth checks inline.

7. **`useEffect` missing dependency array** — A `useEffect` without a dependency array runs on every render. Flag any `useEffect` missing its second argument unless there is a `Note: ` comment explaining why.

8. **`useEffect` with stale closure** — Flag any `useEffect` that references a state variable or prop inside its body but does not include it in the dependency array. This causes the effect to close over a stale value.

9. **Direct state mutation** — State arrays and objects must not be mutated in place. Flag `state.push(...)`, `state.key = value`, or any mutation of a state variable without creating a new reference via the setter.

10. **Missing `key` prop on list-rendered elements** — Every element produced by `.map(...)` in JSX must have a stable, unique `key` prop. Flag `.map(...)` calls without `key`.

11. **Unguarded API response access** — If an API response can return `null` or `undefined` for a field, the component must guard against it before rendering. Flag direct property access on API response data without null checks.

12. **`as SomeType` assertion hiding null** — Type assertions that bypass `null | undefined` (e.g. `data as User`) can mask runtime crashes. Flag assertions used to silence TypeScript where the underlying value may genuinely be null.

13. **Raw hex codes in Tailwind** — No `text-[#abc123]` or `bg-[#...]` in className strings. Colors must come from `globals.css` tokens. Flag all occurrences.

14. **Direct font imports in components** — No `import { Font } from 'next/font/...'` in component files. Fonts must be defined in `app/globals.css`. Flag component-level font imports.

15. **`window` or `document` used without SSR guard** — Accessing browser globals directly in a component body (outside a `useEffect`) will crash during server-side rendering. Flag any direct reference to `window` or `document` that is not guarded by `typeof window !== 'undefined'` or placed inside a `useEffect`.

---

### Style

1. **Handler naming** — Internal state-mutating functions use plain verbs (`addContact`, `removeContact`). User event / async server action handlers use `handle` prefix (`handleCreateSession`, `handleFileUpload`). Flag mismatches.

2. **`useState` type annotation** — Non-trivial types must be annotated: `useState<Contact[]>([])`, `useState<string | null>(null)`. Primitives must infer: `useState('')`, `useState(true)`. Flag over-annotated primitives and under-annotated complex types.

3. **`alt` boolean pattern for buttons** — A button must accept an `alt` boolean. All style differences must be declared as variables at the top of the component body. Flag any button with multiple inline ternary style checks scattered through JSX.

4. **State-swap variables not grouped at top** — All derived values from a boolean prop (`const label = alt ? '...' : '...'`) must be grouped together at the top of the component body, before handlers and JSX. Flag components where these are scattered.

5. **Missing `'use client'` directive** — Any component using `useState`, `useEffect`, event handlers, or browser APIs must have `'use client'` as its first line. Flag missing directives.

6. **Interface/type definitions not between imports and component** — Types must not be defined inside the component function body or after the export. Flag types declared inline or at the bottom of the file.

7. **Component and file name not PascalCase** — Component functions and their containing files must be PascalCase (`AccountCard.tsx`, not `accountCard.tsx` or `account-card.tsx`). Flag deviations.

8. **Props interface not named after component** — The props interface for a component must be named `ComponentNameProps` (e.g. `ButtonProps` for `Button`). Flag generically named interfaces (`Props`, `IProps`, `ComponentProps`).

9. **No inline styles** — `style={{...}}` attributes must not appear in JSX. All styling must use Tailwind classes. Flag any use of inline style objects.

10. **Import order** — External packages first (`react`, `next/*`), then internal imports via `@` alias (`@/components/...`, `@/utils/...`). Flag files that reverse this order or mix the two groups without a blank line between them.

11. **Anonymous default exports** — Default exports must use named function syntax: `export default function MyComponent()`. Flag anonymous arrow function default exports (`export default () => {}`).

12. **Complex conditions inlined in JSX** — Conditional logic with more than one operator should be extracted to a named variable before the return statement, not embedded directly in JSX. Flag complex ternaries or `&&` chains inside JSX.

13. **Boolean prop verbose syntax** — `disabled={true}` should be `disabled`. Flag boolean props unnecessarily passed as `={true}`.

14. **`.then()` chains mixed with `async/await`** — Handlers must be consistently `async/await`. Flag any handler that mixes `.then()` chains with `await` in the same function.

15. **Props interface exported unnecessarily** — Props interfaces must not be exported unless they are explicitly consumed by another file. Flag exported `*Props` interfaces with no external consumers.

---

### Structure

1. **Component file section order** — Each component file must follow: `'use client'` (if needed) → external imports → internal imports → interfaces/types → exported component. Flag deviations.

2. **Component body order** — Inside the component function: routing/searchParams hooks and derived values → `useState` declarations → handler functions → `useEffect`s → return/JSX. Flag deviations.

3. **`useState` declarations not grouped** — All `useState` calls must appear together, not interleaved with handlers or effects. Flag scattered declarations.

4. **`page.tsx` doing more than importing** — `page.tsx` must only import and render its named page component. No logic, hooks, or JSX beyond that single render. Flag fat `page.tsx` files.

5. **Component placement not confirmed** — Generic reusable components belong in `frontend/components/`. Page-specific components belong in the page's `_components/` subfolder. Flag components in the wrong location.

6. **Overly coarse components** — Components should be small and granular. Flag any component rendering more than one distinct UI concern without delegating to sub-components.

7. **Logic belonging in `utils/` placed directly in a component** — API call construction, auth checks, and shared style helpers must live in `utils/api.ts`, `utils/auth.ts`, or `utils/styles.ts` respectively. Flag these implemented inline inside a component.

8. **Types shared across components defined in a single component file** — Types used by more than one component must live in a dedicated types file, not inline in one of the consumers. Flag shared types defined inside a component file.

9. **Direct backend URL references outside `api.ts`** — The backend URL must only appear in `utils/api.ts`. Flag any hardcoded backend URL string in a component or other util file.

10. **Route group boundaries not respected** — Authenticated routes must be inside `(protected)/`. Public marketing routes must be inside `(open)/`. Flag pages placed directly under `/app/` or in the wrong group.

11. **Loading and error states not rendered** — Components that fetch data must render distinct loading UI and error UI, not just `null` or nothing. Flag components that fetch data but render nothing (or show no error) while loading or on failure.

12. **No named exports from utility files** — Files in `frontend/utils/` must use named exports, not a default export. Flag `export default` in any `utils/*.ts` file.

13. **`layout.tsx` containing per-page logic** — Layout files must only set up shared UI shell (nav, wrappers). Flag any `layout.tsx` that makes page-specific API calls or renders content that only applies to one page.

14. **Single-file component wrapped in unnecessary folder** — A component that is a single file does not need its own subfolder. Flag folders inside `components/` that contain only one `.tsx` file with no supporting files.

15. **Handler functions defined outside component when they depend on state** — Handler functions that close over state or setters must be defined inside the component body. Conversely, handlers that require no component state should be moved to `utils/`. Flag handlers placed at module level that reference state, and handlers inside a component body that reference nothing from the component.

16. **Fixed layout preference violated** — Page layout should generally be fixed — panels and sections visible at all times, not collapsible or hidden behind toggles. Flag any component or panel that is hidden by default, collapsed, or toggled into view (e.g. collapsible drawers, off-canvas panels, show/hide toggles) unless the use case clearly justifies it (e.g. a mobile-only menu). For each: state the component, describe the toggle behaviour, and note whether a fixed-split alternative is feasible.

---

## ORM

### Bugs

1. **Implicit `nullable`** — Every `Column(...)` must explicitly set `nullable=True` or `nullable=False`. Flag any column where `nullable` is omitted.

2. **Boolean without `default`** — Any `Column(Boolean, nullable=False)` must also have `default=True` or `default=False`. Flag boolean columns that omit `default`.

3. **Missing `back_populates`** — Every `relationship(...)` must have `back_populates`. Flag any use of `backref` and any relationship missing `back_populates`.

4. **Missing `uselist=False` on one-to-one** — Flag any relationship intended to be one-to-one that lacks `uselist=False`.

5. **Missing `cascade` on parent-owns-child relationships** — Where a child record should not outlive its parent, the relationship must have `cascade="all, delete-orphan"`. Flag apparent ownership relationships lacking this.

6. **`ondelete` not set on `ForeignKey` when ORM cascade is set** — When `cascade="all, delete-orphan"` is on the relationship, the `ForeignKey` must also have `ondelete="CASCADE"` so DB-level deletes behave consistently. Flag the mismatch.

7. **UUID primary keys** — IDs must be `Column(Integer, primary_key=True)`. Flag any model using `UUID`, `String`, or any non-Integer primary key.

8. **`String` column without explicit length** — All `String` columns must specify a length, defaulting to `String(255)`. Flag bare `Column(String)`.

8. **FK column pointing to wrong table or column** — Check that every `ForeignKey("table.column")` string matches an existing table name (lowercase singular) and `id` column. Flag any that reference a table or column that does not exist.

9. **Missing `index=True` on FK column** — Foreign key columns used in joins or lookups should have `index=True`. Flag FK columns without an index.

10. **`default` used where `server_default` is needed** — A Python-side `default` is set by SQLAlchemy only when inserting via the ORM. For database-generated defaults (timestamps, counters), use `server_default`. Flag `default=` on columns that should be DB-generated.

11. **Ambiguous relationship without `foreign_keys`** — When a model has more than one FK to the same related table, SQLAlchemy raises `AmbiguousForeignKeysError` unless `foreign_keys=[...]` is set on the relationship. Flag relationships that could be ambiguous.

12. **Model not imported in `alembic/env.py`** — For Alembic's `--autogenerate` to detect a model, the model file must be imported before `target_metadata` is read. Flag any model file not reachable from the Alembic env import chain.

13. **Timestamp columns added without request** — `created_at` and `updated_at` must not be added unless explicitly asked. Flag any model that includes them without a recorded instruction.

14. **Column defined after a relationship** — Flag any data column defined below a `relationship(...)` in the same model.

---

### Style

1. **`#*` comment missing before relationship** — Every `relationship(...)` must be preceded by a `#*` comment describing what it represents, its cardinality (one-to-one, one-to-many, many-to-many), and the junction table if applicable. Flag relationships without this comment.

2. **`#*` comment missing cardinality** — Even if a `#*` comment exists, it must explicitly state the cardinality. Flag `#*` comments that describe the relationship in prose but omit the cardinality label.

3. **Relationship attribute not named by role** — The attribute name must reflect its role from this model's perspective. Flag generic names like `accounts`, `items`, or `related`.

4. **Model file import order** — Must follow: `Base` from `databases` → SQLAlchemy column types and `ForeignKey` → `relationship` from `sqlalchemy.orm`. Flag deviations.

5. **`__tablename__` casing** — Must be lowercase singular (`"testament"`, not `"testaments"` or `"Testament"`). Flag mismatches.

6. **Class name casing** — Model class must be PascalCase singular. Flag plural or lowercase class names.

7. **Column names not snake_case** — All column attribute names must be snake_case. Flag camelCase or PascalCase column names.

8. **Boolean column not named as a predicate** — Boolean columns must be named as affirmative predicates: `is_active`, `has_permission`, `is_archived`. Flag boolean columns named as bare nouns (`active`, `archived`, `permission`).

9. **`unique=True` or `index=True` without inline comment** — These flags must be accompanied by an inline comment explaining why the uniqueness constraint or index is needed. Flag columns with these flags and no comment.

10. **Soft delete column not named `is_archived`** — Flag any soft-delete boolean using an alternative name (`is_deleted`, `deleted_at` as a flag, `archived`, etc.).

11. **`DateTime` column using `String` type** — Date/time values must use `Column(DateTime, ...)`, never a String. Flag string-typed columns whose name implies a timestamp or date.

12. **Model cannot have side effects** — Model classes are data containers. Flag any model method that does more than compute a derived value from existing attributes.

13. **`id` column not first** — The `id` primary key column must be the first column defined in the model body. Flag models where `id` appears anywhere else.

14. **Enum values stored as raw strings** — If a column is semantically an enum, it must use a Python `Enum` class and `Column(Enum(...))`, not a bare `String` with free-text values. Flag columns whose name ends in `_type`, `_status`, or `_state` that use a `String` type without an associated enum.

15. **`Note: ` comment rule does NOT apply to ORM files** — The `Note:` prefix convention applies only to route/Python files. In ORM model files, plain `#` comments for column rationale (`unique=True`, `index=True`) and `#*` relationship comments are always permitted and must never be flagged. Do not flag any `#` or `#*` comment in a model file.

---

### Structure

1. **Multiple models in one file** — Generally, each model must live in its own file. If any file defines more than one `DeclarativeBase` subclass, flag it if and only if there is no clear hierarchical ownership of one structure over the other and the extra models are not thin junction tables.

2. **`Base` not from `databases.py`** — The `Base` object must be imported from `utils/databases.py`. Flag any model that defines its own `Base` or imports it from elsewhere.

3. **FK column not directly above its relationship** — The FK column must be placed directly above the `relationship(...)` it backs with no blank line between them — they read as a pair. Flag any FK column separated from its relationship.

4. **FK columns not at bottom of column list** — FK columns and their relationships must be grouped at the bottom of the model body, below the model's own data columns, separated by a blank line. Flag FK columns interleaved with data columns.

5. **FK naming convention** — FK columns must be named `<related_table>_id`. The `ForeignKey(...)` string must reference `"<table>.id"` using the lowercase table name. Flag deviations in either the attribute name or the FK string.

6. **Model file not named after its class** — The file name must match the model class name in snake_case (`Testament` → `testament.py`, `BeneficiaryAllocation` → `beneficiary_allocation.py`). Flag mismatches.

7. **Model file not in the `orm/` folder for its package** — Model files must live in `(package-name)/orm/`. Flag model files placed at the package root, in a routes folder, or elsewhere.

8. **Circular imports between model files** — If two model files import each other for type hints, they must use a `TYPE_CHECKING` guard (`from __future__ import annotations` + `if TYPE_CHECKING: import ...`). Flag circular model imports not gated by `TYPE_CHECKING`.

9. **`hybrid_property` or `@property` added without request** — Flag any property decorator on a model class that was not explicitly requested.

10. **`__repr__` added without request** — Flag any `__repr__` method on a model class that was not explicitly requested.

11. **Query-building inside a model file** — No `select(...)`, `session.query(...)`, or any DB call should appear inside a model file. Flag any such code.

12. **Many-to-many junction table not following conventions** — Association tables used for many-to-many relationships must still follow all column, FK, and naming conventions. Flag junction tables that skip `nullable` declarations, use non-integer PKs, or omit FK indexes.

13. **Model not reachable from Alembic import chain** — Every model file must be directly imported (or reachable via a package `__init__`) in `alembic/env.py` so autogenerate detects it. Flag any model file that is not part of that import chain.

14. **Data columns not ordered: non-nullable before nullable** — Within the model's own data columns (before the FK block), non-nullable columns must come first, nullable columns second. Flag models where a nullable column precedes a non-nullable one.

15. **`is_archived` missing on models described as soft-deletable** — If a model is described or used as soft-deletable but lacks an `is_archived` `Column(Boolean, nullable=False, default=False)`, flag it.

16. **Cross-package relationship not one-directional** — Relationships between models in different packages must be one-directional only: the dependent package holds the FK and the `relationship(...)`, and the depended-on package's model is not modified (no `back_populates` on the other side). Flag any cross-package relationship that adds a `back_populates` attribute to the depended-on model, or that modifies a model outside the current package.

---

## Presentation

When presenting audit results, every finding must cite the rule it comes from (e.g. **Backend Bugs 3**, **ORM Style 1**, **Frontend Structure 4**). Never present a finding without its rule reference.
