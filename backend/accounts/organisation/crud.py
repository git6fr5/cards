from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select

from accounts.orm.organisation import Organisation
from accounts.orm.user import User
from utils.auth import require_super_admin
from utils.databases import create_resource, read_resource, update_resource, delete_resource, DatabaseConnection
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "organisation_not_found": "The requested organisation does not exist.",
    "name_already_exists":    "An organisation with that name already exists.",
    "slug_already_exists":    "An organisation with that slug already exists.",
    "domain_already_exists":  "An organisation with that domain already exists.",
    "user_not_found":         "The requested user does not exist.",
}


class CreateOrganisationRequest(BaseModel):
    name:   str
    slug:   str
    domain: str | None = None


class UpdateOrganisationNameRequest(BaseModel):
    name: str


class UpdateOrganisationDomainRequest(BaseModel):
    domain: str | None


class UpdateOrganisationSlugRequest(BaseModel):
    slug: str


class UpdateOrganisationIsArchivedRequest(BaseModel):
    is_archived: bool


class OrganisationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:          int
    name:        str
    slug:        str
    domain:      str | None
    is_archived: bool


class DeleteOrganisationResponse(BaseModel):
    deleted: bool


# Tagged "Feed" so it appears in the org-handover Swagger slice. Locks itself with require_super_admin
# so it stays protected on any mount path — only a super-admin onboards a new organisation. (The
# crud_router include in __init__.py applies the same lock; redundant here but harmless via dep caching.)
@router.post("", status_code=201, response_model=OrganisationResponse,
             dependencies=[Depends(require_super_admin)], tags=["Feed"])
@create_resource
def create_organisation(body: CreateOrganisationRequest) -> Organisation:
    existing_name = DatabaseConnection.execute(
        select(Organisation).where(Organisation.name == body.name)
    ).scalar_one_or_none()
    assert_preconditions([(existing_name is not None, 409, "name_already_exists")], ERRORS)
    existing_slug = DatabaseConnection.execute(
        select(Organisation).where(Organisation.slug == body.slug)
    ).scalar_one_or_none()
    assert_preconditions([(existing_slug is not None, 409, "slug_already_exists")], ERRORS)
    if body.domain:
        existing_domain = DatabaseConnection.execute(
            select(Organisation).where(Organisation.domain == body.domain)
        ).scalar_one_or_none()
        assert_preconditions([(existing_domain is not None, 409, "domain_already_exists")], ERRORS)
    return Organisation(name=body.name, slug=body.slug, domain=body.domain)


@router.get("", response_model=list[OrganisationResponse])
@read_resource
def read_organisations() -> list[OrganisationResponse]:
    organisations = DatabaseConnection.execute(
        select(Organisation).where(Organisation.is_archived == False)
    ).scalars().all()
    return [OrganisationResponse.model_validate(o) for o in organisations]


@router.get("/{organisation_id}", response_model=OrganisationResponse)
@read_resource
def read_organisation(organisation_id: int) -> OrganisationResponse:
    assert_preconditions([(not (organisation := DatabaseConnection.get(Organisation, organisation_id)), 404, "organisation_not_found")], ERRORS)
    return OrganisationResponse.model_validate(organisation)


@router.get("/domain/{domain}", response_model=OrganisationResponse)
@read_resource
def read_organisation_by_domain(domain: str) -> OrganisationResponse:
    organisation = DatabaseConnection.execute(
        select(Organisation).where(Organisation.domain == domain)
    ).scalar_one_or_none()
    assert_preconditions([(organisation is None, 404, "organisation_not_found")], ERRORS)
    return OrganisationResponse.model_validate(organisation)


@router.get("/user/{user_id}", response_model=OrganisationResponse)
@read_resource
def read_organisation_by_user_id(user_id: int) -> OrganisationResponse:
    user = DatabaseConnection.get(User, user_id)
    assert_preconditions([(user is None, 404, "user_not_found")], ERRORS)
    organisation = DatabaseConnection.get(Organisation, user.organisation_id)
    assert_preconditions([(organisation is None, 404, "organisation_not_found")], ERRORS)
    return OrganisationResponse.model_validate(organisation)


@router.get("/search/name", response_model=list[OrganisationResponse])
@read_resource
def search_organisation_by_name(q: str) -> list[OrganisationResponse]:
    organisations = DatabaseConnection.execute(
        select(Organisation).where(Organisation.name.ilike(f"%{q}%"))
    ).scalars().all()
    return [OrganisationResponse.model_validate(o) for o in organisations]


@router.get("/search/domain", response_model=list[OrganisationResponse])
@read_resource
def search_organisation_by_domain(q: str) -> list[OrganisationResponse]:
    organisations = DatabaseConnection.execute(
        select(Organisation).where(Organisation.domain.ilike(f"%{q}%"))
    ).scalars().all()
    return [OrganisationResponse.model_validate(o) for o in organisations]


@router.get("/search/slug", response_model=list[OrganisationResponse])
@read_resource
def search_organisation_by_slug(q: str) -> list[OrganisationResponse]:
    organisations = DatabaseConnection.execute(
        select(Organisation).where(Organisation.slug.ilike(f"%{q}%"))
    ).scalars().all()
    return [OrganisationResponse.model_validate(o) for o in organisations]


@router.put("/{organisation_id}/name", response_model=OrganisationResponse)
@update_resource
def update_organisation_name(organisation_id: int, body: UpdateOrganisationNameRequest) -> OrganisationResponse:
    assert_preconditions([(not (organisation := DatabaseConnection.get(Organisation, organisation_id)), 404, "organisation_not_found")], ERRORS)
    organisation.name = body.name
    return OrganisationResponse.model_validate(organisation)


@router.put("/{organisation_id}/domain", response_model=OrganisationResponse)
@update_resource
def update_organisation_domain(organisation_id: int, body: UpdateOrganisationDomainRequest) -> OrganisationResponse:
    assert_preconditions([(not (organisation := DatabaseConnection.get(Organisation, organisation_id)), 404, "organisation_not_found")], ERRORS)
    organisation.domain = body.domain
    return OrganisationResponse.model_validate(organisation)


@router.put("/{organisation_id}/slug", response_model=OrganisationResponse)
@update_resource
def update_organisation_slug(organisation_id: int, body: UpdateOrganisationSlugRequest) -> OrganisationResponse:
    assert_preconditions([(not (organisation := DatabaseConnection.get(Organisation, organisation_id)), 404, "organisation_not_found")], ERRORS)
    organisation.slug = body.slug
    return OrganisationResponse.model_validate(organisation)


@router.put("/{organisation_id}/is_archived", response_model=OrganisationResponse)
@update_resource
def update_organisation_is_archived(organisation_id: int, body: UpdateOrganisationIsArchivedRequest) -> OrganisationResponse:
    assert_preconditions([(not (organisation := DatabaseConnection.get(Organisation, organisation_id)), 404, "organisation_not_found")], ERRORS)
    organisation.is_archived = body.is_archived
    return OrganisationResponse.model_validate(organisation)


@router.delete("/{organisation_id}", response_model=DeleteOrganisationResponse)
@delete_resource
def delete_organisation(organisation_id: int) -> DeleteOrganisationResponse:
    assert_preconditions([(not (organisation := DatabaseConnection.get(Organisation, organisation_id)), 404, "organisation_not_found")], ERRORS)
    DatabaseConnection.delete(organisation)
    return DeleteOrganisationResponse(deleted=True)
