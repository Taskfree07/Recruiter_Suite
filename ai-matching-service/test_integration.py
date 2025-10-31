"""
Integration test for salary prediction with the new Excel-based model
Tests the model as it would be called from the Node.js backend
"""

import json
import subprocess
import sys

def test_prediction(job_title, location, experience_years, skills):
    """Test a single prediction"""
    print(f"\n{'='*70}")
    print(f"Testing: {job_title} in {location} ({experience_years} years)")
    print(f"{'='*70}")
    
    input_data = {
        'jobTitle': job_title,
        'location': location,
        'experienceYears': experience_years,
        'skills': skills
    }
    
    # Call Python script the same way Node.js does
    result = subprocess.run(
        ['python', 'salary_predictor_ml.py', json.dumps(input_data)],
        capture_output=True,
        text=True,
        cwd=r'c:\Users\Sahithi\Desktop\Recruiter_Suite\ai-matching-service'
    )
    
    print(f"\nReturn Code: {result.returncode}")
    
    if result.stderr:
        print(f"\nStderr Output:")
        print(result.stderr)
    
    if result.returncode == 0:
        try:
            # Parse JSON output
            output_lines = result.stdout.strip().split('\n')
            json_line = None
            for line in output_lines:
                if line.strip().startswith('{'):
                    json_line = line
                    break
            
            if json_line:
                prediction = json.loads(json_line)
                
                print(f"\n✅ SUCCESS!")
                print(f"\nPrediction Results:")
                print(f"  Average Salary: ${prediction['overallAverage']:,}")
                print(f"  Salary Range: ${prediction['overallMin']:,} - ${prediction['overallMax']:,}")
                print(f"  Median: ${prediction['median']:,}")
                print(f"  75th Percentile: ${prediction['percentile75']:,}")
                print(f"  90th Percentile: ${prediction['percentile90']:,}")
                print(f"  COL Index: {prediction['costOfLivingIndex']}")
                print(f"  Model Used: {prediction.get('modelUsed', 'N/A')}")
                
                if 'datasetInfo' in prediction:
                    print(f"\nDataset Info:")
                    print(f"  Source: {prediction['datasetInfo']['source']}")
                    print(f"  Records: {prediction['datasetInfo']['records']}")
                    print(f"  States: {prediction['datasetInfo']['states']}")
                    print(f"  Job Roles: {prediction['datasetInfo']['jobRoles']}")
                
                print(f"\nRecommendations:")
                for i, rec in enumerate(prediction['recommendations'], 1):
                    print(f"  {i}. {rec}")
                
                return True
            else:
                print(f"\n❌ FAILED: No JSON output found")
                print(f"Stdout: {result.stdout}")
                return False
                
        except json.JSONDecodeError as e:
            print(f"\n❌ FAILED: JSON parsing error: {e}")
            print(f"Stdout: {result.stdout}")
            return False
    else:
        print(f"\n❌ FAILED with error:")
        print(result.stderr)
        return False

if __name__ == '__main__':
    print("="*70)
    print("SALARY PREDICTION INTEGRATION TESTS")
    print("Testing with Salary_predection_1.xlsx dataset")
    print("="*70)
    
    test_cases = [
        {
            'job_title': 'Software Engineer',
            'location': 'California',
            'experience_years': 5,
            'skills': ['Python', 'JavaScript', 'React']
        },
        {
            'job_title': 'Data Scientist',
            'location': 'New York',
            'experience_years': 7,
            'skills': ['Python', 'Machine Learning', 'SQL']
        },
        {
            'job_title': 'Software Engineer',
            'location': 'Texas',
            'experience_years': 3,
            'skills': ['Java', 'Spring Boot']
        },
        {
            'job_title': 'DevOps Engineer',
            'location': 'Washington',
            'experience_years': 10,
            'skills': ['Kubernetes', 'AWS', 'Docker']
        },
        {
            'job_title': 'Data Analyst',
            'location': 'Illinois',
            'experience_years': 2,
            'skills': ['SQL', 'Python', 'Tableau']
        }
    ]
    
    passed = 0
    failed = 0
    
    for test_case in test_cases:
        success = test_prediction(**test_case)
        if success:
            passed += 1
        else:
            failed += 1
    
    print(f"\n{'='*70}")
    print(f"TEST SUMMARY")
    print(f"{'='*70}")
    print(f"Total Tests: {len(test_cases)}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"{'='*70}")
    
    sys.exit(0 if failed == 0 else 1)
