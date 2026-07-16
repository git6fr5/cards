# Invite manages authentication only — it is not part of any legal record.
# It handles the one-time invite flow (Phase 1) and issues a session_key on
# redemption (Phase 2), delivered to the caller once and never re-revealed.
# This credential is entirely ephemeral and carries no legal weight.
#
# Phase 1 — invite_token: single-use code sent in the email link.
#            Nulled immediately on redemption so the link cannot be replayed.
# Phase 2 — session_key_hash: generated at redemption; the raw session_key is returned to the
#            caller once and only the hash is stored here.
#
# purpose distinguishes invite types. It is a plain string, not an enum, so this shared model
# carries no domain vocabulary — each consuming package (testaments, scheduling, audiovisual)
# defines and owns its own purpose value locally. Neither Testator nor ThirdParty holds the FK —
# the consuming model (Testator, ThirdPartyRequest) holds invite_id so that Invite has no
# dependency on any downstream package.

from utils.databases import Base
from sqlalchemy import Column, DateTime, Integer, String


class Invite(Base):
    __tablename__ = "invite"

    id                = Column(Integer, primary_key=True)
    purpose           = Column(String(255), nullable=False)
    invite_token      = Column(String(8),  nullable=True)
    invite_expires_at = Column(DateTime,   nullable=True)
    session_key_hash  = Column(String(64), nullable=True)
