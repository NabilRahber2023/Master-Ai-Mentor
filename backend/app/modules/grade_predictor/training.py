import pandas as pd
import json
import os
from catboost import CatBoostRegressor

def train_model():
    # Define paths
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    dataset_path = os.path.join(base_dir, "synthetic_sgpa_dataset_bangladesh.csv")
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_save_path = os.path.join(current_dir, "sgpa_predictor.cbm")
    features_save_path = os.path.join(current_dir, "feature_columns.json")

    print(f"Loading dataset from: {dataset_path}")
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}")

    df = pd.read_csv(dataset_path)

    # Preprocessing
    # Drop StudentID if exists
    if "StudentID" in df.columns:
        df = df.drop(columns=["StudentID"])
    
    # Target Variable
    target_col = "Next_SGPA"
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' found in dataset.")

    y = df[target_col]
    X = df.drop(columns=[target_col])

    # Define Feature Sets
    categorical_features = [
        'Father_Education', 'Mother_Education', 'Parental_Support', 
        'Active_Participation', 'Gender', 'Department'
    ]
    
    # Verify categorical features exist
    missing_cats = [col for col in categorical_features if col not in X.columns]
    if missing_cats:
        print(f"Warning: Missing categorical columns in dataset: {missing_cats}")
        # Only keep existing ones
        categorical_features = [col for col in categorical_features if col in X.columns]

    # Handle missing values in categorical features
    for col in categorical_features:
        X[col] = X[col].fillna("None").astype(str)

    # Save feature names order for inference
    feature_columns = X.columns.tolist()
    with open(features_save_path, "w") as f:
        json.dump(feature_columns, f)
    print(f"Feature columns saved to {features_save_path}")

    # Initialize and Train CatBoostRegressor
    print("Training CatBoostRegressor...")
    model = CatBoostRegressor(
        iterations=1000,
        learning_rate=0.03,
        depth=6,
        loss_function='RMSE',
        cat_features=categorical_features,
        verbose=100
    )

    model.fit(X, y)

    # Save Model
    model.save_model(model_save_path)
    print(f"Model saved to {model_save_path}")

if __name__ == "__main__":
    train_model()
