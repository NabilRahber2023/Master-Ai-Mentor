"""
Pydantic schemas for the Batch Prediction module.

These power the cohort-level dashboard: a dataset overview, a filtered
prediction view (KPIs + charts + table), an AI prescription engine, and a
CGPA forecast — all computed live from the `students` table.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


# ──────────────────────────── Filters ────────────────────────────
class BatchFilters(BaseModel):
    """Filter set shared by the prediction + prescription views."""
    department: str = "All"
    category: str = "All"          # All | High | Mid | Low (by current SGPA)
    gender: str = "All"            # All | Male | Female | Other
    min_study_hours: int = 0       # per-day threshold (0 = Any)
    min_attendance: int = 0        # percent threshold (0 = >0%)


# ──────────────────────────── Overview ────────────────────────────
class DepartmentAvg(BaseModel):
    department: str
    avg_sgpa: float
    count: int


class GenderSplit(BaseModel):
    male: int
    female: int
    other: int
    total: int


class OverviewResponse(BaseModel):
    total_students: int
    high: int
    mid: int
    low: int
    avg_sgpa: float
    avg_study_hours: float         # per-day
    avg_attendance: float          # percent
    high_pct: float
    mid_pct: float
    low_pct: float
    department_avgs: List[DepartmentAvg]
    gender: GenderSplit


# ──────────────────────────── Prediction ────────────────────────────
class StudentRow(BaseModel):
    id: str
    name: str
    dept: str
    category: str                  # High | Mid | Low
    prev_sgpa: float
    study_hrs: int                 # per-day
    attendance: int                # percent
    predicted: float
    status: str                    # On track | At risk


class ScatterPoint(BaseModel):
    prev_sgpa: float
    predicted: float
    status: str


class PredictKpis(BaseModel):
    filtered: int
    on_track: int
    at_risk: int
    avg_predicted: float
    pass_rate: int                 # percent


class PredictResponse(BaseModel):
    kpis: PredictKpis
    distribution_bins: List[str]
    distribution_counts: List[int]
    scatter: List[ScatterPoint]
    students: List[StudentRow]
    showing: int
    total: int


# ──────────────────────────── Prescriptions ────────────────────────────
class PrescriptionRequest(BaseModel):
    filters: BatchFilters = Field(default_factory=BatchFilters)
    target: str = "At risk"        # At risk | Mid
    search: str = ""


class PrescriptionCard(BaseModel):
    id: str
    name: str
    dept: str
    predicted: float
    status: str
    recommendations: List[str]


class PrescriptionResponse(BaseModel):
    target: str
    count: int
    cards: List[PrescriptionCard]


# ──────────────────────────── Forecast ────────────────────────────
class TrendPoint(BaseModel):
    term: str
    value: float
    type: str                      # historical | forecast


class DeptForecast(BaseModel):
    department: str
    current_avg: float
    predicted_avg: float


class ForecastResponse(BaseModel):
    trend: List[TrendPoint]
    forecast_t1: float
    forecast_t2: float
    forecast_t3: float
    target: float
    below_target: bool
    department_breakdown: List[DeptForecast]
