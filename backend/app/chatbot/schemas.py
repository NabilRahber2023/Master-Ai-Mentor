"""
Pydantic schemas for AI Mentor Chatbot API.
Defines request/response models for chat endpoints.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from enum import Enum


class IntentType(str, Enum):
    """Supported intent types for chatbot."""
    GRADE = "grade"
    CAREER = "career"
    NINE_BOX = "9box"
    SUBJECT = "subject"
    SEARCH = "search"
    INFO = "info"
    UNKNOWN = "unknown"


class ToolCall(BaseModel):
    """Represents a tool call from the LLM."""
    tool_name: str = Field(..., description="Name of the tool to call")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Tool arguments")


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    session_id: Optional[UUID] = Field(None, description="Existing session ID")
    message: str = Field(..., min_length=1, max_length=2000, description="User message")

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": None,
                "message": "What is the predicted SGPA for student John?"
            }
        }


class StudentSummary(BaseModel):
    """Brief student info for search results."""
    student_id: str
    name: str
    district: Optional[str] = None
    preferred_department: Optional[str] = None
    current_sgpa: Optional[float] = None


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    session_id: UUID = Field(..., description="Session ID for continuation")
    message: str = Field(..., description="Response message")
    intent: Optional[str] = Field(None, description="Detected intent")
    tool_called: Optional[str] = Field(None, description="Tool that was called")
    result: Optional[Dict[str, Any]] = Field(None, description="Tool result data")
    students_found: Optional[List[StudentSummary]] = Field(None, description="Search results")
    pending_fields: Optional[Dict[str, Any]] = Field(None, description="Missing required fields")
    requires_selection: bool = Field(False, description="Whether user needs to select a student")
    requires_input: bool = Field(False, description="Whether user needs to provide missing data")

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "message": "I found the student. Their predicted SGPA is 3.45.",
                "intent": "grade",
                "tool_called": "predict_sgpa",
                "result": {"predicted_sgpa": 3.45, "risk_level": "Low Risk"},
                "requires_selection": False,
                "requires_input": False
            }
        }


class ResetRequest(BaseModel):
    """Request model for reset endpoint."""
    session_id: UUID = Field(..., description="Session ID to reset")


class ResetResponse(BaseModel):
    """Response model for reset endpoint."""
    success: bool
    message: str


class MCPToolSchema(BaseModel):
    """Schema for MCP tool definitions."""
    name: str
    description: str
    parameters: Dict[str, Any]
    required_fields: List[str]


class PredictionResult(BaseModel):
    """Generic prediction result."""
    prediction_type: str
    data: Dict[str, Any]
    confidence: Optional[float] = None


# Field mapping schemas for ML module integration
class SGPAFieldMapping(BaseModel):
    """Field mapping from student data to SGPA predictor."""
    SSC_GPA: float = Field(default=0.0)
    HSC_GPA: float
    Previous_SGPA: float
    Study_Hours_Per_Day: float
    Attendance_Rate: float
    Family_Income_BDT: float
    Part_Time_Hours: float = Field(default=0.0)
    Father_Education: str = Field(default="Graduate")
    Mother_Education: str = Field(default="Graduate")
    Parental_Support: str = Field(default="Yes")
    Active_Participation: str = Field(default="Yes")
    Gender: str
    Department: str


class CareerFieldMapping(BaseModel):
    """Field mapping from student data to Career predictor."""
    Department: str
    Personality_Type: str
    Preferred_Work_Environment: str
    Interest_Area: str
    Socioeconomic_Score: str
    CGPA: float
    Programming_Skill: int
    Math_Skill: int
    Communication_Skill: int
    Creativity_Score: int
    Problem_Solving: int
    Leadership_Score: int
    Research_Interest: int
    Public_Speaking: int = Field(default=5)
    Internship_Experience_Months: int = Field(default=0)
    Projects_Completed: int = Field(default=0)
    Extracurriculars: int = Field(default=0)


class NineBoxFieldMapping(BaseModel):
    """Field mapping from student data to 9-Box predictor."""
    CGPA: float
    Attendance_Rate: float
    Assignment_Completion_Rate: float
    Project_Quality_Score: int
    Communication_Skill: int
    Teamwork_Score: int
    Problem_Solving_Score: int
    Leadership_Score: int
    Time_Management: int
    Initiative_Taking: int
    Stress_Handling: int
    Internship_Experience_Months: int = Field(default=0)
    Extracurricular_Activities: int = Field(default=0)
    Learning_Agility: int
    Adaptability: int
    Career_Motivation: int


class SubjectFieldMapping(BaseModel):
    """Field mapping from student data to Subject predictor."""
    gender: str
    age: int
    hsc_gpa: float
    study_style: str
    math_skill_level: str
    programming_interest: str
    tech_interest_score: int
    budget_per_semester: float
    business_interest: str
    creative_interest: str
    location: str
    career_goal: str
