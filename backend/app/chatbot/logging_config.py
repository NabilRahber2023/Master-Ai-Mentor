"""
Structured JSON Logging for AI Mentor Chatbot.
Provides consistent, parseable log output for observability.
"""
import json
import logging
import sys
import time
from datetime import datetime
from typing import Any, Dict, Optional
from functools import wraps
from contextvars import ContextVar

# Context variables for request-scoped data
request_context: ContextVar[Dict[str, Any]] = ContextVar('request_context', default={})


class JSONFormatter(logging.Formatter):
    """JSON log formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add context from ContextVar
        ctx = request_context.get()
        if ctx:
            log_data.update(ctx)
        
        # Add extra fields from record
        if hasattr(record, '__dict__'):
            for key, value in record.__dict__.items():
                if key not in (
                    'name', 'msg', 'args', 'created', 'filename', 'funcName',
                    'levelname', 'levelno', 'lineno', 'module', 'msecs',
                    'pathname', 'process', 'processName', 'relativeCreated',
                    'stack_info', 'exc_info', 'exc_text', 'thread', 'threadName',
                    'message', 'taskName'
                ):
                    log_data[key] = value
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data, default=str)


def setup_logging(level: str = "INFO") -> None:
    """
    Configure structured JSON logging for the application.
    
    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR)
    """
    # Remove existing handlers
    root = logging.getLogger()
    for handler in root.handlers[:]:
        root.removeHandler(handler)
    
    # Create JSON handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    
    # Configure root logger
    root.setLevel(getattr(logging, level.upper()))
    root.addHandler(handler)
    
    # Set levels for noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)


class RequestLogger:
    """Context manager for request logging with timing."""
    
    def __init__(
        self,
        session_id: Optional[str] = None,
        intent: Optional[str] = None,
        **extra
    ):
        self.session_id = session_id
        self.intent = intent
        self.extra = extra
        self.start_time: float = 0
        self.logger = logging.getLogger("ai_mentor.request")
    
    def __enter__(self):
        self.start_time = time.perf_counter()
        
        # Set context for this request
        ctx = {
            "session_id": self.session_id,
            "intent": self.intent,
            **self.extra
        }
        request_context.set(ctx)
        
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        latency_ms = (time.perf_counter() - self.start_time) * 1000
        
        ctx = request_context.get()
        ctx["latency_ms"] = round(latency_ms, 2)
        
        if exc_type:
            ctx["error"] = str(exc_val)
            ctx["error_type"] = exc_type.__name__
            self.logger.error("Request failed", extra=ctx)
        else:
            self.logger.info("Request completed", extra=ctx)
        
        # Clear context
        request_context.set({})
        
        return False
    
    def set_tool(self, tool_name: str):
        """Set the tool that was called."""
        ctx = request_context.get()
        ctx["tool_called"] = tool_name
        request_context.set(ctx)
    
    def set_fallback(self, used: bool):
        """Mark if fallback mode was used."""
        ctx = request_context.get()
        ctx["fallback_used"] = used
        request_context.set(ctx)
    
    def set_intent(self, intent: str):
        """Update detected intent."""
        ctx = request_context.get()
        ctx["intent"] = intent
        request_context.set(ctx)


def log_tool_call(func):
    """Decorator to log tool execution."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        logger = logging.getLogger("ai_mentor.tools")
        tool_name = func.__name__
        
        start = time.perf_counter()
        try:
            result = await func(*args, **kwargs)
            latency = (time.perf_counter() - start) * 1000
            
            logger.info(
                f"Tool executed: {tool_name}",
                extra={
                    "tool": tool_name,
                    "latency_ms": round(latency, 2),
                    "success": True
                }
            )
            return result
        except Exception as e:
            latency = (time.perf_counter() - start) * 1000
            logger.error(
                f"Tool failed: {tool_name}",
                extra={
                    "tool": tool_name,
                    "latency_ms": round(latency, 2),
                    "success": False,
                    "error": str(e)
                }
            )
            raise
    
    return wrapper


def strip_pii(data: Dict[str, Any], pii_fields: set = None) -> Dict[str, Any]:
    """
    Strip PII from log data.
    
    Args:
        data: Dictionary to sanitize
        pii_fields: Field names to redact
    
    Returns:
        Sanitized dictionary
    """
    if pii_fields is None:
        pii_fields = {
            "name", "email", "phone", "address", "district",
            "family_income", "password", "token", "api_key"
        }
    
    sanitized = {}
    for key, value in data.items():
        if key.lower() in pii_fields:
            sanitized[key] = "[REDACTED]"
        elif isinstance(value, dict):
            sanitized[key] = strip_pii(value, pii_fields)
        elif isinstance(value, list):
            sanitized[key] = [
                strip_pii(v, pii_fields) if isinstance(v, dict) else v
                for v in value
            ]
        else:
            sanitized[key] = value
    
    return sanitized


# Initialize logging on import
setup_logging()
