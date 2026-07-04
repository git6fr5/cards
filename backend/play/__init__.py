from fastapi import APIRouter

from play.game.crud import router as game_router
from play.action.crud import router as action_router

router = APIRouter()
router.include_router(game_router, prefix="/games", tags=["Games"])
router.include_router(action_router, prefix="/actions", tags=["Actions"])

__all__ = ["router"]
