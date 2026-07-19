# Game Invite Flow — Plan

Traces and closes the gap between "click Invite on /account" and "actually playing on /play/room": creator never navigated anywhere, invitee's seat was hardcoded, no lobby state for an unfilled room, no visibility into active/outgoing games on the account page.

## Scope

**In:**
- Seat randomization at game-creation time (`random.choice`)
- Creator `router.push` to `/play/room` after invite sent
- `/play/room` renders a waiting-lobby view when the room isn't full yet (same route, branch)
- Account page: Active Games section, Outgoing (sent) Pending Invites section, existing finished History unchanged
- Invite-claim seat-index fix: `claim_game_invite` response gains the invitee's resolved `player_index`; `IncomingInvites.tsx` uses it instead of a hardcoded `1` (required correctness fix once seats are randomized — folded into scope, not deferred)
- Frontend `Game`/seat type correction in `play/types.ts` (currently mismatched against backend `GameResponse` — blocks typing the new lobby/active-games reads)

**Out / deferred:**
- Websocket/poll-based auto-redirect when invite gets claimed
- Legacy `PlayLanding.tsx` solo-flow (`POST /games/` trailing slash, stale type usage) — left untouched; flagged only
- Any auth tightening on `GET /games/{room}/state` (currently generic `require_auth`, not seat-scoped)

**Migration impact:** none — no ORM columns added, only query/logic changes.

**Build order:** backend seat-randomize → backend `read_game` (room summary) → backend `read_active_games` → backend `read_sent_game_invites` → backend claim-response seat index → frontend types fix → frontend StartGamePanel push → frontend GameLobby → frontend IncomingInvites seat fix → frontend account sections.

## Decisions (locked)

1. **Seat assignment** — randomized at game-creation time: `creator_index = random.choice([0, 1])`, other seat gets the remaining index.
2. **Lobby rendering** — same `/play/room?room=&player=` route. `PlayRoom.tsx` calls `GET /games/{room}/state` first; on `game_not_full` (422) falls back to `GET /games/{room}` and renders a `GameLobby` component instead of the board. No new frontend route.
3. **Three separate reads**: finished (`GET /games/history`, unchanged), active (`GET /games/active`, new), pending-sent (`GET /game_invites/sent`, new).
4. **"Active"** = both seats filled (`GamePlayer.player_id IS NOT NULL` on both) AND `is_game_over == False`.
5. Deliverable: plan + build (this build).
6. Re-verified: `game_is_full`/`pack_game_state`/`replay_game` (`play/tools.py`), `Game`/`GamePlayer` ORM, `require_game_access` (seat resolution already server-side from `player_id`, `?player=` is a display hint only), route-ordering rule (static `/sent` must register before dynamic `/{game_invite_id}`).
7. **Claim seat-index fix folded in**: `claim_game_invite`'s `GameInviteResponse` needs the invitee's own resolved `player_index` so `IncomingInvites.tsx` can navigate to the correct seat instead of a hardcoded `1`. Required by decision 1, not a separate pass.

## Backend structure

```
backend/play/game/
├── crud.py     [edit]  randomize seat index in create_game; add read_game (GET /{room})
├── active.py   [new]   read_active_games (GET /active)
├── history.py  [exists, unchanged]
backend/play/game_invite/
├── crud.py     [edit]  add read_sent_game_invites (GET /sent, registered BEFORE GET /{game_invite_id});
                         claim_game_invite response gains invitee player_index
```

- `read_game` reuses existing `GameResponse` / `GamePlayerResponse` from `game/crud.py` — no new response model.
- `active.py`: own `router`, own `GameActiveResponse` (room, opponent_display_name, created_at, player_index), registered in `play/__init__.py` as `router.include_router(game_active_router, prefix="/games", tags=["Games"])`. Single query with a `NOT EXISTS` subquery for "no unclaimed seat" — no N+1.
- `read_sent_game_invites` reuses existing `GameInviteResponse`, filtered `inviter_player_id == auth.player_id, status == pending`.
- `GameInviteResponse` gains `invitee_player_index: int` — resolved via the claimed `open_seat.player_index` (already in scope in `claim_game_invite`, no extra query).

## Route inventory

| File | Route fn | Method/path | Key preconditions |
|---|---|---|---|
| `game/crud.py` | `create_game` | `POST /games` | *(edited)* seat index now `random.choice([0,1])` |
| `game/crud.py` | `read_game` | `GET /games/{room}` | 404 `game_not_found` |
| `game/active.py` | `read_active_games` | `GET /games/active` | none (empty list if none) |
| `game_invite/crud.py` | `read_sent_game_invites` | `GET /game_invites/sent` | none — registered before `/{game_invite_id}` |
| `game_invite/crud.py` | `claim_game_invite` | `PUT /game_invites/{id}/claim` | *(edited)* response now includes `invitee_player_index` |

## Frontend

```
frontend/app/_components/types.ts                                  [edit] fix/add shared Game, GamePlayerSeat types
frontend/app/(protected)/play/types.ts                              [edit] drop stale Game/GamePlayer, import shared
frontend/app/(protected)/play/room/PlayRoom.tsx                     [edit] catch game_not_full → fetch summary → branch to lobby
frontend/app/(protected)/play/room/_components/GameLobby.tsx        [new]  seat occupancy + reuse InviteLink
frontend/app/(protected)/account/Account.tsx                        [edit] wire new fetches + sections
frontend/app/(protected)/account/_components/StartGamePanel.tsx     [edit] router.push after invite sent
frontend/app/(protected)/account/_components/IncomingInvites.tsx    [edit] use invitee_player_index instead of hardcoded 1
frontend/app/(protected)/account/_components/ActiveGames.tsx        [new]
frontend/app/(protected)/account/_components/OutgoingInvites.tsx    [new]
frontend/app/(protected)/account/types.ts                           [edit] add ActiveGameEntry; GameInviteEntry gains invitee_player_index
```

## Slice sequence

1. Backend: randomize seat index (`game/crud.py::create_game`).
2. Backend: `read_game` (`GET /games/{room}`).
3. Backend: `read_active_games` (`GET /games/active`, new `active.py`).
4. Backend: `read_sent_game_invites` (`GET /game_invites/sent`, ordered before `/{game_invite_id}`).
5. Backend: `claim_game_invite` response gains `invitee_player_index`.
6. Frontend: fix shared `Game`/seat types (`app/_components/types.ts`, `play/types.ts`).
7. Frontend: `StartGamePanel` router.push using step 2's shape.
8. Frontend: `GameLobby` + `PlayRoom` branch (uses route from step 2).
9. Frontend: `IncomingInvites` seat fix (uses field from step 5).
10. Frontend: `ActiveGames` + `OutgoingInvites` account sections (use routes from 3/4).

## Dependency chain

Step 1 independent. Steps 2–5 independent of each other, each needed before its frontend consumer. Step 6 blocks 7 and 10. Step 8 depends on step 2. Step 9 depends on step 5.

## Risk flags

- Route-ordering: `GET /game_invites/sent` must be registered before `GET /{game_invite_id}` or it becomes unreachable.
- Type drift: fixing `play/types.ts::Game` may surface `PlayLanding.tsx`'s existing mismatched usage as a visible typecheck error — left as-is per scope, flag if it fires.

## Safe cuts (last → first)

1. `OutgoingInvites` account section
2. `ActiveGames` account section
3. Lobby view (`GameLobby.tsx` + `PlayRoom` branch)
4. `IncomingInvites` seat fix (falls back to hardcoded `1`, wrong post-randomization — do-not-cut once seat randomization ships)
5. `StartGamePanel` router.push
6. Seat randomization (do-not-cut — foundational, smallest)
