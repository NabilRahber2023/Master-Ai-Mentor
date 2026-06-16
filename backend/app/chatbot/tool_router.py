"""
Tool Router for AI Mentor Chatbot.
Handles tool execution coordination and result formatting.
Extracted from mcp_dispatcher.py for better separation of concerns.
"""
import logging
import uuid
from typing import Dict, Any, Optional, Tuple
from app.chatbot.tools import get_tool_executor

logger = logging.getLogger(__name__)


class ToolRouter:
    """
    Coordinates tool execution and formats results.
    Provides structured error handling and correlation logging.
    """
    
    async def execute_tool(
        self,
        tool_name: str,
        args: Dict[str, Any],
        correlation_id: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Execute a tool with structured error handling.
        
        Args:
            tool_name: Name of the tool to execute
            args: Tool arguments
            correlation_id: Optional correlation ID for logging
            
        Returns:
            Tuple of (success, result_dict)
        """
        cid = correlation_id or str(uuid.uuid4())[:8]
        
        logger.info(f"[{cid}] Executing tool: {tool_name}", extra={
            "correlation_id": cid,
            "tool_name": tool_name,
            "args": args
        })
        
        try:
            executor = get_tool_executor()
            success, result = await executor.execute(tool_name, args)
            
            logger.info(f"[{cid}] Tool {tool_name} completed", extra={
                "correlation_id": cid,
                "success": success
            })
            
            return success, result
            
        except Exception as e:
            logger.error(f"[{cid}] Tool {tool_name} failed: {e}", extra={
                "correlation_id": cid,
                "error": str(e)
            })
            return False, {"error": str(e), "tool_name": tool_name}
    
    def format_prediction_message(
        self,
        pred_type: str,
        pred_result: Dict[str, Any],
        student_name: str
    ) -> str:
        """
        Format prediction result as human-readable message.
        
        Args:
            pred_type: Type of prediction (sgpa, career, 9box, subject)
            pred_result: Prediction result dictionary
            student_name: Student's name
            
        Returns:
            Formatted message string
        """
        if pred_type == "sgpa":
            sgpa = pred_result.get("predicted_sgpa", "N/A")
            risk = pred_result.get("risk_level", "N/A")
            factors = pred_result.get("contributing_factors", [])
            
            msg = f"Predicted SGPA for {student_name}: {sgpa} ({risk})"
            if factors:
                top_factor = factors[0]
                msg += f"\nTop factor: {top_factor.get('feature', '')} (impact: {top_factor.get('impact_score', 0):.2f})"
            return msg
        
        elif pred_type == "career":
            career = pred_result.get("predicted_career", "N/A")
            confidence = pred_result.get("confidence", 0)
            alternatives = pred_result.get("alternative_careers", [])
            
            msg = f"Recommended career for {student_name}: {career} (confidence: {confidence:.2%})"
            if alternatives:
                msg += f"\nAlternatives: {', '.join(alternatives[:3])}"
            return msg
        
        elif pred_type == "9box":
            position = pred_result.get("nine_box_position_label", "N/A")
            perf = pred_result.get("performance_level", "N/A")
            potential = pred_result.get("potential_level", "N/A")
            rec = pred_result.get("descriptive_recommendation", "")
            
            msg = f"9-Box position for {student_name}: {position}"
            msg += f"\nPerformance: {perf}, Potential: {potential}"
            if rec:
                msg += f"\nRecommendation: {rec}"
            return msg
        
        elif pred_type == "subject":
            dept = pred_result.get("recommended_department", "N/A")
            confidence = pred_result.get("confidence_score", 0)
            alternatives = pred_result.get("alternative_departments", [])
            
            msg = f"Recommended department for {student_name}: {dept} (confidence: {confidence:.2%})"
            if alternatives:
                msg += f"\nAlternatives: {', '.join(alternatives[:3])}"
            return msg
        
        return f"Prediction complete for {student_name}"
    
    def format_error_for_llm(self, error: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format error result as structured response for LLM.
        
        Args:
            error: Error dictionary
            
        Returns:
            Structured error for LLM consumption
        """
        return {
            "status": "error",
            "error_type": error.get("error_type", "unknown"),
            "message": error.get("error", "An error occurred"),
            "tool_name": error.get("tool_name", "unknown"),
            "recoverable": error.get("recoverable", True)
        }


# Global instance
_tool_router: Optional[ToolRouter] = None


def get_tool_router() -> ToolRouter:
    """Get the global ToolRouter instance."""
    global _tool_router
    if _tool_router is None:
        _tool_router = ToolRouter()
    return _tool_router
