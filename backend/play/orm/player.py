from utils.databases import Base
from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship


class Player(Base):
    __tablename__ = "player"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)  # unique: one Player per User
    #* one-to-one — the accounts.User this player wraps. Cross-package: play depends on accounts, one-directional (no back_populates on User).
    user = relationship("User", uselist=False)

    #* one-to-many — the decks this player has built. Cascade: bags deleted when the player is deleted.
    bags = relationship("Bag", back_populates="player", cascade="all, delete-orphan")
    #* one-to-many — every seat this player has occupied across games
    game_history = relationship("GamePlayer", back_populates="player")
    #* one-to-many — games this player has won
    games_won = relationship("Game", back_populates="winner")

    #* one-to-many — friend requests this player has sent
    friend_requests_sent = relationship("Friend", foreign_keys="Friend.requester_player_id", back_populates="requester")
    #* one-to-many — friend requests this player has received
    friend_requests_received = relationship("Friend", foreign_keys="Friend.recipient_player_id", back_populates="recipient")

    #* one-to-many — game invites this player has sent
    game_invites_sent = relationship("GameInvite", foreign_keys="GameInvite.inviter_player_id", back_populates="inviter")
    #* one-to-many — game invites this player has received
    game_invites_received = relationship("GameInvite", foreign_keys="GameInvite.invitee_player_id", back_populates="invitee")
