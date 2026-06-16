from pydantic import BaseModel, Field, field_validator
from typing import Literal

class NineBoxPredictionRequest(BaseModel):
    # Academic Metrics
    CGPA: float = Field(..., ge=0.0, le=4.0, description="Cumulative Grade Point Average (0.0 - 4.0)")
    Attendance_Rate: float = Field(..., ge=0.0, le=100.0, description="Attendance percentage (0-100)")
    Assignment_Completion_Rate: float = Field(..., ge=0.0, le=100.0, description="Assignment completion percentage (0-100)")
    
    # Skills & Competencies (Scores 0-10 based on typical 1-10 scales, assuming header sample N1003 has 10)
    # The sample data has values like 7, 5, 4, 8, 9, 3, 2, 0, 10. So range 0-10 seems correct.
    Project_Quality_Score: int = Field(..., ge=0, le=10, description="Score for project quality (0-10)")
    Communication_Skill: int = Field(..., ge=0, le=10, description="Communication skill score (0-10)")
    Teamwork_Score: int = Field(..., ge=0, le=10, description="Teamwork score (0-10)")
    Problem_Solving_Score: int = Field(..., ge=0, le=10, description="Problem solving score (0-10)")
    Leadership_Score: int = Field(..., ge=0, le=10, description="Leadership score (0-10)")
    Time_Management: int = Field(..., ge=0, le=10, description="Time management score (0-10)")
    Initiative_Taking: int = Field(..., ge=0, le=10, description="Initiative taking score (0-10)")
    Stress_Handling: int = Field(..., ge=0, le=10, description="Stress handling score (0-10)")
    
    # Experience & Activities
    Internship_Experience_Months: int = Field(..., ge=0, description="Months of internship experience")
    Extracurricular_Activities: int = Field(..., ge=0, description="Count or score of extracurricular activities")
    
    # Behavioral/Psychometric
    Learning_Agility: int = Field(..., ge=0, le=10, description="Learning agility score (0-10)")
    Adaptability: int = Field(..., ge=0, le=10, description="Adaptability score (0-10)")
    Career_Motivation: int = Field(..., ge=0, le=10, description="Career motivation score (0-10)")

class NineBoxPredictionResponse(BaseModel):
    performance_level_score: int = Field(..., description="Predicted Performance Level (0, 1, 2)")
    potential_level_score: int = Field(..., description="Predicted Potential Level (0, 1, 2)")
    nine_box_position_label: str = Field(..., description="Descriptive label of the 9-box position")
    position_in_grid: str = Field(..., description="Grid position code (e.g., 'P2L1')")
    descriptive_recommendation: str = Field(..., description="Recommendation based on the position")
