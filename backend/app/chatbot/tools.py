"""
MCP Tool Definitions for AI Mentor Chatbot.
Defines all available tools with their schemas and execution logic.
"""
import httpx
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.chatbot.models import Student
from app.chatbot.database import async_session_maker
from app.chatbot.ingest_csv import get_embedding_model


# Internal API base URL for ML modules
API_BASE_URL = "http://localhost:8000"


# Tool definitions in MCP-style schema
TOOL_DEFINITIONS = {
    "search_student": {
        "name": "search_student",
        "description": "Search for students by name or text query using semantic search",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query (name, district, department, career path)"
                }
            },
            "required": ["query"]
        }
    },
    "get_student": {
        "name": "get_student",
        "description": "Get full details of a student by their ID",
        "parameters": {
            "type": "object",
            "properties": {
                "student_id": {
                    "type": "string",
                    "description": "The student's unique ID"
                }
            },
            "required": ["student_id"]
        }
    },
    "predict_sgpa": {
        "name": "predict_sgpa",
        "description": "Predict next semester SGPA for a student",
        "parameters": {
            "type": "object",
            "properties": {
                "student_id": {
                    "type": "string",
                    "description": "The student's unique ID"
                }
            },
            "required": ["student_id"]
        },
        "required_fields": [
            "hsc_gpa", "current_sgpa", "study_hours_weekly",
            "attendance_rate", "family_income", "gender", "preferred_department"
        ]
    },
    "predict_career": {
        "name": "predict_career",
        "description": "Predict suitable career path for a student",
        "parameters": {
            "type": "object",
            "properties": {
                "student_id": {
                    "type": "string",
                    "description": "The student's unique ID"
                }
            },
            "required": ["student_id"]
        },
        "required_fields": [
            "preferred_department", "personality_type", "work_style",
            "current_sgpa", "programming_interest", "math_skill",
            "communication_skill", "creative_interest", "problem_solving_score"
        ]
    },
    "predict_9box": {
        "name": "predict_9box",
        "description": "Predict 9-box talent grid position for a student",
        "parameters": {
            "type": "object",
            "properties": {
                "student_id": {
                    "type": "string",
                    "description": "The student's unique ID"
                }
            },
            "required": ["student_id"]
        },
        "required_fields": [
            "current_sgpa", "attendance_rate", "assignment_completion_rate",
            "project_skill_score", "communication_skill", "problem_solving_score",
            "leadership_indicator", "initiative_score", "stress_management"
        ]
    },
    "predict_subject": {
        "name": "predict_subject",
        "description": "Predict best department/subject choice for a student",
        "parameters": {
            "type": "object",
            "properties": {
                "student_id": {
                    "type": "string",
                    "description": "The student's unique ID"
                }
            },
            "required": ["student_id"]
        },
        "required_fields": [
            "gender", "age", "hsc_gpa", "study_style", "math_skill",
            "programming_interest", "tech_score", "budget_per_semester",
            "business_interest", "creative_interest", "district"
        ]
    }
}


class ToolExecutor:
    """
    Executes MCP tools and returns results.
    Interfaces with database and ML API endpoints.
    """
    
    def __init__(self):
        self._http_client: Optional[httpx.AsyncClient] = None
    
    async def _get_http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client for API calls."""
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(timeout=30.0)
        return self._http_client
    
    async def close(self):
        """Close HTTP client."""
        if self._http_client and not self._http_client.is_closed:
            await self._http_client.aclose()
    
    def _validate_required_fields(
        self,
        tool_name: str,
        arguments: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Validate required fields for a tool call.
        Returns error dict if validation fails, None if valid.
        """
        tool_def = TOOL_DEFINITIONS.get(tool_name, {})
        params = tool_def.get("parameters", {})
        required = params.get("required", [])
        
        missing = [f for f in required if f not in arguments or not arguments[f]]
        if missing:
            return {
                "error": f"Missing required fields: {', '.join(missing)}",
                "error_type": "validation_error",
                "missing_fields": missing,
                "tool_name": tool_name,
                "recoverable": True
            }
        return None
    
    async def execute(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        correlation_id: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Execute a tool with Pydantic validation and structured error handling.
        
        Args:
            tool_name: Name of the tool to execute
            arguments: Tool arguments
            correlation_id: Optional correlation ID for logging
        
        Returns:
            Tuple of (success, result_dict)
        """
        import uuid as uuid_mod
        import logging
        logger = logging.getLogger(__name__)
        
        cid = correlation_id or str(uuid_mod.uuid4())[:8]
        
        # Check tool exists
        if tool_name not in TOOL_DEFINITIONS:
            logger.warning(f"[{cid}] Unknown tool: {tool_name}")
            return False, {
                "error": f"Unknown tool: {tool_name}",
                "error_type": "unknown_tool",
                "recoverable": False
            }
        
        # Validate required fields
        validation_error = self._validate_required_fields(tool_name, arguments)
        if validation_error:
            logger.warning(f"[{cid}] Validation failed for {tool_name}: {validation_error}")
            return False, validation_error
        
        logger.info(f"[{cid}] Executing tool: {tool_name}")
        
        try:
            if tool_name == "search_student":
                return await self._search_student(arguments.get("query", ""))
            elif tool_name == "get_student":
                return await self._get_student(arguments.get("student_id", ""))
            elif tool_name == "predict_sgpa":
                return await self._predict_sgpa(arguments.get("student_id", ""))
            elif tool_name == "predict_career":
                return await self._predict_career(arguments.get("student_id", ""))
            elif tool_name == "predict_9box":
                return await self._predict_9box(arguments.get("student_id", ""))
            elif tool_name == "predict_subject":
                return await self._predict_subject(arguments.get("student_id", ""))
            else:
                return False, {
                    "error": f"Tool not implemented: {tool_name}",
                    "error_type": "not_implemented",
                    "recoverable": False
                }
        except Exception as e:
            logger.error(f"[{cid}] Tool {tool_name} failed: {e}")
            return False, {
                "error": str(e),
                "error_type": "execution_error",
                "tool_name": tool_name,
                "recoverable": True
            }
    
    async def _search_student(self, query: str) -> Tuple[bool, Dict[str, Any]]:
        """Search students using semantic search with pgvector."""
        if not query or len(query.strip()) < 2:
            return False, {"error": "Query too short. Please provide a longer search term."}
        
        # Generate embedding for query
        model = get_embedding_model()
        query_embedding = model.encode([query])[0].tolist()
        
        async with async_session_maker() as session:
            # Use pgvector cosine distance for semantic search
            # Also search by exact name match
            sql = text("""
                SELECT student_id, name, district, preferred_department, current_sgpa,
                       embedding <-> :embedding AS distance
                FROM students
                WHERE name ILIKE :name_pattern
                   OR embedding <-> :embedding < 1.0
                ORDER BY 
                    CASE WHEN name ILIKE :name_pattern THEN 0 ELSE 1 END,
                    distance
                LIMIT 5
            """)
            
            result = await session.execute(
                sql,
                {
                    "embedding": query_embedding,
                    "name_pattern": f"%{query}%"
                }
            )
            
            rows = result.fetchall()
            
            if not rows:
                return True, {
                    "found": False,
                    "students": [],
                    "message": f"No students found matching '{query}'"
                }
            
            students = [
                {
                    "student_id": row[0],
                    "name": row[1],
                    "district": row[2],
                    "preferred_department": row[3],
                    "current_sgpa": row[4]
                }
                for row in rows
            ]
            
            return True, {
                "found": True,
                "count": len(students),
                "students": students,
                "message": f"Found {len(students)} student(s)"
            }
    
    async def _get_student(self, student_id: str) -> Tuple[bool, Dict[str, Any]]:
        """Get full student details by ID."""
        if not student_id:
            return False, {"error": "Student ID is required"}
        
        async with async_session_maker() as session:
            result = await session.execute(
                select(Student).where(Student.student_id == student_id)
            )
            student = result.scalar_one_or_none()
            
            if not student:
                return False, {"error": f"Student not found: {student_id}"}
            
            return True, {
                "found": True,
                "student": student.to_dict()
            }
    
    async def _predict_sgpa(self, student_id: str) -> Tuple[bool, Dict[str, Any]]:
        """Predict SGPA by calling the ML API endpoint."""
        # Get student data
        success, result = await self._get_student(student_id)
        if not success:
            return success, result
        
        student = result["student"]
        
        # Check required fields
        missing = self._check_missing_fields(student, "predict_sgpa")
        if missing:
            return False, {
                "error": "Missing required fields",
                "missing_fields": missing
            }
        
        # Map student data to SGPA predictor schema with validation clamping
        hsc_gpa = float(student.get("hsc_gpa") or 0)
        current_sgpa = float(student.get("current_sgpa") or 0)
        
        payload = {
            "SSC_GPA": 4.5,  # Default
            "HSC_GPA": min(max(hsc_gpa, 0.0), 5.0),  # Clamp 0-5
            "Previous_SGPA": min(max(current_sgpa, 0.0), 4.0),  # Clamp 0-4
            "Study_Hours_Per_Day": float(student.get("study_hours_weekly") or 0) / 7,
            "Attendance_Rate": min(max(float(student.get("attendance_rate") or 0), 0.0), 100.0),
            "Family_Income_BDT": max(float(student.get("family_income") or 0), 0.0),
            "Part_Time_Hours": 0.0,
            "Father_Education": "Graduate",
            "Mother_Education": "Graduate",
            "Parental_Support": "Yes",
            "Active_Participation": "Yes" if student.get("class_participation", 0) > 5 else "No",
            "Gender": self._map_gender(student.get("gender")), 
            "Department": self._map_department(student.get("preferred_department", "CSE"))
        }
        
        # Call ML API
        client = await self._get_http_client()
        try:
            response = await client.post(
                f"{API_BASE_URL}/api/v1/prediction/sgpa/",
                json=payload
            )
            if response.status_code == 422:
                import logging
                logging.getLogger(__name__).error(f"SGPA 422 Error: {response.text}")
                return False, {"error": f"Validation error: {response.text}"}
                
            response.raise_for_status()
            prediction = response.json()
            
            return True, {
                "student_id": student_id,
                "student_name": student.get("name"),
                "prediction_type": "sgpa",
                "result": prediction
            }
        except httpx.HTTPError as e:
            return False, {"error": f"ML API error: {str(e)}"}
    
    async def _predict_career(self, student_id: str) -> Tuple[bool, Dict[str, Any]]:
        """Predict career by calling the ML API endpoint."""
        success, result = await self._get_student(student_id)
        if not success:
            return success, result
        
        student = result["student"]
        
        missing = self._check_missing_fields(student, "predict_career")
        if missing:
            return False, {
                "error": "Missing required fields",
                "missing_fields": missing
            }
        
        # Map to Career predictor schema
        payload = {
            "Department": self._map_department(student.get("preferred_department", "CSE")),
            "Personality_Type": student.get("personality_type", "INTJ"),
            "Preferred_Work_Environment": self._map_work_environment(student.get("work_style")),
            "Interest_Area": self._map_interest_area(student),
            "Socioeconomic_Score": self._map_socioeconomic(student.get("family_income")),
            "CGPA": float(student.get("current_sgpa") or 3.0),
            "Programming_Skill": int(student.get("programming_interest") or 5),
            "Math_Skill": int(student.get("math_skill") or 5),
            "Communication_Skill": int(student.get("communication_skill") or 5),
            "Creativity_Score": int(student.get("creative_interest") or 5),
            "Problem_Solving": int(student.get("problem_solving_score") or 5),
            "Leadership_Score": int(student.get("leadership_indicator") or 5),
            "Research_Interest": int(student.get("research_interest_score") or 5),
            "Public_Speaking": int(student.get("communication_skill") or 5),
            "Internship_Experience_Months": 0,
            "Projects_Completed": int(student.get("project_skill_score") or 0),
            "Extracurriculars": 1 if student.get("extracurricular_involvement") else 0
        }
        
        client = await self._get_http_client()
        try:
            response = await client.post(
                f"{API_BASE_URL}/api/v1/prediction/career/career",
                json=payload
            )
            if response.status_code == 422:
                import logging
                logging.getLogger(__name__).error(f"Career 422 Error: {response.text}")
                return False, {"error": f"Validation error: {response.text}"}
                
            response.raise_for_status()
            prediction = response.json()
            
            return True, {
                "student_id": student_id,
                "student_name": student.get("name"),
                "prediction_type": "career",
                "result": prediction
            }
        except httpx.HTTPError as e:
            return False, {"error": f"ML API error: {str(e)}"}
    
    async def _predict_9box(self, student_id: str) -> Tuple[bool, Dict[str, Any]]:
        """Predict 9-box position by calling the ML API endpoint."""
        success, result = await self._get_student(student_id)
        if not success:
            return success, result
        
        student = result["student"]
        
        missing = self._check_missing_fields(student, "predict_9box")
        if missing:
            return False, {
                "error": "Missing required fields",
                "missing_fields": missing
            }
        
        # Map to 9-Box predictor schema
        payload = {
            "CGPA": float(student.get("current_sgpa") or 3.0),
            "Attendance_Rate": float(student.get("attendance_rate") or 80),
            "Assignment_Completion_Rate": float(student.get("assignment_completion_rate") or 80),
            "Project_Quality_Score": int(student.get("project_skill_score") or 5),
            "Communication_Skill": int(student.get("communication_skill") or 5),
            "Teamwork_Score": int(student.get("soft_skill_score") or 5),
            "Problem_Solving_Score": int(student.get("problem_solving_score") or 5),
            "Leadership_Score": int(student.get("leadership_indicator") or 5),
            "Time_Management": int(student.get("productivity_score") or 5),
            "Initiative_Taking": int(student.get("initiative_score") or 5),
            "Stress_Handling": int(student.get("stress_management") or 5),
            "Internship_Experience_Months": 0,
            "Extracurricular_Activities": 1 if student.get("extracurricular_involvement") else 0,
            "Learning_Agility": int(student.get("analytical_skill") or 5),
            "Adaptability": int(student.get("stress_management") or 5),
            "Career_Motivation": int(student.get("initiative_score") or 5)
        }
        
        client = await self._get_http_client()
        try:
            response = await client.post(
                f"{API_BASE_URL}/api/v1/prediction/9box/",
                json=payload
            )
            if response.status_code == 422:
                import logging
                logging.getLogger(__name__).error(f"9Box 422 Error: {response.text}")
                return False, {"error": f"Validation error: {response.text}"}
                
            response.raise_for_status()
            prediction = response.json()
            
            return True, {
                "student_id": student_id,
                "student_name": student.get("name"),
                "prediction_type": "9box",
                "result": prediction
            }
        except httpx.HTTPError as e:
            return False, {"error": f"ML API error: {str(e)}"}
    
    async def _predict_subject(self, student_id: str) -> Tuple[bool, Dict[str, Any]]:
        """Predict subject/department by calling the ML API endpoint."""
        success, result = await self._get_student(student_id)
        if not success:
            return success, result
        
        student = result["student"]
        
        missing = self._check_missing_fields(student, "predict_subject")
        if missing:
            return False, {
                "error": "Missing required fields",
                "missing_fields": missing
            }
        
        # Map to Subject predictor schema with validation clamping
        age = int(student.get("age") or 20)
        
        payload = {
            "gender": self._map_gender(student.get("gender")),
            "age": min(max(age, 15), 40), # Clamp 15-40
            "hsc_gpa": min(max(float(student.get("hsc_gpa") or 4.0), 0.0), 5.0), # Clamp 0-5
            "study_style": self._map_study_style(student.get("study_style")),
            "math_skill_level": self._map_skill_level(student.get("math_skill")),
            "programming_interest": self._map_skill_level(student.get("programming_interest")),
            "tech_interest_score": min(max(int(student.get("tech_score") or 50), 0), 100), # Clamp 0-100
            "budget_per_semester": max(float(student.get("budget_per_semester") or 50000), 0.0),
            "business_interest": self._map_skill_level(student.get("business_interest")),
            "creative_interest": self._map_skill_level(student.get("creative_interest")),
            "location": self._map_location(student.get("district")),
            "career_goal": self._map_career_goal(student.get("career_orientation"))
        }
        
        client = await self._get_http_client()
        try:
            response = await client.post(
                f"{API_BASE_URL}/api/v1/prediction/subject/subject_choice",
                json=payload
            )
            if response.status_code == 422:
                import logging
                logging.getLogger(__name__).error(f"Subject 422 Error: {response.text}")
                return False, {"error": f"Validation error: {response.text}"}
                
            response.raise_for_status()
            prediction = response.json()
            
            return True, {
                "student_id": student_id,
                "student_name": student.get("name"),
                "prediction_type": "subject",
                "result": prediction
            }
        except httpx.HTTPError as e:
            return False, {"error": f"ML API error: {str(e)}"}
    
    def _map_gender(self, gender: str) -> str:
        """Map gender to Male/Female."""
        if not gender:
            return "Male"
        g = gender.lower()
        if g.startswith("f") or g == "female":
            return "Female"
        return "Male"

    def _check_missing_fields(
        self,
        student: Dict[str, Any],
        tool_name: str
    ) -> List[str]:
        """Check for missing required fields."""
        required = TOOL_DEFINITIONS.get(tool_name, {}).get("required_fields", [])
        missing = []
        for field in required:
            if student.get(field) is None:
                missing.append(field)
        return missing
    
    def _map_department(self, dept: str) -> str:
        """Map department to supported values."""
        dept_map = {
            "cse": "CSE", "computer science": "CSE", "cs": "CSE",
            "eee": "Engineering", "electrical": "Engineering",
            "bba": "Business", "business": "Business",
            "law": "Law", "llb": "Law",
            "pharmacy": "Pharmacy",
            "english": "English",
            "journalism": "Journalism",
            "arts": "Arts"
        }
        return dept_map.get(dept.lower() if dept else "", "CSE")
    
    def _map_work_environment(self, work_style: str) -> str:
        """Map work style to supported values."""
        if not work_style:
            return "Hybrid"
        ws = work_style.lower()
        if "remote" in ws:
            return "Remote"
        elif "office" in ws or "onsite" in ws:
            return "Office"
        return "Hybrid"
    
    def _map_interest_area(self, student: Dict[str, Any]) -> str:
        """Map student interests to interest area."""
        scores = {
            "Technology": student.get("tech_score") or 0,
            "Business": student.get("business_score") or 0,
            "Research": student.get("research_score") or 0,
            "Creative": student.get("creative_score") or 0
        }
        return max(scores, key=scores.get)
    
    def _map_socioeconomic(self, income: float) -> str:
        """Map income to socioeconomic score."""
        if not income:
            return "Mid"
        if income < 30000:
            return "Low"
        elif income > 80000:
            return "High"
        return "Mid"
    
    def _map_study_style(self, style: str) -> str:
        """Map study style to supported values."""
        if not style:
            return "Mixed"
        s = style.lower()
        if "practical" in s or "hands" in s:
            return "Practical-heavy"
        elif "theory" in s or "reading" in s:
            return "Theory-heavy"
        return "Mixed"
    
    def _map_skill_level(self, score: int) -> str:
        """Map numeric score to skill level."""
        if score is None:
            return "Medium"
        if score <= 3:
            return "Low"
        elif score >= 7:
            return "High"
        return "Medium"
    
    def _map_location(self, district: str) -> str:
        """Map district to location."""
        if not district:
            return "Dhaka"
        if district.lower() == "dhaka":
            return "Dhaka"
        return "Outside Dhaka"
    
    def _map_career_goal(self, orientation: str) -> str:
        """Map career orientation to goal."""
        if not orientation:
            return "Developer"
        o = orientation.lower()
        if "developer" in o or "software" in o or "engineer" in o:
            return "Developer"
        elif "manager" in o or "business" in o:
            return "Manager"
        elif "design" in o or "creative" in o:
            return "Designer"
        elif "research" in o or "academic" in o:
            return "Researcher"
        elif "entrepreneur" in o or "startup" in o:
            return "Entrepreneur"
        return "Developer"


# Global tool executor instance
_tool_executor: Optional[ToolExecutor] = None


def get_tool_executor() -> ToolExecutor:
    """Get the global tool executor instance."""
    global _tool_executor
    if _tool_executor is None:
        _tool_executor = ToolExecutor()
    return _tool_executor


async def close_tool_executor():
    """Close the global tool executor."""
    global _tool_executor
    if _tool_executor:
        await _tool_executor.close()
        _tool_executor = None

