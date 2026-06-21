"""
Database models for AI Mentor Chatbot.
Includes students table with pgvector embeddings and chat_sessions table.
"""
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Text, JSON,
    func
)
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from app.chatbot.database import Base


class Student(Base):
    """
    Student table matching exact dataset columns.
    Includes embedding column for semantic search.
    """
    __tablename__ = "students"

    # Primary Key
    student_id = Column(String(50), primary_key=True, index=True)
    
    # Basic Info
    name = Column(String(255), nullable=False, index=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    district = Column(String(100), nullable=True)
    
    # Financial
    family_income = Column(Float, nullable=True)
    budget_per_semester = Column(Float, nullable=True)
    
    # Academic Style
    study_style = Column(String(50), nullable=True)
    attendance_rate = Column(Float, nullable=True)
    hsc_gpa = Column(Float, nullable=True)
    
    # Skills Assessment
    english_proficiency = Column(Integer, nullable=True)
    math_skill = Column(Integer, nullable=True)
    memory_strength = Column(Integer, nullable=True)
    stress_management = Column(Integer, nullable=True)
    
    # Study Behavior
    study_hours_weekly = Column(Float, nullable=True)
    assignment_completion_rate = Column(Float, nullable=True)
    class_participation = Column(Integer, nullable=True)
    
    # Project & Research
    project_skill_score = Column(Integer, nullable=True)
    research_interest_score = Column(Integer, nullable=True)
    extracurricular_involvement = Column(String(100), nullable=True)
    
    # Academic Performance
    current_sgpa = Column(Float, nullable=True)
    past_semester_sgpa_1 = Column(Float, nullable=True)
    past_semester_sgpa_2 = Column(Float, nullable=True)
    next_semester_sgpa = Column(Float, nullable=True)  # NULL during prediction
    
    # Leadership & Productivity
    leadership_indicator = Column(Integer, nullable=True)
    productivity_score = Column(Integer, nullable=True)
    initiative_score = Column(Integer, nullable=True)
    
    # Interests (0-10 scale)
    programming_interest = Column(Integer, nullable=True)
    business_interest = Column(Integer, nullable=True)
    creative_interest = Column(Integer, nullable=True)
    hardware_interest = Column(Integer, nullable=True)
    math_interest = Column(Integer, nullable=True)
    
    # Soft Skills
    communication_skill = Column(Integer, nullable=True)
    analytical_skill = Column(Integer, nullable=True)
    problem_solving_score = Column(Integer, nullable=True)
    
    # Preferences
    preferred_department = Column(String(100), nullable=True)
    personality_type = Column(String(10), nullable=True)
    
    # Computed Scores
    tech_score = Column(Float, nullable=True)
    business_score = Column(Float, nullable=True)
    creative_score = Column(Float, nullable=True)
    research_score = Column(Float, nullable=True)
    
    # Work & Career
    work_style = Column(String(50), nullable=True)
    soft_skill_score = Column(Float, nullable=True)
    career_orientation = Column(String(100), nullable=True)
    preferred_career_path = Column(String(100), nullable=True)
    
    # 9-Box Grid
    performance_score = Column(Integer, nullable=True)
    potential_score = Column(Integer, nullable=True)
    nine_box_position = Column(String(50), nullable=True)

    # Extra features required by the single-student ML models for CSV mode.
    # (Grade, Career, Growth/9-Box predictors expect these; synthesised in the
    # dataset so every module can run directly off the uploaded CSV.)
    ssc_gpa = Column(Float, nullable=True)
    father_education = Column(String(20), nullable=True)
    mother_education = Column(String(20), nullable=True)
    part_time_hours = Column(Float, nullable=True)
    parental_support = Column(String(10), nullable=True)
    active_participation = Column(String(10), nullable=True)
    public_speaking = Column(Integer, nullable=True)
    internship_experience_months = Column(Integer, nullable=True)
    projects_completed = Column(Integer, nullable=True)
    preferred_work_environment = Column(String(20), nullable=True)
    interest_area = Column(String(50), nullable=True)
    teamwork_score = Column(Integer, nullable=True)
    learning_agility = Column(Integer, nullable=True)
    adaptability = Column(Integer, nullable=True)
    career_motivation = Column(Integer, nullable=True)

    # Vector Embedding for semantic search (384 dimensions for MiniLM)
    embedding = Column(Vector(384), nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=func.now(), nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary, excluding embedding."""
        return {
            col.name: getattr(self, col.name)
            for col in self.__table__.columns
            if col.name != 'embedding'
        }


class ChatSession(Base):
    """
    Chat session table for maintaining conversation state.
    Stores selected student, pending fields, last intent, and conversation memory.
    """
    __tablename__ = "chat_sessions"

    session_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    selected_student_id = Column(String(50), nullable=True)
    last_resolved_student_id = Column(String(50), nullable=True)  # Memory: last resolved
    pending_fields = Column(JSON, nullable=True, default=dict)
    last_intent = Column(String(50), nullable=True)
    last_tool_called = Column(String(50), nullable=True)  # Memory: last tool
    last_tool_summary = Column(Text, nullable=True)  # Memory: tool result summary
    context = Column(JSON, nullable=True, default=dict)  # Additional context storage
    updated_at = Column(
        DateTime,
        default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary."""
        return {
            "session_id": str(self.session_id),
            "selected_student_id": self.selected_student_id,
            "last_resolved_student_id": self.last_resolved_student_id,
            "pending_fields": self.pending_fields,
            "last_intent": self.last_intent,
            "last_tool_called": self.last_tool_called,
            "last_tool_summary": self.last_tool_summary,
            "context": self.context,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
