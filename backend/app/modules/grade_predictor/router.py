from fastapi import APIRouter, HTTPException, status, UploadFile, File
from typing import List
import io
import pandas as pd

from app.modules.grade_predictor.schemas import (
    SGPAPredictionInput,
    PredictionResponse,
    DashboardRequest,
    DashboardResponse,
)
from app.modules.grade_predictor.services import grade_predictor_service, build_dashboard

router = APIRouter(
    tags=["Grade Prediction"]
)

@router.post("/", response_model=PredictionResponse)
async def predict_next_sgpa(input_data: SGPAPredictionInput):
    """
    Predict the next semester's SGPA based on student data.
    """
    try:
        response = grade_predictor_service.predict_sgpa(input_data)
        return response
    except RuntimeError as e:
        # 503 Service Unavailable if model is not loaded
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during prediction: {str(e)}"
        )


@router.post("/batch", response_model=List[PredictionResponse])
async def predict_sgpa_batch(file: UploadFile = File(...)):
    """
    Upload a CSV for bulk SGPA predictions. CSV must contain the model feature columns.
    """
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid CSV file: {e}")

    feature_columns = list(SGPAPredictionInput.model_fields.keys())

    missing = [c for c in feature_columns if c not in df.columns]
    if missing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Missing required columns: {missing}")

    try:
        results = []
        for i, row in df.iterrows():
            try:
                payload = SGPAPredictionInput.parse_obj(row[feature_columns].to_dict())
                results.append(grade_predictor_service.predict_sgpa(payload))
            except Exception as row_error:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Row {i} error: {row_error}"
                )

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/dashboard", response_model=DashboardResponse)
async def grade_prediction_dashboard(request: DashboardRequest) -> DashboardResponse:
    """
    Return the analytics dashboard payload for grade prediction.
    """
    try:
        return build_dashboard(request)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
