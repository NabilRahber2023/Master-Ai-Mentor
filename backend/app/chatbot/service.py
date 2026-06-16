"""
Chatbot Service for AI Mentor.
High-level service layer for chat operations.
"""
import uuid
from typing import Optional
from app.chatbot.mcp_dispatcher import get_dispatcher
from app.chatbot.schemas import ChatRequest, ChatResponse, ResetResponse
from app.chatbot.llm_client import get_llm_client


class ChatbotService:
    """
    Service layer for chatbot operations.
    Provides clean interface for router layer.
    """
    
    async def chat(self, request: ChatRequest) -> ChatResponse:
        """
        Process a chat message and return response.
        
        Args:
            request: ChatRequest with message and optional session_id
        
        Returns:
            ChatResponse with result or prompts
        """
        dispatcher = get_dispatcher()
        
        return await dispatcher.process_message(
            message=request.message,
            session_id=request.session_id
        )
    
    async def reset_session(self, session_id: uuid.UUID) -> ResetResponse:
        """
        Reset a chat session to initial state.
        
        Args:
            session_id: Session ID to reset
        
        Returns:
            ResetResponse indicating success/failure
        """
        dispatcher = get_dispatcher()
        success = await dispatcher.reset_session(session_id)
        
        if success:
            return ResetResponse(
                success=True,
                message="Session reset successfully"
            )
        else:
            return ResetResponse(
                success=False,
                message="Session not found"
            )
    
    async def health_check(self) -> dict:
        """
        Check health of chatbot components.
        
        Returns:
            Dict with component status
        """
        llm_client = get_llm_client()
        llm_healthy = await llm_client.health_check()
        
        return {
            "llm": {
                "status": "healthy" if llm_healthy else "unavailable",
                "model": llm_client.model
            },
            "dispatcher": {
                "status": "healthy"
            }
        }


# Global service instance
_chatbot_service: Optional[ChatbotService] = None


def get_chatbot_service() -> ChatbotService:
    """Get the global chatbot service instance."""
    global _chatbot_service
    if _chatbot_service is None:
        _chatbot_service = ChatbotService()
    return _chatbot_service
