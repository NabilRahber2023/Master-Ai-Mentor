"""
FastAPI Router for AI Mentor Chatbot.
Defines /chat and /chat/reset endpoints.
"""
from fastapi import APIRouter, HTTPException, status
from app.chatbot.schemas import (
    ChatRequest, ChatResponse,
    ResetRequest, ResetResponse
)
from app.chatbot.service import get_chatbot_service


router = APIRouter(
    prefix="/chat",
    tags=["Chatbot"]
)


@router.post(
    "/",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Send a chat message",
    description="Process a user message and return AI response with tool results"
)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Process a chat message.
    
    - **session_id**: Optional existing session ID for conversation continuity
    - **message**: User's message (1-2000 characters)
    
    Returns structured JSON response with:
    - session_id for continuation
    - message response
    - tool results if applicable
    - prompts for selection or missing data
    """
    try:
        service = get_chatbot_service()
        response = await service.chat(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat processing error: {str(e)}"
        )


@router.post(
    "/reset",
    response_model=ResetResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset a chat session",
    description="Clear session state including selected student and pending fields"
)
async def reset_session(request: ResetRequest) -> ResetResponse:
    """
    Reset a chat session.
    
    - **session_id**: Session ID to reset
    
    Clears:
    - Selected student
    - Pending fields
    - Last intent
    - Context data
    """
    try:
        service = get_chatbot_service()
        response = await service.reset_session(request.session_id)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Session reset error: {str(e)}"
        )


@router.get(
    "/health",
    summary="Chatbot health check",
    description="Check health of chatbot components (LLM, dispatcher)"
)
async def health_check():
    """
    Check chatbot component health.
    
    Returns status of:
    - LLM (Ollama connection)
    - Dispatcher
    """
    try:
        service = get_chatbot_service()
        return await service.health_check()
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
