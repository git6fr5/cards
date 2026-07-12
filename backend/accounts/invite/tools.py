import secrets
from datetime import datetime
from typing import Optional

from sqlalchemy import select

from accounts.orm.invite import Invite, InvitePurpose
from utils.databases import DatabaseConnection
from utils.encryption import hash_token


def create_invite(purpose: InvitePurpose, expires_at: datetime) -> Invite:
    invite = Invite(
        purpose=purpose,
        invite_token=secrets.token_hex(4),
        invite_expires_at=expires_at,
    )
    DatabaseConnection.add(invite)
    DatabaseConnection.flush()
    return invite


def read_invite_by_token(token: str) -> Optional[Invite]:
    return DatabaseConnection.execute(
        select(Invite).where(Invite.invite_token == token)
    ).scalar_one_or_none()


def update_invite_redeemed(invite: Invite) -> str:
    invite.invite_token      = None
    invite.invite_expires_at = None
    raw_session_key          = secrets.token_hex(32)
    invite.session_key       = hash_token(raw_session_key)
    return raw_session_key
