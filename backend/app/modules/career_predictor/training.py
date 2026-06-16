import pandas as pd
from catboost import CatBoostClassifier
from sklearn.preprocessing import LabelEncoder
import json
import os
import sys

# Define constants
DATASET_PATH = "synthetic_career_choice_bangladesh.csv"
MODEL_PATH = "app/modules/career_predictor/career_predictor.cbm"
MAPPING_PATH = "app/modules/career_predictor/career_label_mapping.json"
CAT_FEATURES = ['Department', 'Personality_Type', 'Preferred_Work_Environment', 'Interest_Area', 'Socioeconomic_Score']

def train_model():
    print("🚀 Starting Career Prediction Model Training...")

    # Load Data
    if not os.path.exists(DATASET_PATH):
        print(f"❌ Dataset not found at {DATASET_PATH}")
        sys.exit(1)
        
    df = pd.read_csv(DATASET_PATH)
    print(f"✅ Loaded dataset with {len(df)} rows.")

    # Drop ID column if exists
    if 'StudentID' in df.columns:
        df = df.drop('StudentID', axis=1)
        print("✅ Dropped StudentID column.")

    # Separate Features and Target
    X = df.drop('Career_Choice', axis=1)
    y = df['Career_Choice']

    # Label Encode Target
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    # Save Label Mapping
    # Create a dictionary mapping integer -> class name
    label_mapping = {int(i): label for i, label in enumerate(le.classes_)}
    with open(MAPPING_PATH, 'w') as f:
        json.dump(label_mapping, f, indent=4)
    print(f"✅ Saved label mapping to {MAPPING_PATH}")

    # Save Feature Columns Order
    feature_columns = X.columns.tolist()
    FEATURE_COLS_PATH = "app/modules/career_predictor/feature_columns.json"
    with open(FEATURE_COLS_PATH, 'w') as f:
        json.dump(feature_columns, f, indent=4)
    print(f"✅ Saved feature columns to {FEATURE_COLS_PATH}")

    # Train CatBoost
    print("⏳ Training CatBoost Classifier...")
    model = CatBoostClassifier(
        iterations=500,
        learning_rate=0.1,
        depth=6,
        loss_function='MultiClass',
        verbose=100,
        cat_features=CAT_FEATURES
    )
    
    model.fit(X, y_encoded)
    
    # Save Model
    model.save_model(MODEL_PATH)
    print(f"✅ Model saved to {MODEL_PATH}")
    print("🎉 Training Clean & Complete!")

if __name__ == "__main__":
    train_model()
