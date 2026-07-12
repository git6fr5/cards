import secrets
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select

from accounts.orm.access_token import AccessToken
from accounts.orm.organisation import Organisation
from utils.auth import require_org_admin
from utils.databases import update_resource, read_resource, delete_resource, DatabaseConnection
from utils.encryption import hash_token
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "organisation_not_found":   "The requested organisation does not exist.",
    "access_token_not_found":   "The requested access token does not exist.",
    "token_not_in_organisation": "The access token does not belong to the specified organisation.",
}


class CreateAccessTokenRequest(BaseModel):
    label:            str
    permission_level: str = "member"
    expires_at:       datetime | None = None


class UpdateAccessTokenIsArchivedRequest(BaseModel):
    is_archived: bool


class AccessTokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:               int
    label:            str
    permission_level: str
    organisation_id:  int
    is_archived:      bool
    expires_at:       datetime | None = None


class CreateAccessTokenResponse(BaseModel):
    token:        str
    access_token: AccessTokenResponse


class DeleteAccessTokenResponse(BaseModel):
    deleted: bool


@router.post("", status_code=201, response_model=CreateAccessTokenResponse,
             dependencies=[Depends(require_org_admin)])
@update_resource
def create_access_token(organisation_id: int, body: CreateAccessTokenRequest) -> CreateAccessTokenResponse:
    assert_preconditions([(not DatabaseConnection.get(Organisation, organisation_id), 404, "organisation_not_found")], ERRORS)
    raw_token = secrets.token_urlsafe(32)
    token = AccessToken(
        token_hash=hash_token(raw_token),
        label=body.label,
        permission_level=body.permission_level,
        expires_at=body.expires_at,
        organisation_id=organisation_id,
    )
    DatabaseConnection.add(token)
    DatabaseConnection.flush()
    return CreateAccessTokenResponse(token=raw_token, access_token=AccessTokenResponse.model_validate(token))


@router.get("", response_model=list[AccessTokenResponse],
            dependencies=[Depends(require_org_admin)])
@read_resource
def read_access_tokens(organisation_id: int, include_archived: bool = False) -> list[AccessTokenResponse]:
    assert_preconditions([(not DatabaseConnection.get(Organisation, organisation_id), 404, "organisation_not_found")], ERRORS)
    query = select(AccessToken).where(AccessToken.organisation_id == organisation_id)
    if not include_archived:
        query = query.where(AccessToken.is_archived == False)
    tokens = DatabaseConnection.execute(query).scalars().all()
    return [AccessTokenResponse.model_validate(token) for token in tokens]


@router.put("/{token_id}/is_archived", response_model=AccessTokenResponse,
            dependencies=[Depends(require_org_admin)])
@update_resource
def update_access_token_is_archived(organisation_id: int, token_id: int, body: UpdateAccessTokenIsArchivedRequest) -> AccessTokenResponse:
    token = DatabaseConnection.get(AccessToken, token_id)
    assert_preconditions([(token is None, 404, "access_token_not_found")], ERRORS)
    assert_preconditions([(token.organisation_id != organisation_id, 404, "token_not_in_organisation")], ERRORS)
    token.is_archived = body.is_archived
    return AccessTokenResponse.model_validate(token)


@router.delete("/{token_id}", response_model=DeleteAccessTokenResponse,
               dependencies=[Depends(require_org_admin)])
@delete_resource
def delete_access_token(organisation_id: int, token_id: int) -> DeleteAccessTokenResponse:
    token = DatabaseConnection.get(AccessToken, token_id)
    assert_preconditions([(token is None, 404, "access_token_not_found")], ERRORS)
    assert_preconditions([(token.organisation_id != organisation_id, 404, "token_not_in_organisation")], ERRORS)
    DatabaseConnection.delete(token)
    return DeleteAccessTokenResponse(deleted=True)
