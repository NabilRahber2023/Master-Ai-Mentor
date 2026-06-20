from pydantic import BaseModel, Field, validator
from enum import Enum
from typing import List, Optional

class PersonalityType(str, Enum):
    ISTJ = "ISTJ"
    ISFJ = "ISFJ"
    INFJ = "INFJ"
    INTJ = "INTJ"
    ISTP = "ISTP"
    ISFP = "ISFP"
    INFP = "INFP"
    INTP = "INTP"
    ESTP = "ESTP"
    ESFP = "ESFP"
    ENFP = "ENFP"
    ENTP = "ENTP"
    ESTJ = "ESTJ"
    ESFJ = "ESFJ"
    ENFJ = "ENFJ"
    ENTJ = "ENTJ"

class WorkEnvironment(str, Enum):
    Remote = "Remote"
    Hybrid = "Hybrid"
    Office = "Office"

class SocioeconomicScore(str, Enum):
    Low = "Low"
    Mid = "Mid"
    High = "High"

class CareerPredictionRequest(BaseModel):
    # Categorical
    Department: str
    Personality_Type: PersonalityType
    Preferred_Work_Environment: WorkEnvironment
    Interest_Area: str
    Socioeconomic_Score: SocioeconomicScore

    # Numerical
    CGPA: float = Field(..., ge=0.0, le=4.0)
    Programming_Skill: int = Field(..., ge=0, le=10)
    Math_Skill: int = Field(..., ge=0, le=10)
    Communication_Skill: int = Field(..., ge=0, le=10)
    Creativity_Score: int = Field(..., ge=0, le=10)
    Problem_Solving: int = Field(..., ge=0, le=10)
    Leadership_Score: int = Field(..., ge=0, le=10)
    Research_Interest: int = Field(..., ge=0, le=10)
    Public_Speaking: int = Field(..., ge=0, le=10)
    Internship_Experience_Months: int = Field(..., ge=0)
    Projects_Completed: int = Field(..., ge=0)
    Extracurriculars: int = Field(..., ge=0)

class CareerPath(BaseModel):
    career: str
    probability: float

class ContributingFactor(BaseModel):
    feature: str
    value: float | str
    impact_score: float

class CareerPredictionResponse(BaseModel):
    predicted_career: str
    confidence_score: float
    alternative_paths: List[CareerPath]
    contributing_factors: List[ContributingFactor] = []
