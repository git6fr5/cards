from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, delete

from accounts.orm.organisation import Organisation
from accounts.orm.organisation_role import OrganisationRole
from accounts.orm.user import User
from utils.databases import create_resource, read_resource, update_resource, delete_resource, DatabaseConnection
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "organisation_not_found":      "The requested organisation does not exist.",
    "organisation_role_not_found": "The requested organisation role does not exist.",
    "role_name_already_exists":    "A role with that name already exists in this organisation.",
    "role_not_in_organisation":    "The role does not belong to the specified organisation.",
    "user_not_found":              "The requested user does not exist.",
}


class CreateOrganisationRoleRequest(BaseModel):
    name: str


class BatchCreateOrganisationRoleRequest(BaseModel):
    roles: list[CreateOrganisationRoleRequest]


class UpdateOrganisationRoleNameRequest(BaseModel):
    name: str


class UpdateOrganisationRoleIsArchivedRequest(BaseModel):
    is_archived: bool


class BatchDeleteOrganisationRoleRequest(BaseModel):
    ids: list[int]


class OrganisationRoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:              int
    name:            str
    organisation_id: int
    is_archived:     bool


class DeleteOrganisationRoleResponse(BaseModel):
    deleted: bool


@router.post("", status_code=201, response_model=OrganisationRoleResponse)
@create_resource
def create_organisation_role(organisation_id: int, body: CreateOrganisationRoleRequest) -> OrganisationRole:
    assert_preconditions([(not DatabaseConnection.get(Organisation, organisation_id), 404, "organisation_not_found")], ERRORS)
    existing = DatabaseConnection.execute(
        select(OrganisationRole).where(
            OrganisationRole.name == body.name,
            OrganisationRole.organisation_id == organisation_id,
        )
    ).scalar_one_or_none()
    assert_preconditions([(existing is not None, 409, "role_name_already_exists")], ERRORS)
    return OrganisationRole(name=body.name, organisation_id=organisation_id)


@router.post("/batch", status_code=201, response_model=list[OrganisationRoleResponse])
@update_resource
def batch_create_organisation_role(organisation_id: int, body: BatchCreateOrganisationRoleRequest) -> list[OrganisationRoleResponse]:
    assert_preconditions([(not DatabaseConnection.get(Organisation, organisation_id), 404, "organisation_not_found")], ERRORS)
    roles = [OrganisationRole(name=r.name, organisation_id=organisation_id) for r in body.roles]
    for role in roles:
        DatabaseConnection.add(role)
    DatabaseConnection.flush()
    return [OrganisationRoleResponse.model_validate(r) for r in roles]


@router.get("", response_model=list[OrganisationRoleResponse])
@read_resource
def read_organisation_roles_by_organisation(organisation_id: int, include_archived: bool = False) -> list[OrganisationRoleResponse]:
    assert_preconditions([(not DatabaseConnection.get(Organisation, organisation_id), 404, "organisation_not_found")], ERRORS)
    query = select(OrganisationRole).where(OrganisationRole.organisation_id == organisation_id)
    if not include_archived:
        query = query.where(OrganisationRole.is_archived == False)
    roles = DatabaseConnection.execute(query).scalars().all()
    return [OrganisationRoleResponse.model_validate(r) for r in roles]


@router.get("/user/{user_id}", response_model=list[OrganisationRoleResponse])
@read_resource
def read_organisation_roles_by_user(organisation_id: int, user_id: int) -> list[OrganisationRoleResponse]:
    assert_preconditions([(not DatabaseConnection.get(Organisation, organisation_id), 404, "organisation_not_found")], ERRORS)
    user = DatabaseConnection.get(User, user_id)
    assert_preconditions([(user is None, 404, "user_not_found")], ERRORS)
    roles = [r for r in user.organisation_roles if r.organisation_id == organisation_id]
    return [OrganisationRoleResponse.model_validate(r) for r in roles]


@router.get("/{role_id}", response_model=OrganisationRoleResponse)
@read_resource
def read_organisation_role(organisation_id: int, role_id: int) -> OrganisationRoleResponse:
    role = DatabaseConnection.get(OrganisationRole, role_id)
    assert_preconditions([(role is None, 404, "organisation_role_not_found")], ERRORS)
    assert_preconditions([(role.organisation_id != organisation_id, 404, "role_not_in_organisation")], ERRORS)
    return OrganisationRoleResponse.model_validate(role)


@router.put("/{role_id}/name", response_model=OrganisationRoleResponse)
@update_resource
def update_organisation_role_name(organisation_id: int, role_id: int, body: UpdateOrganisationRoleNameRequest) -> OrganisationRoleResponse:
    role = DatabaseConnection.get(OrganisationRole, role_id)
    assert_preconditions([(role is None, 404, "organisation_role_not_found")], ERRORS)
    assert_preconditions([(role.organisation_id != organisation_id, 404, "role_not_in_organisation")], ERRORS)
    role.name = body.name
    return OrganisationRoleResponse.model_validate(role)


@router.put("/{role_id}/is_archived", response_model=OrganisationRoleResponse)
@update_resource
def update_organisation_role_is_archived(organisation_id: int, role_id: int, body: UpdateOrganisationRoleIsArchivedRequest) -> OrganisationRoleResponse:
    role = DatabaseConnection.get(OrganisationRole, role_id)
    assert_preconditions([(role is None, 404, "organisation_role_not_found")], ERRORS)
    assert_preconditions([(role.organisation_id != organisation_id, 404, "role_not_in_organisation")], ERRORS)
    role.is_archived = body.is_archived
    return OrganisationRoleResponse.model_validate(role)


@router.delete("/batch", response_model=DeleteOrganisationRoleResponse)
@delete_resource
def batch_delete_organisation_role(organisation_id: int, body: BatchDeleteOrganisationRoleRequest) -> DeleteOrganisationRoleResponse:
    DatabaseConnection.execute(
        delete(OrganisationRole).where(
            OrganisationRole.id.in_(body.ids),
            OrganisationRole.organisation_id == organisation_id,
        )
    )
    return DeleteOrganisationRoleResponse(deleted=True)


@router.delete("/{role_id}", response_model=DeleteOrganisationRoleResponse)
@delete_resource
def delete_organisation_role(organisation_id: int, role_id: int) -> DeleteOrganisationRoleResponse:
    role = DatabaseConnection.get(OrganisationRole, role_id)
    assert_preconditions([(role is None, 404, "organisation_role_not_found")], ERRORS)
    assert_preconditions([(role.organisation_id != organisation_id, 404, "role_not_in_organisation")], ERRORS)
    DatabaseConnection.delete(role)
    return DeleteOrganisationRoleResponse(deleted=True)
