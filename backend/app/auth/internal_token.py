"""
Single source of truth for the internal service token.

Trusted server-to-server calls (the chatbot calling the ML endpoints) carry this
token in the ``x-internal-token`` header; ``resolve_principal`` accepts it as a
``super_admin`` service principal. Because it grants full access, it must never
fall back to a well-known constant in production.

Resolution order:
  1. ``INTERNAL_API_TOKEN`` from the environment (required for any multi-process
     or multi-host deployment — e.g. uvicorn with ``--workers`` > 1, or a
     separate frontend/backend host).
  2. If unset, an unguessable per-process token generated at import time. Sender
     and receiver both import *this* value, so single-process deployments keep
     working out of the box, but the old public default can never authenticate.

Both the token sender (``app.chatbot.tools``) and the receiver
(``app.auth.principal``) import ``INTERNAL_API_TOKEN`` from here so they always
agree within a process.
"""
import logging
import os
import secrets

logger = logging.getLogger(__name__)

# Legacy well-known default that must NOT be honoured any longer.
_LEGACY_DEFAULT = "ai-mentor-internal-dev-token"


def _resolve_internal_token() -> str:
    token = os.getenv("INTERNAL_API_TOKEN")
    if token and token.strip():
        if token.strip() == _LEGACY_DEFAULT:
            logger.warning(
                "INTERNAL_API_TOKEN is set to the legacy public default value. "
                "This is insecure — set a unique, secret value in production."
            )
        return token.strip()

    # No token configured: mint an ephemeral, unguessable one for this process.
    ephemeral = secrets.token_urlsafe(32)
    logger.warning(
        "INTERNAL_API_TOKEN is not set; generated an ephemeral per-process token. "
        "Internal calls work for a single-process deployment, but you MUST set "
        "INTERNAL_API_TOKEN for multi-worker / multi-host production deployments."
    )
    return ephemeral


# Resolved once at import; shared by sender and receiver within the process.
INTERNAL_API_TOKEN: str = _resolve_internal_token()
