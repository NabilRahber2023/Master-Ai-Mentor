"""
LangChain Orchestrator for AI Mentor Chatbot.
Uses LangChain ONLY for LLM orchestration and conversation memory.
All tool execution goes through existing MCP ToolExecutor.

CRITICAL: This is ADDITIVE. It does NOT replace MCP architecture.
"""
import os
import logging
from typing import Optional, Dict, Any, List

# Handle LangChain import compatibility
try:
    from langchain_community.chat_models import ChatOllama
except ImportError:
    ChatOllama = None

try:
    from langchain.memory import ConversationBufferWindowMemory
except ImportError:
    try:
        from langchain_community.memory import ConversationBufferWindowMemory
    except ImportError:
        ConversationBufferWindowMemory = None

try:
    from langchain.schema import HumanMessage, AIMessage, SystemMessage
except ImportError:
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

logger = logging.getLogger(__name__)

# Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi3:mini")


class LangChainOrchestrator:
    """
    LangChain-based orchestrator with conversation memory.
    Delegates ALL tool execution to existing MCP ToolExecutor.
    
    Usage:
        orchestrator = get_langchain_orchestrator()
        response = await orchestrator.process(message, context)
    """
    
    def __init__(self):
        self._llm: Optional[ChatOllama] = None
        self._memory: Optional[ConversationBufferWindowMemory] = None
        self._initialized = False
    
    def _ensure_initialized(self):
        """Lazy initialization of LangChain components."""
        if self._initialized:
            return
        
        try:
            self._llm = ChatOllama(
                model=OLLAMA_MODEL,
                base_url=OLLAMA_BASE_URL,
                temperature=0.0,
                num_ctx=4096,
            )
            
            # Keep last 10 exchanges for context
            self._memory = ConversationBufferWindowMemory(
                k=10,
                memory_key="chat_history",
                return_messages=True
            )
            
            self._initialized = True
            logger.info(f"LangChain orchestrator initialized with {OLLAMA_MODEL}")
        except Exception as e:
            logger.error(f"Failed to initialize LangChain: {e}")
            raise
    
    def is_available(self) -> bool:
        """Check if LangChain orchestrator is available."""
        try:
            self._ensure_initialized()
            return self._llm is not None
        except Exception:
            return False
    
    def add_to_memory(self, human_msg: str, ai_msg: str):
        """Add exchange to conversation memory."""
        if self._memory:
            self._memory.chat_memory.add_user_message(human_msg)
            self._memory.chat_memory.add_ai_message(ai_msg)
    
    def get_memory_context(self) -> str:
        """Get conversation history as context string."""
        if not self._memory:
            return ""
        
        try:
            messages = self._memory.chat_memory.messages
            history = []
            for msg in messages[-10:]:  # Last 10 messages
                if isinstance(msg, HumanMessage):
                    history.append(f"User: {msg.content}")
                elif isinstance(msg, AIMessage):
                    history.append(f"Assistant: {msg.content}")
            return "\n".join(history)
        except Exception:
            return ""
    
    def clear_memory(self):
        """Clear conversation memory (for session reset)."""
        if self._memory:
            self._memory.clear()
    
    async def generate_with_context(
        self,
        system_prompt: str,
        user_message: str,
        context: Dict[str, Any]
    ) -> str:
        """
        Generate LLM response with conversation context.
        
        Args:
            system_prompt: System instructions
            user_message: Current user message
            context: Session context with resolved entity
            
        Returns:
            LLM response string
        """
        self._ensure_initialized()
        
        if not self._llm:
            raise RuntimeError("LangChain LLM not initialized")
        
        # Build message with memory context
        memory_context = self.get_memory_context()
        
        full_prompt = f"""{system_prompt}

CONVERSATION HISTORY:
{memory_context}

CURRENT CONTEXT:
{self._format_context(context)}

USER: {user_message}
ASSISTANT (JSON only):"""
        
        try:
            messages = [HumanMessage(content=full_prompt)]
            response = await self._llm.ainvoke(messages)
            
            # Store in memory
            self.add_to_memory(user_message, response.content)
            
            return response.content
        except Exception as e:
            logger.error(f"LangChain generation failed: {e}")
            raise
    
    def _format_context(self, context: Dict[str, Any]) -> str:
        """Format context dict for prompt."""
        parts = []
        if context.get("selected_student_id"):
            parts.append(f"Selected student: {context['selected_student_id']}")
        if context.get("resolved_entity"):
            entity = context["resolved_entity"]
            parts.append(f"Resolved: {entity.get('student_name')} ({entity.get('student_id')})")
        if context.get("last_intent"):
            parts.append(f"Last intent: {context['last_intent']}")
        if context.get("last_tool_summary"):
            parts.append(f"Last result: {context['last_tool_summary']}")
        return "\n".join(parts) if parts else "No context"


# Global instance
_langchain_orchestrator: Optional[LangChainOrchestrator] = None


def get_langchain_orchestrator() -> LangChainOrchestrator:
    """Get the global LangChain orchestrator instance."""
    global _langchain_orchestrator
    if _langchain_orchestrator is None:
        _langchain_orchestrator = LangChainOrchestrator()
    return _langchain_orchestrator


def is_langchain_available() -> bool:
    """Check if LangChain is available without initializing."""
    try:
        orchestrator = get_langchain_orchestrator()
        return orchestrator.is_available()
    except Exception:
        return False
