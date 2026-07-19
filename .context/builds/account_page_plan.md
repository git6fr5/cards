# Account page (`(protected)/account`) — build plan

## Scope

In:
- Game history (finished games, win/loss, opponent name)
- Friends list (read-only, display names)
- Start new game (pick bag + friend → creates game + invite)
- Incoming game invites (accept w/ bag pick → redirect into room)
- Readonly bags table (reused catalog UI, tabs) + "Edit bag" → `/catalog?bagId=`
- Nav link to `/catalog`

Deferred (not built):
- Friend request send/accept/decline UI
- "Resume an active/unfinished game you created" list
- Un-friending

Migration impact: `Game` gets `winner_player_id` (nullable FK → player) + `created_at`. User writes the migration.

## Decisions (locked)

1. Win/loss persisted on `Game` (`winner_player_id`, `created_at`) — written once, at the moment `create_action` detects `is_game_over`, not derived live on every history read.
2. Display-name gap fixed by joining `Player.user.display_name` directly onto response models wherever a counterpart is shown — `FriendResponse`, `GameInviteResponse` (inviter/invitee), and the new game-history response (opponent).
3. Start-new-game flow = two existing calls chained client-side: `POST /games` (bag_id) → `POST /game_invites` (game_id + invitee_player_id).
4. `ArchetypePill` + `CostCircle` promoted to `components/ui/` as `RajaArchetypePill` / `RajaCostCircle`.
5. `BagTable`/`BagTableRow`/`BagTabs` promoted out of `catalog/_components/` into `app/_components/` (matches existing precedent — `Piece`, `MovementBoard`, `Board`). Each gains a `readOnly` prop. Shared types (`PieceAttributes`, `PieceFull`, `BagPiece`, `Bag`, `KING_ROLE_TYPE`) moved into `app/_components/types.ts`; catalog-only concerns stay in `catalog/types.ts`, re-exporting the shared ones.
6. `Catalog.tsx` reads a `?bagId=` search param on mount and preselects that bag if it exists among the player's bags.
7. Built in separate slices, backend piece then its frontend piece, in dependency order.

Also required plumbing (not a separate decision): `GameInviteResponse` gained a `room: UUID` field, and `GameResponse` gained an `id: int` field — both needed for the start-game/accept-invite flows to actually work end to end.

## Backend structure

```
backend/play/
  orm/
    game.py                    [edited] + winner_player_id, created_at, winner relationship
    player.py                  [edited] + games_won relationship
  action/
    crud.py                    [edited] persist winner_player_id when is_game_over flips true
  game/
    crud.py                    [edited] GameResponse + id field
    history.py                 [new] GET /games/history — GameHistoryResponse
  friend/
    crud.py                    [edited] FriendResponse + requester/recipient_display_name, _pack_friend(s) helpers
  game_invite/
    crud.py                    [edited] GameInviteResponse + inviter/invitee_display_name + room, _pack_game_invite helper
  __init__.py                  [edited] wired game_history_router (prefix="/games")
```

## Route inventory

| File | Route fn | Method/path | Notes |
|---|---|---|---|
| `game/history.py` | `read_game_history` | `GET /games/history` | player-scoped, only finished games |
| `friend/crud.py` | (all) | `GET /friends`, etc. | response enriched with display names |
| `game_invite/crud.py` | (all) | `GET/POST /game_invites`, `PUT .../claim` | response enriched with display names + room |
| `game/crud.py` | `create_game` | `POST /games` | response now includes `id` |

## Frontend

```
frontend/
  components/ui/
    RajaArchetypePill.tsx       [new]
    RajaCostCircle.tsx          [new]
  app/_components/
    BagTable.tsx                [moved] + readOnly
    BagTableRow.tsx             [moved] + readOnly
    BagTabs.tsx                 [moved] + readOnly
    types.ts                    [edited] + PieceAttributes/PieceFull/BagPiece/Bag/KING_ROLE_TYPE
  app/(protected)/catalog/
    Catalog.tsx                 [edited] ?bagId= preselect, updated imports
    page.tsx                    [edited] wrapped in Suspense (required by useSearchParams)
    _components/PieceCard.tsx   [edited] import RajaArchetypePill/RajaCostCircle
    types.ts                    [edited] re-exports shared types, trimmed to catalog-only concerns
  app/(protected)/account/
    page.tsx                   [new]
    Account.tsx                 [new]
    types.ts                    [new] GameHistoryEntry, FriendEntry, GameInviteEntry, friendCounterpartName
    _components/
      GameHistoryTable.tsx      [new]
      FriendsList.tsx           [new]
      StartGamePanel.tsx        [new]
      IncomingInvites.tsx       [new]
      AccountBags.tsx           [new]
  app/globals.css               [edited] + --max-width-page token
```

## Risk flags / notes

- Win badge uses `tone="neutral"` (not a "success" tone) — `RajaBadge`'s actual implementation only has `neutral`/`danger`, unlike the aspirational design-doc spec listing 5 tones. Didn't invent a new tone to keep this in scope.
- Claim-invite redirect hardcodes `player=1` for the accepting seat — correct given games are always exactly 2 seats (index 0 = creator, index 1 = the only ever-open seat), matches `create_game`'s seat assignment.
- Pre-existing, unrelated bug flagged not fixed: `PlayLanding.tsx` posts `POST /games/` (trailing slash, no body) against a `CreateGameRequest` that requires `bag_id`.
