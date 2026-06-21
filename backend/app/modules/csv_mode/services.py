"""
CSV-mode service layer.

Reads students straight from the shared `students` table (the uploaded CSV) and
runs each trained model on them — both for a single picked student (reusing the
existing per-module services, so SHAP factors match manual mode) and for the
whole cohort (vectorised CatBoost batch prediction).
"""
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sqlalchemy import text

from app.chatbot.database import async_session_maker
from app.chatbot.models import Student

from app.modules.csv_mode import mappers
from app.modules.csv_mode.schemas import (
    Bucket,
    CareerBatchResponse,
    CareerBatchRow,
    GradeBatchResponse,
    GradeBatchRow,
    GridCell,
    GrowthBatchResponse,
    GrowthBatchRow,
    StudentBrief,
    StudentListResponse,
    SubjectBatchResponse,
    SubjectBatchRow,
)

# Non-embedding column list, used to pull full student rows for mapping.
_COLS = [c.name for c in Student.__table__.columns if c.name != "embedding"]
_COLS_SQL = ", ".join(_COLS)


def _brief(row: Dict[str, Any]) -> StudentBrief:
    sgpa = row.get("current_sgpa")
    return StudentBrief(
        student_id=str(row.get("student_id")),
        name=row.get("name") or "Unknown",
        department=row.get("preferred_department"),
        gender=row.get("gender"),
        current_sgpa=round(float(sgpa), 2) if sgpa is not None else None,
    )


# ── data access ───────────────────────────────────────────────────────────────
async def list_students(search: str = "", limit: int = 50, offset: int = 0) -> StudentListResponse:
    params: Dict[str, Any] = {"limit": limit, "offset": offset}
    where = ""
    if search.strip():
        where = "WHERE LOWER(name) LIKE :q OR LOWER(student_id) LIKE :q"
        params["q"] = f"%{search.strip().lower()}%"

    async with async_session_maker() as session:
        total = (await session.execute(
            text(f"SELECT count(*) FROM students {where}"), params
        )).scalar_one()
        rows = (await session.execute(text(f"""
            SELECT student_id, name, preferred_department, gender, current_sgpa
            FROM students {where}
            ORDER BY name
            LIMIT :limit OFFSET :offset
        """), params)).mappings().all()

    briefs = [_brief(dict(r)) for r in rows]
    return StudentListResponse(students=briefs, total=int(total), showing=len(briefs))


async def get_student_row(student_id: str) -> Optional[Dict[str, Any]]:
    async with async_session_maker() as session:
        row = (await session.execute(
            text(f"SELECT {_COLS_SQL} FROM students WHERE student_id = :id"),
            {"id": student_id},
        )).mappings().first()
    return dict(row) if row else None


async def fetch_all_rows() -> List[Dict[str, Any]]:
    async with async_session_maker() as session:
        rows = (await session.execute(
            text(f"SELECT {_COLS_SQL} FROM students ORDER BY student_id")
        )).mappings().all()
    return [dict(r) for r in rows]


# ── single prediction (reuse existing module services) ────────────────────────
async def predict_single_grade(row: Dict[str, Any]) -> Dict[str, Any]:
    from app.modules.grade_predictor.services import grade_predictor_service
    from app.modules.grade_predictor.schemas import SGPAPredictionInput

    feats = mappers.grade_features(row)
    result = grade_predictor_service.predict_sgpa(SGPAPredictionInput(**feats))
    return {"inputs": feats, "prediction": result.model_dump()}


async def predict_single_career(row: Dict[str, Any]) -> Dict[str, Any]:
    from app.modules.career_predictor.services import career_service
    from app.modules.career_predictor.schemas import CareerPredictionRequest

    feats = mappers.career_features(row)
    result = await career_service.predict_career_path(CareerPredictionRequest(**feats))
    return {"inputs": feats, "prediction": result.model_dump()}


async def predict_single_subject(row: Dict[str, Any]) -> Dict[str, Any]:
    from app.modules.subject_predictor.services import SubjectPredictorService
    from app.modules.subject_predictor.schemas import SubjectPredictionInput

    feats = mappers.subject_features(row)
    result = await SubjectPredictorService().predict_subject(SubjectPredictionInput(**feats))
    return {"inputs": feats, "prediction": result.model_dump()}


async def predict_single_growth(row: Dict[str, Any]) -> Dict[str, Any]:
    from app.modules.nine_box_predictor.services import NineBoxService
    from app.modules.nine_box_predictor.schemas import NineBoxPredictionRequest

    feats = mappers.growth_features(row)
    result = await NineBoxService().predict_nine_box(NineBoxPredictionRequest(**feats))
    return {"inputs": feats, "prediction": result.model_dump()}


# ── batch prediction (vectorised) ─────────────────────────────────────────────
def _risk_level(sgpa: float) -> str:
    if sgpa < 2.5:
        return "High Risk"
    if sgpa < 3.0:
        return "Medium Risk"
    return "Low Risk"


def grade_batch(rows: List[Dict[str, Any]], limit: int = 100) -> GradeBatchResponse:
    from app.core.sgpa_ml_engine import sgpa_ml_engine

    model = sgpa_ml_engine.get_model()
    cols = sgpa_ml_engine.get_feature_columns()

    feats = [mappers.grade_features(r) for r in rows]
    df = pd.DataFrame(feats)[cols]
    for c in df.columns:
        if df[c].dtype == "object":
            df[c] = df[c].astype(str)
    preds = np.clip(np.asarray(model.predict(df), dtype=float), 0.0, 4.0)

    total = len(rows)
    on_track = int((preds >= 2.5).sum())
    at_risk = total - on_track
    avg_pred = round(float(preds.mean()), 2) if total else 0.0
    pass_rate = round(on_track / total * 100, 1) if total else 0.0

    bands = [("<2.0", 0, 2.0), ("2.0-2.4", 2.0, 2.5), ("2.5-2.9", 2.5, 3.0),
             ("3.0-3.4", 3.0, 3.5), ("3.5-4.0", 3.5, 4.01)]
    dist = [Bucket(label=lbl, count=int(((preds >= lo) & (preds < hi)).sum())) for lbl, lo, hi in bands]

    out_rows: List[GradeBatchRow] = []
    for r, p in list(zip(rows, preds))[:limit]:
        out_rows.append(GradeBatchRow(
            student_id=str(r.get("student_id")),
            name=r.get("name") or "Unknown",
            department=r.get("preferred_department"),
            previous_sgpa=round(float(r.get("current_sgpa") or 0), 2),
            predicted_sgpa=round(float(p), 2),
            risk_level=_risk_level(float(p)),
        ))

    return GradeBatchResponse(
        total=total, avg_predicted=avg_pred, on_track=on_track, at_risk=at_risk,
        pass_rate=pass_rate, distribution=dist, students=out_rows, showing=len(out_rows),
    )


def career_batch(rows: List[Dict[str, Any]], limit: int = 100) -> CareerBatchResponse:
    from app.core.career_ml_engine import career_ml_engine

    model = career_ml_engine._model
    mapping = career_ml_engine._label_mapping
    cols = career_ml_engine._feature_columns

    df = pd.DataFrame([mappers.career_features(r) for r in rows])
    if cols:
        df = df[cols]
    probs = np.asarray(model.predict_proba(df))
    idx = probs.argmax(axis=1)
    conf = probs.max(axis=1)
    careers = [mapping.get(int(j), f"Unknown-{int(j)}") for j in idx]

    total = len(rows)
    avg_conf = round(float(conf.mean()) * 100, 1) if total else 0.0
    dist = [Bucket(label=c, count=n) for c, n in Counter(careers).most_common()]

    out_rows: List[CareerBatchRow] = []
    for r, c, cf in list(zip(rows, careers, conf))[:limit]:
        out_rows.append(CareerBatchRow(
            student_id=str(r.get("student_id")),
            name=r.get("name") or "Unknown",
            department=r.get("preferred_department"),
            predicted_career=c,
            confidence=round(float(cf) * 100, 1),
        ))

    return CareerBatchResponse(
        total=total, avg_confidence=avg_conf, career_distribution=dist,
        students=out_rows, showing=len(out_rows),
    )


def subject_batch(rows: List[Dict[str, Any]], limit: int = 100) -> SubjectBatchResponse:
    from app.core.subject_ml_engine import subject_ml_engine

    model = subject_ml_engine.model
    inv_map = {v: k for k, v in (subject_ml_engine.label_mapping or {}).items()}

    vectors = []
    for r in rows:
        ft = mappers.subject_features(r)
        vectors.append([
            ft["gender"], ft["study_style"], ft["math_skill_level"], ft["programming_interest"],
            ft["business_interest"], ft["creative_interest"], ft["location"], ft["career_goal"],
            ft["age"], ft["hsc_gpa"], ft["tech_interest_score"], ft["budget_per_semester"],
        ])
    probs = np.asarray(model.predict_proba(vectors))
    idx = probs.argmax(axis=1)
    conf = probs.max(axis=1)
    recs = [inv_map.get(int(j), "Unknown") for j in idx]

    total = len(rows)
    avg_conf = round(float(conf.mean()) * 100, 1) if total else 0.0
    matches = sum(1 for r, rec in zip(rows, recs) if (r.get("preferred_department") or "") == rec)
    match_rate = round(matches / total * 100, 1) if total else 0.0
    dist = [Bucket(label=d, count=n) for d, n in Counter(recs).most_common()]

    out_rows: List[SubjectBatchRow] = []
    for r, rec, cf in list(zip(rows, recs, conf))[:limit]:
        out_rows.append(SubjectBatchRow(
            student_id=str(r.get("student_id")),
            name=r.get("name") or "Unknown",
            current_department=r.get("preferred_department"),
            recommended_department=rec,
            confidence=round(float(cf) * 100, 1),
        ))

    return SubjectBatchResponse(
        total=total, avg_confidence=avg_conf, recommendation_distribution=dist,
        match_rate=match_rate, students=out_rows, showing=len(out_rows),
    )


def growth_batch(rows: List[Dict[str, Any]], limit: int = 100) -> GrowthBatchResponse:
    from app.core.nine_box_ml_engine import nine_box_ml_engine

    perf_model = nine_box_ml_engine.performance_model
    pot_model = nine_box_ml_engine.potential_model
    mapping = nine_box_ml_engine.mapping

    matrix = []
    for r in rows:
        ft = mappers.growth_features(r)
        matrix.append([
            ft["CGPA"], ft["Attendance_Rate"], ft["Assignment_Completion_Rate"],
            ft["Project_Quality_Score"], ft["Communication_Skill"], ft["Teamwork_Score"],
            ft["Problem_Solving_Score"], ft["Leadership_Score"], ft["Time_Management"],
            ft["Initiative_Taking"], ft["Stress_Handling"], ft["Internship_Experience_Months"],
            ft["Extracurricular_Activities"], ft["Learning_Agility"], ft["Adaptability"],
            ft["Career_Motivation"],
        ])
    perf = np.asarray(perf_model.predict(matrix)).flatten().astype(int)
    pot = np.asarray(pot_model.predict(matrix)).flatten().astype(int)

    total = len(rows)
    positions = [f"{int(p)}_{int(q)}" for p, q in zip(perf, pot)]
    stars = sum(1 for p, q in zip(perf, pot) if p == 2 and q == 2)
    risks = sum(1 for p, q in zip(perf, pot) if p == 0 and q == 0)
    counts = Counter(positions)
    grid = [
        GridCell(position=key, label=mapping.get(key, key), count=counts.get(key, 0))
        for key in [f"{p}_{l}" for p in (2, 1, 0) for l in (0, 1, 2)]
    ]

    out_rows: List[GrowthBatchRow] = []
    for r, p, q in list(zip(rows, perf, pot))[:limit]:
        key = f"{int(p)}_{int(q)}"
        out_rows.append(GrowthBatchRow(
            student_id=str(r.get("student_id")),
            name=r.get("name") or "Unknown",
            department=r.get("preferred_department"),
            performance_level=int(p),
            potential_level=int(q),
            position=f"P{int(p)}L{int(q)}",
            label=mapping.get(key, key),
        ))

    return GrowthBatchResponse(
        total=total, stars=stars, risks=risks, grid=grid,
        students=out_rows, showing=len(out_rows),
    )
