from sqlalchemy.orm import Session

from accounts.orm.organisation import Organisation


def seed_organisation(session: Session) -> Organisation:
    organisation = Organisation(name="Default Org", slug="default-org", is_default=True)
    session.add(organisation)
    session.flush()
    return organisation
