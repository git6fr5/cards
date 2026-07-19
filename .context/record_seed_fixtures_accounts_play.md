# Record: Dev fixtures for accounts + play resources

## Contents
1. [Why org/user weren't seedable, and the seeding spec](#1-why-orguser-werent-seedable-and-the-seeding-spec)
2. [Plan decisions and build](#2-plan-decisions-and-build)
3. [Game history + active game seeding](#3-game-history--active-game-seeding)

---

## 1. Why org/user weren't seedable, and the seeding spec

### Context
Only `Piece` had a seeder (`backend/fixtures/piece.py`). Asked why `Organisation`/`User` couldn't
be seeded. Root cause: no technical blocker — every ORM FK chain (`Organisation` -> `User` ->
`Player` -> `Bag`/`BagPiece` -> `Friend`) was already clean, nobody had written those seeder files
yet. Spec given: 1 default org ("Default Org"), 2 users under it, a `Player` per user, both
`default_bags` (goblin + dragon, defined in `backend/engine/.data/default_bags/`) seeded into
`Bag`/`BagPiece` for each player, and the two players made mutual friends.

### Discussion points
None — confirmed as a pure gap, not a design tension.

### Decision
Scope the gap into a proper `/plan` before building, since it touches five new resources across
two packages (`accounts`, `play`) and needed locked decisions on credentials, bag assignment, and
idempotency semantics.

---

## 2. Plan decisions and build

### Context
`/plan` surveyed the ORM chain and `engine/loader.load_default_bag` (goblin/dragon `.txt` files,
repeated names = quantity), then raised four locking questions: idempotency anchor, seeded
credentials, bag-to-player mapping, and friend status.

### Discussion points
- Proposed keeping the idempotency anchor on `Piece.id` (existing) vs moving it to
  `Organisation.id`, framed as a partial-seed-state tradeoff. Pushback: "this fixture seeding is
  pure dev — so 1 doesn't make sense" — the edge case doesn't apply because the dev DB is a fresh
  `testcontainers` instance every run, so there's no legacy partial-seed state to protect against.
  Resolved by locking `Organisation.id` as the anchor, which also matches
  `database_engine_setup.md`'s own canonical example ("e.g. the first Organisation").
- Proposed bag-to-player mapping (player one <- goblin, player two <- dragon) was overridden:
  both players get both bags.
- Mid-build, added a new requirement not in the original spec: `seed_dev` should print each
  seeded user's login (email + plaintext seed password) after seeding completes, for dev
  convenience.

### Decision
Locked plan saved to `.context/builds/seed_fixtures_org_users_players_bags_friend_plan.md`. Built:
- `backend/fixtures/organisation.py` — `seed_organisation`, one default org.
- `backend/fixtures/user.py` — `seed_user` + `seed_password()` (single source of truth for the
  `SEED_PASSWORD` env var / `"password123"` default, reused by the login-print step so the
  plaintext isn't re-derived from the hash).
- `backend/fixtures/player.py` — `seed_player`, one per user.
- `backend/fixtures/bag.py` — `seed_bag`, both default bags per player, `BagPiece` quantities via
  `Counter` over the `.txt` lines, matched against the already-flushed `pieces` list (no re-query).
- `backend/fixtures/friend.py` — `seed_friend`, single `FriendStatus.accepted` row.
- `backend/fixtures/seed_dev.py` — anchor moved to `Organisation.id`, calls all six seeders in
  dependency order, commits once, prints login lines after seeding.

Verification was DB-free: `py_compile` passed on all six files. Full import-chain verification
(`import fixtures.seed_dev`) is blocked by a pre-existing gap in the project venv — `argon2-cffi`
isn't installed, and every route package's `__init__.py` eagerly imports `utils.auth` ->
`utils.encryption` -> `argon2` at import time. Confirmed this isn't caused by the new files: the
pre-existing `fixtures/piece.py` hits the identical `ModuleNotFoundError` on import. Every
class/field referenced in the new seeders (`Bag`, `BagPiece`, `Player`, `Friend`, `FriendStatus`,
`Organisation`, `User`, `engine.loader.load_default_bag`) was instead confirmed by directly
reading the source during planning. Flagged rather than fixed — installing into the venv wasn't
asked for.

### 2026-07-19 — filename prefix follow-up

Asked to rename all fixture files to carry a `seed_` prefix (`seed_bags`, `seed_friends` given as
examples), which deviates from `creating_seeding_fixtures.md`'s documented `{resource}.py`
convention. Flagged two ambiguities (singular vs plural, whether to touch the pre-existing
`piece.py` too) and held per the standing "no edits outside `/build`" rule until `/build` was
re-invoked. On the follow-up `/build` neither question was answered directly, so defaulted:
singular filenames matching the existing `seed_{resource}` function names (not the literal plural
examples), and renamed `piece.py` too since the instruction said "all" fixture files. Renamed
`organisation.py` -> `seed_organisation.py`, `user.py` -> `seed_user.py`, `player.py` ->
`seed_player.py`, `bag.py` -> `seed_bag.py`, `friend.py` -> `seed_friend.py`, `piece.py` ->
`seed_piece.py`; updated the six imports in `seed_dev.py` to match. `py_compile` clean on all
seven files.

---

## 3. Game history + active game seeding

### Context
`/account` page (game history list + active games list, both already built in
`backend/play/game/history.py` and `backend/play/game/active.py`) had nothing to render — no
seeder ever populated `Game`/`GamePlayer` rows. Asked for "a couple" finished games (to show in
history) plus one active game with no turns made against the other seeded player.

### Discussion points
None — pure gap, same as section 1. Investigated both read routes first: `history.py` filters
`Game.is_game_over == True` and derives `result` from `winner_player_id`; `active.py` filters
`is_game_over == False` and additionally requires every seat claimed (no `GamePlayer.player_id IS
NULL`), so "no turns made" only required leaving `GameLog` empty — no invite/unclaimed-seat
machinery needed for the active game.

### Decision
Followed the existing seeder style in this file (fixed/deterministic, no `rng` threading) rather
than `creating_seeding_fixtures.md`'s more general `rng`-based template — consistent with every
other seeder here (`seed_friend`, `seed_bag`, `seed_user`), and there are only ever two seed
players so randomizing pairing/outcome would add nothing. Built `backend/fixtures/seed_game.py`:
`seed_game(session, players)` creates 2 finished `Game` rows (`is_game_over=True`,
`winner_player_id` alternating between the two players, `created_at` staggered into the past so
history ordering is deterministic) and 1 active `Game` row (`is_game_over=False`,
`winner_player_id=None`, `created_at=now`), each with both `GamePlayer` seats claimed
(`player_index` 0/1) and no `GameLog` rows. Wired into `seed_dev.py` after `seed_friend` (needs
`players`, doesn't need `bags`), added a `"game"` key to the summary dict returned by `seed_dev`.

No ORM model touched (reused existing `Game`/`GamePlayer`) — no migration or further fixture
follow-up needed. Verification was DB-free: `py_compile` clean on `seed_game.py` and the edited
`seed_dev.py`.

### 2026-07-19 — StopIteration on `GET /games/{room}/state`

User ran the dev server against the new fixtures and hit `RuntimeError: coroutine raised
StopIteration` from `engine/loader.py:load_board` (`next(piece for piece in player.bag if
isinstance(piece, KingPiece))`), traced through `play/tools.py:replay_game` ->
`_load_seat_pieces`. Root cause: the seeded `GamePlayer` seats had zero `GamePlayerPiece` rows —
the real seat-fill flow (`game/crud.py` and `game_invite/crud.py`) always calls
`snapshot_bag_pieces(seat_id, bag_id)` to copy a chosen `Bag`'s `BagPiece` rows in, and the new
seeder skipped that step entirely, so `player_pieces` came back empty for every seeded game (not
just the active one).

### Decision
`seed_game` now takes `bags: list[Bag]` and, per seat, copies the player's "Goblin" bag's
`BagPiece` rows into that seat's `resolved_pieces` (`GamePlayerPiece`) — mirrors
`snapshot_bag_pieces` without importing it (that function does a live `session.execute` re-query,
inconsistent with this file's "assign to the relationship, let cascade add on flush" convention).
Picked Goblin specifically because it's confirmed to contain a `KingPiece` (`Goblin King` in
`engine/.data/default_bags/goblin.txt`) — `load_board` requires one per side. `seed_dev.py` now
passes `bags` through to `seed_game`. `py_compile` clean on both files.
