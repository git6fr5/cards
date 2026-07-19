# Template

FastAPI + Next.js (TypeScript) + PostgreSQL starter template.

## Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Backend  | FastAPI, SQLAlchemy 2, Alembic          |
| Frontend | Next.js 16, TypeScript, Tailwind CSS v3 |
| Database | PostgreSQL                              |

## Setup

### 1. Rename the project prefix

All design system components and Tailwind tokens use `Project` / `project-` as a placeholder.
Do a global find-and-replace before writing any code:

| Find         | Replace with       | Where                                          |
|--------------|--------------------|------------------------------------------------|
| `Project`    | `YourProjectName`  | `frontend/components/` (function names)        |
| `project-`   | `yourprojectname-` | `frontend/components/` and `tailwind.config.mjs` |

### 2. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env      # then fill in DATABASE_URL
alembic upgrade head

# local dev — auto-creates schema + seeds fixtures when TEST_DB=true
fastapi dev dev.py

# production entrypoint (also runnable locally to test it directly)
uvicorn main:app --reload
```

`DB_AUTO_CREATE` (default `false`) gates `Base.metadata.create_all` in both entrypoints.
`TEST_DB` (default `false`, `dev.py` only) additionally swaps in a `testcontainers` Postgres
instance and seeds dev fixtures on startup.

### 3. Frontend

```bash
cd frontend
npm install

cp .env.example .env      # then fill in NEXT_PUBLIC_API_URL
npm run dev
```

## Structure

```
backend/
    example_package/        # example domain package — delete or rename
    utils/                  # shared database, error, and websocket helpers
    alembic/                # migrations
frontend/
    app/
        (open)/             # public pages (no auth)
        (protected)/        # authenticated pages
    components/
        forms/              # Project* form components
        layout/             # Project* layout components
    utils/
        api.ts              # centralised HTTP client
seed/
    example_seed_data.sql   # example seed — replace with your own
```

## Adding a new backend resource

Run `/resource creation` in Claude Code to scaffold a new package resource following the project conventions.

## Adding a new frontend page

Run `/page creation` in Claude Code to scaffold a new page following the project conventions.
