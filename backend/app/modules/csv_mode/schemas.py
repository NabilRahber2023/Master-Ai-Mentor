"""Response schemas for CSV-mode prediction endpoints."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class StudentBrief(BaseModel):
    student_id: str
    name: str
    department: Optional[str] = None
    gender: Optional[str] = None
    current_sgpa: Optional[float] = None


class StudentListResponse(BaseModel):
    students: List[StudentBrief]
    total: int
    showing: int


# ── Single-prediction wrappers (carry student context + the mapped inputs) ────
class CsvSingleResult(BaseModel):
    student: StudentBrief
    inputs: Dict[str, Any]
    prediction: Dict[str, Any]


# ── Batch (whole-cohort) responses ────────────────────────────────────────────
class Bucket(BaseModel):
    label: str
    count: int


class GradeBatchRow(BaseModel):
    student_id: str
    name: str
    department: Optional[str] = None
    previous_sgpa: float
    predicted_sgpa: float
    risk_level: str


class GradeBatchResponse(BaseModel):
    total: int
    avg_predicted: float
    on_track: int
    at_risk: int
    pass_rate: float
    distribution: List[Bucket]
    students: List[GradeBatchRow]
    showing: int


class CareerBatchRow(BaseModel):
    student_id: str
    name: str
    department: Optional[str] = None
    predicted_career: str
    confidence: float


class CareerBatchResponse(BaseModel):
    total: int
    avg_confidence: float
    career_distribution: List[Bucket]
    students: List[CareerBatchRow]
    showing: int


class SubjectBatchRow(BaseModel):
    student_id: str
    name: str
    current_department: Optional[str] = None
    recommended_department: str
    confidence: float


class SubjectBatchResponse(BaseModel):
    total: int
    avg_confidence: float
    recommendation_distribution: List[Bucket]
    match_rate: float  # % whose recommendation matches their current preferred dept
    students: List[SubjectBatchRow]
    showing: int


class GrowthBatchRow(BaseModel):
    student_id: str
    name: str
    department: Optional[str] = None
    performance_level: int
    potential_level: int
    position: str
    label: str


class GridCell(BaseModel):
    position: str
    label: str
    count: int


class GrowthBatchResponse(BaseModel):
    total: int
    stars: int
    risks: int
    grid: List[GridCell]
    students: List[GrowthBatchRow]
    showing: int
