from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import or_, select

from play.auth import PlayerAuthContext, require_player_access
from play.orm.friend import Friend, FriendStatus
from utils.databases import create_resource, read_resource, update_resource, DatabaseConnection
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "cannot_friend_self":       "You cannot send a friend request to yourself.",
    "already_friends":          "These players are already friends.",
    "friend_request_exists":    "A pending friend request already exists between these players.",
    "friend_request_not_found": "The requested friend request does not exist.",
    "forbidden":                "You are not authorised to perform this action.",
}


class CreateFriendRequest(BaseModel):
    recipient_player_id: int


class UpdateFriendStatusRequest(BaseModel):
    status: FriendStatus


class FriendResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:                  int
    status:              FriendStatus
    created_at:          datetime
    responded_at:        datetime | None
    requester_player_id: int
    recipient_player_id: int


@router.post("", status_code=201, response_model=FriendResponse)
@create_resource
def create_friend(body: CreateFriendRequest, auth: PlayerAuthContext = Depends(require_player_access)) -> Friend:
    assert_preconditions([(body.recipient_player_id == auth.player_id, 422, "cannot_friend_self")], ERRORS)

    existing = DatabaseConnection.execute(
        select(Friend).where(
            or_(
                (Friend.requester_player_id == auth.player_id) & (Friend.recipient_player_id == body.recipient_player_id),
                (Friend.requester_player_id == body.recipient_player_id) & (Friend.recipient_player_id == auth.player_id),
            )
        )
    ).scalar_one_or_none()
    assert_preconditions([
        (existing is not None and existing.status == FriendStatus.accepted, 409, "already_friends"),
        (existing is not None and existing.status == FriendStatus.pending, 409, "friend_request_exists"),
    ], ERRORS)

    return Friend(requester_player_id=auth.player_id, recipient_player_id=body.recipient_player_id)


@router.get("", response_model=list[FriendResponse])
@read_resource
def read_friends_by_player(auth: PlayerAuthContext = Depends(require_player_access)) -> list[FriendResponse]:
    friends = DatabaseConnection.execute(
        select(Friend).where(
            Friend.status == FriendStatus.accepted,
            or_(Friend.requester_player_id == auth.player_id, Friend.recipient_player_id == auth.player_id),
        )
    ).scalars().all()
    return [FriendResponse.model_validate(friend) for friend in friends]


@router.get("/requests/incoming", response_model=list[FriendResponse])
@read_resource
def read_friend_requests_by_recipient(auth: PlayerAuthContext = Depends(require_player_access)) -> list[FriendResponse]:
    requests = DatabaseConnection.execute(
        select(Friend).where(Friend.recipient_player_id == auth.player_id, Friend.status == FriendStatus.pending)
    ).scalars().all()
    return [FriendResponse.model_validate(request) for request in requests]


@router.get("/requests/outgoing", response_model=list[FriendResponse])
@read_resource
def read_friend_requests_by_requester(auth: PlayerAuthContext = Depends(require_player_access)) -> list[FriendResponse]:
    requests = DatabaseConnection.execute(
        select(Friend).where(Friend.requester_player_id == auth.player_id, Friend.status == FriendStatus.pending)
    ).scalars().all()
    return [FriendResponse.model_validate(request) for request in requests]


@router.get("/{friend_id}", response_model=FriendResponse)
@read_resource
def read_friend(friend_id: int, auth: PlayerAuthContext = Depends(require_player_access)) -> FriendResponse:
    friend = DatabaseConnection.get(Friend, friend_id)
    assert_preconditions([(friend is None, 404, "friend_request_not_found")], ERRORS)
    assert_preconditions([(auth.player_id not in (friend.requester_player_id, friend.recipient_player_id), 403, "forbidden")], ERRORS)
    return FriendResponse.model_validate(friend)


@router.put("/{friend_id}/status", response_model=FriendResponse)
@update_resource
def update_friend_status(friend_id: int, body: UpdateFriendStatusRequest, auth: PlayerAuthContext = Depends(require_player_access)) -> FriendResponse:
    friend = DatabaseConnection.get(Friend, friend_id)
    assert_preconditions([(friend is None, 404, "friend_request_not_found")], ERRORS)
    assert_preconditions([(friend.recipient_player_id != auth.player_id, 403, "forbidden")], ERRORS)

    friend.status = body.status
    friend.responded_at = datetime.utcnow()
    return FriendResponse.model_validate(friend)
