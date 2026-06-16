"""
AI Mentor Chatbot Module.
Provides AI-powered chat interface with MCP tool orchestration.
"""
from app.chatbot.router import router as chatbot_router
from app.chatbot.database import init_db, close_db
from app.chatbot.llm_client import close_llm_client
from app.chatbot.tools import close_tool_executor
from app.chatbot.fallback_intent import (
    detect_intent_fallback,
    FallbackIntent,
    FallbackIntentDetector
)
from app.chatbot.security import SecurityMiddleware, validate_tool_call
from app.chatbot.logging_config import setup_logging, RequestLogger
from app.chatbot.performance import get_cache_stats, AsyncTTLCache
from app.chatbot.prompts import get_system_prompt, get_prompt_version
from app.chatbot.startup import run_startup_checks
from app.chatbot.entity_resolver import get_student_resolver, StudentResolver
from app.chatbot.langchain_orchestrator import (
    get_langchain_orchestrator,
    is_langchain_available
)
from app.chatbot.langchain_tools import get_langchain_tools
from app.chatbot.intent_router import get_intent_router, IntentRouter
from app.chatbot.tool_router import get_tool_router, ToolRouter
from app.chatbot.conversation_state import get_conversation_state, ConversationState

__all__ = [
    "chatbot_router",
    "init_db",
    "close_db",
    "close_llm_client",
    "close_tool_executor",
    "detect_intent_fallback",
    "FallbackIntent",
    "FallbackIntentDetector",
    "SecurityMiddleware",
    "validate_tool_call",
    "setup_logging",
    "RequestLogger",
    "get_cache_stats",
    "AsyncTTLCache",
    "get_system_prompt",
    "get_prompt_version",
    "run_startup_checks",
    "get_student_resolver",
    "StudentResolver",
    "get_langchain_orchestrator",
    "is_langchain_available",
    "get_langchain_tools",
    "get_intent_router",
    "IntentRouter",
    "get_tool_router",
    "ToolRouter",
    "get_conversation_state",
    "ConversationState",
]
