# Plan: dev.py + main.py entrypoint split, proper engine setup patterns

## Scope
- In: fix `main.py`'s lifespan (module-global `engine`, `DB_AUTO_CREATE`-gated `create_all`), add new `dev.py` (full internal app: `TEST_DB`-gated auto-create + `seed_dev`), add `fastapi-cli` to `requirements.txt`, update README run instructions.
- Out: no route surface narrowing on `main.py` (stays identical to today), no `client.py`, no `docs.py` (explicitly deferred), no `.env.example` fix (pre-existing gap, unrelated).
- System-of-record: `main.py`/`dev.py` are entrypoint config only, no business logic added.
- Build order: backend-only, single slice, no frontend leg.

## Decisions (locked)
1. `main.py` keeps its exact current route surface (`play_router` + `register_accounts_routes`), unchanged — not narrowed to a hand-picked subset like the guide's `client.py` example.
2. `dev.py` is the local-dev entrypoint (`fastapi dev dev.py`); `main.py`/Dockerfile stay on `uvicorn main:app` for prod. README documents both.
3. No `docs.py` for now.
4. `fastapi-cli` added to `requirements.txt` so `fastapi dev dev.py` (the guide's literal scaffold command) actually resolves, rather than documenting `uvicorn dev:app --reload` as a workaround.

## Backend structure
```
backend/
├── main.py            [edit] global engine + DB_AUTO_CREATE-gated create_all, ORM imports moved inside gate, route surface unchanged
├── dev.py             [new]  full internal app: TEST_DB branch (create_all if test_db or DB_AUTO_CREATE, seed_dev if test_db), same route registration as main.py, dispose_engine() after yield, no __main__ block
├── requirements.txt   [edit] + fastapi-cli
```

## Route inventory
n/a — no routes touched.

## Frontend
n/a.

## Slice sequence
1. Fix `main.py` lifespan (gate + global engine, ORM imports moved inside the gate).
2. Add `dev.py` (mirrors `main.py`'s app setup/CORS/health/routers, differs only in lifespan; no `__main__` block).
3. Add `fastapi-cli` to `requirements.txt`.
4. Update `README.md`: replace single `uvicorn main:app --reload` line with `fastapi dev dev.py` (local, seeds under `TEST_DB=true`) vs `uvicorn main:app --reload` (prod entrypoint locally); document `TEST_DB`/`DB_AUTO_CREATE` env vars.

## Dependency chain
`main.py` fix -> independent. `dev.py` depends on `fixtures/seed_dev.py` (already built) functionally, and mirrors `main.py`'s fixed pattern for consistency only. README depends on both files existing.

## Risk flags
- `dev.py` and `main.py` will have near-duplicate app-setup boilerplate (CORS, health, router registration) — no shared-setup extraction requested, so none added.
- `fastapi-cli` is a new dependency addition.
- `import play.orm` / `import accounts.orm` (bare) must still register every model on `Base.metadata` the same way the current named-import style does — verify each package's `orm/__init__.py` actually imports every model file.

## Safe cuts (last-to-first)
1. README update — drop, code still works, just undocumented.
2. `fastapi-cli` — drop, use `uvicorn dev:app --reload` for local dev instead.
3. `dev.py` — drop, falls back to current single-entrypoint state (audit finding #1 stays unfixed).
