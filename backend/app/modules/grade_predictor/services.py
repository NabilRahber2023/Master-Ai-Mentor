from typing import List
import random
import pandas as pd
import shap
from app.core.sgpa_ml_engine import sgpa_ml_engine
from app.modules.grade_predictor.schemas import (
    SGPAPredictionInput,
    PredictionResponse,
    ContributingFactor,
    DashboardRequest,
    DashboardResponse,
    DashboardOverview,
    CategoryDistribution,
    GenderSplit,
    DepartmentSummary,
    PredictionSummary,
    PredictionDistribution,
    DashboardStudent,
    PrescriptionItem,
    ForecastSeries,
)

class GradePredictorService:
    def __init__(self):
        self._explainer = None
    
    def _get_explainer(self):
        """Lazy load SHAP explainer"""
        if self._explainer is None:
            model = sgpa_ml_engine.get_model()
            self._explainer = shap.TreeExplainer(model)
        return self._explainer
    
    def predict_sgpa(self, input_data: SGPAPredictionInput) -> PredictionResponse:
        model = sgpa_ml_engine.get_model()
        feature_columns = sgpa_ml_engine.get_feature_columns()

        # Convert input to dictionary
        input_dict = input_data.dict()
        
        # Prepare data in the correct order as expected by the model
        # We need to ensure the order matches feature_columns
        # CatBoost can handle categorical features if passed correctly (e.g. as strings in a DataFrame or Pool)
        # Since we trained with specific columns, we should match them.
        
        # Create a DataFrame for prediction to preserve column names and types
        # This is safer than passing a list if we have feature names in the model
        input_df = pd.DataFrame([input_dict])
        
        # Ensure only relevant columns are passed and in correct order
        try:
            input_df = input_df[feature_columns]
        except KeyError as e:
             raise ValueError(f"Input data missing expected features: {e}")
             
        # Convert categorical columns to string to match training
        # We assume any column that was categorical in training (needed to be string) 
        # is also categorical here. The model knows which features are categorical.
        # But for safety, let's cast object columns to string or just all non-numeric if possible?
        # A safer approach is relying on the features list if we knew types.
        # But simpler: basic types are float/int. Enums are objects.
        # Let's iterate over columns and check if they are categorical in schema.
        # Or simpler:
        for col in input_df.columns:
            if input_df[col].dtype == 'object':
                 input_df[col] = input_df[col].astype(str)

        # Predict
        predicted_sgpa = model.predict(input_df)[0]
        
        # Clip result to valid range [0.0, 4.0] (assuming 4.0 scale strictly, though input validation allowed 0-5 for SSC/HSC, SGPA is usually 4.0 max)
        # But let's just use raw prediction or clip if it exceeds reasonable bounds.
        # User requirement says "Predict the continuous numerical value".
        predicted_sgpa = max(0.0, min(4.0, predicted_sgpa))

        # Risk Level Logic
        risk_level = self._calculate_risk_level(predicted_sgpa)
        
        # Calculate contributing factors using SHAP
        contributing_factors = self._calculate_contributing_factors(input_df, input_dict, feature_columns)

        return PredictionResponse(
            predicted_sgpa=round(predicted_sgpa, 2),
            risk_level=risk_level,
            contributing_factors=contributing_factors
        )

    def _calculate_risk_level(self, sgpa: float) -> str:
        if sgpa < 2.5:
            return "High Risk"
        elif sgpa < 3.0:
            return "Medium Risk"
        else:
            return "Low Risk"
    
    def _calculate_contributing_factors(
        self, 
        input_df: pd.DataFrame, 
        input_dict: dict,
        feature_columns: List[str]
    ) -> List[ContributingFactor]:
        """Calculate contributing factors using SHAP values"""
        try:
            explainer = self._get_explainer()
            shap_values = explainer.shap_values(input_df)
            
            # shap_values is a 1D array for single prediction
            if isinstance(shap_values, list):
                shap_values = shap_values[0]
            
            # Create list of (feature_name, original_value, shap_value) tuples
            factors = []
            for i, feature_name in enumerate(feature_columns):
                original_value = input_dict[feature_name]
                shap_value = float(shap_values[0][i]) if len(shap_values.shape) > 1 else float(shap_values[i])
                
                factors.append({
                    'feature': feature_name,
                    'value': original_value,
                    'shap_value': shap_value,
                    'abs_shap': abs(shap_value)
                })
            
            # Sort by absolute SHAP value (impact magnitude) in descending order
            factors.sort(key=lambda x: x['abs_shap'], reverse=True)
            
            # Return top 5 contributing factors
            top_factors = []
            for factor in factors[:5]:
                # Create human-readable feature name
                feature_label = self._format_feature_name(factor['feature'])
                
                top_factors.append(ContributingFactor(
                    feature=feature_label,
                    value=factor['value'],
                    impact_score=round(factor['abs_shap'], 4)
                ))
            
            return top_factors
            
        except Exception as e:
            # If SHAP calculation fails, return empty list
            # This ensures the API doesn't break
            print(f"Error calculating SHAP values: {e}")
            return []
    
    def _format_feature_name(self, feature: str) -> str:
        """Convert feature name to human-readable format"""
        # Map technical names to user-friendly names
        name_mapping = {
            'SSC_GPA': 'SSC GPA',
            'HSC_GPA': 'HSC GPA',
            'Previous_SGPA': 'Previous SGPA',
            'Study_Hours_Per_Day': 'Study Hours Per Day',
            'Attendance_Rate': 'Attendance Rate',
            'Father_Education': "Father's Education",
            'Mother_Education': "Mother's Education",
            'Family_Income_BDT': 'Family Income',
            'Part_Time_Hours': 'Part-Time Work Hours',
            'Parental_Support': 'Parental Support',
            'Active_Participation': 'Active Participation',
            'Gender': 'Gender',
            'Department': 'Department'
        }
        return name_mapping.get(feature, feature.replace('_', ' ').title())

grade_predictor_service = GradePredictorService()


_NAMES = [
    "Rahim", "Karim", "Sadia", "Nasrin", "Tanvir", "Mehedi", "Ayesha", "Jannatul",
    "Shakil", "Faisal", "Raihan", "Sumaiya", "Rifat", "Nadia", "Arif", "Tahmina",
    "Sabbir", "Mitu", "Rakib", "Tania", "Omar", "Shirin", "Imran", "Fatema",
    "Noman", "Ritu", "Zahid", "Mim", "Akash", "Priya", "Farhan", "Suma",
    "Shohel", "Lima", "Rubel", "Riya", "Mamun", "Dipa", "Sagor", "Puja",
    "Badrul", "Reshma", "Limon", "Tamanna", "Milon", "Khadija", "Fahim", "Sharmin",
    "Saikat", "Mousumi",
]

_DEPARTMENTS = ["CSE", "EEE", "BBA", "Civil", "Textile", "Pharmacy"]
_PARENTAL_SUPPORT = ["High", "Medium", "Low", "None"]
_PARTICIPATION = ["Active", "Moderate", "Passive"]
_GENDERS = ["Male", "Female"]


def _score_prediction(student: dict, noise: float) -> float:
    parent_score = {"High": 1.0, "Medium": 0.7, "Low": 0.35, "None": 0.1}[student["parental_support"]]
    participation_score = {"Active": 1.0, "Moderate": 0.65, "Passive": 0.3}[student["active_participation"]]
    raw = (
        0.33 * student["previous_sgpa"]
        + 0.17 * (student["study_hours_per_day"] / 9.0 * 4.0)
        + 0.13 * (student["attendance_rate"] / 100.0 * 4.0)
        + 0.11 * parent_score * 4.0
        + 0.08 * (student["ssc_gpa"] / 5.0 * 4.0)
        + 0.07 * (student["hsc_gpa"] / 5.0 * 4.0)
        + 0.06 * participation_score * 4.0
        - 0.05 * (student["part_time_hours"] / 6.0 * 4.0)
        + noise
    )
    return max(1.0, min(4.0, round(raw, 2)))


def _segment(previous_sgpa: float) -> str:
    if previous_sgpa >= 3.5:
        return "High"
    if previous_sgpa >= 2.5:
        return "Mid"
    return "Low"


def _recommendations(student: dict) -> List[str]:
    recs: List[str] = []
    if student["study_hours_per_day"] < 4:
        recs.append(
            f"Study time is low ({student['study_hours_per_day']} hrs/day) — target 4-6 hrs minimum"
        )
    if student["attendance_rate"] < 85:
        recs.append(
            f"Attendance at {student['attendance_rate']}% — must reach >=85% to avoid penalty"
        )
    if student["part_time_hours"] > 4:
        recs.append(
            f"Part-time work ({student['part_time_hours']} hrs/day) is high — reduce to <=4 hrs"
        )
    if student["active_participation"] == "Passive":
        recs.append("Participate actively in class — ask questions, join discussions")
    if student["ssc_gpa"] < 3.5 or student["hsc_gpa"] < 3.5:
        recs.append("Weak secondary foundation (SSC/HSC) — follow a structured revision plan for core subjects")
    if student["parental_support"] in {"None", "Low"}:
        recs.append("Lack of home support — join a peer study group or request faculty mentoring")
    if student["category"] == "Low":
        recs.append("Enroll in academic counseling to build a personalized semester recovery plan")
    if not recs:
        recs.append("Maintain current routine; focus on completing all assignments on time")
    return recs


def build_dashboard(request: DashboardRequest) -> DashboardResponse:
    rng = random.Random(request.seed)

    students: List[dict] = []
    for i in range(request.limit):
        department = rng.choice(_DEPARTMENTS)
        gender = rng.choice(_GENDERS)
        parental_support = rng.choice(_PARENTAL_SUPPORT)
        active_participation = rng.choice(_PARTICIPATION)
        previous_sgpa = round(rng.uniform(1.6, 4.0), 2)
        ssc_gpa = round(rng.uniform(2.5, 5.0), 2)
        hsc_gpa = round(rng.uniform(2.5, 5.0), 2)
        study_hours = round(rng.uniform(1.0, 9.0), 1)
        attendance = int(round(rng.uniform(50.0, 100.0)))
        part_time = int(round(rng.uniform(0.0, 6.0)))
        noise = round(rng.uniform(-0.25, 0.25), 2)

        category = _segment(previous_sgpa)
        student = {
            "student_id": i + 1,
            "name": f"{_NAMES[i % len(_NAMES)]} {i + 1}",
            "department": department,
            "gender": gender,
            "parental_support": parental_support,
            "active_participation": active_participation,
            "previous_sgpa": previous_sgpa,
            "ssc_gpa": ssc_gpa,
            "hsc_gpa": hsc_gpa,
            "study_hours_per_day": study_hours,
            "attendance_rate": attendance,
            "part_time_hours": part_time,
            "category": category,
        }
        student["predicted_sgpa"] = _score_prediction(student, noise)
        student["status"] = "On track" if student["predicted_sgpa"] >= 3.5 else "At risk"
        students.append(student)

    filters = request.filters
    if filters:
        students = [
            s
            for s in students
            if (not filters.department or s["department"] == filters.department)
            and (not filters.category or s["category"] == filters.category)
            and (not filters.parental_support or s["parental_support"] == filters.parental_support)
            and s["study_hours_per_day"] >= filters.min_study_hours
            and s["attendance_rate"] >= filters.min_attendance
        ]

    total_students = len(students)
    high_count = sum(1 for s in students if s["category"] == "High")
    mid_count = sum(1 for s in students if s["category"] == "Mid")
    low_count = sum(1 for s in students if s["category"] == "Low")
    avg_prev = round(sum(s["previous_sgpa"] for s in students) / total_students, 2) if total_students else 0.0
    avg_study = round(sum(s["study_hours_per_day"] for s in students) / total_students, 1) if total_students else 0.0
    avg_attendance = int(round(sum(s["attendance_rate"] for s in students) / total_students)) if total_students else 0

    overview = DashboardOverview(
        total_students=total_students,
        high_count=high_count,
        mid_count=mid_count,
        low_count=low_count,
        avg_previous_sgpa=avg_prev,
        avg_study_hours=avg_study,
        avg_attendance=avg_attendance,
    )

    category_distribution = CategoryDistribution(high=high_count, mid=mid_count, low=low_count)
    gender_split = GenderSplit(
        male=sum(1 for s in students if s["gender"] == "Male"),
        female=sum(1 for s in students if s["gender"] == "Female"),
    )

    departments: List[DepartmentSummary] = []
    for dept in sorted({s["department"] for s in students}):
        dept_students = [s for s in students if s["department"] == dept]
        if not dept_students:
            continue
        avg_prev_dept = round(sum(s["previous_sgpa"] for s in dept_students) / len(dept_students), 2)
        avg_pred_dept = round(sum(s["predicted_sgpa"] for s in dept_students) / len(dept_students), 2)
        departments.append(
            DepartmentSummary(
                department=dept,
                avg_previous_sgpa=avg_prev_dept,
                avg_predicted_sgpa=avg_pred_dept,
                count=len(dept_students),
            )
        )

    on_track = sum(1 for s in students if s["predicted_sgpa"] >= 3.5)
    at_risk = total_students - on_track
    avg_predicted = round(sum(s["predicted_sgpa"] for s in students) / total_students, 2) if total_students else 0.0
    pass_rate = round(on_track / total_students * 100, 0) if total_students else 0.0
    prediction_summary = PredictionSummary(
        filtered_count=total_students,
        on_track=on_track,
        at_risk=at_risk,
        avg_predicted=avg_predicted,
        pass_rate=pass_rate,
    )

    bins = [
        ("1.0-1.9", 1.0, 2.0),
        ("2.0-2.4", 2.0, 2.5),
        ("2.5-2.9", 2.5, 3.0),
        ("3.0-3.4", 3.0, 3.5),
        ("3.5-3.9", 3.5, 4.0),
        ("4.0", 4.0, 4.01),
    ]
    prediction_distribution = [
        PredictionDistribution(
            label=label,
            count=sum(1 for s in students if lo <= s["predicted_sgpa"] < hi),
        )
        for label, lo, hi in bins
    ]

    prescriptions: List[PrescriptionItem] = []
    for s in students:
        if s["predicted_sgpa"] < 3.5:
            prescriptions.append(
                PrescriptionItem(
                    student_id=s["student_id"],
                    name=s["name"],
                    department=s["department"],
                    category=s["category"],
                    predicted_sgpa=s["predicted_sgpa"],
                    recommendations=_recommendations(s),
                )
            )

    if total_students:
        base = sum(s["previous_sgpa"] for s in students) / total_students
    else:
        base = 0.0
    history = [round(base - 0.24, 2), round(base - 0.16, 2), round(base - 0.07, 2), round(base + 0.01, 2), round(base, 2)]
    if request.forecast_mode == "ma":
        t1 = round((history[2] + history[3] + history[4]) / 3, 2)
        t2 = round((history[3] + history[4] + t1) / 3, 2)
        t3 = round((history[4] + t1 + t2) / 3, 2)
    else:
        n = len(history)
        xm = (n - 1) / 2
        ym = sum(history) / n
        num = sum((i - xm) * (v - ym) for i, v in enumerate(history))
        den = sum((i - xm) ** 2 for i in range(n)) or 1
        slope = num / den
        intercept = ym - slope * xm
        t1 = round(intercept + slope * 5, 2)
        t2 = round(intercept + slope * 6, 2)
        t3 = round(intercept + slope * 7, 2)

    forecast_values = [history[4], t1, t2, t3]
    plan = None
    if t3 < 3.5:
        plan = [
            "Launch peer tutoring across all departments",
            "Add academic support sessions before midterms",
            "Mandate study-skills workshops for low-segment students",
            "Review and enforce attendance policy",
            "Set up student-advisor check-ins every 3 weeks",
        ]

    forecast = ForecastSeries(
        labels=["Term -4", "Term -3", "Term -2", "Term -1", "Current", "T+1", "T+2", "T+3"],
        history=history,
        forecast=forecast_values,
        t1=t1,
        t2=t2,
        t3=t3,
        target=3.5,
        mode=request.forecast_mode,
        cohort_plan=plan,
    )

    dashboard_students = [DashboardStudent(**s) for s in students]

    return DashboardResponse(
        overview=overview,
        category_distribution=category_distribution,
        gender_split=gender_split,
        departments=departments,
        prediction_summary=prediction_summary,
        prediction_distribution=prediction_distribution,
        students=dashboard_students,
        prescriptions=prescriptions,
        forecast=forecast,
    )

