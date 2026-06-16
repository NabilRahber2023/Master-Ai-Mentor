import os
import json
from catboost import CatBoostClassifier
from threading import Lock

class NineBoxMLEngine:
    _instance = None
    _lock = Lock()
    
    def __init__(self):
        if NineBoxMLEngine._instance is not None:
            raise Exception("This class is a singleton!")
        
        self.performance_model = None
        self.potential_model = None
        self.mapping = None
        self.artifacts_dir = "app/modules/nine_box_predictor/artifacts"
        self._load_artifacts()
    
    @staticmethod
    def get_instance():
        if NineBoxMLEngine._instance is None:
            with NineBoxMLEngine._lock:
                if NineBoxMLEngine._instance is None:
                    NineBoxMLEngine._instance = NineBoxMLEngine()
        return NineBoxMLEngine._instance
    
    def _load_artifacts(self):
        # Paths
        perf_path = os.path.join(self.artifacts_dir, "performance_classifier.cbm")
        pot_path = os.path.join(self.artifacts_dir, "potential_classifier.cbm")
        mapping_path = os.path.join(self.artifacts_dir, "nine_box_mapping.json")
        
        # Load Performance Model
        if os.path.exists(perf_path):
            self.performance_model = CatBoostClassifier()
            self.performance_model.load_model(perf_path)
        else:
            raise FileNotFoundError(f"Performance model not found at {perf_path}")
            
        # Load Potential Model
        if os.path.exists(pot_path):
            self.potential_model = CatBoostClassifier()
            self.potential_model.load_model(pot_path)
        else:
            raise FileNotFoundError(f"Potential model not found at {pot_path}")
            
        # Load Mapping
        if os.path.exists(mapping_path):
            with open(mapping_path, 'r') as f:
                self.mapping = json.load(f)
        else:
            raise FileNotFoundError(f"Mapping file not found at {mapping_path}")

    def predict(self, features: list):
        """
        Predicts performance and potential levels.
        Args:
            features: List of feature values in the correct order.
        Returns:
            Tuple(performance_level, potential_level)
        """
        # CatBoost expects 2D array for single prediction or list of list
        # We pass [features]
        perf_pred = self.performance_model.predict([features])[0]
        pot_pred = self.potential_model.predict([features])[0]
        
        # Predictions are returned as arrays/matrices sometimes, need to ensure scalar
        # Check if output is list/array and take first element if so, though [0] above should handle it for single sample
        return int(perf_pred), int(pot_pred)

    def get_mapping_description(self, key: str) -> str:
        return self.mapping.get(key, "Unknown")

nine_box_ml_engine = NineBoxMLEngine.get_instance()
