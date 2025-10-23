"""
Data parser and transformer for iLabor360
Converts raw scraped data to standardized format
"""

import re
from datetime import datetime
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class ILabor360Parser:
    def __init__(self):
        # Common skill keywords for extraction
        self.skill_keywords = [
            'JavaScript', 'Python', 'Java', 'C#', 'C++', 'PHP', 'Ruby', 'Go', 'Rust', 'TypeScript',
            'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
            'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Oracle', 'Redis', 'Elasticsearch',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'DevOps',
            'REST API', 'GraphQL', 'Microservices', 'Git', 'Agile', 'Scrum',
            'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch',
            'Selenium', 'Cypress', 'Jest', 'JUnit', 'Testing', 'QA',
            'SAP', 'Salesforce', 'Oracle', 'ERP', 'CRM', 'ServiceNow'
        ]
        
        # Experience level keywords
        self.experience_levels = {
            'Entry': ['entry', 'junior', 'jr', 'associate', 'graduate', 'fresher'],
            'Junior': ['junior', 'jr'],
            'Mid': ['mid', 'intermediate', 'level 2', 'ii'],
            'Senior': ['senior', 'sr', 'lead', 'principal', 'staff', 'level 3', 'iii'],
            'Lead': ['lead', 'principal', 'architect', 'head'],
            'Principal': ['principal', 'architect', 'fellow', 'distinguished']
        }
    
    def parse_requisitions(self, raw_requisitions: List[Dict]) -> List[Dict]:
        """
        Transform raw requisition data to UnifiedJob format
        
        Args:
            raw_requisitions: List of raw requisition dictionaries from scraper
        
        Returns:
            List of parsed requisitions ready for backend
        """
        parsed = []
        
        for req in raw_requisitions:
            try:
                parsed_req = self._parse_single_requisition(req)
                if parsed_req:
                    parsed.append(parsed_req)
            except Exception as e:
                logger.error(f'Error parsing requisition {req.get("reqId", "unknown")}: {str(e)}')
                continue
        
        logger.info(f'Parsed {len(parsed)} of {len(raw_requisitions)} requisitions')
        return parsed
    
    def _parse_single_requisition(self, req: Dict) -> Dict:
        """Parse a single requisition"""
        title = req.get('title', '').strip()
        if not title:
            return None
        
        # Extract skills from title and description
        skills = self._extract_skills(title)
        
        # Determine experience level
        experience_level = self._extract_experience_level(title)
        
        # Parse location type
        location_type = self._parse_location_type(req.get('customer', ''))
        
        # Map status
        status = self._map_requisition_status(req.get('status', 'open'))
        
        # Parse dates
        posted_date = self._parse_date(req.get('startDate', ''))
        closing_date = self._parse_date(req.get('endDate', ''))
        
        return {
            'title': title,
            'description': f"{title}\n\nClient: {req.get('client', '')}\nCustomer: {req.get('customer', '')}",
            'company': req.get('customer', req.get('client', 'iLabor360')),
            'requiredSkills': skills,
            'niceToHaveSkills': [],
            'experienceYears': self._extract_experience_years(title),
            'experienceLevel': experience_level,
            'location': req.get('location', 'Remote'),
            'locationType': location_type,
            'status': status,
            'postedDate': posted_date,
            'closingDate': closing_date,
            'source': {
                'type': 'ilabor360',
                'id': f"ILABOR360-{req.get('reqId', '')}",
                'url': '',  # Will be filled by backend if available
                'metadata': {
                    'reqId': req.get('reqId', ''),
                    'atsId': req.get('atsId', ''),
                    'client': req.get('client', ''),
                    'customer': req.get('customer', ''),
                    'originalStatus': req.get('status', ''),
                    'startDate': req.get('startDate', ''),
                    'endDate': req.get('endDate', '')
                }
            }
        }
    
    def parse_submissions(self, raw_submissions: List[Dict]) -> List[Dict]:
        """
        Transform raw submission data to standardized format
        
        Args:
            raw_submissions: List of raw submission dictionaries from scraper
        
        Returns:
            List of parsed submissions ready for backend
        """
        parsed = []
        
        for sub in raw_submissions:
            try:
                parsed_sub = self._parse_single_submission(sub)
                if parsed_sub:
                    parsed.append(parsed_sub)
            except Exception as e:
                logger.error(f'Error parsing submission {sub.get("submissionId", "unknown")}: {str(e)}')
                continue
        
        logger.info(f'Parsed {len(parsed)} of {len(raw_submissions)} submissions')
        return parsed
    
    def _parse_single_submission(self, sub: Dict) -> Dict:
        """Parse a single submission"""
        candidate_name = sub.get('candidateName', '').strip()
        if not candidate_name:
            return None
        
        # Map submission status to standard status
        status = self._map_submission_status(sub.get('status', ''))
        
        return {
            'submissionId': sub.get('submissionId', ''),
            'reqId': sub.get('reqId', ''),
            'refNumber': sub.get('refNumber', ''),
            'candidateName': candidate_name,
            'jobTitle': sub.get('jobTitle', ''),
            'location': sub.get('location', ''),
            'status': status,
            'client': sub.get('client', ''),
            'customer': sub.get('customer', ''),
            'provider': sub.get('provider', ''),
            'providerUser': sub.get('providerUser', ''),
            'submittedAt': datetime.now().isoformat(),  # Actual date would need to be scraped
            'notes': f"Submitted via iLabor360 - Ref#: {sub.get('refNumber', 'N/A')}"
        }
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extract skills from text"""
        skills = []
        text_lower = text.lower()
        
        for skill in self.skill_keywords:
            if skill.lower() in text_lower:
                skills.append(skill)
        
        return skills[:10]  # Limit to top 10
    
    def _extract_experience_level(self, title: str) -> str:
        """Extract experience level from title"""
        title_lower = title.lower()
        
        for level, keywords in self.experience_levels.items():
            for keyword in keywords:
                if keyword in title_lower:
                    return level
        
        return 'Mid'  # Default
    
    def _extract_experience_years(self, title: str) -> Dict[str, int]:
        """Extract experience years from title"""
        # Look for patterns like "5+ years", "3-5 years", "5 years"
        patterns = [
            r'(\d+)\s*\+?\s*years?',
            r'(\d+)\s*-\s*(\d+)\s*years?'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, title, re.IGNORECASE)
            if match:
                if len(match.groups()) == 2:
                    return {'min': int(match.group(1)), 'max': int(match.group(2))}
                else:
                    years = int(match.group(1))
                    return {'min': years, 'max': years + 3}
        
        # Default based on experience level
        level = self._extract_experience_level(title)
        defaults = {
            'Entry': {'min': 0, 'max': 2},
            'Junior': {'min': 1, 'max': 3},
            'Mid': {'min': 3, 'max': 6},
            'Senior': {'min': 5, 'max': 10},
            'Lead': {'min': 8, 'max': 15},
            'Principal': {'min': 10, 'max': 20}
        }
        return defaults.get(level, {'min': 3, 'max': 6})
    
    def _parse_location_type(self, text: str) -> str:
        """Parse location type from text"""
        text_lower = text.lower()
        
        if 'remote' in text_lower:
            return 'remote'
        elif 'hybrid' in text_lower:
            return 'hybrid'
        elif 'local' in text_lower or 'onsite' in text_lower or 'on-site' in text_lower:
            return 'onsite'
        
        return 'hybrid'  # Default
    
    def _map_requisition_status(self, status: str) -> str:
        """Map iLabor360 requisition status to standard status"""
        status_lower = status.lower()
        
        if 'open' in status_lower:
            return 'open'
        elif 'filled' in status_lower or 'closed' in status_lower:
            return 'filled'
        elif 'on hold' in status_lower or 'pending' in status_lower:
            return 'on_hold'
        else:
            return 'open'
    
    def _map_submission_status(self, status: str) -> str:
        """Map iLabor360 submission status to standard status"""
        status_lower = status.lower()
        
        mapping = {
            'submitted': 'submitted',
            'position cl': 'submitted',  # Position Closed
            'rejected': 'rejected',
            'interview': 'interviewing',
            'screening': 'screening',
            'offered': 'offered',
            'accepted': 'accepted',
            'placed': 'accepted',
            'placement': 'accepted'
        }
        
        for key, value in mapping.items():
            if key in status_lower:
                return value
        
        return 'submitted'  # Default
    
    def _parse_date(self, date_str: str) -> str:
        """Parse date string to ISO format"""
        if not date_str:
            return datetime.now().isoformat()
        
        # Try various date formats
        formats = [
            '%m/%d/%Y',
            '%m/%d/%y',
            '%Y-%m-%d',
            '%d-%m-%Y',
            '%m-%d-%Y',
            '%B %d, %Y',
            '%b %d, %Y'
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                return dt.isoformat()
            except ValueError:
                continue
        
        # If parsing fails, return current date
        logger.warning(f'Could not parse date: {date_str}')
        return datetime.now().isoformat()
