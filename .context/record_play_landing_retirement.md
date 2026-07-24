## Contents

1. [Retiring the standalone /play landing page](#1-retiring-the-standalone-play-landing-page)

---

## 1. Retiring the standalone /play landing page

### Context

Tracing the `/play` flow (nav → click Start Game → create game → redirect to room) surfaced that
`PlayLanding.tsx` was stale, dead code. `POST /games/` was called with no body, but
`CreateGameRequest.bag_id` on the backend is a required field — every click 422'd. Even if it had
succeeded, the redirect hardcoded `player=0` while the backend assigns the creator to a random
seat (`creator_index = random.choice([0, 1])`), so the creator would land on the wrong seat/board
orientation half the time.

Grepping for `bag_id` usage in the frontend showed the real, working start-game flow already lives
in `StartGamePanel.tsx` (under the Account page) — it collects a bag and a friend to invite, posts
the correct `bag_id`, and derives the correct seat via `creatorSeat.player_index` rather than
hardcoding it. `/play` was superseded by this flow but never removed, and nav entries
(`RajaHeader`, `HomeHero`) still pointed at it.

Separately, `GameLobby.tsx` (the "waiting for opponent" screen under `/play/room`) was still on the
old dark palette (`bg-raja-black`, `text-raja-grey-light`) rather than the `raja-chrome-*` tokens
the rest of the app (including the room page it's nested in) had already migrated to.

### Discussion points

None — root cause and fix were confirmed directly from code (the 422-guaranteed missing `bag_id`,
the hardcoded `player=0` vs. randomized seat, and the working parallel path in `StartGamePanel`),
not inferred or debated.

### Decision

Retire `/play` as a page rather than fixing it in place (rejected alternative: have `PlayLanding`
fetch bags/friends itself and render `StartGamePanel` — rejected as unnecessary duplication of
Account's existing data-loading, and `StartGamePanel`'s friend-invite model doesn't fit a
standalone quick-start page anyway).

Implemented:
- `RajaHeader.tsx` — "Play" nav link now points to `/account` instead of `/play`.
- `HomeHero.tsx` — "Play" button now points to `/account` instead of `/play`.
- Deleted `frontend/app/(protected)/play/page.tsx` and `PlayLanding.tsx`. The `/play/room` subroute
  and `types.ts` are untouched — only the landing page is gone.
- `GameLobby.tsx` — swapped `bg-raja-black`/`text-raja-grey-light`/`RajaLoader alt` for
  `bg-raja-chrome-bg`/`text-raja-chrome-muted`/`RajaLoader` (no `alt`), matching the light chrome
  palette used elsewhere in the room flow.
