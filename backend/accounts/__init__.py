from fastapi import FastAPI

from accounts.user import router as user_router
from accounts.session import router as session_router
from accounts.organisation import router as organisation_router


def register_routes(app: FastAPI) -> None:
    # Default-deny baseline: accounts routes require super-admin (an admin on the default org),
    # relaxed per-route as concrete front-end / client use cases arise.
    #   - user_router: included bare; GET /users/me is open to any authenticated session
    #     (require_auth), every other /users/* route is gated per-route in accounts/user/crud.py.
    #   - session_router: included bare; login (POST /sessions/) must stay public, the other
    #     session routes are gated per-route in accounts/session/crud.py.
    #   - organisation_router: included bare and applies the lock internally (see
    #     accounts/organisation/__init__.py), because its nested access-tokens router is part of
    #     the org-handover "Feed" surface and needs its own looser per-route auth.
    app.include_router(user_router)
    app.include_router(session_router)
    app.include_router(organisation_router)


__all__ = ["register_routes"]
