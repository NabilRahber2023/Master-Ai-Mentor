"""
Direct test of the grade predictor service with contributing factors
"""
import sys
sys.path.insert(0, '/Users/syed/Documents/ai mentor')

from app.modules.grade_predictor.schemas import SGPAPredictionInput
from app.modules.grade_predictor.services import grade_predictor_service

# Test data
test_input = SGPAPredictionInput(
    SSC_GPA=5.0,
    HSC_GPA=4.8,
    Previous_SGPA=3.75,
    Study_Hours_Per_Day=6.0,
    Attendance_Rate=95.0,
    Family_Income_BDT=50000.0,
    Part_Time_Hours=0.0,
    Father_Education="Graduate",
    Mother_Education="HigherSec",
    Parental_Support="Yes",
    Active_Participation="Yes",
    Gender="Male",
    Department="CSE"
)

print("Testing grade prediction with contributing factors...\n")
try:
    result = grade_predictor_service.predict_sgpa(test_input)
    print(f"Predicted SGPA: {result.predicted_sgpa}")
    print(f"Risk Level: {result.risk_level}")
    print(f"\nTop Contributing Factors:")
    for i, factor in enumerate(result.contributing_factors, 1):
        print(f"{i}. {factor.feature}: {factor.value} (Impact: {factor.impact_score})")
    print("\n✓ Test successful!")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
