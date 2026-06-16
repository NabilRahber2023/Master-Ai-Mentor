import pandas as pd
import json
import os
from catboost import CatBoostClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

# Configuration
DATA_PATH = "../../../diu_subject_choice_data.csv"
MODEL_SAVE_PATH = "subject_predictor.cbm"
MAPPING_SAVE_PATH = "subject_label_mapping.json"

CATEGORICAL_FEATURES = [
    'gender', 'preferred_study_style', 'math_skill_level', 
    'programming_interest', 'business_interest', 'creative_interest', 
    'location', 'career_goal'
]

NUMERICAL_FEATURES = ['age', 'hsc_gpa', 'tech_interest_score', 'budget_per_semester']

def train_model():
    # 1. Load Data
    # Searching for data file in plausible locations
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
    elif os.path.exists("diu_subject_choice_data.csv"):
        df = pd.read_csv("diu_subject_choice_data.csv")
    elif os.path.exists("../../../../../diu_subject_choice_data.csv"):
         df = pd.read_csv("../../../../../diu_subject_choice_data.csv")
    else:
        print("Error: diu_subject_choice_data.csv not found.")
        return

    # 2. Preprocessing
    if 'student_id' in df.columns:
        df = df.drop(columns=['student_id'])
        
    X = df[CATEGORICAL_FEATURES + NUMERICAL_FEATURES]
    y = df['diu_department_choice']

    # Label Encoding
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    # Save Label Mapping
    # Store as { "CSE": 0, "EEE": 1, ... }
    label_mapping = {str(label): int(index) for index, label in enumerate(le.classes_)}
    
    with open(MAPPING_SAVE_PATH, 'w') as f:
        json.dump(label_mapping, f, indent=4)
    print(f"Saved label mapping to {MAPPING_SAVE_PATH}")

    # 3. Train Test Split
    X_train, X_val, y_train, y_val = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

    # 4. Train CatBoost
    model = CatBoostClassifier(
        iterations=500,
        learning_rate=0.1,
        depth=6,
        loss_function='MultiClass',
        cat_features=CATEGORICAL_FEATURES,
        verbose=100
    )
    
    model.fit(X_train, y_train, eval_set=(X_val, y_val))
    
    # 5. Save Model
    model.save_model(MODEL_SAVE_PATH)
    print(f"Saved model to {MODEL_SAVE_PATH}")
    
    # 6. Move Artifacts to Module Directory
    import shutil
    target_dir = "app/modules/subject_predictor/"
    if os.path.exists(target_dir):
        shutil.move(MODEL_SAVE_PATH, os.path.join(target_dir, MODEL_SAVE_PATH))
        shutil.move(MAPPING_SAVE_PATH, os.path.join(target_dir, MAPPING_SAVE_PATH))
        print(f"Moved artifacts to {target_dir}")
    else:
        print(f"Target directory {target_dir} not found. Artifacts left in root.")

if __name__ == "__main__":
    train_model()
