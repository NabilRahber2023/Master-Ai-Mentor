"""
Service layer for the Batch Prediction module.

Everything is computed directly from the live `students` table (the same table
the chatbot and CSV ingestion use), so the dashboard always reflects the most
recently uploaded dataset. Predictions use the dataset's `next_semester_sgpa`
target (falling back to current SGPA), clamped to the 0–4 SGPA range.

All queries are parameterised SQL via the shared async session.
"""
from typing import Dict, List, Tuple

from sqlalchemy import text

from app.chatbot.database import async_session_maker
from app.modules.batch_predictor.schemas import (
    BatchFilters,
    DepartmentAvg,
    DeptForecast,
    ForecastResponse,
    GenderSplit,
    OverviewResponse,
    PredictKpis,
    PredictResponse,
    PrescriptionCard,
    PrescriptionRequest,
    PrescriptionResponse,
    ScatterPoint,
    StudentRow,
    TrendPoint,
)

# Predicted SGPA expression, clamped to [0, 4]. Uses the dataset target column
# (next_semester_sgpa) and falls back to current_sgpa when it is missing.
PRED = "LEAST(4.0, GREATEST(0.0, COALESCE(next_semester_sgpa, current_sgpa, 0)))"

# Per-day study hours derived from the weekly column stored in the dataset.
STUDY_DAY = "(COALESCE(study_hours_weekly, 0) / 7.0)"

_GENDER_MAP = {"Male": "M", "Female": "F", "Other": "Other"}


def _category(sgpa: float) -> str:
    if sgpa is None:
        return "Low"
    if sgpa >= 3.5:
        return "High"
    if sgpa >= 2.5:
        return "Mid"
    return "Low"


def _build_where(filters: BatchFilters) -> Tuple[str, Dict]:
    """Build a parameterised WHERE clause from the filter set."""
    clauses: List[str] = []
    params: Dict = {}

    if filters.department and filters.department != "All":
        clauses.append("preferred_department = :department")
        params["department"] = filters.department

    if filters.category and filters.category != "All":
        if filters.category == "High":
            clauses.append("current_sgpa >= 3.5")
        elif filters.category == "Mid":
            clauses.append("current_sgpa >= 2.5 AND current_sgpa < 3.5")
        elif filters.category == "Low":
            clauses.append("current_sgpa < 2.5")

    if filters.gender and filters.gender != "All":
        clauses.append("gender = :gender")
        params["gender"] = _GENDER_MAP.get(filters.gender, filters.gender)

    if filters.min_study_hours and filters.min_study_hours > 0:
        clauses.append("study_hours_weekly >= :min_weekly")
        params["min_weekly"] = filters.min_study_hours * 7

    if filters.min_attendance and filters.min_attendance > 0:
        clauses.append("attendance_rate >= :min_att")
        params["min_att"] = filters.min_attendance

    where = (" WHERE " + " AND ".join(clauses)) if clauses else ""
    return where, params


# ──────────────────────────── Overview ────────────────────────────
async def get_overview() -> OverviewResponse:
    async with async_session_maker() as session:
        row = (await session.execute(text(f"""
            SELECT
                count(*) AS total,
                count(*) FILTER (WHERE current_sgpa >= 3.5) AS high,
                count(*) FILTER (WHERE current_sgpa >= 2.5 AND current_sgpa < 3.5) AS mid,
                count(*) FILTER (WHERE current_sgpa < 2.5) AS low,
                COALESCE(round(avg(current_sgpa)::numeric, 2), 0) AS avg_sgpa,
                COALESCE(round((avg({STUDY_DAY}))::numeric, 1), 0) AS avg_study,
                COALESCE(round(avg(attendance_rate)::numeric, 0), 0) AS avg_att,
                count(*) FILTER (WHERE gender = 'M') AS male,
                count(*) FILTER (WHERE gender = 'F') AS female,
                count(*) FILTER (WHERE gender NOT IN ('M', 'F') OR gender IS NULL) AS other
            FROM students
        """))).mappings().one()

        depts = (await session.execute(text("""
            SELECT preferred_department AS dept,
                   round(avg(current_sgpa)::numeric, 2) AS avg_sgpa,
                   count(*) AS cnt
            FROM students
            WHERE preferred_department IS NOT NULL
            GROUP BY preferred_department
            ORDER BY cnt DESC
            LIMIT 6
        """))).mappings().all()

    total = int(row["total"]) or 1
    return OverviewResponse(
        total_students=int(row["total"]),
        high=int(row["high"]),
        mid=int(row["mid"]),
        low=int(row["low"]),
        avg_sgpa=float(row["avg_sgpa"]),
        avg_study_hours=float(row["avg_study"]),
        avg_attendance=float(row["avg_att"]),
        high_pct=round(int(row["high"]) / total * 100),
        mid_pct=round(int(row["mid"]) / total * 100),
        low_pct=round(int(row["low"]) / total * 100),
        department_avgs=[
            DepartmentAvg(department=d["dept"], avg_sgpa=float(d["avg_sgpa"]), count=int(d["cnt"]))
            for d in depts
        ],
        gender=GenderSplit(
            male=int(row["male"]),
            female=int(row["female"]),
            other=int(row["other"]),
            total=int(row["total"]),
        ),
    )


# ──────────────────────────── Prediction ────────────────────────────
async def run_prediction(filters: BatchFilters, limit: int = 100) -> PredictResponse:
    where, params = _build_where(filters)

    async with async_session_maker() as session:
        kpis = (await session.execute(text(f"""
            SELECT
                count(*) AS filtered,
                count(*) FILTER (WHERE {PRED} >= 2.5) AS on_track,
                count(*) FILTER (WHERE {PRED} < 2.5) AS at_risk,
                COALESCE(round(avg({PRED})::numeric, 2), 0) AS avg_pred
            FROM students{where}
        """), params)).mappings().one()

        dist = (await session.execute(text(f"""
            SELECT
                count(*) FILTER (WHERE {PRED} < 1.5) AS b0,
                count(*) FILTER (WHERE {PRED} >= 1.5 AND {PRED} < 2.0) AS b1,
                count(*) FILTER (WHERE {PRED} >= 2.0 AND {PRED} < 2.5) AS b2,
                count(*) FILTER (WHERE {PRED} >= 2.5 AND {PRED} < 3.0) AS b3,
                count(*) FILTER (WHERE {PRED} >= 3.0 AND {PRED} < 3.5) AS b4,
                count(*) FILTER (WHERE {PRED} >= 3.5) AS b5
            FROM students{where}
        """), params)).mappings().one()

        scatter_rows = (await session.execute(text(f"""
            SELECT current_sgpa AS prev, {PRED} AS predicted
            FROM students{where}
            ORDER BY random()
            LIMIT 500
        """), params)).mappings().all()

        student_rows = (await session.execute(text(f"""
            SELECT student_id AS id, name, preferred_department AS dept,
                   COALESCE(current_sgpa, 0) AS prev_sgpa,
                   {STUDY_DAY} AS study_day,
                   COALESCE(attendance_rate, 0) AS attendance,
                   {PRED} AS predicted
            FROM students{where}
            ORDER BY student_id
            LIMIT :limit
        """), {**params, "limit": limit})).mappings().all()

    filtered = int(kpis["filtered"])
    on_track = int(kpis["on_track"])
    at_risk = int(kpis["at_risk"])
    pass_rate = round(on_track / filtered * 100) if filtered else 0

    bins = ["1.0-1.4", "1.5-1.9", "2.0-2.4", "2.5-2.9", "3.0-3.4", "3.5-4.0"]
    counts = [int(dist[f"b{i}"]) for i in range(6)]

    scatter = [
        ScatterPoint(
            prev_sgpa=round(float(r["prev"] or 0), 2),
            predicted=round(float(r["predicted"]), 2),
            status="On track" if float(r["predicted"]) >= 2.5 else "At risk",
        )
        for r in scatter_rows
    ]

    students = [
        StudentRow(
            id=str(r["id"]),
            name=r["name"] or "Unknown",
            dept=r["dept"] or "—",
            category=_category(float(r["prev_sgpa"])),
            prev_sgpa=round(float(r["prev_sgpa"]), 2),
            study_hrs=round(float(r["study_day"])),
            attendance=round(float(r["attendance"])),
            predicted=round(float(r["predicted"]), 2),
            status="On track" if float(r["predicted"]) >= 2.5 else "At risk",
        )
        for r in student_rows
    ]

    return PredictResponse(
        kpis=PredictKpis(
            filtered=filtered,
            on_track=on_track,
            at_risk=at_risk,
            avg_predicted=float(kpis["avg_pred"]),
            pass_rate=pass_rate,
        ),
        distribution_bins=bins,
        distribution_counts=counts,
        scatter=scatter,
        students=students,
        showing=len(students),
        total=filtered,
    )


# ──────────────────────────── Prescriptions ────────────────────────────
def _recommendations(attendance: int, study_hrs: int, predicted: float, sgpa: float) -> List[str]:
    recs: List[str] = []
    if attendance < 75:
        recs.append(
            f"Critical Attendance Alert: Student is at {attendance}%. "
            f"Automated warning suggested to reach ≥85% baseline."
        )
    else:
        recs.append("Attendance stability detected. Maintain regular attendance for consistent performance.")

    if study_hrs < 5:
        recs.append(
            f"Activity Deficiency: {study_hrs} study hours/day is suboptimal. "
            f"Increase to 6.5h for target stability."
        )
    else:
        recs.append("High intensity study patterns identified. Focus on specific curriculum gaps.")

    if sgpa < 2.5:
        recs.append("Low prior performance detected. Prioritise campus mentorship program enrolment.")

    if predicted < 2.0:
        recs.append("CRITICAL FAILURE RISK: Initiate formal academic recovery protocol immediately.")

    return recs


async def get_prescriptions(req: PrescriptionRequest, limit: int = 60) -> PrescriptionResponse:
    where, params = _build_where(req.filters)

    clauses = [where[7:]] if where else []  # strip leading " WHERE "
    if req.target == "At risk":
        clauses.append(f"{PRED} < 2.5")
    elif req.target == "Mid":
        clauses.append("current_sgpa >= 2.5 AND current_sgpa < 3.5")
    elif req.target == "On track":
        clauses.append(f"{PRED} >= 2.5")

    if req.search.strip():
        clauses.append("(LOWER(name) LIKE :search OR LOWER(student_id) LIKE :search)")
        params["search"] = f"%{req.search.strip().lower()}%"

    where_sql = (" WHERE " + " AND ".join(c for c in clauses if c)) if clauses else ""

    async with async_session_maker() as session:
        rows = (await session.execute(text(f"""
            SELECT student_id AS id, name, preferred_department AS dept,
                   COALESCE(current_sgpa, 0) AS prev_sgpa,
                   {STUDY_DAY} AS study_day,
                   COALESCE(attendance_rate, 0) AS attendance,
                   {PRED} AS predicted
            FROM students{where_sql}
            ORDER BY {PRED} ASC
            LIMIT :limit
        """), {**params, "limit": limit})).mappings().all()

    cards = []
    for r in rows:
        predicted = round(float(r["predicted"]), 2)
        attendance = round(float(r["attendance"]))
        study_hrs = round(float(r["study_day"]))
        sgpa = float(r["prev_sgpa"])
        status = "On track" if predicted >= 2.5 else "At risk"
        cards.append(PrescriptionCard(
            id=str(r["id"]),
            name=r["name"] or "Unknown",
            dept=r["dept"] or "—",
            predicted=predicted,
            status=status,
            recommendations=_recommendations(attendance, study_hrs, predicted, sgpa),
        ))

    return PrescriptionResponse(target=req.target, count=len(cards), cards=cards)


# ──────────────────────────── Forecast ────────────────────────────
async def get_forecast(filters: BatchFilters) -> ForecastResponse:
    where, params = _build_where(filters)

    async with async_session_maker() as session:
        agg = (await session.execute(text(f"""
            SELECT
                COALESCE(round(avg(past_semester_sgpa_2)::numeric, 2), 0) AS past2,
                COALESCE(round(avg(past_semester_sgpa_1)::numeric, 2), 0) AS past1,
                COALESCE(round(avg(current_sgpa)::numeric, 2), 0) AS current,
                COALESCE(round(avg({PRED})::numeric, 2), 0) AS next
            FROM students{where}
        """), params)).mappings().one()

        depts = (await session.execute(text(f"""
            SELECT preferred_department AS dept,
                   round(avg(current_sgpa)::numeric, 2) AS current_avg,
                   round(avg({PRED})::numeric, 2) AS predicted_avg,
                   count(*) AS cnt
            FROM students{where}
            GROUP BY preferred_department
            HAVING preferred_department IS NOT NULL
            ORDER BY cnt DESC
            LIMIT 6
        """), params)).mappings().all()

    past2 = float(agg["past2"])
    past1 = float(agg["past1"])
    current = float(agg["current"])
    t1 = float(agg["next"])

    def clamp(v: float) -> float:
        return round(min(4.0, max(0.0, v)), 2)

    # Moving-average projection for T+2 and T+3.
    t2 = clamp((past1 + current + t1) / 3)
    t3 = clamp((current + t1 + t2) / 3)
    target = 3.5

    trend = [
        TrendPoint(term="Term -2", value=clamp(past2), type="historical"),
        TrendPoint(term="Term -1", value=clamp(past1), type="historical"),
        TrendPoint(term="Current", value=clamp(current), type="historical"),
        TrendPoint(term="T+1", value=clamp(t1), type="forecast"),
        TrendPoint(term="T+2", value=t2, type="forecast"),
        TrendPoint(term="T+3", value=t3, type="forecast"),
    ]

    return ForecastResponse(
        trend=trend,
        forecast_t1=clamp(t1),
        forecast_t2=t2,
        forecast_t3=t3,
        target=target,
        below_target=clamp(t1) < target,
        department_breakdown=[
            DeptForecast(
                department=d["dept"],
                current_avg=float(d["current_avg"]),
                predicted_avg=float(d["predicted_avg"]),
            )
            for d in depts
        ],
    )
