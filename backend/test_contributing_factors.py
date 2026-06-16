import requests
import json

# Test the grade prediction endpoint with contributing factors
url = "http://localhost:8000/api/v1/prediction/grade/"

# Test data
test_data = {
    "SSC_GPA": 5.0,
    "HSC_GPA": 4.8,
    "Previous_SGPA": 3.75,
    "Study_Hours_Per_Day": 6.0,
    "Attendance_Rate": 95.0,
    "Family_Income_BDT": 50000.0,
    "Part_Time_Hours": 0.0,
    "Father_Education": "Graduate",
    "Mother_Education": "HigherSec",
    "Parental_Support": "Yes",
    "Active_Participation": "Yes",
    "Gender": "Male",
    "Department": "CSE"
}

try:
    response = requests.post(url, json=test_data)
    print("Status Code:", response.status_code)
    print("\nResponse:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
