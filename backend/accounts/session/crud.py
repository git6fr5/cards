import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict
from sqlalchemy import delete, select

from accounts.orm.session import Session
from accounts.orm.user import User
from accounts.session.tools import check_login_locked, record_failed_login, clear_login_throttle
from utils.auth import (
    require_auth, require_super_admin, AuthContext,
    SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_SECONDS,
)
from utils.databases import create_resource, update_resource, delete_resource, DatabaseConnection
from utils.encryption import hash_token, verify_password
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "user_not_found":      "No user with that email address exists.",
    "invalid_credentials": "The email address or password is incorrect.",
    "session_not_found":   "The session could not be found.",
    "unauthenticated":     "Valid authentication credentials were not provided.",
    "too_many_attempts":   "Too many failed attempts. Please try again later.",
}


class CreateSessionRequest(BaseModel):
    email:       str
    password:    str
    device_name: str | None = None


class UpdateSessionExpiresAtRequest(BaseModel):
    expires_at: datetime


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:          int
    expires_at:  datetime
    created_at:  datetime
    device_name: str | None = None
    user_id:     int


class DeleteSessionResponse(BaseModel):
    deleted: bool


class DeletedCountResponse(BaseModel):
    count: int


@router.post("", status_code=201, response_model=SessionResponse)
@create_resource
def create_session(body: CreateSessionRequest, request: Request, response: Response) -> Session:
    # request.client.host assumes no untrusted proxy rewrites the source IP; no route in this
    # codebase currently does X-Forwarded-For trust parsing, so not adding that here.
    ip = request.client.host if request.client else None
    locked, retry_after = check_login_locked(body.email, ip)
    if locked:
        raise HTTPException(
            status_code=429,
            detail=ERRORS["too_many_attempts"],
            headers={"Retry-After": str(retry_after)} if retry_after is not None else None,
        )

    user: User = DatabaseConnection.execute(
        select(User).where(User.email == body.email)
    ).scalar_one_or_none()
    if user is None or not verify_password(body.password, user.password_hash):
        record_failed_login(body.email, ip)
        assert_preconditions([
            (user is None, 404, "user_not_found"),
            (user is not None, 401, "invalid_credentials"),
        ], ERRORS)
    clear_login_throttle(body.email)

    raw_token = secrets.token_urlsafe(32)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=raw_token,
        max_age=SESSION_COOKIE_MAX_AGE_SECONDS,
        path="/",
        httponly=True,
        secure=True,
        samesite="lax",
    )
    return Session(
        token_hash=hash_token(raw_token),
        expires_at=datetime.utcnow() + timedelta(days=30),
        device_name=body.device_name,
        user_id=user.id,
    )


@router.put("/{session_id}/expires_at", response_model=SessionResponse,
            dependencies=[Depends(require_super_admin)])
@update_resource
def update_session_expires_at(session_id: int, body: UpdateSessionExpiresAtRequest) -> SessionResponse:
    assert_preconditions([(not (session := DatabaseConnection.get(Session, session_id)), 404, "session_not_found")], ERRORS)
    session.expires_at = body.expires_at
    return SessionResponse.model_validate(session)


@router.delete("", response_model=DeleteSessionResponse)
@delete_resource
def delete_current_session(request: Request, response: Response,
                            auth: AuthContext = Depends(require_auth)) -> DeleteSessionResponse:
    assert_preconditions([(auth.user_id is None, 401, "unauthenticated")], ERRORS)
    raw_token = request.cookies.get(SESSION_COOKIE_NAME)
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    assert_preconditions([(raw_token is None, 401, "unauthenticated")], ERRORS)

    session = DatabaseConnection.execute(
        select(Session).where(
            Session.token_hash == hash_token(raw_token),
            Session.user_id == auth.user_id,
        )
    ).scalar_one_or_none()
    if session is None:
        return DeleteSessionResponse(deleted=False)
    DatabaseConnection.delete(session)
    return DeleteSessionResponse(deleted=True)


@router.delete("/user/{user_id}", response_model=DeletedCountResponse,
               dependencies=[Depends(require_super_admin)])
@delete_resource
def delete_all_sessions_for_user(user_id: int) -> DeletedCountResponse:
    result = DatabaseConnection.execute(
        delete(Session).where(Session.user_id == user_id)
    )
    return DeletedCountResponse(count=result.rowcount)


@router.delete("/expired", response_model=DeletedCountResponse,
               dependencies=[Depends(require_super_admin)])
@delete_resource
def delete_sessions_by_expiry() -> DeletedCountResponse:
    result = DatabaseConnection.execute(
        delete(Session).where(Session.expires_at < datetime.utcnow())
    )
    return DeletedCountResponse(count=result.rowcount)
