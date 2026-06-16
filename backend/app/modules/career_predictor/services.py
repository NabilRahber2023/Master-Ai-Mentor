from app.core.career_ml_engine import CareerMLEngine
from app.modules.career_predictor.schemas import CareerPredictionRequest, CareerPredictionResponse

class CareerPredictorService:
    async def predict_career_path(self, payload: CareerPredictionRequest) -> CareerPredictionResponse:
        # 1. Convert Pydantic model to dictionary
        # We assume the keys match the training data columns exactly
        # using mode='json' ensures Enums are converted to their string values
        features = payload.model_dump(mode='json')
        
        # 2. Call ML Engine
        best_career, confidence, alternatives = CareerMLEngine.get_instance().predict_career(features)
        
        # 3. Format Response
        return CareerPredictionResponse(
            predicted_career=best_career,
            confidence_score=confidence,
            alternative_paths=alternatives
        )

# Instantiate service (can also be done via dependency injection)
career_service = CareerPredictorService()
