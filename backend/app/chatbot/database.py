"""
Database configuration and connection management for AI Mentor Chatbot.
Uses SQLAlchemy 2.0 async with PostgreSQL + pgvector.

Multi-tenant isolation
----------------------
Every organization owns a dedicated PostgreSQL database (created by the frontend
provisioning flow, name stored in ``organization.metadata.tenantDbName``). The
authenticated principal is resolved per request (see ``app.auth.principal``) and
the tenant database name is published into ``current_tenant_db`` — a context var
that is naturally isolated per asyncio task, so concurrent requests never see one
another's tenant.

``async_session_maker()`` is the single seam every service/repository already
uses. It now returns a session bound to the *current* tenant's engine. When no
tenant is in context (CLI ingestion, startup checks, the shared control plane) it
falls back to the control/shared engine — preserving the original behaviour.

The control-plane engine (Better Auth ``session``/``user``/``member``/
``organization`` tables) is always the shared database and must be reached via
``control_session_maker`` regardless of tenant context.
"""
import asyncio
import contextvars
import os
from typing import Dict, Optional

from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

# Database URL from environment or default. This points at the shared/control
# database that holds the Better Auth tables (and serves as the fallback for
# un-provisioned organizations).
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_mentor"
)


def _int_env(name: str, default: int) -> int:
    """Read a positive-int tunable from the environment, falling back to the
    original hardcoded default when unset or malformed."""
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except (TypeError, ValueError):
        return default


# Connection-pool sizing. Defaults preserve the original behaviour; operators can
# shrink these (or point DATABASE_URL at PgBouncer) to bound total Postgres
# connections when many tenants are active. Control pool serves the shared/auth
# database; tenant pools are created once per organization database.
CONTROL_POOL_SIZE = _int_env("DB_CONTROL_POOL_SIZE", 10)
CONTROL_MAX_OVERFLOW = _int_env("DB_CONTROL_MAX_OVERFLOW", 20)
TENANT_POOL_SIZE = _int_env("DB_TENANT_POOL_SIZE", 5)
TENANT_MAX_OVERFLOW = _int_env("DB_TENANT_MAX_OVERFLOW", 10)


class Base(DeclarativeBase):
    """SQLAlchemy declarative base for all models."""
    pass


# ── Control / shared engine ─────────────────────────────────────────────────
# Used for auth reads (always the shared DB) and as the fallback tenant when no
# organization tenant database is in context.
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=CONTROL_POOL_SIZE,
    max_overflow=CONTROL_MAX_OVERFLOW,
    pool_pre_ping=True
)

# Session factory for the control plane / shared database.
control_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


# ── Per-tenant engine registry ──────────────────────────────────────────────
# The tenant database name for the current request, isolated per asyncio task.
current_tenant_db: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "current_tenant_db", default=None
)

# Cached engine + session factory per tenant database name (reused across
# requests, one connection pool per tenant).
_tenant_engines: Dict[str, AsyncEngine] = {}
_tenant_makers: Dict[str, async_sessionmaker] = {}
# Tenant databases whose schema (pgvector + tables) has been ensured this process.
_tenant_ready: set = set()
_registry_lock = asyncio.Lock()


def _tenant_url(tenant_db_name: str) -> str:
    """Build the async connection URL for a tenant database.

    Reuses the shared DATABASE_URL's host/port/credentials, swapping only the
    database name — tenant DBs live on the same PostgreSQL instance.
    """
    return make_url(DATABASE_URL).set(database=tenant_db_name).render_as_string(
        hide_password=False
    )


async def ensure_tenant_ready(tenant_db_name: Optional[str]) -> None:
    """Ensure an engine + schema exist for the given tenant database.

    Idempotent and concurrency-safe: the engine/pool is created once and cached,
    and the schema (pgvector extension + ORM tables) is materialised once per
    process. Safe to call on every request; a no-op once warm.

    A ``None`` name means "use the shared/control database" — nothing to do.
    """
    if not tenant_db_name:
        return
    if tenant_db_name in _tenant_ready:
        return

    async with _registry_lock:
        if tenant_db_name in _tenant_ready:
            return

        tenant_engine = _tenant_engines.get(tenant_db_name)
        if tenant_engine is None:
            tenant_engine = create_async_engine(
                _tenant_url(tenant_db_name),
                echo=False,
                pool_size=TENANT_POOL_SIZE,
                max_overflow=TENANT_MAX_OVERFLOW,
                pool_pre_ping=True,
            )
            _tenant_engines[tenant_db_name] = tenant_engine
            _tenant_makers[tenant_db_name] = async_sessionmaker(
                tenant_engine, class_=AsyncSession, expire_on_commit=False
            )

        # Materialise the schema (pgvector must exist before the vector columns).
        # Importing models here registers all tables on Base.metadata.
        import app.chatbot.models  # noqa: F401
        async with tenant_engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.run_sync(Base.metadata.create_all)

        _tenant_ready.add(tenant_db_name)


def _current_maker() -> async_sessionmaker:
    """Return the session factory bound to the current tenant (or the control
    plane when no tenant is in context)."""
    tenant_db_name = current_tenant_db.get()
    if not tenant_db_name:
        return control_session_maker
    maker = _tenant_makers.get(tenant_db_name)
    if maker is None:
        # Not warmed yet — resolve_principal warms tenants before handlers run,
        # so this is only reached from out-of-band callers. Fall back safely.
        raise RuntimeError(
            f"Tenant database '{tenant_db_name}' is not initialized; "
            "ensure_tenant_ready() must be awaited before opening a session."
        )
    return maker


def async_session_maker() -> AsyncSession:
    """Open a new AsyncSession for the current tenant.

    Keeps the original call signature (``async with async_session_maker() as
    session:``) used throughout the codebase, but now transparently binds to the
    caller's tenant database.
    """
    return _current_maker()()


def _current_engine() -> AsyncEngine:
    """Return the engine bound to the current tenant (or the shared engine)."""
    tenant_db_name = current_tenant_db.get()
    if not tenant_db_name:
        return engine
    tenant_engine = _tenant_engines.get(tenant_db_name)
    if tenant_engine is None:
        raise RuntimeError(
            f"Tenant database '{tenant_db_name}' is not initialized."
        )
    return tenant_engine


async def get_db() -> AsyncSession:
    """Dependency for getting a database session for the current tenant."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize the current context's database: enable pgvector and create
    tables. With no tenant in context this targets the shared database (used at
    application startup); within a tenant request it targets that tenant DB."""
    tenant_db_name = current_tenant_db.get()
    if tenant_db_name:
        await ensure_tenant_ready(tenant_db_name)
        return
    import app.chatbot.models  # noqa: F401
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Dispose all database connections (shared + every tenant engine)."""
    await engine.dispose()
    for tenant_engine in _tenant_engines.values():
        await tenant_engine.dispose()
    _tenant_engines.clear()
    _tenant_makers.clear()
    _tenant_ready.clear()
