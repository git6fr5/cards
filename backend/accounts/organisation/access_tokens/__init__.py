from fastapi import APIRouter

from .crud import router as crud_router

router = APIRouter(tags=["Access Tokens"])
router.include_router(crud_router, prefix="/{organisation_id}/access-tokens")
