# Record: play_foundation

## Contents

1. [Motivating problem — accounts to play a game](#1-motivating-problem--accounts-to-play-a-game)
2. [Player, Bag, Piece resource design](#2-player-bag-piece-resource-design)
3. [Friend and GameInvite — parked/deferred](#3-friend-and-gameinvite--parkeddeferred)
4. [Package-specific auth: require_player_access / require_bag_access](#4-package-specific-auth-require_player_access--require_bag_access)
5. [Critical discovery: accounts package was never mounted](#5-critical-discovery-accounts-package-was-never-mounted)

---

## 1. Motivating problem — accounts to play a game

### Context
Ran `/audit auth_context` first, which found `backend/play/**` (game/action routes) had zero auth anywhere — no `Depends(require_auth)`, and `GamePlayer.player_user_id` was a dead, always-null int with a comment calling it a "future FK to a user table; no accounts yet." Separately, the frontend already gated `/play/**` behind a logged-in session via `proxy.ts` (redirects to `/auth` if no session cookie) — but which *seat* (player 0 or 1) a logged-in user acts as was purely a client-controlled `?player=` URL query param, spoofable by editing the URL.

### Discussion points
Original scope (from the audit follow-up) was much narrower: just add `require_auth`/seat-ownership checks to the existing `play/game` and `play/action` routes, plus a `GameInvite` system so a player could invite a specific friend to claim the second seat. Through `/plan`, this snowballed: adding real seat-auth required knowing "which account is this," which didn't cleanly exist — `GamePlayer.player_user_id` pointed nowhere. That pulled in a `Player` resource (an app-layer identity distinct from `accounts.User`), which pulled in `Bag`/`Piece` (decks a player owns) once the user brought those up mid-plan, and a `Friend` resource (for picking who to invite).

### Decision
Split into slices. This build ships the **foundation only**: `Player`, `Bag`, `Piece`, `BagPiece`, plus the package-specific auth resolvers needed to scope `Bag` access to its owning `Player`. The original ask — auth on `play/game`/`play/action`, seat-claiming, `GameInvite` — is explicitly deferred to a later slice once this foundation exists. See section 3.

---

## 2. Player, Bag, Piece resource design

### Context
Each new resource was run through the project's `resource_creation_workflow.md` (ORM + CRUD questions, framing choices) rather than designed ad hoc.

- **`Player`** (`play/orm/player.py`): a bare 1:1 wrapper around `accounts.User` — `id`, `user_id` (FK, unique, cascade-delete). Deliberately minimal (`last_online_at` was proposed, then explicitly cut — "not necessary for this prototype"). Created via an explicit `POST /players/` call, conceptually fired by a future post-signup "setup wizard" — not auto-provisioned off `User` creation, to keep `accounts` unaware of `play` (correct cross-package dependency direction: `play` depends on `accounts`, never the reverse).
- **`GamePlayer` repoint**: the existing (always-null) `player_user_id` int column was renamed to `player_id` and turned into a real FK → `Player.id` (nullable — a seat can be unclaimed). This is what makes `Player.game_history` a real relationship instead of a dead field.
- **`Piece`** (`play/orm/piece.py`): bare reference row — `id`, `name` (unique). Full piece definitions stay in `engine/.data/catalog/**/*.json` (keyed by the JSON's own `"name"` field, matching `engine/loader.py`'s existing `load_catalog()`). Explicitly *not* a CRUD-created resource yet — "real creation will come later" once there's proper piece-authoring UX. Seeded via a new fixture instead.
- **`Bag`** (`play/orm/bag.py`): a player's saved deck — `id`, `player_id` (FK), `name`, `created_at`, unique on `(player_id, name)`.
- **`BagPiece`** (junction, shares `bag.py` per the ORM guide's "thin junction shares parent's file" rule): many-to-many between `Bag` and `Piece` with a `quantity` column — a piece name is a single shared catalog entry referenced by many bags, not duplicated per bag. Unique on `(bag_id, piece_id)`; quantity is incremented/decremented rather than duplicating rows.

### Discussion points
- Initially proposed `Bag` with a `piece_name` string column directly (no separate `Piece` resource) — the user redirected: pieces needed to be their own resource (`id` + unique `name`) even though bare, specifically so the DB row is the stable FK target while `.data/catalog/` JSON stays the source of truth for the actual definition.
- Initially asked whether `Bag`↔piece was one-to-many; user's "1 bag to many pieces" phrasing was clarified to actually mean many-to-many via a junction (a piece like "Goblin Bomber" is one shared catalog row referenced by many different bags, not duplicated per bag) — user confirmed.
- `BagPiece` was confirmed to have **no CRUD routes of its own** — it's exposed as a `pieces` field on `BagResponse` and mutated through a single `update_bag_pieces(bag_id, delta_pieces: dict[name, int])` route on `Bag`, rather than separate add/remove endpoints.
- Read-route ownership: `read_bag(bag_id)` needed to check the caller actually owns that bag, not just that they have *a* `Player` record — resolved via the `require_bag_access` resolver (section 4), modeled directly on a sibling project's `operations/customer/auth.py` pattern the user pointed to.

### Decision
All four models locked and built as described above. `Piece` rows are fixture-seeded (section below), not created via API. `is_archived`/`is_active` on `Bag` explicitly deferred — bare minimum for this prototype stage.

---

## 3. Friend and GameInvite — parked/deferred

### Context
The original motivating idea ("invite to game should send a `GameInvite` to a friend, only that friend can claim the second seat") implied a `Friend` resource. It was scoped in detail — framing chosen was **directed request/accept** (`requester_user_id`/`recipient_user_id`/`status`/`created_at`/`responded_at`, unique on the pair) — but its ORM/CRUD questions were asked and never answered; the conversation moved on to `Player`/`Bag`/`Piece` instead.

### Discussion points
When circling back, the user explicitly parked `Friend` ("park Friend, we will come back to it after this foundation has landed") rather than finishing it now. `GameInvite` (and the seat-level `require_game_access` auth resolver it depends on) was deferred at the same time — both wait until after this `Player`/`Bag`/`Piece` foundation ships.

### Decision
Neither `Friend` nor `GameInvite` is part of this build. Open items for whenever that slice resumes:
- `Friend` — framing (directed request/accept) is locked; ORM columns and CRUD routes still need to be asked/answered.
- `GameInvite` lifecycle (single-use? decline/cancel action?) and location (`play/orm/` vs elsewhere) — never answered.
- "Find game" — clarified mid-plan to mean "my games" (a resume list for games the caller's `Player` is already seated in), not a public open lobby — this is still unbuilt.
- The original audit finding (zero auth on `play/game`/`play/action` routes, spoofable `?player=` seat param) is **still open** — this build doesn't touch those routes at all.

---

## 4. Package-specific auth: require_player_access / require_bag_access

### Context
Per this project's `auth_context.md` guide, business-logic-scoped access (not pure identity+org) belongs in a package-root `auth.py`, not the shared `utils/auth.py`. This is the first package-specific `auth.py` built in this project.

### Discussion points
The user pointed to a sibling project's example — `/Users/Development/Web/penguin/backend/operations/customer/auth.py` — as the concrete pattern to follow: a `@dataclass(kw_only=True)` subclass of `AuthContext`, a resolver that loads the target resource and checks access, returning `{Custom}AuthContext(**vars(auth), extra_field=...)`. `kw_only=True` is required because `AuthContext`'s own fields include one with a default (`is_admin=False`), which would otherwise conflict with new no-default fields on the subclass.

### Decision
`play/auth.py` defines two layers, each delegating to the one below it (per the guide's parent/child resolver-delegation rule):
- `PlayerAuthContext` (+ `player_id` field) / `require_player_access` — resolves `auth.user_id` → `Player.id`, 404 if no `Player` row exists yet (i.e. the caller hasn't run the setup wizard). Base for anything scoped to "the calling player."
- `BagAuthContext` (+ `bag_id` field) / `require_bag_access` — takes a path `bag_id`, delegates to `require_player_access`, then checks `bag.player_id == auth.player_id` (404 if the bag doesn't exist, then 403 if it exists but isn't the caller's — existence-before-permission, per the guide).

`Piece` routes were explicitly locked as **fully public** — no `Depends()` at all — since they only expose static catalog reference data.

A future `require_game_access` (seat-level, for the deferred `play/game`/`play/action` hardening) will follow the same naming/delegation shape once that slice resumes.

---

## 5. Critical discovery: accounts package was never mounted

### Context
While verifying the cross-package FK (`Player.user_id` → `accounts.User`) wouldn't create an import cycle, checked how `accounts`'s routes get registered in the live app — and found `backend/main.py` never called `accounts.register_routes(app)` anywhere, and never imported `accounts.orm` for table creation either. Only `play.router` was mounted.

### Discussion points
This meant `/sessions`, `/users`, `/organisations` did not exist in the running app at all — no reachable `POST /sessions` to log in with, so no session cookie could ever be minted, so `require_auth` (and therefore everything this entire plan was building on top of it) would 401 forever regardless of how correct the new auth code was. Confirmed via `next.config.ts` that the frontend's `/api` rewrite points at this exact same `main.py` app (`BACKEND_ORIGIN`, default `localhost:8000`) — not a separate accounts-serving backend.

Flagged as a blocker before writing any code. This was explicitly outside the locked `play_foundation_plan.md` scope, but nothing in that plan could ever work end-to-end without it, so it was surfaced for an explicit go/no-go before folding it into this build (rather than silently expanding scope).

### Decision
User confirmed: mount it as part of this build. `main.py` now imports `accounts.orm` alongside `play.orm` in the lifespan's table-registration block, and calls `register_accounts_routes(app)` (aliased on import, since `accounts` exports a `register_routes(app)` function rather than a bare `router` like `play` does) right after `app.include_router(play_router)`.
