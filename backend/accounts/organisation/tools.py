from sqlalchemy import select

from accounts.orm.organisation import Organisation
from utils.databases import DatabaseConnection
from utils.errors import assert_preconditions


_ERRORS = {
    "default_organisation_not_found": "No default organisation is configured.",
}


def find_default_org() -> Organisation:
    org = DatabaseConnection.execute(
        select(Organisation).where(Organisation.is_default == True)
    ).scalar_one_or_none()
    assert_preconditions([(org is None, 404, "default_organisation_not_found")], _ERRORS)
    return org
