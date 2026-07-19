from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import or_, select

from play.auth import PlayerAuthContext, require_player_access
from play.orm.bag import Bag
from play.orm.friend import Friend, FriendStatus
from play.orm.game import Game
from play.orm.game_invite import GameInvite, GameInviteStatus
from play.orm.game_player import GamePlayer
from play.tools import snapshot_bag_pieces
from utils.databases import create_resource, read_resource, update_resource, DatabaseConnection
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "game_not_found":         "The requested game does not exist.",
    "bag_not_found":          "The requested bag does not exist.",
    "not_friends":            "You can only invite an accepted friend to a game.",
    "no_open_seat":           "This game has no open seat to invite a player into.",
    "invite_already_pending": "A pending invite already exists for this player and game.",
    "game_invite_not_found":  "The requested game invite does not exist.",
    "forbidden":              "You are not authorised to perform this action.",
    "invite_not_pending":     "This game invite has already been claimed.",
}


class CreateGameInviteRequest(BaseModel):
    game_id:           int
    invitee_player_id: int


class ClaimGameInviteRequest(BaseModel):
    bag_id: int


class GameInviteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:                 int
    status:             GameInviteStatus
    created_at:         datetime
    game_id:            int
    inviter_player_id:  int
    invitee_player_id:  int


def _are_friends(player_a_id: int, player_b_id: int) -> bool:
    friend = DatabaseConnection.execute(
        select(Friend).where(
            Friend.status == FriendStatus.accepted,
            or_(
                (Friend.requester_player_id == player_a_id) & (Friend.recipient_player_id == player_b_id),
                (Friend.requester_player_id == player_b_id) & (Friend.recipient_player_id == player_a_id),
            ),
        )
    ).scalar_one_or_none()
    return friend is not None


def _find_open_seat(game_id: int) -> GamePlayer | None:
    return DatabaseConnection.execute(
        select(GamePlayer).where(GamePlayer.game_id == game_id, GamePlayer.player_id.is_(None))
    ).scalar_one_or_none()


@router.post("", status_code=201, response_model=GameInviteResponse)
@create_resource
def create_game_invite(body: CreateGameInviteRequest, auth: PlayerAuthContext = Depends(require_player_access)) -> GameInvite:
    game = DatabaseConnection.get(Game, body.game_id)
    assert_preconditions([(game is None, 404, "game_not_found")], ERRORS)
    assert_preconditions([(not _are_friends(auth.player_id, body.invitee_player_id), 403, "not_friends")], ERRORS)
    assert_preconditions([(_find_open_seat(body.game_id) is None, 422, "no_open_seat")], ERRORS)

    existing = DatabaseConnection.execute(
        select(GameInvite).where(
            GameInvite.game_id == body.game_id,
            GameInvite.invitee_player_id == body.invitee_player_id,
            GameInvite.status == GameInviteStatus.pending,
        )
    ).scalar_one_or_none()
    assert_preconditions([(existing is not None, 409, "invite_already_pending")], ERRORS)

    return GameInvite(game_id=body.game_id, inviter_player_id=auth.player_id, invitee_player_id=body.invitee_player_id)


@router.get("", response_model=list[GameInviteResponse])
@read_resource
def read_game_invites_by_recipient(auth: PlayerAuthContext = Depends(require_player_access)) -> list[GameInviteResponse]:
    invites = DatabaseConnection.execute(
        select(GameInvite).where(
            GameInvite.invitee_player_id == auth.player_id,
            GameInvite.status == GameInviteStatus.pending,
        )
    ).scalars().all()
    return [GameInviteResponse.model_validate(invite) for invite in invites]


@router.get("/{game_invite_id}", response_model=GameInviteResponse)
@read_resource
def read_game_invite(game_invite_id: int, auth: PlayerAuthContext = Depends(require_player_access)) -> GameInviteResponse:
    invite = DatabaseConnection.get(GameInvite, game_invite_id)
    assert_preconditions([(invite is None, 404, "game_invite_not_found")], ERRORS)
    assert_preconditions([(auth.player_id not in (invite.inviter_player_id, invite.invitee_player_id), 403, "forbidden")], ERRORS)
    return GameInviteResponse.model_validate(invite)


@router.put("/{game_invite_id}/claim", response_model=GameInviteResponse)
@update_resource
def claim_game_invite(
    game_invite_id: int,
    body: ClaimGameInviteRequest,
    auth: PlayerAuthContext = Depends(require_player_access),
) -> GameInviteResponse:
    invite = DatabaseConnection.get(GameInvite, game_invite_id)
    assert_preconditions([(invite is None, 404, "game_invite_not_found")], ERRORS)
    assert_preconditions([(invite.invitee_player_id != auth.player_id, 403, "forbidden")], ERRORS)
    assert_preconditions([(invite.status != GameInviteStatus.pending, 409, "invite_not_pending")], ERRORS)

    bag = DatabaseConnection.get(Bag, body.bag_id)
    assert_preconditions([(bag is None, 404, "bag_not_found")], ERRORS)
    assert_preconditions([(bag.player_id != auth.player_id, 403, "forbidden")], ERRORS)

    open_seat = _find_open_seat(invite.game_id)
    assert_preconditions([(open_seat is None, 422, "no_open_seat")], ERRORS)

    open_seat.player_id = auth.player_id
    DatabaseConnection.flush()
    snapshot_bag_pieces(open_seat.id, body.bag_id)
    invite.status = GameInviteStatus.claimed
    return GameInviteResponse.model_validate(invite)
