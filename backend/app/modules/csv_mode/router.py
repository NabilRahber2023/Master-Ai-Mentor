"""
CSV-mode prediction router.

Lets every module run off the uploaded dataset (`students` table):
  GET  /students                       list / search students (picker)
  GET  /students/{id}                  full student row (prefill / inspect)
  GET  /{module}/predict/{id}          single-student prediction
  GET  /{module}/batch                 whole-cohort prediction + aggregates

module ∈ {grade, career, subject, growth}
"""
from fastapi import APIRouter, HTTPException, Query, status

from app.modules.csv_mode import services
from app.modules.csv_mode.schemas import (
    CareerBatchResponse,
    CsvSingleResult,
    GradeBatchResponse,
    GrowthBatchResponse,
    StudentListResponse,
    SubjectBatchResponse,
)

router = APIRouter(tags=["CSV Mode Prediction"])

_SINGLE = {
    "grade": services.predict_single_grade,
    "career": services.predict_single_career,
    "subject": services.predict_single_subject,
    "growth": services.predict_single_growth,
}
_BATCH = {
    "grade": services.grade_batch,
    "career": services.career_batch,
    "subject": services.subject_batch,
    "growth": services.growth_batch,
}


@router.get("/students", response_model=StudentListResponse)
async def list_students(
    search: str = Query("", description="Search by name or student_id"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    return await services.list_students(search=search, limit=limit, offset=offset)


@router.get("/students/{student_id}")
async def get_student(student_id: str):
    row = await services.get_student_row(student_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return row


@router.get("/{module}/predict/{student_id}", response_model=CsvSingleResult)
async def predict_single(module: str, student_id: str):
    fn = _SINGLE.get(module)
    if fn is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown module '{module}'")
    row = await services.get_student_row(student_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    try:
        result = await fn(row)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Prediction failed: {e}")
    return CsvSingleResult(student=services._brief(row), inputs=result["inputs"], prediction=result["prediction"])


@router.get("/{module}/batch")
async def predict_batch(module: str, limit: int = Query(100, ge=1, le=1000)):
    fn = _BATCH.get(module)
    if fn is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown module '{module}'")
    rows = await services.fetch_all_rows()
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No students in dataset. Upload a CSV first.")
    try:
        return fn(rows, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Batch prediction failed: {e}")
