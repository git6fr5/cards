from fastapi import APIRouter
from .crud import router as crud_router

router = APIRouter(prefix="/example-items", tags=["Example Items"])
router.include_router(crud_router)
