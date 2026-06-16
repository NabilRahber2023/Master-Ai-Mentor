"""
LangChain Tool Wrappers for AI Mentor Chatbot.
Wraps existing MCP tools as LangChain Tool objects.
All execution goes through existing ToolExecutor.
"""
import asyncio
import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

# Handle LangChain import compatibility
try:
    from langchain.tools import Tool, StructuredTool
except ImportError:
    try:
        from langchain_core.tools import Tool, StructuredTool
    except ImportError:
        Tool = None
        StructuredTool = None

logger = logging.getLogger(__name__)


class SearchStudentInput(BaseModel):
    """Input schema for search_student tool."""
    query: str = Field(description="Student name or search query")


class GetStudentInput(BaseModel):
    """Input schema for get_student tool."""
    student_id: str = Field(description="Student ID (e.g., STU001)")


class PredictSGPAInput(BaseModel):
    """Input schema for predict_sgpa tool."""
    student_id: str = Field(description="Student ID for SGPA prediction")


class PredictCareerInput(BaseModel):
    """Input schema for predict_career tool."""
    student_id: str = Field(description="Student ID for career prediction")


class Predict9BoxInput(BaseModel):
    """Input schema for predict_9box tool."""
    student_id: str = Field(description="Student ID for 9-box prediction")


class PredictSubjectInput(BaseModel):
    """Input schema for predict_subject tool."""
    student_id: str = Field(description="Student ID for subject prediction")


class LangChainToolWrapper:
    """
    Wraps existing MCP tools as LangChain Tool objects.
    All tool calls are delegated to the existing ToolExecutor.
    """
    
    def __init__(self):
        self._tool_executor = None
        self._tools = None
    
    def _get_tool_executor(self):
        """Lazy load tool executor to avoid circular imports."""
        if self._tool_executor is None:
            from app.chatbot.tools import get_tool_executor
            self._tool_executor = get_tool_executor()
        return self._tool_executor
    
    def _run_async(self, coro):
        """Run async function in sync context."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    future = pool.submit(asyncio.run, coro)
                    return future.result()
            else:
                return loop.run_until_complete(coro)
        except Exception as e:
            logger.error(f"Async execution failed: {e}")
            return {"error": str(e)}
    
    async def _execute_tool(self, tool_name: str, args: Dict[str, Any]) -> str:
        """Execute a tool and return result as string."""
        executor = self._get_tool_executor()
        success, result = await executor.execute(tool_name, args)
        
        if success:
            return str(result)
        else:
            return f"Error: {result.get('error', 'Unknown error')}"
    
    def search_student(self, query: str) -> str:
        """Search for students by name or query."""
        return self._run_async(self._execute_tool("search_student", {"query": query}))
    
    def get_student(self, student_id: str) -> str:
        """Get student details by ID."""
        return self._run_async(self._execute_tool("get_student", {"student_id": student_id}))
    
    def predict_sgpa(self, student_id: str) -> str:
        """Predict SGPA for a student."""
        return self._run_async(self._execute_tool("predict_sgpa", {"student_id": student_id}))
    
    def predict_career(self, student_id: str) -> str:
        """Predict career path for a student."""
        return self._run_async(self._execute_tool("predict_career", {"student_id": student_id}))
    
    def predict_9box(self, student_id: str) -> str:
        """Predict 9-box position for a student."""
        return self._run_async(self._execute_tool("predict_9box", {"student_id": student_id}))
    
    def predict_subject(self, student_id: str) -> str:
        """Predict best subject/department for a student."""
        return self._run_async(self._execute_tool("predict_subject", {"student_id": student_id}))
    
    def get_tools(self) -> list:
        """Get list of LangChain Tool objects."""
        if self._tools is not None:
            return self._tools
        
        self._tools = [
            StructuredTool.from_function(
                func=self.search_student,
                name="search_student",
                description="Search for students by name or text query",
                args_schema=SearchStudentInput
            ),
            StructuredTool.from_function(
                func=self.get_student,
                name="get_student",
                description="Get full details for a student by their ID",
                args_schema=GetStudentInput
            ),
            StructuredTool.from_function(
                func=self.predict_sgpa,
                name="predict_sgpa",
                description="Predict the next semester SGPA for a student",
                args_schema=PredictSGPAInput
            ),
            StructuredTool.from_function(
                func=self.predict_career,
                name="predict_career",
                description="Predict the best career path for a student",
                args_schema=PredictCareerInput
            ),
            StructuredTool.from_function(
                func=self.predict_9box,
                name="predict_9box",
                description="Predict the 9-box talent grid position for a student",
                args_schema=Predict9BoxInput
            ),
            StructuredTool.from_function(
                func=self.predict_subject,
                name="predict_subject",
                description="Predict the best department/subject for a student",
                args_schema=PredictSubjectInput
            ),
        ]
        
        return self._tools


# Global instance
_tool_wrapper: Optional[LangChainToolWrapper] = None


def get_langchain_tools() -> list:
    """Get LangChain Tool objects for all MCP tools."""
    global _tool_wrapper
    if _tool_wrapper is None:
        _tool_wrapper = LangChainToolWrapper()
    return _tool_wrapper.get_tools()
