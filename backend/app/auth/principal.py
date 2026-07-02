"""
Resolve the caller's identity for FastAPI requests.

Auth is validated against the **shared** Better Auth `session` table (same Postgres
the frontend uses). The browser's session cookie is forwarded by the Next.js rewrite,
so we read it here. Trusted internal service calls (e.g. the chatbot calling the ML
endpoints) carry an internal token instead.
"""
import json
import logging
import time
from dataclasses import dataclass, field
from typing import Dict, Optional, Set, Tuple

from sqlalchemy import text

from app.auth.internal_token import INTERNAL_API_TOKEN
from app.chatbot.database import (
    control_session_maker,
    current_tenant_db,
    ensure_tenant_ready,
)

logger = logging.getLogger(__name__)

COOKIE_NAMES = (
    "better-auth.session_token",
    "__Secure-better-auth.session_token",
)

_CACHE_TTL = 30.0  # seconds
_cache: Dict[str, Tuple[float, "Principal"]] = {}


@dataclass
class Principal:
    user_id: Optional[str] = None
    platform_role: Optional[str] = None
    org_id: Optional[str] = None
    org_role: Optional[str] = None
    modules: Set[str] = field(default_factory=set)  # entitled module ids
    is_service: bool = False
    is_authenticated: bool = False
    tenant_db_name: Optional[str] = None  # dedicated tenant database, if provisioned


def _service_principal() -> Principal:
    return Principal(platform_role="super_admin", is_service=True, is_authenticated=True)


def _extract_token(request) -> Optional[str]:
    for name in COOKIE_NAMES:
        raw = request.cookies.get(name)
        if raw:
            # Cookie value is "<token>.<signature>"; session.token stores the token part.
            return raw.split(".", 1)[0]
    # Also accept Authorization: Bearer <token> for non-browser clients.
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:].split(".", 1)[0]
    return None


async def _load_principal(token: str) -> Optional[Principal]:
    async with control_session_maker() as session:
        row = (await session.execute(text("""
            SELECT s.user_id, s.expires_at, u.role AS platform_role
            FROM "session" s JOIN "user" u ON u.id = s.user_id
            WHERE s.token = :token
        """), {"token": token})).mappings().first()
        if not row:
            return None
        # Expiry check (expires_at is a timestamp).
        exp = row["expires_at"]
        if exp is not None:
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            exp_aware = exp if exp.tzinfo else exp.replace(tzinfo=timezone.utc)
            if exp_aware < now:
                return None

        user_id = row["user_id"]
        platform_role = row["platform_role"] or "user"

        member = (await session.execute(text("""
            SELECT organization_id, role FROM member WHERE user_id = :uid LIMIT 1
        """), {"uid": user_id})).mappings().first()

        org_id = member["organization_id"] if member else None
        org_role = member["role"] if member else None

        modules: Set[str] = set()
        tenant_db_name: Optional[str] = None
        if org_id:
            mod_rows = (await session.execute(text("""
                SELECT om.module_id FROM org_module om
                JOIN module_registry mr ON mr.id = om.module_id
                WHERE om.organization_id = :oid AND om.enabled AND mr.global_enabled
            """), {"oid": org_id})).fetchall()
            modules = {r[0] for r in mod_rows}

            # Dedicated tenant database (set by the provisioning flow).
            org_row = (await session.execute(text("""
                SELECT metadata FROM organization WHERE id = :oid
            """), {"oid": org_id})).mappings().first()
            if org_row and org_row.get("metadata"):
                try:
                    meta = json.loads(org_row["metadata"])
                    tenant_db_name = meta.get("tenantDbName") or None
                except (ValueError, TypeError):
                    tenant_db_name = None

        return Principal(
            user_id=user_id, platform_role=platform_role,
            org_id=org_id, org_role=org_role, modules=modules,
            is_authenticated=True, tenant_db_name=tenant_db_name,
        )


async def _activate_tenant(principal: Optional[Principal]) -> None:
    """Publish the principal's tenant database into the request context so every
    downstream ``async_session_maker()`` binds to the correct tenant. Warms the
    tenant engine/schema on first use; falls back to the shared DB on failure so
    existing (un-provisioned) organizations keep working."""
    tenant_db_name = principal.tenant_db_name if principal else None
    if tenant_db_name:
        try:
            await ensure_tenant_ready(tenant_db_name)
        except Exception as e:  # noqa: BLE001 - never fail the request on warmup
            logger.error(
                "Failed to initialize tenant database %s: %s", tenant_db_name, e
            )
            tenant_db_name = None
    current_tenant_db.set(tenant_db_name)


async def resolve_principal(request) -> Optional[Principal]:
    """Return the Principal for a request, or None if unauthenticated."""
    # 1) Trusted internal service call.
    if request.headers.get("x-internal-token") == INTERNAL_API_TOKEN:
        principal = _service_principal()
        await _activate_tenant(principal)
        return principal

    # 2) User session via cookie / bearer.
    token = _extract_token(request)
    if not token:
        current_tenant_db.set(None)
        return None

    cached = _cache.get(token)
    now = time.monotonic()
    if cached and cached[0] > now:
        await _activate_tenant(cached[1])
        return cached[1]

    principal = await _load_principal(token)
    if principal:
        _cache[token] = (now + _CACHE_TTL, principal)
    await _activate_tenant(principal)
    return principal


def invalidate_cache():
    _cache.clear()
