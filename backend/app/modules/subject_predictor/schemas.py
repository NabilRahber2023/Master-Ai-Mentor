from enum import Enum
from pydantic import BaseModel, Field, field_validator
from typing import List

class SkillLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class StudyStyle(str, Enum):
    PRACTICAL_HEAVY = "Practical-heavy"
    MIXED = "Mixed"
    THEORY_HEAVY = "Theory-heavy"

class Location(str, Enum):
    DHAKA = "Dhaka"
    OUTSIDE_DHAKA = "Outside Dhaka"
    INTERNATIONAL = "International"

class CareerGoal(str, Enum):
    DEVELOPER = "Developer"
    MANAGER = "Manager"
    DESIGNER = "Designer"
    RESEARCHER = "Researcher"
    ENTREPRENEUR = "Entrepreneur"

class SubjectPredictionInput(BaseModel):
    gender: str = Field(..., pattern="^(Male|Female)$", description="Gender (Male/Female)")
    age: int = Field(..., ge=15, le=40, description="Age of the student")
    hsc_gpa: float = Field(..., ge=0.0, le=5.0, description="HSC GPA (0.0 - 5.0)")
    study_style: StudyStyle
    math_skill_level: SkillLevel
    programming_interest: SkillLevel
    tech_interest_score: int = Field(..., ge=0, le=100, description="Tech interest score (0-100)")
    budget_per_semester: float = Field(..., ge=0, description="Budget per semester (min 0)")
    business_interest: SkillLevel
    creative_interest: SkillLevel
    location: Location
    career_goal: CareerGoal

    @field_validator('gender')
    @classmethod
    def validate_gender(cls, v):
        return v.title()

class AlternativeOption(BaseModel):
    department: str
    probability: float

class ContributingFactor(BaseModel):
    feature: str
    value: float | str
    impact_score: float

class SubjectPredictionOutput(BaseModel):
    recommended_department: str
    confidence_score: float
    alternative_options: List[AlternativeOption]
    contributing_factors: List[ContributingFactor] = []
