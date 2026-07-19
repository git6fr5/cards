# Record: signup_flow

## Contents

1. [Motivating survey — frontend gaps from play_foundation/play_game_auth](#1-motivating-survey--frontend-gaps-from-play_foundationplay_game_auth)
2. [Blocker: no self-serve sign-up route exists](#2-blocker-no-self-serve-sign-up-route-exists)
3. [create_user_by_signup — built](#3-create_user_by_signup--built)

---

## 1. Motivating survey — frontend gaps from play_foundation/play_game_auth

### Context
Read `record_play_foundation.md` and `record_play_game_auth.md` to scope the "natural frontend changes" that fall out of the backend work those records describe. Survey of the actual frontend (`app/(protected)/play/**`, `utils/api.ts`, `utils/auth.ts`) found the backend had moved well ahead of the frontend: `create_game` now requires `bag_id` and auto-seats the creator, but `PlayLanding.tsx` still POSTs with no body; `types.ts` still has the pre-rename `player_user_id`/`is_completed` fields; `InviteLink.tsx` still hand-builds a spoofable `?player=` URL instead of using the real `Friend`/`GameInvite` flow; and there is zero UI anywhere for `Player`, `Bag`, `Piece`, `Friend`, or `GameInvite` despite all of them being fully live backend resources.

### Discussion points
Original framing offered candidate slices (repair-only, Player+Bag foundation UI, Friend/GameInvite UI, or all combined) and asked which to plan first. User redirected with a concrete answer instead of picking from the candidates: three pages, each to go through the project's `page_creation_workflow.md` independently —
1. a sign-up flow
2. a single protected page combining the piece catalog + bag builder (deliberately merged for simplicity rather than two pages)
3. an "Account" page — game history, friends list, start-a-new-game (select bag + invite a friend), incoming game invitations, and nav to the catalog/bag-builder page

User asked to start with page 1.

### Decision
Three pages locked as the frontend scope, sequenced 1→2→3, each run through `page_creation_workflow.md` independently. Page 1 (sign-up) surfaced a backend blocker before any layout/component planning could proceed — see section 2. Pages 2 and 3 are still open, unbuilt, waiting on page 1's flow (and its Account-page branch, section 3) to land first.

---

## 2. Blocker: no self-serve sign-up route exists

### Context
Before designing page 1's layout, checked whether a sign-up call the frontend could actually make existed. It doesn't: `POST /users` (`accounts/user/crud.py`) requires `require_super_admin`, `POST /organisations` likewise — this shared `accounts` package is an admin-provisioned B2B model, not self-serve. An `Invite` token primitive exists (`accounts/invite/tools.py`) but is never wired to a router.

### Discussion points
Was pointed to `/Users/Development/Web/wills/frontend/app/(open)/auth` as a reference. Checked it against wills' own backend copy of the same shared `accounts/user/crud.py` — its `SignupForm.tsx` calls `POST /users` from a fully anonymous page, but `create_user` there is *also* locked behind `require_super_admin`/`require_auth`. The reference itself would 401 for a real anonymous signup; it wasn't a working precedent, just a UI shape to borrow. Surfaced this before copying it wholesale.

Proposed three shapes for closing the gap: (a) drop `require_super_admin` from the existing route entirely, (b) add a narrow new public route, (c) wire the unused `Invite` token flow into a real route. User picked (b), specifying the exact odd-but-fine naming: route `/users/signup`, function `create_user_by_signup`.

Since `accounts` is shared canon (`.shared-paths`), and this is backend code, treated it as its own atomic plan+build rather than folding it into frontend page-creation-workflow steps — user confirmed: plan and build this first, commit, then resume the three-page frontend work.

### Decision
Scoped and built as `create_user_by_signup` (section 3). The three-page frontend plan (section 1) resumes after this lands. Pages 2 and 3 remain fully unscoped beyond their one-paragraph descriptions above.

---

## 3. create_user_by_signup — built

### Context
Saved as `.context/builds/signup_route_plan.md`, then built via `/build`.

### Discussion points
Key design decisions, locked during planning:
- **Org assignment**: resolves the `Organisation` where `is_default == True` and assigns the new user there — no per-domain org lookup (wills' pattern doesn't fit; cards has no B2B org segmentation). This follows the project's existing "default organisation" convention (`general_rules.md`'s Artefacts §1).
- **`permission_level`** hardcoded to `"member"` server-side; the signup request body has no such field at all (unlike the super-admin-only `CreateUserRequest`, where the caller is trusted to set it).
- **`organisation_id`** never client-supplied on this route — resolved server-side only.
- **No session minted inline** — frontend will call `POST /sessions` separately right after signup succeeds, same shape as the existing login flow.
- **No `Player` row created here** — stays `play` package's job; cross-package dependency direction (`play` depends on `accounts`, never reverse) holds.
- Missing-default-org case (environment not seeded yet) returns 500 `no_default_organisation` rather than erroring uncleanly — flagged as an expected state until fixtures are updated, not a bug.

### Decision
Added `CreateUserSignupRequest` + `create_user_by_signup` (`POST /users/signup`, public, no `Depends()`) to `accounts/user/crud.py`, reusing the existing `UserResponse`. No new files, no `__init__.py` change (prefix already applied there). Verified via `py_compile` only — full module import is currently blocked in this venv by an unrelated missing `argon2` dependency, pre-existing and not caused by this change.

Open follow-ups, not done in this build:
- `fixtures/seed_dev.py` needs a seeded `Organisation(is_default=True)` — the user writes this; until it exists, signup 500s in dev.
- Shared-path publish (`./scripts/shared-sync.sh publish`) still needed after commit, since `accounts/user/crud.py` is shared canon.
- Frontend `/auth` page itself (calling this new route) is still unbuilt — this build was backend-only.
