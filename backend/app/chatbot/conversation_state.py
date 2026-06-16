"""
Conversation State Manager for AI Mentor Chatbot.
Handles session state persistence and updates.
Extracted from mcp_dispatcher.py for better separation of concerns.
"""
import uuid
import logging
from typing import Dict, Any, Optional
from sqlalchemy import select, update
from app.chatbot.database import async_session_maker
from app.chatbot.models import ChatSession

logger = logging.getLogger(__name__)


class ConversationState:
    """
    Manages chat session state in PostgreSQL.
    Handles creation, updates, and resets.
    """
    
    async def get_or_create(
        self,
        session_id: Optional[uuid.UUID]
    ) -> ChatSession:
        """
        Get existing session or create new one.
        
        Args:
            session_id: Existing session ID or None
            
        Returns:
            ChatSession object
        """
        async with async_session_maker() as db_session:
            if session_id:
                result = await db_session.execute(
                    select(ChatSession).where(ChatSession.session_id == session_id)
                )
                session = result.scalar_one_or_none()
                if session:
                    return session
            
            # Create new session
            new_session = ChatSession(
                session_id=uuid.uuid4(),
                pending_fields={},
                context={}
            )
            db_session.add(new_session)
            await db_session.commit()
            await db_session.refresh(new_session)
            
            logger.info(f"Created new session: {new_session.session_id}")
            return new_session
    
    async def update(
        self,
        session_id: uuid.UUID,
        **fields
    ) -> None:
        """
        Update session fields in database.
        
        Args:
            session_id: Session to update
            **fields: Fields to update
        """
        async with async_session_maker() as db_session:
            await db_session.execute(
                update(ChatSession)
                .where(ChatSession.session_id == session_id)
                .values(**fields)
            )
            await db_session.commit()
            
            logger.debug(f"Updated session {session_id}: {list(fields.keys())}")
    
    async def reset(self, session_id: uuid.UUID) -> bool:
        """
        Reset session to initial state.
        
        Args:
            session_id: Session to reset
            
        Returns:
            True if reset successful, False if session not found
        """
        async with async_session_maker() as db_session:
            result = await db_session.execute(
                select(ChatSession).where(ChatSession.session_id == session_id)
            )
            session = result.scalar_one_or_none()
            
            if not session:
                return False
            
            # Clear all state
            session.selected_student_id = None
            session.last_resolved_student_id = None
            session.pending_fields = {}
            session.last_intent = None
            session.last_tool_called = None
            session.last_tool_summary = None
            session.context = {}
            
            await db_session.commit()
            
            logger.info(f"Reset session: {session_id}")
            return True
    
    async def set_selected_student(
        self,
        session_id: uuid.UUID,
        student_id: str
    ) -> None:
        """
        Set the selected student for a session.
        
        Args:
            session_id: Session to update
            student_id: Student ID to select
        """
        await self.update(
            session_id,
            selected_student_id=student_id,
            last_resolved_student_id=student_id
        )
    
    async def set_pending_fields(
        self,
        session_id: uuid.UUID,
        fields: Dict[str, Any]
    ) -> None:
        """
        Set pending fields for a session.
        
        Args:
            session_id: Session to update
            fields: Pending fields dictionary
        """
        await self.update(session_id, pending_fields=fields)
    
    async def clear_pending_fields(self, session_id: uuid.UUID) -> None:
        """Clear pending fields for a session."""
        await self.update(session_id, pending_fields={})
    
    async def record_tool_call(
        self,
        session_id: uuid.UUID,
        tool_name: str,
        summary: str,
        intent: Optional[str] = None
    ) -> None:
        """
        Record a tool call in session history.
        
        Args:
            session_id: Session to update
            tool_name: Name of tool called
            summary: Summary of tool result
            intent: Optional intent type
        """
        updates = {
            "last_tool_called": tool_name,
            "last_tool_summary": summary
        }
        if intent:
            updates["last_intent"] = intent
        
        await self.update(session_id, **updates)


# Global instance
_conversation_state: Optional[ConversationState] = None


def get_conversation_state() -> ConversationState:
    """Get the global ConversationState instance."""
    global _conversation_state
    if _conversation_state is None:
        _conversation_state = ConversationState()
    return _conversation_state
