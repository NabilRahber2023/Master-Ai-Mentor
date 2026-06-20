from app.core.nine_box_ml_engine import NineBoxMLEngine
from app.modules.nine_box_predictor.schemas import NineBoxPredictionRequest, NineBoxPredictionResponse

class NineBoxService:
    def __init__(self):
        self.ml_engine = NineBoxMLEngine.get_instance()
    
    async def predict_nine_box(self, request: NineBoxPredictionRequest) -> NineBoxPredictionResponse:
        # Extract features in the correct order matching training data
        # Feature order from training script:
        # StudentID dropped.
        # Order should match CSV columns excluding StudentID, Performance, Potential.
        # Inspecting CSV Header again:
        # CGPA, Attendance_Rate, Assignment_Completion_Rate, Project_Quality_Score, Communication_Skill, 
        # Teamwork_Score, Problem_Solving_Score, Leadership_Score, Time_Management, Initiative_Taking, 
        # Stress_Handling, Internship_Experience_Months, Extracurricular_Activities, Learning_Agility, 
        # Adaptability, Career_Motivation
        
        features = [
            request.CGPA,
            request.Attendance_Rate,
            request.Assignment_Completion_Rate,
            request.Project_Quality_Score,
            request.Communication_Skill,
            request.Teamwork_Score,
            request.Problem_Solving_Score,
            request.Leadership_Score,
            request.Time_Management,
            request.Initiative_Taking,
            request.Stress_Handling,
            request.Internship_Experience_Months,
            request.Extracurricular_Activities,
            request.Learning_Agility,
            request.Adaptability,
            request.Career_Motivation
        ]
        
        perf_score, pot_score, confidence = self.ml_engine.predict(features)
        
        # Grid Position Key (P_L)
        grid_key = f"{perf_score}_{pot_score}"
        
        # Description
        description_label = self.ml_engine.get_mapping_description(grid_key)
        
        # Recommendation
        # Logic can be expanded. For now, using the label as base or map to specific recommendation logic.
        # Since the requirement asks for "descriptive_recommendation": string, strictly based on position.
        # I'll map it to a simple recommendation string based on label for now.
        
        recommendation_map = {
            "Star (High Performance / High Potential)": "Retain, Challenge, and Promote.",
            "High Performer (High Performance / Moderate Potential)": "Keep engaged, provide stretch assignments.",
            "Effective (High Performance / Low Potential)": "Keep in current role, recognize contribution.",
            "Growth Employee (Moderate Performance / High Potential)": "Train, Mentor, and Develop skills.",
            "Core Employee (Moderate Performance / Moderate Potential)": "Develop in current role, check for motivation.",
            "Effective with Issues (Moderate Performance / Low Potential)": "Performance management, clarify expectations.",
            "Enigma (Low Performance / High Potential)": "Investigate root cause, provide coaching.",
            "Dilemma (Low Performance / Moderate Potential)": "Coaching, verify fit for role.",
            "Risk (Low Performance / Low Potential)": "Consider reassignment or exit plan."
        }
        
        # If the key in the mapping is the full string "Star...", we need to match it.
        # The mapping returns the full string.
        recommendation = recommendation_map.get(description_label, "Refer to HR for detailed analysis.")
        
        return NineBoxPredictionResponse(
            performance_level_score=perf_score,
            potential_level_score=pot_score,
            confidence_score=confidence,
            nine_box_position_label=description_label,
            position_in_grid=f"P{perf_score}L{pot_score}",
            descriptive_recommendation=recommendation
        )
