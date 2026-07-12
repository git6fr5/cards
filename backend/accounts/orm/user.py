from datetime import datetime

from utils.databases import Base
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from accounts.orm.organisation_role import user_organisation_role


class User(Base):
    __tablename__ = "user"

    id               = Column(Integer, primary_key=True)
    email            = Column(String(255), nullable=False, unique=True, index=True)  # unique: one account per email; index: login lookup
    password_hash    = Column(String(255), nullable=False)
    display_name     = Column(String(255), nullable=False)
    permission_level = Column(String(50), nullable=False, default="member")
    created_at       = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at       = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_archived      = Column(Boolean, nullable=False, default=False)

    organisation_id = Column(Integer, ForeignKey("organisation.id"), nullable=False, index=True)  # index: frequent org-scoped queries
    #* Many-to-one → Organisation. A user belongs to one organisation.
    organisation = relationship("Organisation", back_populates="users")

    #* One-to-many → Session. A user can have many active sessions across devices. Cascade: sessions deleted when user is deleted.
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")

    #* Many-to-many → OrganisationRole via user_organisation_role junction. The user's assigned organisation roles.
    organisation_roles = relationship("OrganisationRole", secondary=user_organisation_role, back_populates="users")
