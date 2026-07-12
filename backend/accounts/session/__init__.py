from fastapi import APIRouter

from .crud import router as crud_router

router = APIRouter(tags=["Sessions"])
router.include_router(crud_router, prefix="/sessions")
