from utils.databases import Base
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship


class AccessToken(Base):
    __tablename__ = "access_token"

    id          = Column(Integer, primary_key=True)
    token_hash  = Column(String(255), nullable=False, unique=True, index=True)  # unique + index: looked up on every token-authenticated request
    label       = Column(String(255), nullable=False)
    permission_level = Column(String(50), nullable=False, default="member")  # mirrors User.permission_level; "admin" tokens may manage org tokens
    is_archived = Column(Boolean, nullable=False, default=False)
    expires_at  = Column(DateTime, nullable=True)

    organisation_id = Column(Integer, ForeignKey("organisation.id", ondelete="CASCADE"), nullable=False, index=True)  # index: token-by-org lookups
    #* Many-to-one → Organisation. Many access tokens belong to one organisation. Cascade: tokens deleted when the organisation is deleted.
    organisation = relationship("Organisation", back_populates="access_tokens")
