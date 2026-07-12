from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select

from accounts.orm.organisation import Organisation
from accounts.orm.organisation_role import OrganisationRole
from accounts.orm.user import User
from utils.auth import require_auth, require_org_admin, require_self_or_user_admin, require_super_admin, AuthContext
from utils.databases import create_resource, read_resource, update_resource, delete_resource, DatabaseConnection
from utils.errors import assert_preconditions
from utils.encryption import hash_password


router = APIRouter()


ERRORS = {
    "user_not_found":              "The requested user does not exist.",
    "organisation_not_found":      "The requested organisation does not exist.",
    "organisation_role_not_found": "The requested organisation role does not exist.",
    "email_already_exists":        "A user with that email address already exists.",
    "invalid_token":               "The provided token is invalid or does not exist.",
    "session_expired":             "The session has expired. Please log in again.",
    "unauthenticated":             "Valid authentication credentials were not provided.",
}


class CreateUserRequest(BaseModel):
    email:            str
    password:         str
    display_name:     str
    organisation_id:  int
    permission_level: str = "member"


class UpdateUserDisplayNameRequest(BaseModel):
    display_name: str


class UpdateUserEmailRequest(BaseModel):
    email: str


class UpdateUserPasswordRequest(BaseModel):
    password: str


class UpdateUserIsArchivedRequest(BaseModel):
    is_archived: bool


class UpdateUserPermissionLevelRequest(BaseModel):
    permission_level: str


class UpdateUserOrganisationRolesRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    add:    list[int] = Field(default_factory=list)
    remove: list[int] = Field(default_factory=list, alias="del")


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:               int
    email:            str
    display_name:     str
    permission_level: str
    is_archived:      bool
    organisation_id:  int


class UpdateUserOrganisationRolesResponse(BaseModel):
    organisation_role_ids: list[int]


class DeleteUserResponse(BaseModel):
    deleted: bool


@router.post("", status_code=201, response_model=UserResponse,
             dependencies=[Depends(require_super_admin)])
@create_resource
def create_user(body: CreateUserRequest) -> User:
    assert_preconditions([(not DatabaseConnection.get(Organisation, body.organisation_id), 404, "organisation_not_found")], ERRORS)
    existing = DatabaseConnection.execute(
        select(User).where(User.email == body.email)
    ).scalar_one_or_none()
    assert_preconditions([(existing is not None, 409, "email_already_exists")], ERRORS)
    return User(
        email=body.email,
        password_hash=hash_password(body.password),
        display_name=body.display_name,
        organisation_id=body.organisation_id,
        permission_level=body.permission_level,
    )


@router.get("", response_model=list[UserResponse],
            dependencies=[Depends(require_super_admin)])
@read_resource
def read_users() -> list[UserResponse]:
    users = DatabaseConnection.execute(
        select(User).where(User.is_archived == False)
    ).scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/me", response_model=UserResponse)
@read_resource
def read_current_user(auth: AuthContext = Depends(require_auth)) -> UserResponse:
    assert_preconditions([(auth.user_id is None, 401, "unauthenticated")], ERRORS)
    user = DatabaseConnection.get(User, auth.user_id)
    assert_preconditions([(user is None, 404, "user_not_found")], ERRORS)
    return UserResponse.model_validate(user)


@router.get("/organisation_role/{organisation_role_id}", response_model=list[UserResponse],
            dependencies=[Depends(require_super_admin)])
@read_resource
def read_users_by_organisation_role(organisation_role_id: int) -> list[UserResponse]:
    role = DatabaseConnection.get(OrganisationRole, organisation_role_id)
    assert_preconditions([(role is None, 404, "organisation_role_not_found")], ERRORS)
    return [UserResponse.model_validate(u) for u in role.users]


@router.get("/organisation/{organisation_id}", response_model=list[UserResponse],
            dependencies=[Depends(require_org_admin)])
@read_resource
def read_users_by_organisation(organisation_id: int) -> list[UserResponse]:
    assert_preconditions([(not DatabaseConnection.get(Organisation, organisation_id), 404, "organisation_not_found")], ERRORS)
    users = DatabaseConnection.execute(
        select(User).where(User.organisation_id == organisation_id, User.is_archived == False)
    ).scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/{user_id}", response_model=UserResponse,
            dependencies=[Depends(require_self_or_user_admin)])
@read_resource
def read_user(user_id: int) -> UserResponse:
    assert_preconditions([(not (user := DatabaseConnection.get(User, user_id)), 404, "user_not_found")], ERRORS)
    return UserResponse.model_validate(user)


@router.get("/email/{email}", response_model=UserResponse,
            dependencies=[Depends(require_super_admin)])
@read_resource
def read_user_by_email(email: str) -> UserResponse:
    user = DatabaseConnection.execute(
        select(User).where(User.email == email)
    ).scalar_one_or_none()
    assert_preconditions([(user is None, 404, "user_not_found")], ERRORS)
    return UserResponse.model_validate(user)


@router.get("/display_name/{display_name}", response_model=UserResponse,
            dependencies=[Depends(require_super_admin)])
@read_resource
def read_user_by_display_name(display_name: str) -> UserResponse:
    user = DatabaseConnection.execute(
        select(User).where(User.display_name == display_name)
    ).scalar_one_or_none()
    assert_preconditions([(user is None, 404, "user_not_found")], ERRORS)
    return UserResponse.model_validate(user)


@router.get("/search/email", response_model=list[UserResponse],
            dependencies=[Depends(require_super_admin)])
@read_resource
def search_user_by_email(q: str) -> list[UserResponse]:
    users = DatabaseConnection.execute(
        select(User).where(User.email.ilike(f"%{q}%"))
    ).scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/search/display_name", response_model=list[UserResponse],
            dependencies=[Depends(require_super_admin)])
@read_resource
def search_user_by_display_name(q: str) -> list[UserResponse]:
    users = DatabaseConnection.execute(
        select(User).where(User.display_name.ilike(f"%{q}%"))
    ).scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.put("/{user_id}/display_name", response_model=UserResponse,
            dependencies=[Depends(require_super_admin)])
@update_resource
def update_user_display_name(user_id: int, body: UpdateUserDisplayNameRequest) -> UserResponse:
    assert_preconditions([(not (user := DatabaseConnection.get(User, user_id)), 404, "user_not_found")], ERRORS)
    user.display_name = body.display_name
    return UserResponse.model_validate(user)


@router.put("/{user_id}/email", response_model=UserResponse,
            dependencies=[Depends(require_super_admin)])
@update_resource
def update_user_email(user_id: int, body: UpdateUserEmailRequest) -> UserResponse:
    assert_preconditions([(not (user := DatabaseConnection.get(User, user_id)), 404, "user_not_found")], ERRORS)
    user.email = body.email
    return UserResponse.model_validate(user)


@router.put("/{user_id}/password", response_model=UserResponse,
            dependencies=[Depends(require_super_admin)])
@update_resource
def update_user_password(user_id: int, body: UpdateUserPasswordRequest) -> UserResponse:
    assert_preconditions([(not (user := DatabaseConnection.get(User, user_id)), 404, "user_not_found")], ERRORS)
    user.password_hash = hash_password(body.password)
    return UserResponse.model_validate(user)


@router.put("/{user_id}/is_archived", response_model=UserResponse,
            dependencies=[Depends(require_super_admin)])
@update_resource
def update_user_is_archived(user_id: int, body: UpdateUserIsArchivedRequest) -> UserResponse:
    assert_preconditions([(not (user := DatabaseConnection.get(User, user_id)), 404, "user_not_found")], ERRORS)
    user.is_archived = body.is_archived
    return UserResponse.model_validate(user)


@router.put("/{user_id}/permission_level", response_model=UserResponse,
            dependencies=[Depends(require_super_admin)])
@update_resource
def update_user_permission_level(user_id: int, body: UpdateUserPermissionLevelRequest) -> UserResponse:
    assert_preconditions([(not (user := DatabaseConnection.get(User, user_id)), 404, "user_not_found")], ERRORS)
    user.permission_level = body.permission_level
    return UserResponse.model_validate(user)


@router.put("/{user_id}/organisation_roles", response_model=UpdateUserOrganisationRolesResponse,
            dependencies=[Depends(require_super_admin)])
@update_resource
def update_user_organisation_roles(user_id: int, body: UpdateUserOrganisationRolesRequest) -> UpdateUserOrganisationRolesResponse:
    assert_preconditions([(not (user := DatabaseConnection.get(User, user_id)), 404, "user_not_found")], ERRORS)
    if body.add:
        roles_to_add = DatabaseConnection.execute(
            select(OrganisationRole).where(OrganisationRole.id.in_(body.add))
        ).scalars().all()
        for role in roles_to_add:
            if role not in user.organisation_roles:
                user.organisation_roles.append(role)
    if body.remove:
        roles_to_remove = DatabaseConnection.execute(
            select(OrganisationRole).where(OrganisationRole.id.in_(body.remove))
        ).scalars().all()
        for role in roles_to_remove:
            if role in user.organisation_roles:
                user.organisation_roles.remove(role)
    return UpdateUserOrganisationRolesResponse(
        organisation_role_ids=[r.id for r in user.organisation_roles]
    )


@router.delete("/{user_id}", response_model=DeleteUserResponse,
               dependencies=[Depends(require_super_admin)])
@delete_resource
def delete_user(user_id: int) -> DeleteUserResponse:
    assert_preconditions([(not (user := DatabaseConnection.get(User, user_id)), 404, "user_not_found")], ERRORS)
    DatabaseConnection.delete(user)
    return DeleteUserResponse(deleted=True)
