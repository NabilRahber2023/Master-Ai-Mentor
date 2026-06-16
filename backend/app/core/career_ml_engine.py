import os
import json
from catboost import CatBoostClassifier
import pandas as pd
from typing import List, Dict, Tuple

class CareerMLEngine:
    _instance = None
    _model = None
    _label_mapping = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        # Initialized to None, load_model() must be called explicitly
        pass

    def load_model(self):
        """Loads model and label mapping from disk."""
        base_path = os.path.dirname(os.path.abspath(__file__))
        # Assuming model is stored in app/modules/career_predictor/ or a shared models dir
        # For this setup, we'll look in app/modules/career_predictor/ as per requirements
        model_path = os.path.join(base_path, "../modules/career_predictor/career_predictor.cbm")
        mapping_path = os.path.join(base_path, "../modules/career_predictor/career_label_mapping.json")
        features_path = os.path.join(base_path, "../modules/career_predictor/feature_columns.json")

        if os.path.exists(model_path):
            self._model = CatBoostClassifier()
            self._model.load_model(model_path)
            print(f"✅ Career Model loaded from {model_path}")
        else:
            print(f"⚠️ Career Model not found at {model_path}")

        if os.path.exists(mapping_path):
            with open(mapping_path, 'r') as f:
                self._label_mapping = json.load(f)
                self._label_mapping = {int(k): v for k, v in self._label_mapping.items()}
            print(f"✅ Label Mapping loaded from {mapping_path}")
        else:
            print(f"⚠️ Label Mapping not found at {mapping_path}")

        if os.path.exists(features_path):
            with open(features_path, 'r') as f:
                self._feature_columns = json.load(f)
            print(f"✅ Feature Columns loaded from {features_path}")
        else:
            self._feature_columns = None
            print(f"⚠️ Feature Columns not found at {features_path}")

    def predict_career(self, features: dict) -> Tuple[str, float, List[dict]]:
        """
        Predicts career and top probabilities.
        Returns: (best_career, confidence, alternatives_list)
        """
        if not self._model or not self._label_mapping:
            raise RuntimeError("Model or Label Mapping not loaded. Please train the model first.")

        # Prepare input dataframe
        df = pd.DataFrame([features])
        
        # Enforce column order if available
        if self._feature_columns:
            # Ensure all columns exist, fill missing with defaults if necessary (or error)
            # Here we assume validation ensures presence.
            df = df[self._feature_columns]
        
        # Get probabilities
        probs = self._model.predict_proba(df)[0]
        
        # Get top 3 indices
        top_indices = probs.argsort()[-3:][::-1]
        
        results = []
        for idx in top_indices:
            career_name = self._label_mapping.get(idx, f"Unknown-{idx}")
            prob = float(probs[idx])
            results.append({"career": career_name, "probability": prob})
            
        best_choice = results[0]
        alternatives = results[1:]
        
        return best_choice["career"], best_choice["probability"], alternatives

# Global instance removed to support explicit lifecycle management
career_ml_engine = CareerMLEngine.get_instance()
