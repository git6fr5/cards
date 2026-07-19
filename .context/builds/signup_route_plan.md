# Plan: signup_route

Feature: one new public route, `POST /users/signup` → `create_user_by_signup`, so a brand-new visitor can create a `User` without an admin — surfaced as a prerequisite while planning the frontend `/auth` sign-up page (no self-serve create-user route existed at all).

Locked 2026-07-19.

## Scope

**In:**
- `accounts/user/crud.py`: new `CreateUserSignupRequest` model + `create_user_by_signup` route (`POST /signup`, no `Depends()` — public). Resolves the target `Organisation` server-side (`is_default == True`), hardcodes `permission_level="member"`. Reuses the existing `UserResponse`.

**Out (explicit):**
- Session minting — frontend calls `POST /sessions` separately right after signup succeeds, same as login.
- `Player` (play package) creation — stays `play`'s job, deferred to the Account-page "first login" wizard.
- Invite-token gated signup, domain-based org lookup (wills' pattern — doesn't fit; cards has no B2B org segmentation).
- Any frontend work — deferred back to the three-page plan (Auth, Catalog/Bag builder, Account).

**Migration impact:** none — no ORM/model change.

**Fixture gap (flagged, not fixed here):** no `Organisation` with `is_default=True` exists yet in dev seed data (`fixtures/seed_dev.py` only seeds `Piece`). Signup will 500 (`no_default_organisation`) until one is seeded — the user writes this fixture change.

## Decisions (locked)

1. Org assignment: query `Organisation` where `is_default == True`, assign new user there — matches `general_rules.md`'s existing "default organisation" convention; no per-domain org lookup (unlike the wills reference, which has real B2B org segmentation cards doesn't need).
2. `permission_level` hardcoded `"member"` server-side — request body has no such field (unlike the super-admin-only `CreateUserRequest`, where the caller is trusted).
3. `organisation_id` never client-supplied on this route — resolved server-side only.
4. Duplicate email → 409, reusing the existing `email_already_exists` key already in the file's `ERRORS` dict.
5. Missing default org → 500, new `ERRORS` key `no_default_organisation`.
6. No session minted inline in this route — kept as a separate concern, same shape as the existing `create_session` route.
7. No `Player` row created here — cross-package direction stays `play` depends on `accounts`, never reverse.

## Backend structure

```
backend/accounts/user/crud.py   [edit]
  + CreateUserSignupRequest   (new Pydantic request model)
  + create_user_by_signup     (new route, POST /signup — no Depends, public)
```

No new files. `accounts/user/__init__.py` unchanged (`/users` prefix already applied there via `include_router(crud_router, prefix="/users")`; router already included bare in `accounts/__init__.py`).

## Route inventory

| file | fn | method/path | preconditions |
|---|---|---|---|
| `accounts/user/crud.py` | `create_user_by_signup` | `POST /users/signup` | 500 `no_default_organisation` (no default org exists) · 409 `email_already_exists` |

## Frontend

None this slice — deferred to the three-page plan (`/auth`, catalog/bag-builder, `/account`).

## Slice sequence

1. Backend: add `CreateUserSignupRequest` + `create_user_by_signup` to `accounts/user/crud.py`.
2. (User) seed a default `Organisation` in dev DB / extend `fixtures/seed_dev.py`.
3. Commit.
4. Resume frontend three-page plan, starting with `/auth`.

## Dependency chain

A seeded default `Organisation` unblocks this route working end-to-end; nothing else depends on this route existing before the `/auth` frontend page is built against it.

## Risk flags

- Segment collision: new `POST /signup` (static, 1 segment) vs. the only other POST in the file, `POST ""` (collection root, 0 segments) — no collision regardless of registration order.
- Signup 500s in dev until a default org is seeded — expected, not a bug, flagged above.
- `accounts/user/crud.py` is shared canon (`.shared-paths`) — after commit, `./scripts/shared-sync.sh publish` reminder applies.

## Safe cuts

- The 500 `no_default_organisation` precondition could be dropped (let a missing org error naturally) — not recommended, it's one line and gives a clear signal instead of a raw stack trace.
