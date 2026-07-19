# Account page

## Contents

1. [Scope of the account page](#1-scope-of-the-account-page)
2. [Win/loss + display-name data gaps](#2-winloss--display-name-data-gaps)
3. [Component reuse strategy](#3-component-reuse-strategy)
4. [Start-game / invite flow](#4-start-game--invite-flow)

---

## 1. Scope of the account page

### Context
No `.context/` record or code existed for `(protected)/account` — the page didn't exist at all. The user wanted a page showing game history, friends, a way to start a new game with a friend, incoming invites, and a readonly view of the player's bags with a jump-back-into-`/catalog`-to-edit action.

### Discussion points
Initial ask (first message) described "for each friend, an invite to play" as a per-friend action. A later clarifying note replaced that with a dedicated "Start a new game" section (pick a bag + a friend, one flow) plus a separate "Incoming game invitations" section — the per-friend invite button idea was dropped in favor of this split.

### Decision
Final scope: game history (win/loss), friends list (read-only), start-new-game panel (bag + friend picker), incoming invites (accept w/ bag picker → redirect into the room), readonly bags table reusing catalog's UI with an "Edit bag" jump to `/catalog?bagId=`, and a nav link to `/catalog`. Deferred: friend request send/accept/decline UI, a way to resume an unfinished game you created, un-friending.

---

## 2. Win/loss + display-name data gaps

### Context
Surveying the codebase before planning surfaced two real gaps: `Game` had no persisted winner or timestamp (`is_game_over` was computed live via engine replay and even then never had a winner concept), and there was no way for an ordinary player to resolve another player's display name — `PlayerResponse` only exposed `{id, user_id}`, and `/users/{id}` is self-or-admin gated.

### Discussion points
Two options were on the table for win/loss: derive live via replay on every history read (no schema change), or persist `winner_player_id` + `created_at` on `Game`, written once when the game actually ends. User chose persistence.
For display names, the question was how far the fix should reach — user approved "new field on FriendResponse," and during planning this was generalized to also cover `GameInviteResponse` (inviter/invitee) and the new game-history response (opponent), since all three surfaces hit the same underlying gap.

### Decision
`Game` gained `winner_player_id` (nullable FK → player, `ondelete=SET NULL`) and `created_at`; `Player` gained the reciprocal `games_won` relationship. `create_action` now persists the winner once, at the exact point it detects `is_game_over` flipping true (guarded so it never re-computes on subsequent calls). Display names are resolved via a batched `Player → User` join and attached to `FriendResponse`, `GameInviteResponse`, and the new `GameHistoryResponse` — never a per-row query. User writes the Alembic migration for the new `Game` columns.

---

## 3. Component reuse strategy

### Context
The account page needed a readonly bags table identical in style to `/catalog`'s bag table, plus the same archetype-pill/cost-circle atoms `PieceCard` already used. Those components (`BagTable`, `BagTableRow`, `BagTabs`, `ArchetypePill`, `CostCircle`) all lived in `catalog/_components/` — page-local by convention, not meant to be imported cross-page.

### Discussion points
Two live tensions: (1) should the small presentational atoms (`ArchetypePill`, `CostCircle`) be promoted into `components/ui/` as proper design-system atoms now that two pages need them, or forked; (2) should the heavier, drag-and-drop-capable `BagTable`/`BagTableRow`/`BagTabs` be promoted, forked, or given a `readOnly` escape hatch. User approved promotion for both rather than forking.

### Decision
`ArchetypePill`/`CostCircle` → `components/ui/RajaArchetypePill`/`RajaCostCircle` (proper `{Project}`-prefixed shared atoms). `BagTable`/`BagTableRow`/`BagTabs` → `app/_components/`, matching the existing precedent set by `Piece`/`MovementBoard`/`Board` (cross-page, non-design-system shared components) rather than `components/table/` (which the style guide reserves for generic table chrome only, not actual tables). All three gained a `readOnly` prop that disables drag/drop and the rename/create affordances. Their shared types (`PieceFull`, `Bag`, `BagPiece`, `KING_ROLE_TYPE`, etc.) moved to `app/_components/types.ts`; `catalog/types.ts` re-exports them and keeps only catalog-specific concerns (`FilterState`, bag-size constants, `getBagRejectionReason`).

Flagged to the user during planning: this reuse carries forward two pre-existing game-palette dips — `ArchetypePill` sets raw archetype hex via inline `style` (bypassing chrome tokens), and `CostCircle` uses `bg-raja-ink/50` for summon cost. Both already existed in catalog; nothing new was introduced.

---

## 4. Start-game / invite flow

### Context
"Start a new game" needed to chain a bag+friend picker into actually creating a game and sending an invite. The existing backend already had `POST /games` (bag_id → creates game, seats creator) and `POST /game_invites` (game_id + invitee_player_id, requires an accepted friend + open seat) — composable client-side with no new backend action needed for the invite itself.

### Discussion points
Two contract gaps surfaced only once actually wiring the frontend call chain (not caught during planning): `GameResponse` (from `POST /games`) exposed only `room`/`is_game_over`/`players` — no `id` — but `POST /game_invites` requires `game_id: int`, making the two calls impossible to chain as designed. Similarly, `GameInviteResponse` had no `room` field, which the accept-invite flow needs to redirect the claimant into `/play/room`.

### Decision
Added `id: int` to `GameResponse` and `room: UUID` to `GameInviteResponse` — necessary plumbing, not new scope decisions, since the chained flow was already locked. The accept-invite redirect hardcodes seat `player=1` for the claimant, since games are always exactly two seats (index 0 = creator, index 1 = the only seat that can ever be open) — matches `create_game`'s existing seat assignment, not a new assumption.

Also flagged, not fixed (pre-existing, unrelated): `PlayLanding.tsx` posts `POST /games/` (trailing slash, no body) against a `CreateGameRequest` that requires `bag_id` — looks broken independent of this work.
