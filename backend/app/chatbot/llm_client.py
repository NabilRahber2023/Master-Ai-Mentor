"""
Ollama LLM Client for AI Mentor Chatbot.
Handles communication with local Ollama instance running phi3:mini.
"""
import os
import json
import httpx
from typing import Dict, Any, Optional, List
from pydantic import BaseModel


# Ollama configuration (phi3:mini - optimized for low memory)
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi3:mini")
OLLAMA_TIMEOUT = 120.0  # Allow for first-load + complex prompt processing


class LLMResponse(BaseModel):
    """Response from LLM."""
    content: Optional[str] = ""  # Allow None, default to empty string
    tool_call: Optional[Dict[str, Any]] = None
    raw_response: Optional[str] = None


# System prompt for the orchestrator LLM
SYSTEM_PROMPT = """You are an AI Mentor assistant that helps with student predictions. Your job is to orchestrate tool calls.

IMPORTANT CONTEXT RULES:
1. If "selected_student_id" is in context, USE THAT STUDENT for predictions - don't ask again
2. If user asks for prediction and student is already selected, proceed with prediction
3. Remember the conversation context - don't repeat questions already answered
4. Be conversational and natural, not robotic

AVAILABLE TOOLS:
1. search_student: Search for a student by name or query
   Args: {"query": "search text"}

2. get_student: Get student details by ID
   Args: {"student_id": "STU001"}

3. predict_sgpa: Predict next semester SGPA (requires selected student)
   Args: {"student_id": "STU001"}

4. predict_career: Predict career path (requires selected student)
   Args: {"student_id": "STU001"}

5. predict_9box: Predict 9-box position (requires selected student)
   Args: {"student_id": "STU001"}

6. predict_subject: Predict best department (requires selected student)
   Args: {"student_id": "STU001"}

RESPONSE FORMAT (JSON):
{
  "intent": "grade|career|9box|subject|search|info|clarification|chat",
  "action": "call_tool|respond",
  "tool_call": {"tool_name": "...", "arguments": {...}},
  "message": "Your message to user"
}

CRITICAL RULES:
- If user wants prediction AND there's a selected_student_id in context: call the prediction tool directly
- If no student selected AND user wants prediction: call search_student first
- Never ask for student ID if you already have it in context
- For predictions: ALWAYS use the student_id from context, not from the message

EXAMPLE - Student already selected (selected_student_id: "STU12345"):
User: "predict SGPA"
Response: {"intent": "grade", "action": "call_tool", "tool_call": {"tool_name": "predict_sgpa", "arguments": {"student_id": "STU12345"}}, "message": "Predicting SGPA..."}

EXAMPLE - No student selected:
User: "predict SGPA"
Response: {"intent": "grade", "action": "call_tool", "tool_call": {"tool_name": "search_student", "arguments": {"query": ""}}, "message": "Which student would you like to predict for?"}"""


class OllamaClient:
    """
    Async client for Ollama LLM.
    Handles model interactions for tool orchestration.
    """
    
    def __init__(
        self,
        base_url: str = OLLAMA_BASE_URL,
        model: str = OLLAMA_MODEL,
        timeout: float = OLLAMA_TIMEOUT
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client
    
    async def close(self):
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
    
    async def health_check(self) -> bool:
        """Check if Ollama is running and model is available."""
        try:
            client = await self._get_client()
            response = await client.get(f"{self.base_url}/api/tags")
            if response.status_code == 200:
                data = response.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                # Check if our model is available (with or without tag)
                model_base = self.model.split(":")[0]
                return any(model_base in m for m in models)
            return False
        except Exception as e:
            print(f"Ollama health check failed: {e}")
            return False
    
    async def generate(
        self,
        user_message: str,
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> LLMResponse:
        """
        Generate a response from the LLM.
        
        Args:
            user_message: The user's message
            context: Additional context (selected student, session state)
            conversation_history: Previous messages in the conversation
        
        Returns:
            LLMResponse with parsed tool call or message
        """
        client = await self._get_client()
        
        # Build the full prompt with context
        full_prompt = self._build_prompt(user_message, context, conversation_history)
        
        # Call Ollama API with phi3:mini optimized settings
        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": 0.0,   # Deterministic output
                "num_predict": 512,   # Shorter responses
                "num_ctx": 4096,      # Context window limit
                "top_p": 1.0,         # No nucleus sampling
                "repeat_penalty": 1.1
            }
        }
        
        try:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json=payload
            )
            response.raise_for_status()
            
            data = response.json()
            raw_response = data.get("response", "")
            
            # Parse the response
            return self._parse_response(raw_response)
            
        except httpx.TimeoutException:
            return LLMResponse(
                content="I'm taking too long to respond. Please try again.",
                raw_response="TIMEOUT"
            )
        except Exception as e:
            return LLMResponse(
                content=f"Error communicating with LLM: {str(e)}",
                raw_response=str(e)
            )
    
    def _build_prompt(
        self,
        user_message: str,
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Build the full prompt with system message and context."""
        parts = [SYSTEM_PROMPT]
        
        # Add context if available
        if context:
            context_str = json.dumps(context, indent=2)
            parts.append(f"\nCURRENT CONTEXT:\n{context_str}")
        
        # Add conversation history
        if conversation_history:
            parts.append("\nCONVERSATION HISTORY:")
            for msg in conversation_history[-5:]:  # Last 5 messages
                role = msg.get("role", "user")
                content = msg.get("content", "")
                parts.append(f"{role.upper()}: {content}")
        
        # Add current user message
        parts.append(f"\nUSER: {user_message}")
        parts.append("\nASSISTANT (respond in JSON only):")
        
        return "\n".join(parts)
    
    def _parse_response(self, raw_response: str) -> LLMResponse:
        """Parse LLM response and extract tool calls."""
        raw_response = raw_response.strip()
        
        # Try to extract JSON from response
        try:
            # Look for JSON in the response
            json_start = raw_response.find("{")
            json_end = raw_response.rfind("}") + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = raw_response[json_start:json_end]
                data = json.loads(json_str)
                
                # Extract tool call if present
                tool_call = None
                if data.get("action") == "call_tool" and data.get("tool_call"):
                    tool_call = data["tool_call"]
                
                # Extract message
                message = data.get("message", "I understood your request.")
                
                return LLMResponse(
                    content=message,
                    tool_call=tool_call,
                    raw_response=raw_response
                )
            else:
                # No JSON found, treat as plain text response
                return LLMResponse(
                    content=raw_response,
                    raw_response=raw_response
                )
                
        except json.JSONDecodeError:
            # Failed to parse JSON, return raw response
            return LLMResponse(
                content=raw_response,
                raw_response=raw_response
            )


# Global client instance
_llm_client: Optional[OllamaClient] = None


def get_llm_client() -> OllamaClient:
    """Get the global LLM client instance."""
    global _llm_client
    if _llm_client is None:
        _llm_client = OllamaClient()
    return _llm_client


async def close_llm_client():
    """Close the global LLM client."""
    global _llm_client
    if _llm_client:
        await _llm_client.close()
        _llm_client = None
