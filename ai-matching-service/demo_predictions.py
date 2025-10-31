"""
Demo script showing salary predictions using the trained model
"""

import json
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from salary_predictor_ml import SalaryPredictor

def print_prediction(title, result):
    """Pretty print a prediction result"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}")
    
    if 'error' in result:
        print(f"❌ Error: {result['error']}")
        return
    
    print(f"\n📊 SALARY PREDICTION")
    print(f"   Job Title: {result['jobTitle']}")
    print(f"   Location: {result['location']}")
    print(f"   Experience: {result['experienceYears']} years")
    print(f"   Model: {result.get('modelUsed', 'N/A')}")
    
    print(f"\n💰 SALARY ESTIMATES")
    print(f"   Average:        ${result['overallAverage']:>10,}")
    print(f"   Range:          ${result['overallMin']:>10,} - ${result['overallMax']:,}")
    print(f"   Median (50th):  ${result['median']:>10,}")
    print(f"   75th Percentile: ${result['percentile75']:>10,}")
    print(f"   90th Percentile: ${result['percentile90']:>10,}")
    
    print(f"\n📍 LOCATION DATA")
    print(f"   Cost of Living Index: {result['costOfLivingIndex']}")
    print(f"   (100 = National Average)")
    
    if 'datasetInfo' in result:
        info = result['datasetInfo']
        print(f"\n📚 DATA SOURCE")
        print(f"   Dataset: {info['source']}")
        print(f"   Records: {info['records']:,}")
        print(f"   States: {info['states']}")
        print(f"   Job Roles: {info['jobRoles']}")
    
    print(f"\n💡 RECOMMENDATIONS")
    for i, rec in enumerate(result['recommendations'], 1):
        print(f"   {i}. {rec}")

if __name__ == '__main__':
    print("="*80)
    print(" "*20 + "SALARY PREDICTION DEMO")
    print(" "*15 + "Using Salary_predection_1.xlsx Dataset")
    print("="*80)
    
    predictor = SalaryPredictor()
    
    # Demo predictions
    demos = [
        {
            'title': 'Entry-Level Software Engineer in California',
            'job_title': 'Software Engineer',
            'location': 'California',
            'experience_years': 1,
            'skills': ['Python', 'JavaScript']
        },
        {
            'title': 'Mid-Level Data Scientist in New York',
            'job_title': 'Data Scientist',
            'location': 'New York',
            'experience_years': 6,
            'skills': ['Python', 'Machine Learning', 'SQL', 'TensorFlow']
        },
        {
            'title': 'Senior DevOps Engineer in Washington',
            'job_title': 'DevOps Engineer',
            'location': 'Washington',
            'experience_years': 12,
            'skills': ['Kubernetes', 'AWS', 'Docker', 'Terraform']
        },
        {
            'title': 'Junior Software Engineer in Texas',
            'job_title': 'Software Engineer',
            'location': 'Texas',
            'experience_years': 2,
            'skills': ['Java', 'Spring Boot', 'MySQL']
        },
        {
            'title': 'Expert-Level Software Engineer in Massachusetts',
            'job_title': 'Software Engineer',
            'location': 'Massachusetts',
            'experience_years': 18,
            'skills': ['Python', 'AWS', 'Kubernetes', 'Machine Learning']
        }
    ]
    
    for demo in demos:
        title = demo.pop('title')
        result = predictor.predict(**demo)
        print_prediction(title, result)
    
    print(f"\n{'='*80}")
    print(" "*25 + "DEMO COMPLETE")
    print("="*80)
    print("\nThe model is ready to use in your Recruiter Suite application!")
    print("All predictions are based on the Salary_predection_1.xlsx dataset.")
    print("="*80 + "\n")
