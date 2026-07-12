from utils.databases import Base
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Table, UniqueConstraint
from sqlalchemy.orm import relationship


user_organisation_role = Table(
    "user_organisation_role",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("user.id"), primary_key=True),
    Column("organisation_role_id", Integer, ForeignKey("organisation_role.id"), primary_key=True),
)


class OrganisationRole(Base):
    __tablename__ = "organisation_role"

    id          = Column(Integer, primary_key=True)
    name        = Column(String(255), nullable=False)
    is_archived = Column(Boolean, nullable=False, default=False)

    organisation_id = Column(Integer, ForeignKey("organisation.id"), nullable=False, index=True)  # index: org-scoped role queries
    #* Many-to-one → Organisation. A role belongs to one organisation.
    organisation = relationship("Organisation", back_populates="organisation_roles")

    #* Many-to-many → User via user_organisation_role junction. Users assigned this role.
    users = relationship("User", secondary=user_organisation_role, back_populates="organisation_roles")

    __table_args__ = (
        UniqueConstraint("name", "organisation_id", name="uq_organisation_role_name_org"),
    )
