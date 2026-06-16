from .services import SubjectPredictorService

def get_subject_predictor_service() -> SubjectPredictorService:
    return SubjectPredictorService()
