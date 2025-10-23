"""
Simple test script to verify iLabor360 scraper
"""
import requests
import json
import os

# Disable proxy
os.environ['NO_PROXY'] = 'localhost,127.0.0.1'

BASE_URL = 'http://localhost:5002'

# Create session without proxy
session = requests.Session()
session.trust_env = False

def test_health():
    """Test health endpoint"""
    print('Testing health endpoint...')
    try:
        response = session.get(f'{BASE_URL}/health', timeout=5)
        print(f'✓ Health check: {response.json()}')
        return True
    except Exception as e:
        print(f'✗ Health check failed: {e}')
        return False

def test_login():
    """Test login with actual credentials"""
    print('\nTesting login...')
    try:
        response = session.post(
            f'{BASE_URL}/scrape/login',
            json={
                'username': 'Matt.s@techgene.com',
                'password': 'King@1234',
                'loginUrl': 'https://vendor.ilabor360.com/logout'
            },
            timeout=120
        )
        result = response.json()
        if result.get('success'):
            print(f'✓ Login successful!')
            print(f'  Session ID: {result.get("sessionId")}')
            print(f'  Dashboard URL: {result.get("dashboardUrl")}')
            return result.get('sessionId')
        else:
            print(f'✗ Login failed: {result.get("error")}')
            return None
    except Exception as e:
        print(f'✗ Login error: {e}')
        return None

def test_scrape_requisitions(session_id):
    """Test scraping requisitions"""
    print('\nTesting requisitions scraping...')
    try:
        response = session.post(
            f'{BASE_URL}/scrape/requisitions',
            json={
                'sessionId': session_id,
                'maxRequisitions': 10,
                'status': 'all'
            },
            timeout=120
        )
        result = response.json()
        if result.get('success'):
            print(f'✓ Scraped {result.get("count")} requisitions')
            if result.get('requisitions'):
                first = result['requisitions'][0]
                print(f'  Sample: {first.get("title")} at {first.get("company")}')
            return True
        else:
            print(f'✗ Scraping failed: {result.get("error")}')
            return False
    except Exception as e:
        print(f'✗ Scraping error: {e}')
        return False

def test_scrape_submissions(session_id):
    """Test scraping submissions"""
    print('\nTesting submissions scraping...')
    try:
        response = session.post(
            f'{BASE_URL}/scrape/submissions',
            json={
                'sessionId': session_id,
                'maxSubmissions': 10
            },
            timeout=120
        )
        result = response.json()
        if result.get('success'):
            print(f'✓ Scraped {result.get("count")} submissions')
            if result.get('submissions'):
                first = result['submissions'][0]
                print(f'  Sample: {first.get("candidateName")} for {first.get("jobTitle")}')
            return True
        else:
            print(f'✗ Scraping failed: {result.get("error")}')
            return False
    except Exception as e:
        print(f'✗ Scraping error: {e}')
        return False

def close_session(session_id):
    """Close browser session"""
    print('\nClosing session...')
    try:
        session.post(f'{BASE_URL}/session/close', json={'sessionId': session_id})
        print('✓ Session closed')
    except Exception as e:
        print(f'Warning: Could not close session: {e}')

if __name__ == '__main__':
    print('=' * 60)
    print('iLabor360 Scraper Test Suite')
    print('=' * 60)
    
    # Test 1: Health check
    if not test_health():
        print('\n❌ Server is not running. Start it with: python app.py')
        exit(1)
    
    # Test 2: Login
    session_id = test_login()
    if not session_id:
        print('\n❌ Login failed. Cannot proceed with scraping tests.')
        exit(1)
    
    # Test 3: Scrape requisitions
    test_scrape_requisitions(session_id)
    
    # Test 4: Scrape submissions
    test_scrape_submissions(session_id)
    
    # Cleanup
    close_session(session_id)
    
    print('\n' + '=' * 60)
    print('✅ All tests completed!')
    print('=' * 60)
