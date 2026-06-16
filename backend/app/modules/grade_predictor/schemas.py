from enum import Enum
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class Gender(str, Enum):
    Male = "Male"
    Female = "Female"

class SupportStatus(str, Enum):
    Yes = "Yes"
    No = "No"

class EducationLevel(str, Enum):
    Secondary = "Secondary"
    HigherSec = "HigherSec"
    Primary = "Primary"
    Graduate = "Graduate"
    Postgraduate = "Postgraduate"
    None_ = "None" 

class Department(str, Enum):
    CSE = "CSE"
    Arts = "Arts"
    Law = "Law"
    Business = "Business"
    Pharmacy = "Pharmacy"
    Engineering = "Engineering"
    English = "English"
    Journalism = "Journalism"

class SGPAPredictionInput(BaseModel):
    # Numerical Features
    SSC_GPA: float = Field(..., ge=0.0, le=5.0, description="SSC GPA (0.0 to 5.0)")
    HSC_GPA: float = Field(..., ge=0.0, le=5.0, description="HSC GPA (0.0 to 5.0)")
    Previous_SGPA: float = Field(..., ge=0.0, le=4.0, description="Previous SGPA (0.0 to 4.0)")
    Study_Hours_Per_Day: float = Field(..., ge=0.0, description="Average study hours per day")
    Attendance_Rate: float = Field(..., ge=0.0, le=100.0, description="Attendance rate in percentage (0-100)")
    Family_Income_BDT: float = Field(..., ge=0.0, description="Monthly family income in BDT")
    Part_Time_Hours: float = Field(..., ge=0.0, description="Hours worked part-time per week")
    
    # Categorical Features
    Father_Education: EducationLevel
    Mother_Education: EducationLevel
    Parental_Support: SupportStatus
    Active_Participation: SupportStatus
    Gender: Gender
    Department: Department

    class Config:
        schema_extra = {
            "example": {
                "SSC_GPA": 5.0,
                "HSC_GPA": 4.8,
                "Previous_SGPA": 3.75,
                "Study_Hours_Per_Day": 6.0,
                "Attendance_Rate": 95.0,
                "Family_Income_BDT": 50000.0,
                "Part_Time_Hours": 0.0,
                "Father_Education": "Graduate",
                "Mother_Education": "HigherSec",
                "Parental_Support": "Yes",
                "Active_Participation": "Yes",
                "Gender": "Male",
                "Department": "CSE"
            }
        }

class ContributingFactor(BaseModel):
    feature: str = Field(..., description="Name of the contributing feature")
    value: float | str = Field(..., description="Original value of the feature")
    impact_score: float = Field(..., description="Impact score - how much this feature affects the prediction")

class PredictionResponse(BaseModel):
    predicted_sgpa: float
    risk_level: str
    contributing_factors: List[ContributingFactor] = Field(..., description="Top contributing factors sorted by impact")


class DashboardFilters(BaseModel):
    department: Optional[str] = Field(None, description="Filter by department")
    category: Optional[str] = Field(None, description="Filter by SGPA segment: High/Mid/Low")
    parental_support: Optional[str] = Field(None, description="Filter by parental support status")
    min_study_hours: float = Field(0.0, description="Minimum study hours per day")
    min_attendance: float = Field(0.0, description="Minimum attendance percentage")


class DashboardRequest(BaseModel):
    data_source: Literal["demo", "csv"] = Field("demo", description="Source of dashboard data")
    forecast_mode: Literal["ma", "reg"] = Field("ma", description="Forecast mode: moving average or regression")
    limit: int = Field(200, ge=1, le=2000, description="Maximum number of student rows to return")
    seed: int = Field(42, ge=0, description="Seed for deterministic demo data")
    filters: Optional[DashboardFilters] = None


class DashboardOverview(BaseModel):
    total_students: int
    high_count: int
    mid_count: int
    low_count: int
    avg_previous_sgpa: float
    avg_study_hours: float
    avg_attendance: float


class CategoryDistribution(BaseModel):
    high: int
    mid: int
    low: int


class GenderSplit(BaseModel):
    male: int
    female: int


class DepartmentSummary(BaseModel):
    department: str
    avg_previous_sgpa: float
    avg_predicted_sgpa: float
    count: int


class PredictionSummary(BaseModel):
    filtered_count: int
    on_track: int
    at_risk: int
    avg_predicted: float
    pass_rate: float


class PredictionDistribution(BaseModel):
    label: str
    count: int


class DashboardStudent(BaseModel):
    student_id: int
    name: str
    department: str
    gender: str
    parental_support: str
    active_participation: str
    previous_sgpa: float
    ssc_gpa: float
    hsc_gpa: float
    study_hours_per_day: float
    attendance_rate: float
    part_time_hours: float
    category: str
    predicted_sgpa: float
    status: str


class PrescriptionItem(BaseModel):
    student_id: int
    name: str
    department: str
    category: str
    predicted_sgpa: float
    recommendations: List[str]


class ForecastSeries(BaseModel):
    labels: List[str]
    history: List[float]
    forecast: List[float]
    t1: float
    t2: float
    t3: float
    target: float
    mode: str
    cohort_plan: Optional[List[str]] = None


class DashboardResponse(BaseModel):
    overview: DashboardOverview
    category_distribution: CategoryDistribution
    gender_split: GenderSplit
    departments: List[DepartmentSummary]
    prediction_summary: PredictionSummary
    prediction_distribution: List[PredictionDistribution]
    students: List[DashboardStudent]
    prescriptions: List[PrescriptionItem]
    forecast: ForecastSeries
