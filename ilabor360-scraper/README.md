# iLabor360 Scraper Service

Selenium-based web scraper for extracting requisitions (job openings) and submissions (candidate submissions) from iLabor360.

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Google Chrome browser installed
- pip (Python package manager)

### Installation

1. **Navigate to the scraper directory:**
```bash
cd ilabor360-scraper
```

2. **Create virtual environment:**
```bash
python -m venv venv
```

3. **Activate virtual environment:**

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

4. **Install dependencies:**
```bash
pip install -r requirements.txt
```

### Running the Service

**Windows:**
```bash
start.bat
```

**Mac/Linux:**
```bash
chmod +x start.sh
./start.sh
```

**Or manually:**
```bash
python app.py
```

The service will start on **http://localhost:5002**

## 📡 API Endpoints

### 1. Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "ilabor360-scraper",
  "version": "1.0.0"
}
```

### 2. Login
```
POST /scrape/login
```

**Request:**
```json
{
  "username": "user@example.com",
  "password": "password123",
  "loginUrl": "https://vendor.ilabor360.com/logout"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "abc-123-def-456",
  "dashboardUrl": "https://vendor.ilabor360.com/dashboard"
}
```

### 3. Scrape Requisitions
```
POST /scrape/requisitions
```

**Request:**
```json
{
  "sessionId": "abc-123-def-456",
  "maxRequisitions": 100,
  "status": "open"
}
```

**Response:**
```json
{
  "success": true,
  "count": 45,
  "requisitions": [
    {
      "title": "Senior Full Stack Developer",
      "company": "Amtrak 1 US - Local",
      "requiredSkills": ["React", "Node.js", "MongoDB"],
      "experienceLevel": "Senior",
      "location": "Washington, DC",
      "status": "open",
      ...
    }
  ]
}
```

### 4. Scrape Submissions
```
POST /scrape/submissions
```

**Request:**
```json
{
  "sessionId": "abc-123-def-456",
  "maxSubmissions": 100
}
```

**Response:**
```json
{
  "success": true,
  "count": 25,
  "submissions": [
    {
      "submissionId": "1065820",
      "reqId": "151703",
      "candidateName": "KALYAN MALLAREDDY",
      "jobTitle": "Senior SAP Security Admin",
      "status": "submitted",
      ...
    }
  ]
}
```

### 5. Scrape All (Both Requisitions & Submissions)
```
POST /scrape/all
```

**Request:**
```json
{
  "sessionId": "abc-123-def-456",
  "maxRequisitions": 100,
  "maxSubmissions": 100
}
```

### 6. Close Session
```
POST /session/close
```

**Request:**
```json
{
  "sessionId": "abc-123-def-456"
}
```

## 🧪 Testing

### Test with cURL

**1. Health Check:**
```bash
curl http://localhost:5002/health
```

**2. Login:**
```bash
curl -X POST http://localhost:5002/scrape/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"Matt.s@techgene.com\",\"password\":\"King@1234\",\"loginUrl\":\"https://vendor.ilabor360.com/logout\"}"
```

**3. Scrape Requisitions:**
```bash
curl -X POST http://localhost:5002/scrape/requisitions \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"YOUR_SESSION_ID\",\"maxRequisitions\":50,\"status\":\"open\"}"
```

### Test with Python

```python
import requests

# Login
response = requests.post('http://localhost:5002/scrape/login', json={
    'username': 'Matt.s@techgene.com',
    'password': 'King@1234',
    'loginUrl': 'https://vendor.ilabor360.com/logout'
})
session_id = response.json()['sessionId']

# Scrape requisitions
response = requests.post('http://localhost:5002/scrape/requisitions', json={
    'sessionId': session_id,
    'maxRequisitions': 50
})
print(response.json())
```

## 🔧 Configuration

Create a `.env` file (copy from `.env.example`):

```env
FLASK_PORT=5002
FLASK_DEBUG=False
CHROME_HEADLESS=true
LOG_LEVEL=INFO
```

## 📝 Data Flow

1. **Login** → Create browser session with Selenium
2. **Navigate** → Go to Requisitions/Submissions pages
3. **Extract** → Parse HTML tables to extract data
4. **Transform** → Convert to standardized format
5. **Return** → Send JSON response to backend

## 🐛 Troubleshooting

### ChromeDriver Issues
If you see "ChromeDriver not found" error:
```bash
pip install --upgrade webdriver-manager
```

### Port Already in Use
Change the port in `.env`:
```env
FLASK_PORT=5003
```

### Login Fails
- Check credentials are correct
- Check iLabor360 site is accessible
- Try with headless=false for debugging:
  - Edit `scraper.py` line 23: `headless=False`

### No Data Scraped
- Check if page structure changed
- Review logs for specific errors
- Try increasing timeout values

## 📊 Logging

Logs are output to console with timestamps:

```
2025-10-23 10:30:15 - scraper - INFO - Creating browser session for login
2025-10-23 10:30:18 - scraper - INFO - Found username field using: ID=username
2025-10-23 10:30:20 - scraper - INFO - Login successful! Session ID: abc-123
```

## 🔒 Security

- Credentials are only stored in memory during session
- Browser sessions auto-expire after 1 hour
- CORS enabled for localhost only
- No credentials logged to files

## 📦 Dependencies

- **selenium** - Browser automation
- **webdriver-manager** - Automatic ChromeDriver management
- **flask** - API server
- **beautifulsoup4** - HTML parsing
- **requests** - HTTP client

## 🚀 Production Deployment

For production, consider:
1. Use a headless server (install `xvfb` for Linux)
2. Set up proper logging to files
3. Implement session cleanup cron job
4. Add authentication to API endpoints
5. Use environment variables for credentials
6. Monitor with health check endpoint

## 📞 Support

If you encounter issues:
1. Check logs for error messages
2. Verify iLabor360 site structure hasn't changed
3. Test with headless=false to see browser
4. Check network connectivity

---

**Version:** 1.0.0  
**Last Updated:** October 23, 2025
