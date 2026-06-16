import json
import os
import threading
from typing import Optional, Dict, Any

from catboost import CatBoostClassifier

class SubjectMLEngine:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(SubjectMLEngine, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.model: Optional[CatBoostClassifier] = None
        self.label_mapping: Optional[Dict[str, Any]] = None
        self.base_path = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(self.base_path, "../modules/subject_predictor/subject_predictor.cbm")
        self.mapping_path = os.path.join(self.base_path, "../modules/subject_predictor/subject_label_mapping.json")
        self._load_resources()
        self._initialized = True

    def _load_resources(self):
        """Loads the CatBoost model and label mapping from disk."""
        try:
            if os.path.exists(self.model_path):
                self.model = CatBoostClassifier()
                self.model.load_model(self.model_path)
                print(f"SubjectMLEngine: Loaded model from {self.model_path}")
            else:
                print(f"SubjectMLEngine: Model not found at {self.model_path}")

            if os.path.exists(self.mapping_path):
                with open(self.mapping_path, 'r') as f:
                    self.label_mapping = json.load(f)
                print(f"SubjectMLEngine: Loaded label mapping from {self.mapping_path}")
            else:
                print(f"SubjectMLEngine: Label mapping not found at {self.mapping_path}")
        except Exception as e:
            print(f"SubjectMLEngine: Error loading resources: {e}")

    def predict(self, features: list) -> list:
        """
        Predicts probabilities for the given features.
        
        Args:
            features: A list of feature values in the order expected by the model.
            
        Returns:
            A list of probability arrays (one for each input sample).
        """
        if not self.model:
            raise RuntimeError("SubjectMLEngine: Model is not loaded.")
            
        # CatBoost predict_proba returns a numpy array
        return self.model.predict_proba([features])

    def get_class_label(self, class_index: int) -> str:
        """Returns the original class label for a given index."""
        if not self.label_mapping:
             raise RuntimeError("SubjectMLEngine: Label mapping is not loaded.")
             
        # Invert the mapping to look up by index
        # The mapping is expected to be { "Label": index }
        inverse_mapping = {v: k for k, v in self.label_mapping.items()}
        return inverse_mapping.get(class_index, "Unknown")
        
        if not self.model:
             raise RuntimeError("SubjectMLEngine: Model is not loaded.")
        return self.model.classes_

subject_ml_engine = SubjectMLEngine()
