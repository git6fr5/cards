from datetime import datetime, timezone
from typing import Annotated
from pydantic import PlainSerializer


def _ensure_utc(v: datetime) -> datetime:
    if v.tzinfo is None:
        return v.replace(tzinfo=timezone.utc)
    return v.astimezone(timezone.utc)


UTCDateTime = Annotated[datetime, PlainSerializer(_ensure_utc, return_type=datetime)]


def utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_naive_utc(v: datetime) -> datetime:
    return v.astimezone(timezone.utc).replace(tzinfo=None)
