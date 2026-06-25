---
name: Resource Creation Workflow
description: Step-by-step process for creating a new backend resource (ORM model + CRUD routes) when the user names a resource and path
type: feedback
originSessionId: 0284deaa-bc6a-45cf-9250-635fc46fb897
---
When the user asks to create a resource, follow this exact process.

**Why:** The project has strict conventions (style_guide.md) and the user wants a consistent, guided flow rather than ad-hoc generation.

**How to apply:** Any time the user says "create a resource", "create a new resource", or names a resource + path and asks you to scaffold it.

---

## Step 1 — Gather inputs

Ask for the resource name and path if not already given:
- **Resource name** (e.g. `Testament`, `Beneficiary`)
- **Path** where the route folder lives (e.g. `backend/{package}/{resource}/`)
- **Conceptual purpose** — if the user has not explained what this resource represents and how it fits into the system, ask before proceeding. Understanding the purpose is required to make good decisions about columns, relationships, and route design.

Once the user provides the conceptual purpose, suggest 3–4 alternative resource names and present 4 more comprehensive framings of what the resource could be (e.g. slightly different scopes, responsibilities, or relationships). Ask the user to pick which framing most aligns with their intent before moving on.

If the user picks a different name than the one originally given, confirm whether the folder path should also be updated to match the new name.

---

## Step 2 — Ask ORM questions

Ask all of these before generating anything:

1. What are the columns? For each: name, SQLAlchemy type, nullable (yes/no), unique (yes/no), indexed (yes/no), and reason for unique/index if set.
2. Does the model have any foreign keys / relationships? For each: related table, FK column name, relationship attribute name, cardinality (one-to-many / many-to-one / one-to-one / many-to-many), cascade delete (yes/no), and whether the related model is in a **different package**. Cross-package relationships must be one-directional — only the dependent package's model gets the FK and `relationship(...)`; do not add `back_populates` to the other package's model. Ask the user which package should depend on the other before implementing.
3. Is this model soft-deletable? (adds `is_archived = Column(Boolean, nullable=False, default=False)`)
4. Which package's `orm/` folder should the model file go in? (e.g. `backend/{package}/orm/`)

---

## Step 3 — Ask CRUD questions

Ask all of these before generating anything:

1. Any special requirements for creation?
2. What columns should be used to read this resource? (`read_{resource}_by_{column}` routes)
3. What columns should be used to search for this resource? (`search_{resource}_by_{column}` routes using `.ilike()`)
4. What columns should be updatable? (one `update_{resource}_{column}` route per column)
5. Should there be a batch create route?
6. Should there be a batch delete route?
7. Are any of the routes inference operations — LLM text generation, embedding computation, or similarity projection? If yes, they belong in `infer.py` with inference verbs, not `crud.py`. For each, identify where it sits in the pipeline (`generate` → `embed` → `project`) and confirm it will 422 if the prior stage's output is missing.

Once the user has answered all ORM and CRUD questions, before generating any files, present:
- **5 CRUD recommendations** — additional routes or behaviours worth considering based on how this resource will likely be used (e.g. bulk reads, filtered lists, soft-delete toggles, reorder routes).
- **5 model field recommendations** — additional columns worth considering based on the resource's purpose (e.g. `is_archived`, ordering/position column, source/origin tracking, metadata fields).

Ask the user whether they want to adopt any before proceeding to generation.

---

## Step 4 — Generate files

### ORM model file — `{package}/orm/{resource_snake}.py`

Follow these rules from the style guide:

- Import order: `Base` from `utils/databases` → SQLAlchemy column types + `ForeignKey` → `relationship` from `sqlalchemy.orm`
- Class: PascalCase singular. `__tablename__`: lowercase singular.
- `id = Column(Integer, primary_key=True)` — first column always.
- All columns: explicit `nullable=True/False`. Strings always `String(255)` unless specified otherwise.
- `unique=True` / `index=True` must have an inline comment explaining why.
- Boolean with `nullable=False` always has `default=`.
- If soft-deletable: `is_archived = Column(Boolean, nullable=False, default=False)`.
- Non-nullable data columns before nullable data columns.
- FK columns + relationships grouped at bottom, separated from data columns by a blank line.
- FK column placed directly above its `relationship(...)` with no blank line between (they read as a pair).
- FK naming: `<related_table>_id`. `ForeignKey("table.id")` uses lowercase table name.
- Every `relationship(...)` preceded by a `#*` comment: what it represents, cardinality, junction table if applicable.
- Always `back_populates` (never `backref`). One-to-one: `uselist=False`. Child deleted with parent: `cascade="all, delete-orphan"` + `ondelete="CASCADE"` on the FK.
- No `created_at`/`updated_at` unless asked. No `@property`, `hybrid_property`, or `__repr__` unless asked.
- No comments except `#*` relationship comments and inline unique/index rationale comments.

### CRUD route file — `{path}/crud.py`

Follow these rules:

- File section order: imports → `router = APIRouter()` (no prefix) → `RUNTIME_ERRORS` (if needed) → `ERRORS` dict → Pydantic models → route handlers. Two blank lines between sections.
- Never `from fastapi import HTTPException` in a route file. Use `assert_preconditions` from `utils/errors.py`.
- Every route decorator must include `response_model=`.
- Pydantic models — two-tier naming:
  - Operation-specific (single handler): `{Action}{Resource}Request` / `{Action}{Resource}Response` — action is a verb matching the operation (e.g. `CreateTestamentRequest`, `SearchBeneficiaryResponse`).
  - Shared resource representation (returned by multiple handlers — create, read, update): `{Resource}Response` with no action prefix (e.g. `TestamentResponse`, `BeneficiaryResponse`).
- `ERRORS` values must be full sentences.

Route order within `crud.py`:
1. `create_{resource}` — `@router.post("/")` — call `DatabaseConnection.flush()` after `add()` before `return`
   - `batch_create_{resource}` if requested — `flush()` once after the loop
2. `read_{resource}` — `@router.get("/{resource_id}")`
   - `read_{resource}_by_{column}` — `@router.get("/{column_name}/{column_value}")`
   - `search_{resource}_by_{column}` — `@router.get("/search/{column_value}")` using `.ilike()`
3. `update_{resource}_{column}` — `@router.put("/{resource_id}/{column}")` — one per updatable column
4. `delete_{resource}` — `@router.delete("/{resource_id}")`
   - `batch_delete_{resource}` if requested — single `DELETE WHERE id IN (...)` query, not a loop

All DB access through `databases.py` decorators. SQLAlchemy 2.0 style: `select(Model).where(...)`. Always check for `None` after a read before accessing attributes.

### Package `__init__.py`

- Add the new router with the resource prefix: `APIRouter(prefix="/{resource_plural}")`.
- Include it in the package's router exports.

---

## Step 5 — Remind about migrations

After generating, always remind the user: the new ORM model requires an Alembic migration — the user writes this unless explicitly asked to generate it.
