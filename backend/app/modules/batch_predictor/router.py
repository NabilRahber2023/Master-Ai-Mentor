"""
FastAPI router for the Batch Prediction module.

Mounted at /api/v1/prediction/batch. Provides cohort-level analytics computed
live from the students table: dataset overview, filtered predictions, an AI
prescription engine, and a CGPA forecast.
"""
from fastapi import APIRouter, HTTPException, status

from app.modules.batch_predictor.schemas import (
    BatchFilters,
    ForecastResponse,
    OverviewResponse,
    PredictResponse,
    PrescriptionRequest,
    PrescriptionResponse,
)
from app.modules.batch_predictor import services

router = APIRouter(tags=["Batch Prediction"])


@router.get("/overview", response_model=OverviewResponse)
async def overview() -> OverviewResponse:
    """Dataset overview: KPIs, category split, per-department averages, gender."""
    try:
        return await services.get_overview()
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Overview failed: {e}")


@router.post("/predict", response_model=PredictResponse)
async def predict(filters: BatchFilters) -> PredictResponse:
    """Run the cohort prediction for the given filters."""
    try:
        return await services.run_prediction(filters)
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Prediction failed: {e}")


@router.post("/prescriptions", response_model=PrescriptionResponse)
async def prescriptions(req: PrescriptionRequest) -> PrescriptionResponse:
    """AI prescription engine: per-student recommendations for a target group."""
    try:
        return await services.get_prescriptions(req)
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Prescriptions failed: {e}")


@router.post("/forecast", response_model=ForecastResponse)
async def forecast(filters: BatchFilters) -> ForecastResponse:
    """CGPA forecast: historical trend, projected terms, department breakdown."""
    try:
        return await services.get_forecast(filters)
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Forecast failed: {e}")
