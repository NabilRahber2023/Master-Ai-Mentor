"""
FastAPI authorization dependencies.

Usage:
    @router.post("/predict", dependencies=[Depends(require("predict:single"))])
    @router.post("/batch",   dependencies=[Depends(require("predict:batch", module="batch-prediction"))])
"""
from typing import Optional

from fastapi import Depends, HTTPException, Request, status

from app.auth.matrix import has_permission, is_super_admin
from app.auth.principal import Principal, resolve_principal


async def get_principal(request: Request) -> Principal:
    principal = await resolve_principal(request)
    if not principal or not principal.is_authenticated:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return principal


def require(permission: str, module: Optional[str] = None):
    """Dependency enforcing a permission (and optional module entitlement)."""
    async def _dep(request: Request) -> Principal:
        principal = await get_principal(request)

        # Service + super admin bypass role/module gates.
        if principal.is_service or is_super_admin(principal.platform_role):
            return principal

        if not has_permission(principal.platform_role, principal.org_role, permission):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

        if module and module not in principal.modules:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Module '{module}' is disabled for your organization",
            )
        return principal

    return _dep
