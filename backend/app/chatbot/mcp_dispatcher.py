"""
MCP Dispatcher for AI Mentor Chatbot.
Coordinates between LLM, tools, and session management.
ARCHITECTURE: Entity Resolution runs BEFORE Intent Detection.
"""
import uuid
import logging
from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.chatbot.database import async_session_maker
from app.chatbot.models import ChatSession
from app.chatbot.llm_client import get_llm_client, LLMResponse
from app.chatbot.tools import get_tool_executor, TOOL_DEFINITIONS
from app.chatbot.schemas import (
    IntentType, ChatResponse, StudentSummary
)
from app.chatbot.entity_resolver import get_student_resolver, ResolvedEntity

logger = logging.getLogger(__name__)


# Intent keywords for fallback detection
INTENT_KEYWORDS = {
    IntentType.GRADE: ["sgpa", "grade", "gpa", "academic", "semester", "performance"],
    IntentType.CAREER: ["career", "job", "profession", "work", "employment", "future"],
    IntentType.NINE_BOX: ["9-box", "9box", "talent", "grid", "potential", "performance matrix"],
    IntentType.SUBJECT: ["subject", "department", "major", "course", "study what"],
    IntentType.SEARCH: ["find", "search", "look for", "who is", "student named"],
    IntentType.INFO: ["info", "details", "about", "tell me about", "show"]
}

# Greeting words that should not trigger search
GREETING_WORDS = {
    "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
    "greetings", "howdy", "yo", "sup", "what's up", "whats up", "hola",
    "thanks", "thank you", "ok", "okay", "sure", "yes", "no", "bye", "goodbye"
}

# Module @ mentions for direct tool calls
MODULE_MENTIONS = {
    "@sgpa": "predict_sgpa",
    "@grade": "predict_sgpa",
    "@career": "predict_career",
    "@job": "predict_career",
    "@9box": "predict_9box",
    "@ninebox": "predict_9box",
    "@talent": "predict_9box",
    "@subject": "predict_subject",
    "@department": "predict_subject",
    "@major": "predict_subject",
    "@all": "all_predictions"
}


class MCPDispatcher:
    """
    Orchestrates the conversation flow between user, LLM, and tools.
    Manages session state and enforces MCP rules.
    CRITICAL: Entity resolution runs BEFORE intent detection.
    """
    
    async def process_message(
        self,
        message: str,
        session_id: Optional[uuid.UUID] = None
    ) -> ChatResponse:
        """
        Process a user message and return a response.
        
        Architecture: Greeting Check → @ Mention Check → Entity Resolution → LLM
        
        Args:
            message: User's message
            session_id: Existing session ID or None for new session
        
        Returns:
            ChatResponse with results or prompts for more info
        """
        # Get or create session
        session = await self._get_or_create_session(session_id)
        session_id = session.session_id
        
        # Check if we're waiting for user input on missing fields
        if session.pending_fields:
            return await self._handle_pending_input(session, message)
        
        # ============================================================
        # GREETING CHECK (respond naturally, don't search)
        # ============================================================
        if self._is_greeting(message):
            return self._handle_greeting(session)
        
        # ============================================================
        # @ MENTION CHECK (direct tool calls without LLM)
        # ============================================================
        mentioned_tools = self._parse_module_mentions(message)
        if mentioned_tools:
            return await self._execute_mentioned_modules(session, mentioned_tools, message)
        
        # ============================================================
        # ENTITY RESOLUTION (before intent detection)
        # ============================================================
        resolver = get_student_resolver()
        entity_result = await resolver.resolve(
            message=message,
            session_student_id=session.selected_student_id,
            last_resolved_student_id=getattr(session, 'last_resolved_student_id', None)
        )
        
        # Handle entity resolution results
        if entity_result.status == "exact" or entity_result.status == "single":
            # Auto-select the resolved student
            await self._update_session(
                session_id,
                selected_student_id=entity_result.student_id,
                last_resolved_student_id=entity_result.student_id
            )
            session.selected_student_id = entity_result.student_id
            logger.info(f"Entity resolved: {entity_result.student_id}")
        
        elif entity_result.status == "ambiguous":
            # Multiple candidates - ask user to choose
            student_summaries = [
                StudentSummary(**c) for c in entity_result.candidates
            ]
            return ChatResponse(
                session_id=session_id,
                message="I found multiple students. Please select one by ID:",
                intent=IntentType.SEARCH.value,
                tool_called="search_student",
                students_found=student_summaries,
                requires_selection=True
            )
        
        # ============================================================
        # BUILD CONTEXT WITH RESOLVED ENTITY
        # ============================================================
        context = self._build_context(session, entity_result)
        
        # ============================================================
        # FAST KEYWORD-BASED INTENT DETECTION (bypass slow LLM)
        # ============================================================
        fast_intent = self._detect_intent_fallback(message)
        
        # If we can handle this without LLM, do it fast
        if fast_intent != IntentType.UNKNOWN:
            return await self._handle_fast_intent(session, message, fast_intent, entity_result)
        
        # ============================================================
        # LLM FALLBACK (only for complex/ambiguous cases)
        # ============================================================
        logger.info("No fast intent match, falling back to LLM...")
        llm_client = get_llm_client()
        llm_response = await llm_client.generate(message, context)
        
        # Process LLM response
        return await self._process_llm_response(session, message, llm_response)
    
    async def _get_or_create_session(
        self,
        session_id: Optional[uuid.UUID]
    ) -> ChatSession:
        """Get existing session or create new one."""
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
            return new_session
    
    async def _update_session(
        self,
        session_id: uuid.UUID,
        **updates
    ):
        """Update session in database."""
        async with async_session_maker() as db_session:
            await db_session.execute(
                update(ChatSession)
                .where(ChatSession.session_id == session_id)
                .values(**updates)
            )
            await db_session.commit()
    
    def _build_context(
        self,
        session: ChatSession,
        entity_result: Optional[ResolvedEntity] = None
    ) -> Dict[str, Any]:
        """Build context dictionary for LLM with resolved entity."""
        ctx = {
            "session_id": str(session.session_id),
            "selected_student_id": session.selected_student_id,
            "last_intent": session.last_intent,
            "last_tool_called": getattr(session, 'last_tool_called', None),
            "last_tool_summary": getattr(session, 'last_tool_summary', None),
            "pending_fields": session.pending_fields,
            "additional_context": session.context or {}
        }
        # Add entity resolution result to context
        if entity_result and entity_result.student_id:
            ctx["resolved_entity"] = {
                "student_id": entity_result.student_id,
                "student_name": entity_result.student_name,
                "status": entity_result.status
            }
        return ctx
    
    def _is_greeting(self, message: str) -> bool:
        """Check if message is a simple greeting that shouldn't trigger search."""
        msg_clean = message.lower().strip().rstrip("!.?")
        # Check exact matches
        if msg_clean in GREETING_WORDS:
            return True
        # Check if very short (likely greeting/acknowledgement)
        words = msg_clean.split()
        if len(words) <= 2:
            for word in words:
                if word in GREETING_WORDS:
                    return True
        return False
    
    def _handle_greeting(self, session: ChatSession) -> ChatResponse:
        """Return a friendly greeting response."""
        student_context = ""
        if session.selected_student_id:
            student_context = f" I'm currently working with student {session.selected_student_id}. You can use @sgpa, @career, @9box, or @subject to get predictions."
        
        return ChatResponse(
            session_id=session.session_id,
            message=f"Hello! I'm your AI Mentor assistant. I can help you search for students and predict their SGPA, career paths, 9-box position, and recommended subjects.{student_context} How can I help you today?",
            intent="greeting"
        )
    
    def _parse_module_mentions(self, message: str) -> List[str]:
        """Extract @ module mentions from message."""
        mentioned_tools = []
        msg_lower = message.lower()
        
        for mention, tool_name in MODULE_MENTIONS.items():
            if mention in msg_lower:
                if tool_name == "all_predictions":
                    # @all means all 4 prediction tools
                    return ["predict_sgpa", "predict_career", "predict_9box", "predict_subject"]
                if tool_name not in mentioned_tools:
                    mentioned_tools.append(tool_name)
        
        return mentioned_tools
    
    async def _execute_mentioned_modules(
        self,
        session: ChatSession,
        tools: List[str],
        original_message: str
    ) -> ChatResponse:
        """Execute multiple mentioned modules and return combined results."""
        # Check if we have a selected student
        if not session.selected_student_id:
            # Try to extract student from message
            resolver = get_student_resolver()
            entity_result = await resolver.resolve(
                message=original_message,
                session_student_id=None,
                last_resolved_student_id=getattr(session, 'last_resolved_student_id', None)
            )
            
            if entity_result.status == "exact" or entity_result.status == "single":
                await self._update_session(
                    session.session_id,
                    selected_student_id=entity_result.student_id,
                    last_resolved_student_id=entity_result.student_id
                )
                session.selected_student_id = entity_result.student_id
            else:
                return ChatResponse(
                    session_id=session.session_id,
                    message="Please select a student first. Use 'search [name]' to find a student, or click on a student card.",
                    intent="clarification",
                    requires_input=True
                )
        
        # Execute all mentioned tools
        executor = get_tool_executor()
        results = []
        messages = []
        
        for tool_name in tools:
            success, result = await executor.execute(
                tool_name,
                {"student_id": session.selected_student_id}
            )
            if success:
                results.append(result)
                messages.append(self._format_prediction_message(result))
            else:
                messages.append(f"⚠️ {tool_name}: {result.get('error', 'Failed')}")
        
        # Combine results
        combined_message = "\n\n".join(messages)
        
        return ChatResponse(
            session_id=session.session_id,
            message=combined_message,
            intent="multi_prediction",
            tool_called=",".join(tools),
            result={"predictions": results}
        )
    
    def _detect_intent_fallback(self, message: str) -> IntentType:
        """Fallback intent detection using keywords."""
        message_lower = message.lower()
        
        # Check for direct Student ID (e.g., STU12345)
        import re
        if re.search(r"stu\d{5}", message_lower):
            return IntentType.INFO
        
        for intent, keywords in INTENT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in message_lower:
                    return intent
        
        return IntentType.UNKNOWN
    
    async def _handle_fast_intent(
        self,
        session: ChatSession,
        message: str,
        intent: IntentType,
        entity_result: Optional[ResolvedEntity] = None
    ) -> ChatResponse:
        """
        Handle intent without LLM - fast path for predictable cases.
        This bypasses the slow LLM call entirely.
        """
        logger.info(f"Fast intent handling: {intent.value}")
        executor = get_tool_executor()
        
        # PREDICTION INTENTS - need a selected student
        if intent in [IntentType.GRADE, IntentType.CAREER, IntentType.NINE_BOX, IntentType.SUBJECT]:
            # Check if we have a student
            student_id = session.selected_student_id
            if entity_result and entity_result.student_id:
                student_id = entity_result.student_id
            
            if not student_id:
                return ChatResponse(
                    session_id=session.session_id,
                    message="Please select a student first. Search for a student by name or location.",
                    intent=intent.value,
                    requires_input=True
                )
            
            # Map intent to tool
            tool_name = self._intent_to_tool(intent)
            
            # Execute prediction directly
            success, result = await executor.execute(
                tool_name,
                {"student_id": student_id}
            )
            
            if success:
                return ChatResponse(
                    session_id=session.session_id,
                    message=self._format_prediction_message(result),
                    intent=intent.value,
                    tool_called=tool_name,
                    result=result
                )
            else:
                return ChatResponse(
                    session_id=session.session_id,
                    message=f"Prediction failed: {result.get('error', 'Unknown error')}",
                    intent=intent.value,
                    tool_called=tool_name
                )
        
        # SEARCH INTENT
        if intent == IntentType.SEARCH:
            query = self._extract_search_query(message)
            success, result = await executor.execute(
                "search_student",
                {"query": query}
            )
            if success:
                return await self._handle_search_result(session, result)
            else:
                return ChatResponse(
                    session_id=session.session_id,
                    message=f"Search failed: {result.get('error', 'Unknown error')}",
                    intent=intent.value
                )
        
        # INFO INTENT - get student details
        if intent == IntentType.INFO:
            student_id = session.selected_student_id
            if entity_result and entity_result.student_id:
                student_id = entity_result.student_id
            
            if student_id:
                success, result = await executor.execute(
                    "get_student",
                    {"student_id": student_id}
                )
                if success:
                    student = result.get("student", {})
                    return ChatResponse(
                        session_id=session.session_id,
                        message=f"Student: {student.get('name')} (ID: {student.get('student_id')})",
                        intent=intent.value,
                        tool_called="get_student",
                        result=result
                    )
            
            # No student - try to search
            query = self._extract_search_query(message)
            if query:
                success, result = await executor.execute(
                    "search_student",
                    {"query": query}
                )
                if success:
                    return await self._handle_search_result(session, result)
            
            return ChatResponse(
                session_id=session.session_id,
                message="Please provide a student name or ID.",
                intent=intent.value,
                requires_input=True
            )
        
        # Fallback - should not reach here
        return ChatResponse(
            session_id=session.session_id,
            message="I'm not sure how to help with that. Try searching for a student or asking for a prediction.",
            intent=IntentType.UNKNOWN.value
        )
    
    async def _handle_pending_input(
        self,
        session: ChatSession,
        message: str
    ) -> ChatResponse:
        """Handle user input for pending fields."""
        pending = session.pending_fields or {}
        
        if not pending:
            return await self._continue_normal_flow(session, message)
        
        # For now, clear pending and retry the original intent
        # In production, you'd parse the user's response to fill the fields
        await self._update_session(
            session.session_id,
            pending_fields={}
        )
        
        return ChatResponse(
            session_id=session.session_id,
            message="Thank you for the information. Let me process your request.",
            intent=session.last_intent,
            requires_input=False
        )
    
    async def _continue_normal_flow(
        self,
        session: ChatSession,
        message: str
    ) -> ChatResponse:
        """Continue normal conversation flow."""
        llm_client = get_llm_client()
        context = self._build_context(session)
        llm_response = await llm_client.generate(message, context)
        return await self._process_llm_response(session, message, llm_response)
    
    async def _process_llm_response(
        self,
        session: ChatSession,
        user_message: str,
        llm_response: LLMResponse
    ) -> ChatResponse:
        """Process the LLM response and execute tools if needed."""
        
        # If LLM returned a tool call, execute it
        if llm_response.tool_call:
            return await self._execute_tool_call(
                session,
                llm_response.tool_call,
                llm_response.content
            )
        
        # If no tool call, try fallback intent detection
        intent = self._detect_intent_fallback(user_message)
        
        # If we detected an intent, try to handle it
        if intent != IntentType.UNKNOWN:
            return await self._handle_intent_fallback(session, user_message, intent)
        
        # Otherwise, return the LLM's text response
        return ChatResponse(
            session_id=session.session_id,
            message=llm_response.content,
            intent=IntentType.UNKNOWN.value
        )
    
    async def _execute_tool_call(
        self,
        session: ChatSession,
        tool_call: Dict[str, Any],
        llm_message: str
    ) -> ChatResponse:
        """Execute a tool call and return the result."""
        tool_name = tool_call.get("tool_name", "")
        arguments = tool_call.get("arguments", {})
        
        # Get tool executor
        executor = get_tool_executor()

        # The LLM occasionally hallucinates a non-existent tool (e.g. "clarification",
        # "none", "answer"). Treat those as a request for clarification and respond
        # helpfully instead of surfacing a raw error, falling back to the LLM's own text.
        KNOWN_TOOLS = {
            "search_student", "get_student",
            "predict_sgpa", "predict_career", "predict_9box", "predict_subject",
        }
        if tool_name not in KNOWN_TOOLS:
            fallback = (llm_message or "").strip()
            if not fallback:
                fallback = (
                    "I can help you search for a student and predict their SGPA, career path, "
                    "9-box talent position, or recommended subject. Try \"find student named ...\" "
                    "or, once a student is selected, \"predict career\"."
                )
            return ChatResponse(
                session_id=session.session_id,
                message=fallback,
                intent="clarification",
                requires_input=True,
            )

        # Execute the tool
        success, result = await executor.execute(tool_name, arguments)

        if not success:
            # Check for missing fields
            if "missing_fields" in result:
                await self._update_session(
                    session.session_id,
                    pending_fields={"fields": result["missing_fields"], "tool": tool_name}
                )
                return ChatResponse(
                    session_id=session.session_id,
                    message=f"I need some additional information: {', '.join(result['missing_fields'])}",
                    intent=self._tool_to_intent(tool_name),
                    pending_fields=result["missing_fields"],
                    requires_input=True
                )
            
            return ChatResponse(
                session_id=session.session_id,
                message=f"Error: {result.get('error', 'Unknown error')}",
                tool_called=tool_name
            )
        
        # Handle search results
        if tool_name == "search_student":
            return await self._handle_search_result(session, result)
        
        # Handle get_student - select the student
        if tool_name == "get_student":
            student = result.get("student", {})
            await self._update_session(
                session.session_id,
                selected_student_id=student.get("student_id")
            )
            return ChatResponse(
                session_id=session.session_id,
                message=f"Found student: {student.get('name')}",
                tool_called=tool_name,
                result={"student": student}
            )
        
        # Handle predictions
        if tool_name.startswith("predict_"):
            return ChatResponse(
                session_id=session.session_id,
                message=self._format_prediction_message(result),
                intent=self._tool_to_intent(tool_name),
                tool_called=tool_name,
                result=result
            )
        
        return ChatResponse(
            session_id=session.session_id,
            message=llm_message,
            tool_called=tool_name,
            result=result
        )
    
    async def _handle_search_result(
        self,
        session: ChatSession,
        result: Dict[str, Any]
    ) -> ChatResponse:
        """Handle search results - may require user selection."""
        students = result.get("students", [])
        
        if not students:
            return ChatResponse(
                session_id=session.session_id,
                message=result.get("message", "No students found."),
                tool_called="search_student",
                students_found=[]
            )
        
        if len(students) == 1:
            # Auto-select if only one result
            student = students[0]
            await self._update_session(
                session.session_id,
                selected_student_id=student["student_id"]
            )
            return ChatResponse(
                session_id=session.session_id,
                message=f"Found student: {student['name']} (ID: {student['student_id']})",
                tool_called="search_student",
                result={"selected_student": student}
            )
        
        # Multiple students - ask user to choose
        student_summaries = [
            StudentSummary(**s) for s in students
        ]
        
        return ChatResponse(
            session_id=session.session_id,
            message="I found multiple students. Please select one by ID:",
            tool_called="search_student",
            students_found=student_summaries,
            requires_selection=True
        )
    
    async def _handle_intent_fallback(
        self,
        session: ChatSession,
        message: str,
        intent: IntentType
    ) -> ChatResponse:
        """Handle intent when LLM didn't return a tool call."""
        await self._update_session(session.session_id, last_intent=intent.value)
        
        # If we have a selected student, try to make prediction
        if session.selected_student_id and intent in [
            IntentType.GRADE, IntentType.CAREER, IntentType.NINE_BOX, IntentType.SUBJECT
        ]:
            tool_name = self._intent_to_tool(intent)
            executor = get_tool_executor()
            success, result = await executor.execute(
                tool_name,
                {"student_id": session.selected_student_id}
            )
            
            if success:
                return ChatResponse(
                    session_id=session.session_id,
                    message=self._format_prediction_message(result),
                    intent=intent.value,
                    tool_called=tool_name,
                    result=result
                )
        
        # Need to search for student first
        if intent in [IntentType.SEARCH, IntentType.INFO]:
            # Extract potential search query from message
            query = self._extract_search_query(message)
            if query:
                executor = get_tool_executor()
                success, result = await executor.execute(
                    "search_student",
                    {"query": query}
                )
                if success:
                    return await self._handle_search_result(session, result)
        
        # Ask for student name
        return ChatResponse(
            session_id=session.session_id,
            message="Please provide the student's name or ID to proceed.",
            intent=intent.value,
            requires_input=True
        )
    
    def _tool_to_intent(self, tool_name: str) -> str:
        """Map tool name to intent."""
        mapping = {
            "predict_sgpa": "grade",
            "predict_career": "career",
            "predict_9box": "9box",
            "predict_subject": "subject",
            "search_student": "search",
            "get_student": "info"
        }
        return mapping.get(tool_name, "unknown")
    
    def _intent_to_tool(self, intent: IntentType) -> str:
        """Map intent to tool name."""
        mapping = {
            IntentType.GRADE: "predict_sgpa",
            IntentType.CAREER: "predict_career",
            IntentType.NINE_BOX: "predict_9box",
            IntentType.SUBJECT: "predict_subject"
        }
        return mapping.get(intent, "")
    
    def _extract_search_query(self, message: str) -> str:
        """Extract potential search query from message."""
        # Remove common words
        stop_words = [
            "find", "search", "look", "for", "student", "named", "called",
            "who", "is", "the", "a", "an", "about", "info", "details"
        ]
        words = message.split()
        filtered = [w for w in words if w.lower() not in stop_words]
        return " ".join(filtered).strip()
    
    def _format_prediction_message(self, result: Dict[str, Any]) -> str:
        """Format prediction result as a message."""
        pred_type = result.get("prediction_type", "")
        student_name = result.get("student_name", "the student")
        pred_result = result.get("result", {})
        
        if pred_type == "sgpa":
            sgpa = pred_result.get("predicted_sgpa", "N/A")
            risk = pred_result.get("risk_level", "N/A")
            factors = pred_result.get("contributing_factors", [])
            
            msg = f"Predicted SGPA for {student_name}: {sgpa} ({risk})"
            if factors:
                top_factor = factors[0]
                msg += f". Top factor: {top_factor.get('feature')} (impact: {top_factor.get('impact_score')})"
            return msg
        
        elif pred_type == "career":
            career = pred_result.get("predicted_career", "N/A")
            confidence = pred_result.get("confidence_score", 0)
            return f"Recommended career for {student_name}: {career} (confidence: {confidence:.2%})"
        
        elif pred_type == "9box":
            position = pred_result.get("nine_box_position_label", "N/A")
            rec = pred_result.get("descriptive_recommendation", "")
            return f"9-Box position for {student_name}: {position}. Recommendation: {rec}"
        
        elif pred_type == "subject":
            dept = pred_result.get("recommended_department", "N/A")
            confidence = pred_result.get("confidence_score", 0)
            return f"Recommended department for {student_name}: {dept} (confidence: {confidence:.2%})"
        
        return f"Prediction complete for {student_name}"
    
    async def reset_session(self, session_id: uuid.UUID) -> bool:
        """Reset a session to initial state including conversation memory."""
        async with async_session_maker() as db_session:
            result = await db_session.execute(
                select(ChatSession).where(ChatSession.session_id == session_id)
            )
            session = result.scalar_one_or_none()
            
            if not session:
                return False
            
            # Clear all state including conversation memory
            session.selected_student_id = None
            session.last_resolved_student_id = None
            session.pending_fields = {}
            session.last_intent = None
            session.last_tool_called = None
            session.last_tool_summary = None
            session.context = {}
            
            await db_session.commit()
            return True


# Global dispatcher instance
_dispatcher: Optional[MCPDispatcher] = None


def get_dispatcher() -> MCPDispatcher:
    """Get the global MCP dispatcher instance."""
    global _dispatcher
    if _dispatcher is None:
        _dispatcher = MCPDispatcher()
    return _dispatcher
