from app.core.subject_ml_engine import SubjectMLEngine
from .schemas import SubjectPredictionInput, SubjectPredictionOutput, AlternativeOption
import numpy as np

class SubjectPredictorService:
    def __init__(self):
        # In a real app, we might inject this, but for the singleton pattern requirement:
        self.engine = SubjectMLEngine()

    async def predict_subject(self, input_data: SubjectPredictionInput) -> SubjectPredictionOutput:
        # 1. Prepare Features in the correct order
        # Must match training.py order: CATEGORICAL (8) + NUMERICAL (4)
        # ['gender', 'preferred_study_style', 'math_skill_level', 'programming_interest', 'business_interest', 'creative_interest', 'location', 'career_goal']
        # ['age', 'hsc_gpa', 'tech_interest_score', 'budget_per_semester']
        
        feature_vector = [
            input_data.gender,
            input_data.study_style.value,       # Map Enum to value
            input_data.math_skill_level.value,
            input_data.programming_interest.value,
            input_data.business_interest.value,
            input_data.creative_interest.value,
            input_data.location.value,
            input_data.career_goal.value,
            input_data.age,
            input_data.hsc_gpa,
            input_data.tech_interest_score,
            input_data.budget_per_semester
        ]
        
        # 2. Predict
        # Returns list of probability arrays (we sent batch of size 1)
        probs_batch = self.engine.predict(feature_vector)
        probs = probs_batch[0] # The first and only result
        
        # 3. Get Top K (3) classes
        top_k_indices = np.argsort(probs)[::-1][:3]
        
        recommendation = None
        alternatives = []
        
        for i, idx in enumerate(top_k_indices):
            label = self.engine.get_class_label(idx)
            confidence = float(probs[idx])
            
            if i == 0:
                recommendation = label
                rec_confidence = confidence
            else:
                alternatives.append(AlternativeOption(department=label, probability=confidence))
                
        return SubjectPredictionOutput(
            recommended_department=recommendation,
            confidence_score=rec_confidence,
            alternative_options=alternatives
        )
