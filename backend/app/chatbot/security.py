"""
Security middleware and guardrails for AI Mentor Chatbot.
Rate limiting, input validation, and request size limits.
"""
import time
import logging
from typing import Callable, Dict, Set
from collections import defaultdict
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)

# Configuration
MAX_REQUEST_SIZE_BYTES = 10 * 1024  # 10 KB
RATE_LIMIT_REQUESTS = 30  # requests per window
RATE_LIMIT_WINDOW_SECONDS = 60  # 1 minute

# Allowed tools (server-side allowlist)
ALLOWED_TOOLS: Set[str] = {
    "search_student",
    "get_student",
    "predict_sgpa",
    "predict_career",
    "predict_9box",
    "predict_subject"
}


class RateLimiter:
    """
    Simple in-memory rate limiter.
    For production, use Redis-based rate limiting.
    """
    
    def __init__(
        self,
        max_requests: int = RATE_LIMIT_REQUESTS,
        window_seconds: int = RATE_LIMIT_WINDOW_SECONDS
    ):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: Dict[str, list] = defaultdict(list)
    
    def is_allowed(self, client_id: str) -> bool:
        """
        Check if client is within rate limit.
        
        Args:
            client_id: Client identifier (IP or session)
        
        Returns:
            True if allowed, False if rate limited
        """
        now = time.time()
        window_start = now - self.window_seconds
        
        # Clean old requests
        self._requests[client_id] = [
            ts for ts in self._requests[client_id]
            if ts > window_start
        ]
        
        # Check limit
        if len(self._requests[client_id]) >= self.max_requests:
            return False
        
        # Record request
        self._requests[client_id].append(now)
        return True
    
    def get_remaining(self, client_id: str) -> int:
        """Get remaining requests for client."""
        now = time.time()
        window_start = now - self.window_seconds
        
        recent = [
            ts for ts in self._requests[client_id]
            if ts > window_start
        ]
        
        return max(0, self.max_requests - len(recent))


# Global rate limiter
_rate_limiter = RateLimiter()


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Security middleware for FastAPI.
    Implements request size limits, rate limiting, and input validation.
    """
    
    async def dispatch(
        self,
        request: Request,
        call_next: Callable
    ) -> Response:
        # Skip for non-chat endpoints
        if "/chat" not in request.url.path:
            return await call_next(request)
        
        # Get client identifier
        client_id = self._get_client_id(request)
        
        # Rate limiting
        if not _rate_limiter.is_allowed(client_id):
            logger.warning(
                "Rate limit exceeded",
                extra={"client_id": client_id}
            )
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Maximum {RATE_LIMIT_REQUESTS} requests per minute",
                    "retry_after_seconds": RATE_LIMIT_WINDOW_SECONDS
                }
            )
        
        # Request size limit
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_REQUEST_SIZE_BYTES:
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={
                    "error": "Request too large",
                    "message": f"Maximum request size is {MAX_REQUEST_SIZE_BYTES} bytes"
                }
            )
        
        # Add security headers to response
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Rate-Limit-Remaining"] = str(
            _rate_limiter.get_remaining(client_id)
        )
        
        return response
    
    def _get_client_id(self, request: Request) -> str:
        """Extract client identifier from request."""
        # Try X-Forwarded-For header first (for proxied requests)
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        # Fall back to client host
        if request.client:
            return request.client.host
        
        return "unknown"


def validate_tool_call(tool_name: str) -> bool:
    """
    Validate that a tool is in the allowlist.
    
    Args:
        tool_name: Name of tool to validate
    
    Returns:
        True if allowed, False otherwise
    """
    if tool_name not in ALLOWED_TOOLS:
        logger.warning(
            "Blocked unauthorized tool call",
            extra={"tool": tool_name, "allowed": list(ALLOWED_TOOLS)}
        )
        return False
    return True


def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent injection attacks.
    
    Args:
        text: Raw user input
    
    Returns:
        Sanitized text
    """
    # Remove null bytes
    text = text.replace("\x00", "")
    
    # Limit length
    text = text[:2000]
    
    # Strip leading/trailing whitespace
    text = text.strip()
    
    return text


def validate_session_id(session_id: str) -> bool:
    """
    Validate session ID format.
    
    Args:
        session_id: Session ID to validate
    
    Returns:
        True if valid UUID format
    """
    import re
    uuid_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    return bool(uuid_pattern.match(str(session_id)))
