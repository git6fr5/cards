# Plan: play_foundation

Feature: account-backed identity foundation for the `play` package — `Player`, `Bag`, `Piece`, `BagPiece` resources plus package-specific auth (`require_player_access`, `require_bag_access`).

Locked 2026-07-19.

## Scope

**In (this build):**
- New resources: `Piece` (bare, fixture-seeded), `Player` (bare 1:1 wrapper over `User`), `Bag` (deck), `BagPiece` (junction, no own CRUD — folded into `Bag`)
- Schema edit on existing model: `GamePlayer.player_user_id` → renamed `player_id`, repointed from loose int to real FK → `Player.id`
- New package-specific auth: `backend/play/auth.py` — `PlayerAuthContext`/`require_player_access`, `BagAuthContext`/`require_bag_access` (modeled on `/Users/Development/Web/penguin/backend/operations/customer/auth.py`)
- First use of `backend/fixtures/` in this project (package doesn't exist yet — needs scaffolding per `creating_seeding_fixtures.md`)

**Out / deferred (tracked, not built now):**
- `Friend` (parked — ORM/CRUD never finalized; framing 2 chosen — directed request/accept — if picked back up)
- `GameInvite`, "find game"/"my games" list
- `require_game_access` (seat-level auth on `play/game`+`play/action` routes) — the original audit finding (zero auth on those routes) stays open
- Frontend: no changes in this slice. The spoofable `?player=` URL param, setup-wizard UI, bag-builder UI all deferred
- Wiring a player's `Bag` into actual game-start (engine still self-seeds a default catalog bag via `start_game(seed=...)`)
- `Player.last_online_at` — cut, not deferred

**Migration impact:** yes — 4 new tables + 1 column rename/retype on `game_player`. User writes the migration.

**Side note (not in scope):** `backend/routes.py` (`/game/ws/{room_id}`, `/game/room/...`) imports `engine.context`/`engine.engine`, neither of which exist, and nothing mounts this router in `main.py`. Dead/orphaned file.

## Decisions (locked)

1. Backend-only this slice; frontend integration is separate follow-up work.
2. `Player` is a bare 1:1 wrapper: `id`, `user_id` FK (unique, not null, cascade-delete with `User`). Created via explicit `POST /players/` (a future "setup wizard" calls this), not auto-provisioned off `accounts.User` creation — keeps `accounts` unaware of `play`.
3. `GamePlayer.player_user_id` → `player_id`, FK → `Player.id`. Makes `Player`'s game history a real join (`GamePlayer` rows keyed to `Player.id`), replacing the previously-dead always-null int.
4. `Piece` is a bare reference row (`id`, `name` unique not null) — full definition stays in `engine/.data/catalog/**/*.json`, keyed by the JSON's `"name"` field (matches `engine/loader.py`'s existing `load_catalog()` keying). Seeded via a new fixture, not a CRUD route.
5. `Bag`↔`Piece` is many-to-many via `BagPiece(bag_id, piece_id, quantity)`, unique on `(bag_id, piece_id)`, increment/decrement `quantity` rather than duplicate rows. `BagPiece` has no routes of its own — exposed as a `pieces` field on `BagResponse`, mutated via a single `update_bag_pieces` delta route on `Bag`.
6. `Bag`: `id`, `player_id` FK (not null), `name` (not null), `created_at`; unique on `(player_id, name)`. Bare — no `is_archived`/`is_active` yet.
7. Auth shape: `require_player_access` (identity → `Player`, 404 if no `Player` row) is the base; `require_bag_access` (path `bag_id` → loads `Bag`, delegates to `require_player_access`, 403 if `bag.player_id != auth.player_id`) is the child resolver.
8. `Piece` routes are fully public — no `Depends()` at all.
9. `read_{resource}` (not `read_{resource}_by_id`) for PK lookups, per `creating_backend_routes.md:48`.

## Backend structure

```
backend/play/
├── auth.py                    [new]  PlayerAuthContext/require_player_access, BagAuthContext/require_bag_access
├── orm/
│   ├── player.py               [new]  Player
│   ├── bag.py                  [new]  Bag
│   ├── bag_piece.py            [new]  BagPiece (junction)
│   ├── piece.py                 [new]  Piece
│   ├── game_player.py          [edit]  player_user_id → player_id, FK → Player.id
│   ├── game.py                 [exists]
│   ├── game_log.py             [exists]
│   └── __init__.py             [edit]  export Player, Bag, BagPiece, Piece
├── player/
│   ├── __init__.py             [new]
│   └── crud.py                 [new]  create_player, read_player, read_current_player
├── bag/
│   ├── __init__.py             [new]
│   └── crud.py                 [new]  create_bag, read_bag, read_bags, update_bag_name, update_bag_pieces, delete_bag
├── piece/
│   ├── __init__.py             [new]
│   └── crud.py                 [new]  read_piece, read_piece_by_name, read_pieces
├── game/                       [exists, untouched this slice]
├── action/                     [exists, untouched this slice]
└── __init__.py                 [edit]  mount player/bag/piece routers

backend/fixtures/               [new package]
├── __init__.py                 [new]
└── seed_piece.py                [new]  walks engine/.data/catalog/**/*.json → Piece rows

backend/main.py                 [edit]  lifespan import: add Player, Bag, BagPiece, Piece
```

`{Resource}Response` authored in each resource's own `crud.py`, except `BagResponse.pieces` which is composed from a `BagPiece` join inside `bag/crud.py`.

## Route inventory

| File | Route fn | Method/path | Auth | Key preconditions |
|---|---|---|---|---|
| `player/crud.py` | `create_player` | `POST /players/` | `require_auth` | 409 if caller already has a `Player` |
| `player/crud.py` | `read_player` | `GET /players/{player_id}` | `require_auth` | 404 if not found |
| `player/crud.py` | `read_current_player` | `GET /players/me` | `require_player_access` | — |
| `bag/crud.py` | `create_bag` | `POST /bags/` | `require_player_access` | 409 on dup `(player_id, name)` |
| `bag/crud.py` | `read_bag` | `GET /bags/{bag_id}` | `require_bag_access` | 404 not found → 403 not owner (via resolver) |
| `bag/crud.py` | `read_bags` | `GET /bags/` | `require_player_access` | filtered to `auth.player_id` |
| `bag/crud.py` | `update_bag_name` | `PUT /bags/{bag_id}/name` | `require_bag_access` | — |
| `bag/crud.py` | `update_bag_pieces` | `PUT /bags/{bag_id}/pieces` | `require_bag_access` | 422 if a piece name doesn't exist or delta would go negative |
| `bag/crud.py` | `delete_bag` | `DELETE /bags/{bag_id}` | `require_bag_access` | cascades `BagPiece` rows |
| `piece/crud.py` | `read_piece` | `GET /pieces/{piece_id}` | none (public) | 404 not found |
| `piece/crud.py` | `read_piece_by_name` | `GET /pieces/name/{name}` | none (public) | 404 not found |
| `piece/crud.py` | `read_pieces` | `GET /pieces/` | none (public) | — |

## Frontend

None this slice.

## Slice sequence

1. `Piece` ORM + `fixtures/` package scaffold + `seed_piece.py` + `piece/crud.py` (no dependencies)
2. `Player` ORM (depends on `accounts.User`)
3. `GamePlayer` repoint (`player_user_id`→`player_id`, FK to `Player`) — depends on `Player` existing
4. `play/auth.py` — `require_player_access` (depends on `Player`)
5. `player/crud.py` routes (depends on #4)
6. `Bag` + `BagPiece` ORM (depends on `Player`, `Piece`)
7. `play/auth.py` — `require_bag_access` (depends on #4, #6)
8. `bag/crud.py` routes (depends on #7)
9. Mount `player`/`bag`/`piece` routers in `play/__init__.py`, update `main.py` lifespan imports

## Dependency chain

`Piece` and `Player` are independent roots → `GamePlayer` repoint and `require_player_access` both need `Player` → `Bag`/`BagPiece` need `Player` + `Piece` → `require_bag_access` needs `Bag` + `require_player_access` → `bag/crud.py` needs `require_bag_access`.

## Risk flags

- `GamePlayer` rename (`player_user_id`→`player_id`) is a breaking column change on an existing table — if any real game rows already exist in a live DB, migration needs a data-preserving rename, not drop+add (all current values are `null` per the code comment, so likely fine, but worth double-checking before writing the migration).
- `update_bag_pieces`'s delta semantics (name-keyed dict, +/-) need careful 422 handling — unknown piece name vs. over-decrement are two different failure cases, both worth distinct error keys.
- First use of `backend/fixtures/` — no established pattern in this repo yet to copy from; `creating_seeding_fixtures.md` governs shape but this is a new package, not just a new seeder file.

## Safe cuts (last → first)

1. `read_pieces` (list-all)
2. `update_bag_name`
3. `require_bag_access`'s ownership check (not recommended to cut)
4. `GamePlayer` repoint (#3 in sequence) — nothing else in this slice strictly requires it
5. Do-not-cut: `Piece` fixture seeding — without it `Bag`/`BagPiece` have nothing to reference.
