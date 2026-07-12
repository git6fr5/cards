from datetime import datetime

from utils.databases import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship


class Session(Base):
    __tablename__ = "session"

    id          = Column(Integer, primary_key=True)
    token_hash  = Column(String(255), nullable=False, unique=True, index=True)  # unique: one token per session; index: lookup on every request
    expires_at  = Column(DateTime, nullable=False)
    created_at  = Column(DateTime, nullable=False, default=datetime.utcnow)
    device_name = Column(String(255), nullable=True)

    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)  # index: frequent lookup by user
    #* Many-to-one → User. Many sessions can belong to one user. Cascade: session deleted when user is deleted.
    user = relationship("User", back_populates="sessions")
