# Record: dev.py + main.py entrypoint split

## Contents
1. [Why the split, and the shape decided](#1-why-the-split-and-the-shape-decided)

---

## 1. Why the split, and the shape decided

### Context
An `/audit database_engine_setup` pass had already flagged that `main.py` runs
`Base.metadata.create_all()` unconditionally, with zero `DB_AUTO_CREATE` gate anywhere in the
codebase (rated 0/5 — no justifying reason found). Separately, `backend/fixtures/seed_dev.py`
was fully built (org/users/players/bags/friend) but never invoked from any entrypoint — the
project only has a single `main.py`, and the guide's documented seeding path only fires from a
`dev.py`-shaped entrypoint under `TEST_DB`. Asked to add both a `dev.py` and fix `main.py` to use
the guide's proper engine-setup patterns.

### Discussion points
- Flagged an apparent naming mismatch: the guide's multi-entrypoint pair is named `dev.py` +
  `client.py`, not `dev.py` + `main.py`. Resolved by re-reading the guide's own `main.py` scaffold
  text, which explicitly treats `main.py` and `client.py` as interchangeable names for the same
  external-facing, non-seeding role — so "`dev.py` + `main.py`" is sanctioned as-is, no rename
  needed.
- Asked three scoping questions: (1) narrow `main.py`'s route surface like the guide's `client.py`
  example, or keep it as-is? Answered "yes" to keeping it unchanged — no route-exclusion decision
  was in scope. (2) Switch local-dev workflow to `fastapi dev dev.py`, keep prod on
  `uvicorn main:app`, and update the (generic, pre-existing, unrelated-to-this-project) README?
  Answered "yes" to all three. (3) Add the guide's optional `docs.py` OpenAPI generator? Answered
  "not right now."
- Self-locked one implementation default without asking (small, reversible): added `fastapi-cli`
  to `requirements.txt` so `fastapi dev dev.py` actually resolves, rather than documenting
  `uvicorn dev:app --reload` as a workaround — matches the guide's literal scaffold command.
- Verified before switching to bare `import play.orm` / `import accounts.orm` (replacing the
  named-class imports) that both packages' `orm/__init__.py` already import every model file —
  confirmed identical, so the bare-import form registers exactly the same models on
  `Base.metadata`.

### Decision
Plan saved to `.context/builds/dev_main_entrypoint_split_plan.md`. Built:
- `backend/main.py` — lifespan now does `global engine; engine = init_engine()`, wraps
  `Base.metadata.create_all` (and its ORM registration imports) behind `DB_AUTO_CREATE`. Route
  surface, CORS, `/health`, `__main__` block all unchanged.
- `backend/dev.py` (new) — full internal app: `TEST_DB`-or-`DB_AUTO_CREATE`-gated `create_all`,
  `seed_dev(engine)` under `TEST_DB`, identical route registration to `main.py`,
  `dispose_engine()` after `yield`. No `__main__` block — its only supported invocation is
  `fastapi dev dev.py`.
- `backend/requirements.txt` — added `fastapi-cli`.
- `README.md` — backend setup section now documents both `fastapi dev dev.py` (local,
  `TEST_DB=true` auto-seeds) and `uvicorn main:app --reload` (prod entrypoint locally), plus
  `DB_AUTO_CREATE`/`TEST_DB` env var meanings.

Verification was DB-free: `py_compile` passed on both `main.py` and `dev.py`. Full import-chain
verification remains blocked by the same pre-existing missing-`argon2-cffi` venv gap noted in the
seed-fixtures record — not re-tested here since it's a known, unrelated environment issue.
