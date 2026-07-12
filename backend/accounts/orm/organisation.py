from utils.databases import Base
from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship


class Organisation(Base):
    __tablename__ = "organisation"

    id          = Column(Integer, primary_key=True)
    name        = Column(String(255), nullable=False, unique=True)  # unique: one record per organisation name
    slug        = Column(String(255), nullable=False, unique=True, index=True)  # unique + index: URL-safe identifier, looked up on every request
    domain      = Column(String(255), nullable=True, unique=True)  # unique: one org per domain if provided
    is_archived  = Column(Boolean, nullable=False, default=False)
    is_default   = Column(Boolean, nullable=False, default=False)

    #* One-to-many → User. An organisation has many users. Users are not cascade-deleted when an org is deleted.
    users = relationship("User", back_populates="organisation")

    #* One-to-many → OrganisationRole. An organisation has many defined roles. Roles are not cascade-deleted when an org is deleted.
    organisation_roles = relationship("OrganisationRole", back_populates="organisation")

    #* One-to-many → AccessToken. An organisation has many access tokens. Cascade: tokens deleted when the organisation is deleted.
    access_tokens = relationship("AccessToken", back_populates="organisation", cascade="all, delete-orphan")
