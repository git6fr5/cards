from fastapi import APIRouter, Depends

from utils.auth import require_super_admin

from .crud import router as crud_router
from .roles import router as roles_router
from .access_tokens import router as access_tokens_router

router = APIRouter(tags=["Organisations"])
# Org CRUD and roles keep the default-deny super-admin lock. Access-tokens is part of the org
# "Feed" handover surface, so it is included bare and gates each route itself (require_org_admin).
router.include_router(crud_router, prefix="/organisations", dependencies=[Depends(require_super_admin)])
router.include_router(roles_router, prefix="/organisations",
                      dependencies=[Depends(require_super_admin)])
router.include_router(access_tokens_router, prefix="/organisations", tags=["Feed"])
