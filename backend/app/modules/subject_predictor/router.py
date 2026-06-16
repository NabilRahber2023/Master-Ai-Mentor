from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List
import io
import pandas as pd

from .schemas import SubjectPredictionInput, SubjectPredictionOutput
from .dependencies import get_subject_predictor_service
from .services import SubjectPredictorService

router = APIRouter(
    tags=["Subject Prediction"]
)

@router.post("/subject_choice", response_model=SubjectPredictionOutput)
async def predict_subject_choice(
    input_data: SubjectPredictionInput,
    service: SubjectPredictorService = Depends(get_subject_predictor_service)
):
    try:
        result = await service.predict_subject(input_data)
        return result
    except RuntimeError as e:
        # If model is not loaded (503 Service Unavailable)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during prediction: {str(e)}"
        )


@router.post("/batch", response_model=List[SubjectPredictionOutput])
async def predict_subject_batch(file: UploadFile = File(...), service: SubjectPredictorService = Depends(get_subject_predictor_service)):
    """Upload CSV for bulk subject predictions. CSV headers should match request fields."""
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid CSV file: {e}")

    results: List[SubjectPredictionOutput] = []
    for i, row in df.iterrows():
        try:
            payload = SubjectPredictionInput.parse_obj(row.to_dict())
            res = await service.predict_subject(payload)
            results.append(res)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Row {i} error: {e}")

    return results
