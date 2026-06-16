from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List
import io
import pandas as pd

from app.modules.career_predictor.schemas import CareerPredictionRequest, CareerPredictionResponse
from app.modules.career_predictor.services import career_service
from app.core.career_ml_engine import CareerMLEngine

# Create Router
router = APIRouter(
    tags=["Career Prediction"]
)

@router.post("/career", response_model=CareerPredictionResponse, status_code=status.HTTP_200_OK)
async def predict_career_choice(request: CareerPredictionRequest):
    """
    Predicts the suitable career path for a student based on skills, academics, and personality.
    Returns the top predicted career and alternative paths with probabilities.
    """
    # Check if model is loaded
    if CareerMLEngine.get_instance()._model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Career Prediction Model is not loaded. Please contact support."
        )

    try:
        result = await career_service.predict_career_path(request)
        return result
    except Exception as e:
        # Log the error here in a real app
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/batch", response_model=List[CareerPredictionResponse])
async def predict_career_batch(file: UploadFile = File(...)):
    """Upload CSV for bulk career predictions. Columns should match the API request fields."""
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid CSV file: {e}")

    results: List[CareerPredictionResponse] = []
    for i, row in df.iterrows():
        try:
            payload = CareerPredictionRequest.parse_obj(row.to_dict())
            res = await career_service.predict_career_path(payload)
            results.append(res)
        except Exception as e:
            # Append an error-like response or skip; here we raise to inform user
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Row {i} error: {e}")

    return results
