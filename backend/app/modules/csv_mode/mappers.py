"""
CSV-mode feature mappers.

Turn a row from the shared `students` table (the uploaded CSV) into the exact
feature inputs each trained single-student model expects. This is the bridge that
lets Grade / Career / Subject / Growth(9-Box) run directly off the dataset instead
of a manually typed form.

Each `*_features` function returns a plain dict keyed by the model's feature names
(see each module's `feature_columns.json`). The 15 extra columns added to the
dataset (see scripts/augment_dataset.py) supply the features that have no natural
source; everything else is mapped/derived from existing columns.
"""
from typing import Any, Dict, Optional

# ── primitive coercion helpers ────────────────────────────────────────────────

def f(row: Dict[str, Any], key: str, default: float = 0.0) -> float:
    v = row.get(key)
    if v is None or v == "" or v == "None":
        return default
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def i(row: Dict[str, Any], key: str, default: int = 0) -> int:
    return int(round(f(row, key, default)))


def s(row: Dict[str, Any], key: str, default: str = "") -> str:
    v = row.get(key)
    if v is None or v == "":
        return default
    return str(v)


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def level_from_int(v: float) -> str:
    """Map a 0-10 score to a Low/Medium/High band (subject model SkillLevel)."""
    if v >= 7:
        return "High"
    if v >= 4:
        return "Medium"
    return "Low"


# ── categorical mappers ───────────────────────────────────────────────────────

def gender_full(row: Dict[str, Any]) -> str:
    g = s(row, "gender", "M").strip().upper()
    if g.startswith("F"):
        return "Female"
    return "Male"  # M and 'Other' fall back to Male (models only know Male/Female)


# CSV preferred_department -> Grade model Department enum.
_GRADE_DEPT = {
    "CSE": "CSE", "SWE": "CSE", "CIS": "CSE", "Software Engineering": "CSE",
    "EEE": "Engineering", "ETE": "Engineering", "Civil": "Engineering",
    "Textile Engineering": "Engineering",
    "BBA": "Business", "Economics": "Business", "Real Estate": "Business",
    "ITM": "Business", "Tourism & Hospitality Management": "Business",
    "English": "English",
    "Journalism & Media Studies": "Journalism",
    "Multimedia & Creative Tech": "Arts", "Multimedia & Creative Technology": "Arts",
    "Architecture": "Arts",
    "D.Pharm": "Pharmacy", "Pharmacy": "Pharmacy",
    "Nutrition": "Pharmacy", "Nutrition & Food Engineering": "Pharmacy",
    "LLB": "Law",
}


def grade_department(row: Dict[str, Any]) -> str:
    return _GRADE_DEPT.get(s(row, "preferred_department"), "Engineering")


# CSV study_style -> Subject model StudyStyle enum.
_STUDY_STYLE = {
    "Mixed": "Mixed", "Visual": "Practical-heavy",
    "Analytical": "Theory-heavy", "Rote": "Theory-heavy",
    "Practical-heavy": "Practical-heavy", "Theory-heavy": "Theory-heavy",
}


def study_style(row: Dict[str, Any]) -> str:
    return _STUDY_STYLE.get(s(row, "study_style"), "Mixed")


_DHAKA = {"Dhaka", "Gazipur"}


def location(row: Dict[str, Any]) -> str:
    return "Dhaka" if s(row, "district") in _DHAKA else "Outside Dhaka"


def career_goal(row: Dict[str, Any]) -> str:
    path = s(row, "preferred_career_path").lower()
    orient = s(row, "career_orientation").lower()
    if any(k in path for k in ("entrepreneur", "founder", "startup")):
        return "Entrepreneur"
    if any(k in path for k in ("research", "scientist", "academician", "academic")) or orient == "research":
        return "Researcher"
    if any(k in path for k in ("design", "creative", "multimedia", "artist")) or orient == "creative":
        return "Designer"
    if any(k in path for k in ("manager", "analyst", "business", "consultant")) or orient == "business":
        return "Manager"
    return "Developer"


def socioeconomic(row: Dict[str, Any]) -> str:
    income = f(row, "family_income", 40000)
    if income >= 70000:
        return "High"
    if income >= 35000:
        return "Mid"
    return "Low"


def extracurricular_count(row: Dict[str, Any]) -> int:
    return {"Low": 1, "Medium": 3, "High": 6}.get(s(row, "extracurricular_involvement"), 3)


def work_environment(row: Dict[str, Any]) -> str:
    v = s(row, "preferred_work_environment")
    if v in ("Remote", "Hybrid", "Office"):
        return v
    return {"Solo": "Remote", "Team": "Office", "Hybrid": "Hybrid"}.get(s(row, "work_style"), "Hybrid")


def personality_type(row: Dict[str, Any]) -> str:
    v = s(row, "personality_type").strip().upper()
    valid = {
        "ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP",
        "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ",
    }
    return v if v in valid else "ISTJ"


def _edu(v: str) -> str:
    valid = {"None", "Primary", "Secondary", "HigherSec", "Graduate", "Postgraduate"}
    return v if v in valid else "Secondary"


# ── per-model feature builders (keys == model feature_columns.json) ───────────

def grade_features(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "SSC_GPA": clamp(f(row, "ssc_gpa", f(row, "hsc_gpa", 4.0)), 0.0, 5.0),
        "HSC_GPA": clamp(f(row, "hsc_gpa", 4.0), 0.0, 5.0),
        "Previous_SGPA": clamp(f(row, "current_sgpa", 3.0), 0.0, 4.0),
        "Study_Hours_Per_Day": clamp(f(row, "study_hours_weekly", 14.0) / 7.0, 0.0, 24.0),
        "Attendance_Rate": clamp(f(row, "attendance_rate", 80.0), 0.0, 100.0),
        "Father_Education": _edu(s(row, "father_education", "Secondary")),
        "Mother_Education": _edu(s(row, "mother_education", "Secondary")),
        "Family_Income_BDT": max(0.0, f(row, "family_income", 40000.0)),
        "Part_Time_Hours": max(0.0, f(row, "part_time_hours", 0.0)),
        "Parental_Support": "Yes" if s(row, "parental_support", "Yes") == "Yes" else "No",
        "Active_Participation": "Yes" if s(row, "active_participation", "No") == "Yes" else "No",
        "Gender": gender_full(row),
        "Department": grade_department(row),
    }


def career_features(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "Department": s(row, "preferred_department", "CSE") or "CSE",
        "CGPA": clamp(f(row, "current_sgpa", 3.0), 0.0, 4.0),
        "Programming_Skill": int(clamp(i(row, "programming_interest", 5), 0, 10)),
        "Math_Skill": int(clamp(i(row, "math_skill", 5), 0, 10)),
        "Communication_Skill": int(clamp(i(row, "communication_skill", 5), 0, 10)),
        "Creativity_Score": int(clamp(i(row, "creative_interest", 5), 0, 10)),
        "Problem_Solving": int(clamp(i(row, "problem_solving_score", 5), 0, 10)),
        "Leadership_Score": int(clamp(i(row, "leadership_indicator", 5), 0, 10)),
        "Research_Interest": int(clamp(i(row, "research_interest_score", 5), 0, 10)),
        "Public_Speaking": int(clamp(i(row, "public_speaking", 5), 0, 10)),
        "Internship_Experience_Months": max(0, i(row, "internship_experience_months", 0)),
        "Projects_Completed": max(0, i(row, "projects_completed", 0)),
        "Extracurriculars": extracurricular_count(row),
        "Personality_Type": personality_type(row),
        "Preferred_Work_Environment": work_environment(row),
        "Interest_Area": s(row, "interest_area", "General") or "General",
        "Socioeconomic_Score": socioeconomic(row),
    }


def subject_features(row: Dict[str, Any]) -> Dict[str, Any]:
    tech = f(row, "tech_score", 5.0)
    tech_100 = tech * 10 if tech <= 10 else tech
    return {
        "gender": gender_full(row),
        "age": int(clamp(i(row, "age", 21), 15, 40)),
        "hsc_gpa": clamp(f(row, "hsc_gpa", 4.0), 0.0, 5.0),
        "study_style": study_style(row),
        "math_skill_level": level_from_int(f(row, "math_skill", 5)),
        "programming_interest": level_from_int(f(row, "programming_interest", 5)),
        "tech_interest_score": int(clamp(tech_100, 0, 100)),
        "budget_per_semester": max(0.0, f(row, "budget_per_semester", 50000.0)),
        "business_interest": level_from_int(f(row, "business_interest", 5)),
        "creative_interest": level_from_int(f(row, "creative_interest", 5)),
        "location": location(row),
        "career_goal": career_goal(row),
    }


def growth_features(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "CGPA": clamp(f(row, "current_sgpa", 3.0), 0.0, 4.0),
        "Attendance_Rate": clamp(f(row, "attendance_rate", 80.0), 0.0, 100.0),
        "Assignment_Completion_Rate": clamp(f(row, "assignment_completion_rate", 85.0), 0.0, 100.0),
        "Project_Quality_Score": int(clamp(i(row, "project_skill_score", 5), 0, 10)),
        "Communication_Skill": int(clamp(i(row, "communication_skill", 5), 0, 10)),
        "Teamwork_Score": int(clamp(i(row, "teamwork_score", 5), 0, 10)),
        "Problem_Solving_Score": int(clamp(i(row, "problem_solving_score", 5), 0, 10)),
        "Leadership_Score": int(clamp(i(row, "leadership_indicator", 5), 0, 10)),
        "Time_Management": int(clamp(i(row, "productivity_score", 5), 0, 10)),
        "Initiative_Taking": int(clamp(i(row, "initiative_score", 5), 0, 10)),
        "Stress_Handling": int(clamp(i(row, "stress_management", 5), 0, 10)),
        "Internship_Experience_Months": max(0, i(row, "internship_experience_months", 0)),
        "Extracurricular_Activities": extracurricular_count(row),
        "Learning_Agility": int(clamp(i(row, "learning_agility", 5), 0, 10)),
        "Adaptability": int(clamp(i(row, "adaptability", 5), 0, 10)),
        "Career_Motivation": int(clamp(i(row, "career_motivation", 5), 0, 10)),
    }
