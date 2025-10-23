"""
iLabor360 Scraper Service
Flask API for scraping requisitions and submissions from iLabor360
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from scraper import ILabor360Scraper
from parser import ILabor360Parser
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize scraper
scraper = ILabor360Scraper()
parser = ILabor360Parser()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'ilabor360-scraper',
        'version': '1.0.0'
    })

@app.route('/scrape/login', methods=['POST'])
def login():
    """
    Test login credentials
    
    Request Body:
    {
        "username": "user@example.com",
        "password": "password123",
        "loginUrl": "https://vendor.ilabor360.com/logout"
    }
    """
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        login_url = data.get('loginUrl', 'https://vendor.ilabor360.com/logout')
        
        if not username or not password:
            return jsonify({
                'success': False,
                'error': 'Username and password are required'
            }), 400
        
        logger.info(f'Testing login for user: {username}')
        
        # Attempt login
        result = scraper.login(username, password, login_url)
        
        if result['success']:
            logger.info('Login successful')
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'sessionId': result['sessionId'],
                'dashboardUrl': result.get('dashboardUrl')
            })
        else:
            logger.error(f'Login failed: {result.get("error")}')
            return jsonify({
                'success': False,
                'error': result.get('error', 'Login failed')
            }), 401
            
    except Exception as e:
        logger.error(f'Login error: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/scrape/requisitions', methods=['POST'])
def scrape_requisitions():
    """
    Scrape requisitions (job openings)
    
    Request Body:
    {
        "sessionId": "abc123",
        "maxRequisitions": 100,
        "status": "open"  // optional: "open", "filled", "closed", "all"
    }
    """
    try:
        data = request.json
        session_id = data.get('sessionId')
        max_requisitions = data.get('maxRequisitions', 100)
        status_filter = data.get('status', 'all')
        
        if not session_id:
            return jsonify({
                'success': False,
                'error': 'Session ID is required'
            }), 400
        
        logger.info(f'Scraping requisitions (max: {max_requisitions}, status: {status_filter})')
        
        # Scrape requisitions
        result = scraper.scrape_requisitions(
            session_id=session_id,
            max_items=max_requisitions,
            status_filter=status_filter
        )
        
        if not result['success']:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to scrape requisitions')
            }), 500
        
        # Parse and transform data
        raw_requisitions = result['requisitions']
        parsed_requisitions = parser.parse_requisitions(raw_requisitions)
        
        logger.info(f'Successfully scraped {len(parsed_requisitions)} requisitions')
        
        return jsonify({
            'success': True,
            'count': len(parsed_requisitions),
            'requisitions': parsed_requisitions
        })
        
    except Exception as e:
        logger.error(f'Scrape requisitions error: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/scrape/submissions', methods=['POST'])
def scrape_submissions():
    """
    Scrape submissions (candidate submissions)
    
    Request Body:
    {
        "sessionId": "abc123",
        "maxSubmissions": 100,
        "dateFrom": "2025-01-01",  // optional
        "dateTo": "2025-12-31"      // optional
    }
    """
    try:
        data = request.json
        session_id = data.get('sessionId')
        max_submissions = data.get('maxSubmissions', 100)
        date_from = data.get('dateFrom')
        date_to = data.get('dateTo')
        
        if not session_id:
            return jsonify({
                'success': False,
                'error': 'Session ID is required'
            }), 400
        
        logger.info(f'Scraping submissions (max: {max_submissions})')
        
        # Scrape submissions
        result = scraper.scrape_submissions(
            session_id=session_id,
            max_items=max_submissions,
            date_from=date_from,
            date_to=date_to
        )
        
        if not result['success']:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to scrape submissions')
            }), 500
        
        # Parse and transform data
        raw_submissions = result['submissions']
        parsed_submissions = parser.parse_submissions(raw_submissions)
        
        logger.info(f'Successfully scraped {len(parsed_submissions)} submissions')
        
        return jsonify({
            'success': True,
            'count': len(parsed_submissions),
            'submissions': parsed_submissions
        })
        
    except Exception as e:
        logger.error(f'Scrape submissions error: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/scrape/all', methods=['POST'])
def scrape_all():
    """
    Scrape both requisitions and submissions in one call
    
    Request Body:
    {
        "sessionId": "abc123",
        "maxRequisitions": 100,
        "maxSubmissions": 100
    }
    """
    try:
        data = request.json
        session_id = data.get('sessionId')
        
        if not session_id:
            return jsonify({
                'success': False,
                'error': 'Session ID is required'
            }), 400
        
        logger.info('Scraping both requisitions and submissions')
        
        # Scrape requisitions
        req_result = scraper.scrape_requisitions(
            session_id=session_id,
            max_items=data.get('maxRequisitions', 100)
        )
        
        # Scrape submissions
        sub_result = scraper.scrape_submissions(
            session_id=session_id,
            max_items=data.get('maxSubmissions', 100)
        )
        
        requisitions = []
        submissions = []
        
        if req_result['success']:
            requisitions = parser.parse_requisitions(req_result['requisitions'])
        
        if sub_result['success']:
            submissions = parser.parse_submissions(sub_result['submissions'])
        
        logger.info(f'Scraped {len(requisitions)} requisitions and {len(submissions)} submissions')
        
        return jsonify({
            'success': True,
            'requisitions': {
                'count': len(requisitions),
                'data': requisitions
            },
            'submissions': {
                'count': len(submissions),
                'data': submissions
            }
        })
        
    except Exception as e:
        logger.error(f'Scrape all error: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/session/close', methods=['POST'])
def close_session():
    """Close browser session"""
    try:
        data = request.json
        session_id = data.get('sessionId')
        
        if session_id:
            scraper.close_session(session_id)
            logger.info(f'Session {session_id} closed')
        
        return jsonify({
            'success': True,
            'message': 'Session closed'
        })
        
    except Exception as e:
        logger.error(f'Close session error: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5002))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f'Starting iLabor360 Scraper Service on port {port}')
    logger.info(f'Debug mode: {debug}')
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
