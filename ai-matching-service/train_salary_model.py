"""
Train Salary Prediction Model using Salary_predection_1.xlsx dataset

This script:
1. Loads the Excel file with salary data by state, job role, and experience
2. Transforms it into a format suitable for ML training
3. Trains a Gradient Boosting model
4. Saves the model for use in predictions
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
import joblib
import os

# Paths
EXCEL_PATH = r'c:\Users\Sahithi\Desktop\Recruiter_Suite\ai-matching-service\data\Salary_predection_1.xlsx'
MODEL_PATH = r'c:\Users\Sahithi\Desktop\Recruiter_Suite\ai-matching-service\models\salary_model.pkl'
ENCODERS_PATH = r'c:\Users\Sahithi\Desktop\Recruiter_Suite\ai-matching-service\models\salary_encoders.pkl'

def load_and_transform_data():
    """Load Excel file and transform into training format"""
    print("Loading Excel file...")
    df = pd.read_excel(EXCEL_PATH)
    
    print(f"Loaded {len(df)} rows with {len(df.columns)} columns")
    print(f"Columns: {list(df.columns)}")
    
    # Transform wide format to long format
    # Each row has State, Job Role, and salary data for different experience levels
    # We need to create multiple rows per original row (one for each experience level)
    
    records = []
    
    experience_mapping = {
        '0-1 Years (Entry)': 0.5,
        '2-4 Years (Junior)': 3,
        '5-9 Years (Mid)': 7,
        '10-14 Years (Senior)': 12,
        '15+ Years (Expert)': 17
    }
    
    for _, row in df.iterrows():
        state = row['State']
        job_role = row['Job Role']
        state_coli = row['State_COLI']
        
        # Create a record for each experience level
        for exp_label, exp_years in experience_mapping.items():
            avg_col = f'{exp_label} - Avg'
            min_col = f'{exp_label} - Min'
            max_col = f'{exp_label} - Max'
            
            if avg_col in df.columns:
                records.append({
                    'state': state,
                    'job_role': job_role,
                    'state_coli': state_coli,
                    'experience_years': exp_years,
                    'salary': row[avg_col],
                    'salary_min': row[min_col],
                    'salary_max': row[max_col]
                })
    
    # Create DataFrame from records
    df_transformed = pd.DataFrame(records)
    
    print(f"\nTransformed to {len(df_transformed)} training records")
    print(f"Unique states: {df_transformed['state'].nunique()}")
    print(f"Unique job roles: {df_transformed['job_role'].nunique()}")
    print(f"Salary range: ${df_transformed['salary'].min():,.2f} - ${df_transformed['salary'].max():,.2f}")
    print(f"Average salary: ${df_transformed['salary'].mean():,.2f}")
    
    return df_transformed

def train_model(df):
    """Train Gradient Boosting model"""
    print("\n" + "="*60)
    print("TRAINING MODEL")
    print("="*60)
    
    # Encode categorical features
    encoders = {}
    
    # Encode state
    encoders['state'] = LabelEncoder()
    df['state_encoded'] = encoders['state'].fit_transform(df['state'])
    
    # Encode job role
    encoders['job_role'] = LabelEncoder()
    df['job_role_encoded'] = encoders['job_role'].fit_transform(df['job_role'])
    
    # Feature columns
    feature_columns = ['state_encoded', 'job_role_encoded', 'state_coli', 'experience_years']
    
    # Prepare X and y
    X = df[feature_columns]
    y = df['salary']
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"\nTraining set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    
    # Train Gradient Boosting Regressor
    print("\nTraining Gradient Boosting Regressor...")
    model = GradientBoostingRegressor(
        n_estimators=200,
        learning_rate=0.1,
        max_depth=6,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        verbose=0
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    print("\n" + "="*60)
    print("MODEL EVALUATION")
    print("="*60)
    
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)
    
    train_mae = mean_absolute_error(y_train, train_pred)
    test_mae = mean_absolute_error(y_test, test_pred)
    train_rmse = np.sqrt(mean_squared_error(y_train, train_pred))
    test_rmse = np.sqrt(mean_squared_error(y_test, test_pred))
    train_r2 = r2_score(y_train, train_pred)
    test_r2 = r2_score(y_test, test_pred)
    
    print(f"\nTraining Metrics:")
    print(f"  MAE:  ${train_mae:,.2f}")
    print(f"  RMSE: ${train_rmse:,.2f}")
    print(f"  R²:   {train_r2:.4f}")
    
    print(f"\nTest Metrics:")
    print(f"  MAE:  ${test_mae:,.2f}")
    print(f"  RMSE: ${test_rmse:,.2f}")
    print(f"  R²:   {test_r2:.4f}")
    
    # Feature importance
    print(f"\nFeature Importance:")
    for i, col in enumerate(feature_columns):
        print(f"  {col}: {model.feature_importances_[i]:.4f}")
    
    # Save model
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    
    joblib.dump(model, MODEL_PATH)
    joblib.dump({
        'encoders': encoders,
        'feature_columns': feature_columns,
        'dataset_stats': {
            'total_records': len(df),
            'unique_states': df['state'].nunique(),
            'unique_job_roles': df['job_role'].nunique(),
            'salary_range': {
                'min': float(df['salary'].min()),
                'max': float(df['salary'].max()),
                'mean': float(df['salary'].mean()),
                'median': float(df['salary'].median())
            }
        }
    }, ENCODERS_PATH)
    
    print(f"\n✓ Model saved to: {MODEL_PATH}")
    print(f"✓ Encoders saved to: {ENCODERS_PATH}")
    
    return model, encoders, feature_columns

def test_predictions(model, encoders, feature_columns):
    """Test the model with sample predictions"""
    print("\n" + "="*60)
    print("SAMPLE PREDICTIONS")
    print("="*60)
    
    test_cases = [
        {'job_role': 'Software Engineer', 'state': 'California', 'experience_years': 5, 'state_coli': 150.0},
        {'job_role': 'Data Scientist', 'state': 'New York', 'experience_years': 7, 'state_coli': 168.0},
        {'job_role': 'Product Manager', 'state': 'Texas', 'experience_years': 10, 'state_coli': 95.0},
        {'job_role': 'Software Engineer', 'state': 'Washington', 'experience_years': 3, 'state_coli': 120.0},
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        try:
            # Encode features
            state_encoded = encoders['state'].transform([test_case['state']])[0]
            job_role_encoded = encoders['job_role'].transform([test_case['job_role']])[0]
            
            # Create feature vector
            X = [[state_encoded, job_role_encoded, test_case['state_coli'], test_case['experience_years']]]
            
            # Predict
            prediction = model.predict(X)[0]
            
            print(f"\nTest Case {i}:")
            print(f"  Job Role: {test_case['job_role']}")
            print(f"  State: {test_case['state']}")
            print(f"  Experience: {test_case['experience_years']} years")
            print(f"  Predicted Salary: ${prediction:,.2f}")
            
        except Exception as e:
            print(f"\nTest Case {i}: Error - {e}")

if __name__ == '__main__':
    print("="*60)
    print("SALARY PREDICTION MODEL TRAINING")
    print("Using: Salary_predection_1.xlsx")
    print("="*60)
    
    # Load and transform data
    df = load_and_transform_data()
    
    # Train model
    model, encoders, feature_columns = train_model(df)
    
    # Test predictions
    test_predictions(model, encoders, feature_columns)
    
    print("\n" + "="*60)
    print("TRAINING COMPLETE!")
    print("="*60)
