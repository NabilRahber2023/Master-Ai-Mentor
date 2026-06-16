from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from typing import List
import io
import pandas as pd

from app.modules.nine_box_predictor.schemas import NineBoxPredictionRequest, NineBoxPredictionResponse
from app.modules.nine_box_predictor.services import NineBoxService
from app.modules.nine_box_predictor.dependencies import get_nine_box_service

router = APIRouter(
    tags=["9-Box Prediction"]
)

@router.post("/", response_model=NineBoxPredictionResponse)
async def predict_9box_position(
    request: NineBoxPredictionRequest,
    service: NineBoxService = Depends(get_nine_box_service)
):
    try:
        result = await service.predict_nine_box(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch", response_model=List[NineBoxPredictionResponse])
async def predict_9box_batch(file: UploadFile = File(...), service: NineBoxService = Depends(get_nine_box_service)):
    """Upload CSV for bulk 9-box predictions. CSV should include the required feature columns."""
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid CSV file: {e}")

    results: List[NineBoxPredictionResponse] = []
    for i, row in df.iterrows():
        try:
            payload = NineBoxPredictionRequest.parse_obj(row.to_dict())
            res = await service.predict_nine_box(payload)
            results.append(res)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Row {i} error: {e}")

    return results
