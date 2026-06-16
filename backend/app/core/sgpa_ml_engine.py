import os
import json
from catboost import CatBoostRegressor

class SGPAMLEngine:
    _instance = None
    _model = None
    _feature_columns = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SGPAMLEngine, cls).__new__(cls)
            cls._instance._load_resources()
        return cls._instance

    def _load_resources(self):
        # Define paths
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        module_path = os.path.join(base_path, "modules", "grade_predictor")
        model_path = os.path.join(module_path, "sgpa_predictor.cbm")
        feature_path = os.path.join(module_path, "feature_columns.json")

        # Load Model
        if os.path.exists(model_path):
            self._model = CatBoostRegressor()
            self._model.load_model(model_path)
            print(f"Model loaded from {model_path}")
        else:
            print(f"Model file not found at {model_path}. Please train the model first.")

        # Load Feature Columns
        if os.path.exists(feature_path):
            with open(feature_path, "r") as f:
                self._feature_columns = json.load(f)
            print(f"Feature columns loaded from {feature_path}")
        else:
            print(f"Feature columns file not found at {feature_path}. Please train the model first.")

    def get_model(self):
        if self._model is None:
            # Try reloading if not loaded (e.g., training happened after startup)
            self._load_resources()
        if self._model is None:
            raise RuntimeError("Model is not loaded. Train the model first.")
        return self._model

    def get_feature_columns(self):
        if self._feature_columns is None:
             self._load_resources()
        if self._feature_columns is None:
            raise RuntimeError("Feature columns are not loaded. Train the model first.")
        return self._feature_columns

# Global instance
sgpa_ml_engine = SGPAMLEngine()
