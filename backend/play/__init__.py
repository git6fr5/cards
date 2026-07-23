from fastapi import APIRouter

from play.game.crud import router as game_router
from play.game.history import router as game_history_router
from play.game.active import router as game_active_router
from play.game.socket import router as game_socket_router
from play.action.crud import router as action_router
from play.action.preview import router as action_preview_router
from play.player.crud import router as player_router
from play.bag.crud import router as bag_router
from play.piece.crud import router as piece_router
from play.friend.crud import router as friend_router
from play.game_invite.crud import router as game_invite_router

router = APIRouter()
router.include_router(game_history_router, prefix="/games", tags=["Games"])
router.include_router(game_active_router, prefix="/games", tags=["Games"])
router.include_router(game_router, prefix="/games", tags=["Games"])
router.include_router(game_socket_router, prefix="/games", tags=["Games"])
router.include_router(action_router, prefix="/actions", tags=["Actions"])
router.include_router(action_preview_router, prefix="/actions", tags=["Actions"])
router.include_router(player_router, prefix="/players", tags=["Players"])
router.include_router(bag_router, prefix="/bags", tags=["Bags"])
router.include_router(piece_router, prefix="/pieces", tags=["Pieces"])
router.include_router(friend_router, prefix="/friends", tags=["Friends"])
router.include_router(game_invite_router, prefix="/game_invites", tags=["Game Invites"])

__all__ = ["router"]
