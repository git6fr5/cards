# Audit: database_engine_setup.md — 2026-07-19

Scope: whole backend (`backend/`). Guide: `guides/database_engine_setup.md`.

## Files checked
- `backend/main.py` (entrypoint/lifespan)
- `backend/utils/databases.py` (engine, `DatabaseConnection`, session decorators)
- `backend/utils/auth.py`, `backend/play/auth.py` (manual resolver Session usage)
- `backend/fixtures/seed_dev.py` + seeders (seeding pattern)
- Every `crud.py` / `preview.py` / `board.py` route file under `accounts/` and `play/` (decorator-per-verb rule)

## Findings

### 1. `Base.metadata.create_all` runs unconditionally, no `DB_AUTO_CREATE` gate
**File:** `backend/main.py:14-19`
```python
async def lifespan(app: FastAPI):
    try:
        from play.orm import Game, GamePlayer, GamePlayerPiece, GameLog, Player, Bag, BagPiece, Piece, Friend, GameInvite  # noqa: F401
        from accounts.orm import User, Session, Organisation, OrganisationRole, AccessToken, Invite  # noqa: F401
        Base.metadata.create_all(init_engine())
    except Exception as e:
        print(f"[startup] DB connection failed: {e}")
```
**Rule:** "Schema auto-creation (`Base.metadata.create_all(engine)`) is gated behind `DB_AUTO_CREATE` (env var, default `"false"`) — never run unconditionally on every boot. ORM package imports needed to register models on `Base.metadata`... only happen inside that gated block."
**Reasoning:** `DB_AUTO_CREATE` does not appear anywhere in the codebase (`grep` confirms zero hits). No comment or prior decision on record justifies this. **Rating: 0/5 — no justifying reason found.**

### 2. `create_game` manually `add()`s inside a `@create_resource`-decorated handler
**File:** `backend/play/game/crud.py:83-92`
```python
@router.post("", status_code=201, response_model=GameResponse)
@create_resource
def create_game(body: CreateGameRequest, auth: PlayerAuthContext = Depends(require_player_access)) -> Game:
    ...
    game = Game(seed=seed, room=uuid4(), is_game_over=False)
    creator_seat = GamePlayer(player_index=0, player_id=auth.player_id)
    game.players = [creator_seat, GamePlayer(player_index=1)]

    DatabaseConnection.add(game)
    DatabaseConnection.flush()
    snapshot_bag_pieces(creator_seat.id, body.bag_id)

    return game
```
**Rule:** "A `create_{resource}` handler only needs its own `DatabaseConnection.flush()` if it needs the DB-assigned id before constructing its return value — the decorator already refreshes on return either way." (implies no manual `add()` needed)
**Reasoning:** `flush()` alone can't assign `creator_seat.id` unless `game` (and its cascaded `players`) is already in the session — the parent must be `add()`-ed first for cascade-add to attach the children. `snapshot_bag_pieces(creator_seat.id, ...)` needs that id mid-handler, before `@create_resource`'s own auto-add runs on return. The manual `add()` looks functionally necessary for this specific "need a cascaded child's id before returning" case, which the guide's prose doesn't fully cover — not contradicted by any on-record decision, but a real gap between guide wording and this case's requirements. **Rating: 4/5 — functionally justified, though undocumented as an explicit exception.**

## Reviewed, not findings

- `play/action/preview.py:31-32` — `@router.post(...)` paired with `@read_resource` looked like a verb mismatch on first pass. On inspection: the handler only replays/simulates (no `add`/`flush`/`commit`), POST is used solely because it needs a request body — this is the *correct* decorator for its actual read-only CRUD semantics, not a violation.
- `accounts/organisation/access_tokens/crud.py:58-70` (`create_access_token`) — POST decorated `@update_resource` instead of `@create_resource`, manually `add()`s + `flush()`s. Justified: the handler returns a composite `CreateAccessTokenResponse` (plaintext token + serialized model), not a bare ORM instance, so `@create_resource`'s auto-add-the-returned-object contract doesn't apply — matches the guide's own batch-route exception in spirit.
- All other `crud.py` files across `accounts/` and `play/` — every `GET`→`read_resource`, `PUT`/`DELETE`→`update_resource`/`delete_resource`, and `POST`→`create_resource` (or `update_resource` for batch/composite-return cases) pairing checked and correct.
- `utils/databases.py` — `init_engine`/`dispose_engine`/`create_engine` args/`TEST_DB` swap/vector-extension bootstrap all match the guide's scaffold exactly.
- `utils/auth.py`, `play/auth.py` manual resolvers opening their own `with Session(init_engine()) as session:` — this is the guide's documented exception (`Depends()` resolves before the route decorator sets the `current_session` ContextVar).
- `fixtures/seed_dev.py` — raw `Session` usage matches the seeding scaffold; no `TEST_DB`/`DB_AUTO_CREATE` conflation.
- No `@app.on_event("startup")` usage anywhere (lifespan pattern used throughout, correct).
- No bare `except: pass` swallowing DB errors found.
- `create_engine` never called outside `utils/databases.py`.

## Minor / not scored as findings
- `main.py` doesn't assign `init_engine()`'s result to a module-level `global engine` the way the guide's own `main.py` scaffold shows (`global engine; engine = init_engine()`) — it just calls `init_engine()` inline. Harmless: `init_engine()` is already memoized globally inside `databases.py`, and `main.py` never re-references `engine` elsewhere (no `dispose_engine()` call in this file either, consistent with the single-entrypoint shape).
- `main.py`'s ORM-registration imports use `from play.orm import Game, GamePlayer, ...` / `from accounts.orm import User, Session, ...` (named imports) rather than the guide's literal `import {package}.orm  # noqa: F401`. Functionally equivalent — importing the package still executes its `__init__.py` and registers every model on `Base.metadata` regardless of which names are then pulled out — pure style deviation.
