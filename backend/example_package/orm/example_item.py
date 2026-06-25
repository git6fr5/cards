from sqlalchemy import Boolean, Column, Integer, String, Text

from utils.databases import Base


class ExampleItem(Base):
    __tablename__ = "example_item"

    id          = Column(Integer, primary_key=True)
    name        = Column(String(255), nullable=False, unique=True)  # unique: items are looked up by name
    description = Column(Text, nullable=True)
    is_archived = Column(Boolean, nullable=False, default=False)
