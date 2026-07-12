# Invite manages authentication only — it is not part of any legal record.
# It handles the one-time invite flow (Phase 1) and issues a session_key on
# redemption (Phase 2) that the frontend stores in sessionStorage to prove
# the holder's identity on the relevant page. This credential is entirely
# ephemeral and carries no legal weight.
#
# Phase 1 — invite_token: single-use code sent in the email link.
#            Nulled immediately on redemption so the link cannot be replayed.
# Phase 2 — session_key: generated at redemption, returned to the frontend.
#            Stored in sessionStorage; cleared when the tab closes.
#
# purpose distinguishes invite types. Neither Testator nor ThirdParty holds
# the FK — the consuming model (Testator, ThirdPartyRequest) holds invite_id
# so that Invite has no dependency on any downstream package.

import enum

from utils.databases import Base
from sqlalchemy import Column, DateTime, Enum, Integer, String


class InvitePurpose(str, enum.Enum):
    TestatorInvite    = "TestatorInvite"
    ThirdPartyInvite  = "ThirdPartyInvite"
    AudiovisualInvite = "AudiovisualInvite"


class Invite(Base):
    __tablename__ = "invite"

    id                = Column(Integer, primary_key=True)
    purpose           = Column(Enum(InvitePurpose), nullable=False)
    invite_token      = Column(String(8),  nullable=True)
    invite_expires_at = Column(DateTime,   nullable=True)
    session_key       = Column(String(64), nullable=True)
