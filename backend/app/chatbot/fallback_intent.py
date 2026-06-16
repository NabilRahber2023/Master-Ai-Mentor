"""
Deterministic Fallback Intent Detection for AI Mentor Chatbot.
Rule-based intent detection when LLM is unavailable or times out.
"""
import re
import logging
from enum import Enum
from typing import Optional, Tuple, Dict, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


class FallbackIntent(str, Enum):
    """Supported intent types for fallback detection."""
    GRADE = "grade"
    CAREER = "career"
    NINE_BOX = "9box"
    SUBJECT = "subject"
    SEARCH = "search"
    INFO = "info"
    RESET = "reset"
    UNKNOWN = "unknown"


@dataclass
class IntentMatch:
    """Result of intent matching."""
    intent: FallbackIntent
    confidence: float
    matched_keywords: list
    suggested_tool: Optional[str] = None


# Intent keyword patterns with weights
INTENT_PATTERNS: Dict[FallbackIntent, Dict[str, float]] = {
    FallbackIntent.GRADE: {
        "sgpa": 1.0,
        "gpa": 0.8,
        "grade": 0.9,
        "academic": 0.6,
        "semester": 0.5,
        "next semester": 0.9,
        "predict sgpa": 1.0,
        "predicted gpa": 0.9,
        "cgpa": 0.7,
        "performance": 0.4,
    },
    FallbackIntent.CAREER: {
        "career": 1.0,
        "job": 0.8,
        "profession": 0.9,
        "work": 0.5,
        "employment": 0.8,
        "future career": 1.0,
        "career path": 1.0,
        "what should i become": 0.9,
        "best career": 0.9,
    },
    FallbackIntent.NINE_BOX: {
        "9-box": 1.0,
        "9box": 1.0,
        "nine box": 1.0,
        "talent grid": 0.9,
        "potential": 0.7,
        "performance matrix": 0.9,
        "talent matrix": 0.9,
        "performance potential": 0.8,
        "hr grid": 0.8,
    },
    FallbackIntent.SUBJECT: {
        "subject": 0.9,
        "department": 1.0,
        "major": 0.9,
        "course": 0.6,
        "what to study": 0.9,
        "which department": 1.0,
        "recommend department": 1.0,
        "best department": 0.9,
        "subject choice": 1.0,
    },
    FallbackIntent.SEARCH: {
        "find": 0.8,
        "search": 0.9,
        "look for": 0.8,
        "who is": 0.9,
        "student named": 1.0,
        "find student": 1.0,
        "search student": 1.0,
    },
    FallbackIntent.INFO: {
        "info": 0.7,
        "details": 0.8,
        "about": 0.5,
        "tell me about": 0.8,
        "show": 0.6,
        "get student": 0.9,
        "student details": 0.9,
    },
    FallbackIntent.RESET: {
        "reset": 1.0,
        "clear": 0.8,
        "start over": 0.9,
        "new session": 0.9,
        "forget": 0.7,
    },
}

# Intent to tool mapping
INTENT_TO_TOOL: Dict[FallbackIntent, str] = {
    FallbackIntent.GRADE: "predict_sgpa",
    FallbackIntent.CAREER: "predict_career",
    FallbackIntent.NINE_BOX: "predict_9box",
    FallbackIntent.SUBJECT: "predict_subject",
    FallbackIntent.SEARCH: "search_student",
    FallbackIntent.INFO: "get_student",
}


class FallbackIntentDetector:
    """
    Rule-based intent detector for fallback mode.
    Used when LLM is unavailable or times out.
    """
    
    def __init__(self):
        self._compiled_patterns: Dict[FallbackIntent, list] = {}
        self._compile_patterns()
    
    def _compile_patterns(self):
        """Pre-compile regex patterns for efficiency."""
        for intent, patterns in INTENT_PATTERNS.items():
            compiled = []
            for pattern, weight in patterns.items():
                # Create regex that matches word boundaries
                regex = re.compile(r'\b' + re.escape(pattern) + r'\b', re.IGNORECASE)
                compiled.append((regex, pattern, weight))
            self._compiled_patterns[intent] = compiled
    
    def detect(self, message: str) -> IntentMatch:
        """
        Detect intent from message using keyword matching.
        
        Args:
            message: User message to analyze
        
        Returns:
            IntentMatch with detected intent and confidence
        """
        if not message or not message.strip():
            return IntentMatch(
                intent=FallbackIntent.UNKNOWN,
                confidence=0.0,
                matched_keywords=[]
            )
        
        message_lower = message.lower().strip()
        
        # Score each intent
        intent_scores: Dict[FallbackIntent, Tuple[float, list]] = {}
        
        for intent, patterns in self._compiled_patterns.items():
            total_score = 0.0
            matched = []
            
            for regex, pattern, weight in patterns:
                if regex.search(message_lower):
                    total_score += weight
                    matched.append(pattern)
            
            if total_score > 0:
                intent_scores[intent] = (total_score, matched)
        
        # Find best match
        if not intent_scores:
            return IntentMatch(
                intent=FallbackIntent.UNKNOWN,
                confidence=0.0,
                matched_keywords=[]
            )
        
        best_intent = max(intent_scores.keys(), key=lambda i: intent_scores[i][0])
        score, matched = intent_scores[best_intent]
        
        # Normalize confidence (0-1 scale)
        confidence = min(score / 3.0, 1.0)
        
        # Get suggested tool
        suggested_tool = INTENT_TO_TOOL.get(best_intent)
        
        return IntentMatch(
            intent=best_intent,
            confidence=confidence,
            matched_keywords=matched,
            suggested_tool=suggested_tool
        )
    
    def extract_student_query(self, message: str) -> Optional[str]:
        """
        Extract potential student name or ID from message.
        
        Args:
            message: User message
        
        Returns:
            Extracted query or None
        """
        # Remove common words
        stop_words = {
            "find", "search", "look", "for", "student", "named", "called",
            "who", "is", "the", "a", "an", "about", "info", "details",
            "what", "predict", "sgpa", "gpa", "career", "grade", "show",
            "tell", "me", "get", "of", "please", "can", "you", "i", "want"
        }
        
        words = message.split()
        filtered = [w for w in words if w.lower() not in stop_words and len(w) > 1]
        
        # Check for student ID pattern (e.g., STU001, S-1234)
        for word in words:
            if re.match(r'^[A-Z]{2,4}[-_]?\d{3,6}$', word.upper()):
                return word.upper()
        
        return " ".join(filtered).strip() if filtered else None


# Global instance
_detector: Optional[FallbackIntentDetector] = None


def get_fallback_detector() -> FallbackIntentDetector:
    """Get the global fallback intent detector."""
    global _detector
    if _detector is None:
        _detector = FallbackIntentDetector()
    return _detector


def detect_intent_fallback(message: str) -> IntentMatch:
    """
    Convenience function for fallback intent detection.
    
    Args:
        message: User message
    
    Returns:
        IntentMatch result
    """
    detector = get_fallback_detector()
    result = detector.detect(message)
    
    # Log fallback usage
    logger.info(
        "Fallback intent detection",
        extra={
            "intent": result.intent.value,
            "confidence": result.confidence,
            "matched_keywords": result.matched_keywords,
            "fallback_used": True
        }
    )
    
    return result
