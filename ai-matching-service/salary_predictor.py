"""
Salary Prediction Service

This service scrapes salary data from multiple sources:
- Indeed
- Glassdoor
- ZipRecruiter
- Salary.com (when API keys are added)
- BLS (Bureau of Labor Statistics)

For MVP, uses mock data. Add your API keys to enable real scraping.
"""

import json
import random
from typing import Dict, List, Optional
import sys

class SalaryPredictor:
    def __init__(self):
        # API Keys - Add these when available
        self.indeed_api_key = None  # TODO: Add Indeed API key
        self.glassdoor_api_key = None  # TODO: Add Glassdoor API key
        self.ziprecruiter_api_key = None  # TODO: Add ZipRecruiter API key

        # Cost of Living Index (sample data - can be expanded)
        self.col_index = {
            'san francisco': 1.62,
            'new york': 1.68,
            'seattle': 1.41,
            'austin': 1.06,
            'boston': 1.47,
            'los angeles': 1.41,
            'chicago': 1.08,
            'denver': 1.12,
            'atlanta': 0.96,
            'dallas': 0.96,
            'miami': 1.10,
            'phoenix': 0.96,
            'philadelphia': 1.06,
            'san diego': 1.44,
            'portland': 1.26,
            # Add more cities as needed
        }

    def get_cost_of_living(self, location: str) -> float:
        """Get cost of living index for a location (1.0 = national average)"""
        city = location.lower().split(',')[0].strip()
        return self.col_index.get(city, 1.0)

    def scrape_indeed(self, job_title: str, location: str) -> Optional[Dict]:
        """
        Scrape salary data from Indeed
        TODO: Implement real scraping when API key is available
        """
        if self.indeed_api_key:
            # Real API call would go here
            pass

        # Mock data for MVP
        base_salary = self._estimate_base_salary(job_title)
        col = self.get_cost_of_living(location)

        return {
            'source': 'indeed',
            'min': int(base_salary * 0.85 * col),
            'max': int(base_salary * 1.25 * col),
            'average': int(base_salary * col),
            'url': f'https://www.indeed.com/salaries/{job_title.replace(" ", "-")}-Salaries',
        }

    def scrape_glassdoor(self, job_title: str, location: str) -> Optional[Dict]:
        """
        Scrape salary data from Glassdoor
        TODO: Implement real scraping when API key is available
        """
        if self.glassdoor_api_key:
            # Real API call would go here
            pass

        # Mock data for MVP
        base_salary = self._estimate_base_salary(job_title)
        col = self.get_cost_of_living(location)
        variation = random.uniform(0.95, 1.05)  # Add some variation

        return {
            'source': 'glassdoor',
            'min': int(base_salary * 0.80 * col * variation),
            'max': int(base_salary * 1.30 * col * variation),
            'average': int(base_salary * col * variation),
            'url': f'https://www.glassdoor.com/Salaries/{job_title.replace(" ", "-")}-salary',
        }

    def scrape_ziprecruiter(self, job_title: str, location: str) -> Optional[Dict]:
        """
        Scrape salary data from ZipRecruiter
        TODO: Implement real scraping when API key is available
        """
        if self.ziprecruiter_api_key:
            # Real API call would go here
            pass

        # Mock data for MVP
        base_salary = self._estimate_base_salary(job_title)
        col = self.get_cost_of_living(location)
        variation = random.uniform(0.93, 1.07)  # Add some variation

        return {
            'source': 'ziprecruiter',
            'min': int(base_salary * 0.87 * col * variation),
            'max': int(base_salary * 1.22 * col * variation),
            'average': int(base_salary * col * variation),
            'url': f'https://www.ziprecruiter.com/Salaries/{job_title.replace(" ", "-")}',
        }

    def _estimate_base_salary(self, job_title: str) -> int:
        """
        Estimate base salary based on job title
        This is a simplified mapping - real data would come from APIs
        """
        title_lower = job_title.lower()

        # Software Engineering
        if 'software engineer' in title_lower or 'developer' in title_lower:
            if 'senior' in title_lower or 'sr' in title_lower:
                return 140000
            elif 'lead' in title_lower or 'principal' in title_lower:
                return 180000
            elif 'junior' in title_lower or 'jr' in title_lower:
                return 85000
            else:
                return 115000

        # Data Science
        elif 'data scientist' in title_lower:
            if 'senior' in title_lower:
                return 145000
            elif 'lead' in title_lower:
                return 175000
            else:
                return 120000

        # DevOps/SRE
        elif 'devops' in title_lower or 'sre' in title_lower:
            if 'senior' in title_lower:
                return 150000
            else:
                return 125000

        # Product Management
        elif 'product manager' in title_lower:
            if 'senior' in title_lower:
                return 155000
            elif 'director' in title_lower:
                return 190000
            else:
                return 130000

        # Design
        elif 'designer' in title_lower or 'ux' in title_lower or 'ui' in title_lower:
            if 'senior' in title_lower:
                return 125000
            elif 'lead' in title_lower:
                return 150000
            else:
                return 95000

        # QA/Testing
        elif 'qa' in title_lower or 'test' in title_lower:
            if 'senior' in title_lower:
                return 110000
            else:
                return 85000

        # Default
        else:
            return 100000

    def calculate_percentiles(self, salaries: List[int]) -> Dict:
        """Calculate salary percentiles"""
        sorted_salaries = sorted(salaries)
        n = len(sorted_salaries)

        return {
            'median': sorted_salaries[n // 2],
            'percentile_75': sorted_salaries[int(n * 0.75)],
            'percentile_90': sorted_salaries[int(n * 0.90)],
        }

    def adjust_for_experience(self, base_salary: int, experience_years: int) -> int:
        """Adjust salary based on years of experience"""
        if experience_years <= 2:
            return int(base_salary * 0.85)
        elif experience_years <= 5:
            return int(base_salary * 1.0)
        elif experience_years <= 10:
            return int(base_salary * 1.20)
        else:
            return int(base_salary * 1.40)

    def predict(self, job_title: str, location: str, experience_years: int = 3, skills: List[str] = None) -> Dict:
        """
        Main prediction function
        Returns aggregated salary data from multiple sources
        """
        sources = []

        # Scrape from all sources
        indeed_data = self.scrape_indeed(job_title, location)
        if indeed_data:
            sources.append(indeed_data)

        glassdoor_data = self.scrape_glassdoor(job_title, location)
        if glassdoor_data:
            sources.append(glassdoor_data)

        ziprecruiter_data = self.scrape_ziprecruiter(job_title, location)
        if ziprecruiter_data:
            sources.append(ziprecruiter_data)

        if not sources:
            return {
                'error': 'No salary data available for this job title and location'
            }

        # Calculate aggregated statistics
        all_averages = [s['average'] for s in sources]
        all_mins = [s['min'] for s in sources]
        all_maxs = [s['max'] for s in sources]

        overall_average = sum(all_averages) // len(all_averages)
        overall_min = sum(all_mins) // len(all_mins)
        overall_max = sum(all_maxs) // len(all_maxs)

        # Adjust for experience
        experience_multiplier = 1.0
        if experience_years <= 2:
            experience_multiplier = 0.85
        elif experience_years <= 5:
            experience_multiplier = 1.0
        elif experience_years <= 10:
            experience_multiplier = 1.15
        else:
            experience_multiplier = 1.35

        overall_average = int(overall_average * experience_multiplier)
        overall_min = int(overall_min * experience_multiplier)
        overall_max = int(overall_max * experience_multiplier)

        # Calculate percentiles
        sample_salaries = []
        for _ in range(100):
            sample_salaries.append(random.randint(overall_min, overall_max))

        percentiles = self.calculate_percentiles(sample_salaries)

        # Generate recommendations
        recommendations = self._generate_recommendations(
            job_title, location, experience_years, overall_average, skills
        )

        return {
            'jobTitle': job_title,
            'location': location,
            'experienceYears': experience_years,
            'overallAverage': overall_average,
            'overallMin': overall_min,
            'overallMax': overall_max,
            'median': percentiles['median'],
            'percentile75': percentiles['percentile_75'],
            'percentile90': percentiles['percentile_90'],
            'sources': sources,
            'costOfLivingIndex': int(self.get_cost_of_living(location) * 100),
            'recommendations': recommendations,
        }

    def _generate_recommendations(self, job_title: str, location: str,
                                  experience_years: int, average_salary: int,
                                  skills: Optional[List[str]]) -> List[str]:
        """Generate AI recommendations based on salary data"""
        recommendations = []

        # Experience-based recommendations
        if experience_years < 3:
            recommendations.append(
                f"Entry-level salary. Focus on gaining experience and building your portfolio to increase earning potential."
            )
        elif experience_years > 10:
            recommendations.append(
                f"Senior-level position. Consider negotiating for equity or additional benefits beyond base salary."
            )

        # Location-based recommendations
        col = self.get_cost_of_living(location)
        if col > 1.3:
            recommendations.append(
                f"High cost-of-living area. Salary is {int((col - 1) * 100)}% above national average to compensate."
            )
        elif col < 0.95:
            recommendations.append(
                f"Lower cost-of-living area. Consider remote opportunities for higher-paying markets."
            )

        # Skills-based recommendations
        if skills:
            high_value_skills = ['aws', 'kubernetes', 'react', 'python', 'machine learning', 'ai']
            matching_skills = [s for s in skills if s.lower() in high_value_skills]
            if matching_skills:
                recommendations.append(
                    f"Your skills in {', '.join(matching_skills)} are in high demand and can command premium salaries."
                )

        # General recommendation
        recommendations.append(
            f"Market average for {job_title} in {location}: {average_salary:,}. Negotiate within 10-15% of this range."
        )

        return recommendations


if __name__ == '__main__':
    # For testing or direct invocation
    if len(sys.argv) > 1:
        input_data = json.loads(sys.argv[1])
        predictor = SalaryPredictor()
        result = predictor.predict(
            input_data['jobTitle'],
            input_data['location'],
            input_data.get('experienceYears', 3),
            input_data.get('skills', [])
        )
        print(json.dumps(result))
    else:
        # Test example
        predictor = SalaryPredictor()
        result = predictor.predict('Senior Software Engineer', 'San Francisco, CA', 7, ['Python', 'AWS', 'React'])
        print(json.dumps(result, indent=2))
