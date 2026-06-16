"""
Intent Router for AI Mentor Chatbot.
Handles intent detection and routing to appropriate tools.
Extracted from mcp_dispatcher.py for better separation of concerns.
"""
import logging
from typing import Dict, List, Optional
from app.chatbot.schemas import IntentType

logger = logging.getLogger(__name__)


# Intent keywords for fallback detection
INTENT_KEYWORDS: Dict[IntentType, List[str]] = {
    IntentType.GRADE: ["sgpa", "grade", "gpa", "academic", "semester", "performance", "cgpa"],
    IntentType.CAREER: ["career", "job", "profession", "work", "employment", "future", "occupation"],
    IntentType.NINE_BOX: ["9-box", "9box", "talent", "grid", "potential", "performance matrix", "nine box"],
    IntentType.SUBJECT: ["subject", "department", "major", "course", "study what", "which department"],
    IntentType.SEARCH: ["find", "search", "look for", "who is", "student named", "locate"],
    IntentType.INFO: ["info", "details", "about", "tell me about", "show", "get student"]
}


# Map intents to tool names
INTENT_TO_TOOL: Dict[IntentType, str] = {
    IntentType.GRADE: "predict_sgpa",
    IntentType.CAREER: "predict_career",
    IntentType.NINE_BOX: "predict_9box",
    IntentType.SUBJECT: "predict_subject",
    IntentType.SEARCH: "search_student",
    IntentType.INFO: "get_student"
}


class IntentRouter:
    """
    Routes user intents to appropriate tools.
    Provides fallback keyword-based detection when LLM is unavailable.
    """
    
    def detect_intent_fallback(self, message: str) -> IntentType:
        """
        Fallback intent detection using keyword matching.
        Used when LLM is unavailable or fails.
        
        Args:
            message: User message
            
        Returns:
            Detected IntentType
        """
        message_lower = message.lower()
        
        # Score each intent based on keyword matches
        scores: Dict[IntentType, int] = {}
        
        for intent, keywords in INTENT_KEYWORDS.items():
            score = 0
            for keyword in keywords:
                if keyword in message_lower:
                    score += 1
            if score > 0:
                scores[intent] = score
        
        # Return intent with highest score
        if scores:
            return max(scores.keys(), key=lambda i: scores[i])
        
        return IntentType.UNKNOWN
    
    def get_tool_for_intent(self, intent: IntentType) -> Optional[str]:
        """
        Get the tool name for a given intent.
        
        Args:
            intent: IntentType to map
            
        Returns:
            Tool name or None if unknown intent
        """
        return INTENT_TO_TOOL.get(intent)
    
    def requires_student(self, intent: IntentType) -> bool:
        """
        Check if the intent requires a selected student.
        
        Args:
            intent: IntentType to check
            
        Returns:
            True if student is required
        """
        return intent in {
            IntentType.GRADE,
            IntentType.CAREER,
            IntentType.NINE_BOX,
            IntentType.SUBJECT,
            IntentType.INFO
        }


# Global instance
_intent_router: Optional[IntentRouter] = None


def get_intent_router() -> IntentRouter:
    """Get the global IntentRouter instance."""
    global _intent_router
    if _intent_router is None:
        _intent_router = IntentRouter()
    return _intent_router
