# Plan: dev fixtures — default org, 2 users, players, both default bags each, mutual friend

## Scope
- In: `seed_organisation`, `seed_user`, `seed_player`, `seed_bag`, `seed_friend` — backend/fixtures only.
- Out: no ORM changes, no routes, no frontend, no migration.
- First-class concern: deterministic dev data — no RNG anywhere in this slice (matches `seed_piece`'s own precedent of skipping the `rng` param when nothing's random).
- Build order: backend-only, single vertical slice (fixtures don't have a frontend leg).
- Added after initial draft: `seed_dev` prints each seeded user's login (email + plaintext seed password) after seeding completes.

## Decisions (locked)
1. Idempotency anchor moves to `Organisation.id` — the guide's own canonical example (`database_engine_setup.md:115`, "e.g. the first Organisation"), and moot on partial-seed-state edge cases since dev DB is a fresh `testcontainers` instance each run.
2. Creds: `player_one@example.com` / `player_two@example.com`, display names "Player One"/"Player Two", password from `os.getenv("SEED_PASSWORD", "password123")` hashed via real `hash_password` (`utils/encryption.py:14`).
3. Both players get both bags — `goblin` and `dragon` each, per player. 4 `Bag` rows total, named "Goblin"/"Dragon".
4. `Friend` seeded directly as `FriendStatus.accepted` with `responded_at=utcnow()` between the two players.
5. After seeding, `seed_dev` prints login lines (`email / password`) for both seeded users — dev convenience, plaintext password taken from the same variable used to hash it, never re-derived from the hash.

## Backend structure
```
backend/fixtures/
├── piece.py            [exists] unchanged
├── organisation.py     [new] seed_organisation(session) -> Organisation
├── user.py             [new] seed_user(session, organisation) -> list[User]
├── player.py           [new] seed_player(session, users) -> list[Player]
├── bag.py              [new] seed_bag(session, players, pieces) -> list[Bag]
├── friend.py           [new] seed_friend(session, players) -> Friend
└── seed_dev.py          [edit] anchor -> Organisation.id, call all 6 seeders in order, commit once, print login lines
```

## Route inventory
n/a — no routes touched.

## Frontend
n/a.

## Slice sequence
1. `seed_piece` (unchanged) — Piece catalog rows.
2. `seed_organisation` — one "Default Org", `is_default=True`.
3. `seed_user` — 2 users under that org.
4. `seed_player` — 1 Player per User.
5. `seed_bag` — per player: `Bag(name="Goblin")` + `Bag(name="Dragon")`, each with `BagPiece` rows built by `Counter(load_default_bag(bag_name))` against a `{Piece.name: Piece}` dict built from the already-flushed `pieces` list (no re-query, per guide rule). Relationship-assign `bag.bag_pieces = [...]`, let cascade add on `session.add_all(bags)`.
6. `seed_friend` — single accepted `Friend(player_one -> player_two)`.
7. `seed_dev` prints login lines for both users.

## Dependency chain
piece -> organisation -> user -> player -> bag (needs player + piece) -> friend (needs player) -> login print (needs users + plaintext password).

## Risk flags
- If any `default_bags/{goblin,dragon}.txt` name isn't in the `Piece` catalog, `piece_by_name[name]` raises `KeyError` — no defensive handling added, since the same name-matching invariant is already trusted by the engine's own `load_players` path (`engine/loader.py:36-38`).
- `Bag` has `UniqueConstraint(player_id, name)` — fine, two distinct names per player.
- `BagPiece` has `UniqueConstraint(bag_id, piece_id)` — `Counter` collapses duplicate lines from the `.txt` into one row with `quantity`, so no collision.
- Printed login includes a plaintext password — dev-only (`TEST_DB` gated), acceptable per guide rule 6's spirit (seed creds aren't real secrets).

## Safe cuts (last-to-first)
1. `seed_friend` — drop entirely, rest stands alone.
2. Second bag per player (`dragon`) — fall back to one bag each if "both get both" turns out unwanted later.
3. `seed_bag` — drop, leaves org/users/players seeded without decks.
4. `seed_player` — drop, leaves just org/users.
