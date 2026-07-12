from fastapi import APIRouter

from .crud import router as crud_router

router = APIRouter(tags=["Users"])
router.include_router(crud_router, prefix="/users")
