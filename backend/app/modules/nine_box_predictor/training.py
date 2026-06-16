import pandas as pd
from catboost import CatBoostClassifier
import json
import os

# Constants
CSV_PATH = "synthetic_9box_bangladesh.csv"
ARTIFACTS_DIR = "app/modules/nine_box_predictor/artifacts"
PERFORMANCE_MODEL_PATH = os.path.join(ARTIFACTS_DIR, "performance_classifier.cbm")
POTENTIAL_MODEL_PATH = os.path.join(ARTIFACTS_DIR, "potential_classifier.cbm")
MAPPING_PATH = os.path.join(ARTIFACTS_DIR, "nine_box_mapping.json")

def train_models():
    print(f"Loading data from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    
    # Drop StudentID
    if "StudentID" in df.columns:
        df = df.drop(columns=["StudentID"])
    
    # Prepare Features and Targets
    X = df.drop(columns=["Performance_Level", "Potential_Level"])
    y_performance = df["Performance_Level"]
    y_potential = df["Potential_Level"]
    
    # Train Performance Model
    print("Training Performance Classifier...")
    perf_model = CatBoostClassifier(iterations=500, depth=6, learning_rate=0.1, loss_function='MultiClass', verbose=100)
    perf_model.fit(X, y_performance)
    perf_model.save_model(PERFORMANCE_MODEL_PATH)
    print(f"Performance model saved to {PERFORMANCE_MODEL_PATH}")
    
    # Train Potential Model
    print("Training Potential Classifier...")
    pot_model = CatBoostClassifier(iterations=500, depth=6, learning_rate=0.1, loss_function='MultiClass', verbose=100)
    pot_model.fit(X, y_potential)
    pot_model.save_model(POTENTIAL_MODEL_PATH)
    print(f"Potential model saved to {POTENTIAL_MODEL_PATH}")
    
    # Create and Save Mapping
    # Logic: Performance_Potential (P_L)
    # 0: Low, 1: Moderate, 2: High (Assuming standard encoding, verifying based on logic)
    # Actually, typical 9-box:
    # Axis: Performance (x), Potential (y) or vice-versa.
    # User Request Example: "2_2": "Star (High Performance / High Potential)"
    # This implies 2 is High.
    # "0_0": "Risk (Low Performance / Low Potential)" => 0 is Low.
    # So 1 must be Moderate.
    
    mapping = {
        "2_2": "Star (High Performance / High Potential)",
        "2_1": "High Performer (High Performance / Moderate Potential)",
        "2_0": "Effective (High Performance / Low Potential)",
        "1_2": "Growth Employee (Moderate Performance / High Potential)",
        "1_1": "Core Employee (Moderate Performance / Moderate Potential)",
        "1_0": "Effective with Issues (Moderate Performance / Low Potential)",
        "0_2": "Enigma (Low Performance / High Potential)",
        "0_1": "Dilemma (Low Performance / Moderate Potential)",
        "0_0": "Risk (Low Performance / Low Potential)"
    }
    
    with open(MAPPING_PATH, 'w') as f:
        json.dump(mapping, f, indent=4)
    print(f"Mapping saved to {MAPPING_PATH}")

if __name__ == "__main__":
    if not os.path.exists(ARTIFACTS_DIR):
        os.makedirs(ARTIFACTS_DIR)
    train_models()
