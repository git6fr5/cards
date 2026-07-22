# Audit: auth_context — 2026-07-19

Guide: `guides/auth_context.md`
Scope: whole project (no scope arg given)

## Files in scope

- `backend/utils/auth.py` — generic layer (only auth.py in the repo)
- `backend/accounts/**` — only package consuming the generic layer (`crud.py` files under `user/`, `session/`, `organisation/`, `organisation/roles/`, `organisation/access_tokens/`, plus `__init__.py` router mounts)
- `backend/accounts/orm/invite.py`, `backend/accounts/invite/tools.py` — Invite model + invitee-credential helpers
- `backend/play/**` — checked, has no auth surface at all (no `Depends`, no auth import) — confirmed genuinely out of scope, not an omission (see note below)

No package-root `auth.py` exists anywhere in the repo (only `utils/auth.py`), so the entire "Package-specific auth contexts", "Auth context for accessing a specific resource", and most of "Invitee credentials" sections have no code to check against yet — noted, not treated as violations.

## Findings

### 1. `Invite.purpose` is a plain string, not an `InvitePurpose` enum

**File:** `backend/accounts/orm/invite.py:25`
**Rule:** guide line 44 — "built on the single shared `accounts.orm.invite.Invite` model — `purpose` (an `InvitePurpose` enum discriminator), `invite_token` ..."

```python
purpose           = Column(String(255), nullable=False)
```

vs. the guide's stated shape (`purpose` typed as an `InvitePurpose` enum).

**Reasoning (Step 5):** Deliberate, documented deviation — `invite.py:11-15` states explicitly:

> "purpose distinguishes invite types. It is a plain string, not an enum, so this shared model carries no domain vocabulary — each consuming package (testaments, scheduling, audiovisual) defines and owns its own purpose value locally."

**Validity rating: 4/5.** Sound rationale (keeps the shared/synced model decoupled from downstream packages' domain vocabulary — consistent with the guide's own stated reason for keeping package-specific logic out of `utils/auth.py`). Docked one point only because it contradicts the guide's literal text rather than the guide being updated to reflect the pattern — worth reconciling the guide wording with this project's chosen shape, or confirming this project intentionally diverges.

## Non-findings / observations (no rule cited — informational only)

- `require_org_member` (`utils/auth.py:154`) is defined per the guide's "four categories" list but has zero callers anywhere in the backend. Not a rule violation (guide doesn't require every generic dependency to be used), just dead-code risk to be aware of.
- `create_invite` / `read_invite_by_token` / `update_invite_redeemed` (`accounts/invite/tools.py`) have zero callers — the invitee-credential flow described in guide lines 42-50 is scaffolded (model + helpers exist) but no `InvitePurpose` value or consuming route exists yet in this project.
- `backend/play/**` (the game package) has no authentication at all on any route. This isn't a guide violation — the guide governs *how* auth contexts are structured when auth is needed, not whether a given package needs auth — but flagging since it's a deliberate-looking but undocumented design choice (no comment recording that `play` routes are intentionally public, unlike the explicit reasoning left in `accounts/__init__.py` and `accounts/organisation/__init__.py` for their auth decisions).

## Compliant checks (verified against every discrete rule in the guide)

- `AuthContext` dataclass + `resolve_access_token`/`resolve_session_token` returning `AuthContext | None` (not raising) — `utils/auth.py:34-91` — matches guide lines 6-9.
- All four generic dependencies present with correct scope (`require_org_admin`, `require_org_member`, `require_super_admin`, `require_self_or_user_admin`) — guide lines 10-14.
- Every DB-touching resolver opens its own short-lived `with Session(init_engine()) as session:` rather than the request-scoped session — `require_auth` (line 103), `_load_user_organisation_id` (line 140) — guide line 28.
- Private helpers prefixed `_` (`_is_org_scoped_admin`, `_is_org_scoped_member`, `_load_user_organisation_id`) — guide line 29.
- Member/admin checks share the identical org-match condition, admin ANDs `is_admin` on top — guide line 30.
- Both scoped checks OR against `auth.is_default_org` rather than plain equality — guide line 31.
- Existence-before-permission ordering respected where a resolver actually loads the target row: `require_user_admin` and `require_self_or_user_admin` both assert 404 (user not found) before asserting 403 (not admin) — guide line 32. (`require_org_admin`/`require_org_member` never load the org row at all — they're pure identity/path-param checks — so this ordering rule doesn't apply to them; existence is checked separately in the route body, which is the established pattern across every `crud.py` using them.)
- No writes inside any resolver/`require_*` — all read-only — guide line 33.
- `ERRORS` dict in `utils/auth.py` is snake_case keys / sentence-case values ending in a period — guide line 22 (generic-layer analog).
- Router-level `dependencies=[Depends(...)]` lock pattern (`accounts/organisation/__init__.py`, `accounts/__init__.py`) is explicitly commented with rationale, consistent with guide's spirit even though this specific "router-level lock vs per-route" mechanic isn't itself dictated by the guide text.

## Not independently verifiable

- Guide line 54 ("Maintenance"): whether `utils/auth.py` is still verbatim-in-sync with sibling projects can't be confirmed from within this repo alone — would need a diff against another project's copy. `./scripts/shared-sync.sh status` reported "up to date" against this repo's own shared-sync baseline at audit time, which is a proxy but not the same check the guide describes.
