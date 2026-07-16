from dataclasses import dataclass
from datetime import datetime

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from utils.encryption import hash_token
from utils.errors import assert_preconditions
import os

# accounts.orm models are imported lazily inside the resolver functions: the access-token
# crud router imports this module, so a top-level accounts import would create a cycle.


ERRORS = {
    "unauthenticated": "Valid authentication credentials were not provided.",
    "forbidden":       "You are not authorised to perform this action.",
    "user_not_found":  "The requested user does not exist.",
}

ADMIN_PERMISSION_LEVEL = "admin"

# Single source of truth for the session cookie, shared with accounts/session/crud.py.
SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME")
SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30  # 30 days


_bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class AuthContext:
    organisation_id: int
    organisation_slug: str | None
    user_id: int | None
    is_default_org: bool
    is_admin: bool = False  # admin permission level — set for both session users and access tokens


def resolve_access_token(session: Session, raw_token: str) -> AuthContext | None:
    from accounts.orm.access_token import AccessToken
    from accounts.orm.organisation import Organisation

    token = session.execute(
        select(AccessToken).where(
            AccessToken.token_hash == hash_token(raw_token),
            AccessToken.is_archived == False,
        )
    ).scalar_one_or_none()
    if token is None:
        return None
    if token.expires_at is not None and token.expires_at < datetime.utcnow():
        return None
    organisation = session.get(Organisation, token.organisation_id)
    if organisation is None:
        return None
    return AuthContext(
        organisation_id=organisation.id,
        organisation_slug=organisation.slug,
        user_id=None,
        is_default_org=organisation.is_default,
        is_admin=token.permission_level == ADMIN_PERMISSION_LEVEL,
    )

def resolve_session_token(session: Session, raw_token: str) -> AuthContext | None:
    from accounts.orm.organisation import Organisation
    from accounts.orm.session import Session as UserSession
    from accounts.orm.user import User

    user_session = session.execute(
        select(UserSession).where(UserSession.token_hash == hash_token(raw_token))
    ).scalar_one_or_none()
    if user_session is None:
        return None
    if user_session.expires_at < datetime.utcnow():
        return None
    user = session.get(User, user_session.user_id)
    if user is None:
        return None
    organisation = session.get(Organisation, user.organisation_id)
    if organisation is None:
        return None
    return AuthContext(
        organisation_id=organisation.id,
        organisation_slug=organisation.slug,
        user_id=user.id,
        is_default_org=organisation.is_default,
        is_admin=user.permission_level == ADMIN_PERMISSION_LEVEL,
    )


def require_auth(
    request: Request,
    bearer: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> AuthContext:
    # Note: opens its own read-only session because the request-scoped ContextVar
    # session from utils/databases.py is not yet established when dependencies resolve.
    from utils.databases import init_engine

    context: AuthContext | None = None
    with Session(init_engine()) as session:
        # Two distinct, non-overlapping transports: machine callers authenticate via an
        # `Authorization: Bearer` access token; browser sessions authenticate via the
        # HttpOnly session cookie (never exposed to frontend JS, so it can never travel as a
        # Bearer credential). Try the access token first since this surface is primarily
        # server-to-server.
        if bearer is not None:
            context = resolve_access_token(session, bearer.credentials)
        if context is None:
            raw_session_token = request.cookies.get(SESSION_COOKIE_NAME)
            if raw_session_token is not None:
                context = resolve_session_token(session, raw_session_token)
    assert_preconditions([(context is None, 401, "unauthenticated")], ERRORS)
    return context


def _is_org_scoped_admin(auth: AuthContext, target_organisation_id: int) -> bool:
    # Caller is scoped to the target org if it owns the org, or is the default (super) org.
    # Both session users and access tokens must additionally hold the admin permission level.
    org_scoped = auth.is_default_org or auth.organisation_id == target_organisation_id
    return org_scoped and auth.is_admin


def _is_org_scoped_member(auth: AuthContext, target_organisation_id: int) -> bool:
    # Same org-match check as _is_org_scoped_admin, without the admin permission requirement —
    # for routes any member of the organisation may use (e.g. a witness responding to a
    # scheduling blast), not just the org's admins.
    return auth.is_default_org or auth.organisation_id == target_organisation_id


def _load_user_organisation_id(user_id: int) -> int | None:
    # Opens its own read-only session for the same reason as require_auth: the request-scoped
    # ContextVar session is not established while dependencies resolve. Returns None if the
    # target user does not exist so the caller can surface a 404.
    from utils.databases import init_engine
    from accounts.orm.user import User

    with Session(init_engine()) as session:
        user = session.get(User, user_id)
        return user.organisation_id if user is not None else None


def require_org_admin(
    organisation_id: int,
    auth: AuthContext = Depends(require_auth),
) -> AuthContext:
    # Target org comes from the path. Use on routes nested under /organisations/{organisation_id}.
    assert_preconditions([(not _is_org_scoped_admin(auth, organisation_id), 403, "forbidden")], ERRORS)
    return auth


def require_org_member(
    organisation_id: int,
    auth: AuthContext = Depends(require_auth),
) -> AuthContext:
    # Same as require_org_admin, minus the admin permission requirement. Use on routes any
    # member of the organisation may reach (e.g. scheduling — witnesses responding to a blast),
    # not just its admins.
    assert_preconditions([(not _is_org_scoped_member(auth, organisation_id), 403, "forbidden")], ERRORS)
    return auth


def require_super_admin(
    auth: AuthContext = Depends(require_auth),
) -> AuthContext:
    # Super admin = an admin on the default (super) org. Use for global, cross-org operations that
    # have no single target org in the path: creating/deleting organisations, global list-alls.
    assert_preconditions([(not (auth.is_default_org and auth.is_admin), 403, "forbidden")], ERRORS)
    return auth


def require_user_admin(
    user_id: int,
    auth: AuthContext = Depends(require_auth),
) -> AuthContext:
    # Target org is derived from the user being acted on, so an admin can only manage users in
    # their own org (or any org, if they are the default org). Use on admin-only user routes
    # such as permission_level / is_archived / organisation_roles edits.
    target_organisation_id = _load_user_organisation_id(user_id)
    assert_preconditions([(target_organisation_id is None, 404, "user_not_found")], ERRORS)
    assert_preconditions([(not _is_org_scoped_admin(auth, target_organisation_id), 403, "forbidden")], ERRORS)
    return auth


def require_self_or_user_admin(
    user_id: int,
    auth: AuthContext = Depends(require_auth),
) -> AuthContext:
    # Self-service routes: a session user acting on their own record is always allowed; otherwise
    # fall back to org-scoped admin against the target user's org. Access tokens have user_id=None
    # so they never match "self" and must satisfy the admin branch.
    if auth.user_id is not None and auth.user_id == user_id:
        return auth
    target_organisation_id = _load_user_organisation_id(user_id)
    assert_preconditions([(target_organisation_id is None, 404, "user_not_found")], ERRORS)
    assert_preconditions([(not _is_org_scoped_admin(auth, target_organisation_id), 403, "forbidden")], ERRORS)
    return auth
