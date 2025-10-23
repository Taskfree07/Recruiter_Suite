# iLabor360 Scraping Integration Plan

## 📋 Executive Summary

This document outlines the plan to integrate **iLabor360** real-time job scraping into your existing ATS Resume Optimizer's Job Pipeline system. The scraping service will automatically fetch jobs from iLabor360 and integrate them with your unified job management system alongside Outlook and Ceipal sources.

---

## 🎯 Goals

1. **Real-Time Job Scraping**: Automatically scrape job postings from iLabor360
2. **Seamless Integration**: Integrate scraped jobs into existing UnifiedJob model
3. **AI Matching**: Leverage existing AI matching service for candidate recommendations
4. **Automated Sync**: Schedule periodic syncing (every 15-30 minutes)
5. **Error Handling**: Robust error handling and retry mechanisms
6. **Monitoring**: Track sync status, success rates, and errors

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Job Pipeline Page                                  │   │
│  │  - Shows jobs from: Outlook | Ceipal | iLabor360   │   │
│  │  - Filter by source                                 │   │
│  │  - Manual sync button                               │   │
│  │  - Auto-sync status indicator                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  iLabor360 Settings Page (NEW)                      │   │
│  │  - Login credentials config                         │   │
│  │  - Sync settings                                    │   │
│  │  - Connection test                                  │   │
│  │  - Sync history/logs                                │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTP/REST API
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                Node.js Backend (Express)                     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  iLabor360 Routes (/api/ilabor360/*)                │   │
│  │  - GET /config                                      │   │
│  │  - POST /config                                     │   │
│  │  - POST /test-connection                            │   │
│  │  - POST /sync                                       │   │
│  │  - GET /stats                                       │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │  iLabor360 Service                                  │   │
│  │  - Authentication management                        │   │
│  │  - Job scraping orchestration                       │   │
│  │  - Data transformation                              │   │
│  │  - Error handling                                   │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │  Cron Scheduler (node-cron)                         │   │
│  │  - Runs every 15-30 minutes                         │   │
│  │  - Triggers sync automatically                      │   │
│  └────────────────────┬────────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────┘
                         │ HTTP/Scraping
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Python Scraping Service                         │
│  (Microservice - Similar to ai-matching-service)            │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Flask API Server (Port 5002)                       │   │
│  │  - POST /scrape/login                               │   │
│  │  - POST /scrape/jobs                                │   │
│  │  - POST /scrape/job-details                         │   │
│  │  - GET /health                                      │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │  Selenium/Playwright Scraper                        │   │
│  │  - Browser automation                               │   │
│  │  - Login to iLabor360                               │   │
│  │  - Navigate job listings                            │   │
│  │  - Extract job details                              │   │
│  │  - Handle pagination                                │   │
│  │  - Session management                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Data Parser                                         │   │
│  │  - Clean HTML                                       │   │
│  │  - Extract structured data                          │   │
│  │  - Normalize skills                                 │   │
│  │  - Parse salary ranges                              │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────┬──────────────────────────────────────┘
                        │ Returns JSON
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB                                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  unified_jobs (existing)                            │   │
│  │  - sources: [..., {type: 'ilabor360', ...}]        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ilabor360_configs (new)                            │   │
│  │  - Login credentials (encrypted)                    │   │
│  │  - Sync settings                                    │   │
│  │  - Last sync timestamp                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ilabor360_sync_logs (new)                          │   │
│  │  - Sync history                                     │   │
│  │  - Success/failure tracking                         │   │
│  │  - Error logs                                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Research Questions (Must Answer First)

Before implementing, we need to understand iLabor360's structure:

### 1. **Access & Authentication**
- [ ] What is the iLabor360 URL? (e.g., `https://app.ilabor360.com`)
- [ ] Login type: Username/Password, SSO, or API Key?
- [ ] Does iLabor360 have a public API?
- [ ] Are there any scraping restrictions (robots.txt, terms of service)?
- [ ] Is login session-based or token-based?
- [ ] Session timeout duration?

### 2. **Job Listing Structure**
- [ ] Where are job listings located? (Dashboard, specific menu item?)
- [ ] URL pattern for job list page? (e.g., `/jobs`, `/requisitions`)
- [ ] Are jobs paginated? If yes, how? (Query params, infinite scroll?)
- [ ] How many jobs per page?
- [ ] Total number of jobs typically available?

### 3. **Job Detail Pages**
- [ ] URL pattern for individual job details?
- [ ] Are all details on list page or need to click into each job?
- [ ] HTML structure: Tables, divs, or JSON responses?
- [ ] Are there AJAX/dynamic loads we need to wait for?

### 4. **Data Fields Available**
- [ ] Job title
- [ ] Job ID/reference number
- [ ] Company name
- [ ] Job description
- [ ] Required skills (how are they formatted?)
- [ ] Experience level/years
- [ ] Location (city, state, remote option?)
- [ ] Salary range (if available)
- [ ] Posted date
- [ ] Application deadline
- [ ] Job status (open/closed)
- [ ] Number of positions
- [ ] Hiring manager info
- [ ] Any custom fields specific to your organization

### 5. **Technical Constraints**
- [ ] Does iLabor360 use JavaScript rendering? (React, Angular, Vue?)
- [ ] Are there CAPTCHAs on login?
- [ ] Rate limiting detected?
- [ ] IP blocking concerns?
- [ ] Multi-factor authentication?

---

## 📦 Technology Stack

### Option A: Selenium (Recommended for Complex Sites)
**Pros:**
- Full browser automation
- Handles JavaScript-heavy sites
- Can interact with complex UI elements
- Good for sites with dynamic content
- Can handle multi-step authentication

**Cons:**
- Slower than other options
- Higher resource usage (needs browser)
- More complex setup

**Dependencies:**
```python
selenium==4.15.2
webdriver-manager==4.0.1
beautifulsoup4==4.12.3
lxml==5.1.0
```

### Option B: Playwright (Modern Alternative)
**Pros:**
- Faster than Selenium
- Better API design
- Built-in auto-waiting
- Excellent for modern web apps
- Headless by default

**Cons:**
- Newer (less community support)
- Still resource-intensive

**Dependencies:**
```python
playwright==1.40.0
beautifulsoup4==4.12.3
```

### Option C: Requests + BeautifulSoup (Lightest)
**Pros:**
- Very fast
- Low resource usage
- Simple to implement
- Good for static HTML sites

**Cons:**
- Cannot handle JavaScript rendering
- Won't work if site is React/Vue/Angular heavy
- No interaction with UI elements

**Dependencies:**
```python
requests==2.31.0
beautifulsoup4==4.12.3
lxml==5.1.0
```

### 🎯 Recommendation: **Start with Selenium**
- Most reliable for unknown site structure
- Can always switch to lighter option later if site is simple
- Already familiar pattern (similar to salary scraper concept)

---

## 🗂️ Database Schema

### 1. iLabor360Config Collection

```typescript
interface IILabor360Config {
  userId: string;                    // Multi-tenant support
  
  // Authentication
  username: string;                  // Encrypted
  password: string;                  // Encrypted
  loginUrl: string;                  // iLabor360 login page
  
  // Connection Status
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastConnectionTest: Date;
  lastError?: string;
  
  // Sync Settings
  syncEnabled: boolean;
  syncInterval: number;              // Minutes (default: 30)
  autoSync: boolean;                 // Auto-sync on/off
  lastSyncDate?: Date;
  
  // Scraping Config
  jobListUrl: string;                // URL pattern for job list
  maxJobsPerSync: number;            // Limit per sync (default: 50)
  scrapingTimeout: number;           // Seconds (default: 60)
  
  // Filters
  filterByStatus?: string[];         // ['open', 'active']
  filterByLocation?: string[];
  filterByDepartment?: string[];
  
  // Stats
  totalJobsSynced: number;
  lastSyncJobCount: number;
  errorCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. iLabor360SyncLog Collection

```typescript
interface IILabor360SyncLog {
  userId: string;
  syncStartTime: Date;
  syncEndTime: Date;
  status: 'success' | 'partial' | 'failed';
  
  // Results
  jobsFound: number;
  jobsAdded: number;
  jobsUpdated: number;
  jobsSkipped: number;
  
  // Errors
  errors: Array<{
    jobId?: string;
    error: string;
    timestamp: Date;
  }>;
  
  // Performance
  durationMs: number;
  
  createdAt: Date;
}
```

### 3. UnifiedJob Update (Existing Schema)

No changes needed! Just add `ilabor360` as a source type:

```typescript
sources: [
  {
    type: 'ilabor360',              // NEW: Add to enum
    id: 'ILABOR360-12345',          // iLabor360 job ID
    url: 'https://app.ilabor360...', // Direct link to job
    metadata: {
      internalJobId: '12345',
      department: 'Engineering',
      hiringManager: 'John Doe',
      originalPostedDate: '2025-10-20',
      // Any other iLabor360-specific fields
    },
    syncDate: Date.now()
  }
]
```

---

## 🛠️ Implementation Files

### New Files to Create

```
backend/src/
├── models/
│   ├── iLabor360Config.ts          (NEW) - Config model
│   └── iLabor360SyncLog.ts         (NEW) - Sync logs model
├── routes/
│   └── iLabor360Routes.ts          (NEW) - API endpoints
└── services/
    └── iLabor360Service.ts         (NEW) - Main service

ilabor360-scraper/                  (NEW MICROSERVICE)
├── app.py                          - Flask API server
├── scraper.py                      - Selenium scraper
├── parser.py                       - Data parser
├── config.py                       - Config management
├── requirements.txt                - Python dependencies
├── start.bat                       - Windows startup script
├── start.sh                        - Unix startup script
└── README.md                       - Setup instructions

frontend/src/
├── pages/
│   └── ILabor360Settings.tsx       (NEW) - Settings page
└── services/
    └── iLabor360Service.ts         (NEW) - API client
```

### Updated Files

```
backend/src/
├── models/
│   └── unifiedJob.ts               (UPDATE) - Add 'ilabor360' to source enum
└── server.ts                       (UPDATE) - Register routes & cron job

frontend/src/
├── pages/
│   └── RecruiterDashboard.tsx      (UPDATE) - Add iLabor360 sync button
└── App.tsx                         (UPDATE) - Add settings route
```

---

## 🔄 Scraping Flow

### Step 1: Authentication
```
1. User enters credentials in frontend settings
2. Frontend sends to POST /api/ilabor360/config
3. Backend encrypts and saves to DB
4. Backend calls Python scraper: POST /scrape/login
5. Python scraper:
   - Opens browser (headless)
   - Navigates to iLabor360 login page
   - Enters username/password
   - Waits for redirect to dashboard
   - Stores session cookies
6. Returns success/failure to backend
7. Backend updates connection status
```

### Step 2: Manual Sync (User Triggered)
```
1. User clicks "Sync iLabor360" button
2. Frontend calls POST /api/ilabor360/sync
3. Backend calls Python scraper: POST /scrape/jobs
4. Python scraper:
   - Reuses session or re-login if expired
   - Navigates to job list page
   - Scrapes all job cards/rows
   - Extracts: ID, title, company, location, status
   - Handles pagination (if needed)
   - For each job: Calls /scrape/job-details
   - Extracts full description, skills, salary, etc.
5. Returns array of job objects to backend
6. Backend transforms to UnifiedJob format
7. Backend saves to MongoDB:
   - Check if job exists (by iLabor360 ID)
   - If exists: Update
   - If new: Insert with source = 'ilabor360'
8. Backend creates sync log entry
9. Backend returns summary to frontend
10. Frontend shows success message + stats
```

### Step 3: Automatic Sync (Scheduled)
```
1. Cron job runs every 30 minutes
2. Checks if autoSync is enabled
3. If enabled, triggers sync (same as Step 2)
4. Logs results to console and DB
5. If errors exceed threshold, sends alert (future: email)
```

---

## 🔐 Security Considerations

### 1. Credential Encryption
```typescript
// Use existing encryption or create new service
import crypto from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

### 2. Rate Limiting
```typescript
// Prevent abuse
app.use('/api/ilabor360/sync', rateLimit({
  windowMs: 5 * 60 * 1000,    // 5 minutes
  max: 5,                      // Max 5 syncs per 5 min
  message: 'Too many sync requests, please wait'
}));
```

### 3. Session Management
```python
# Store session in memory or Redis
class SessionManager:
    def __init__(self):
        self.sessions = {}  # userId: { cookies, timestamp }
    
    def get_session(self, user_id: str):
        if user_id in self.sessions:
            session = self.sessions[user_id]
            # Check if session is still valid (< 30 min old)
            if (datetime.now() - session['timestamp']).seconds < 1800:
                return session['cookies']
        return None
    
    def save_session(self, user_id: str, cookies):
        self.sessions[user_id] = {
            'cookies': cookies,
            'timestamp': datetime.now()
        }
```

---

## 📊 API Endpoints

### Backend (Node.js)

#### 1. GET `/api/ilabor360/config`
Get current configuration.

**Response:**
```json
{
  "success": true,
  "config": {
    "username": "user@company.com",
    "password": "********",
    "loginUrl": "https://app.ilabor360.com/login",
    "connectionStatus": "connected",
    "syncEnabled": true,
    "syncInterval": 30,
    "autoSync": true,
    "lastSyncDate": "2025-10-23T10:30:00Z",
    "totalJobsSynced": 125
  }
}
```

#### 2. POST `/api/ilabor360/config`
Update configuration.

**Request:**
```json
{
  "username": "user@company.com",
  "password": "securePassword123",
  "loginUrl": "https://app.ilabor360.com/login",
  "jobListUrl": "https://app.ilabor360.com/jobs",
  "syncInterval": 30,
  "autoSync": true
}
```

#### 3. POST `/api/ilabor360/test-connection`
Test login credentials.

**Response:**
```json
{
  "success": true,
  "message": "Successfully connected to iLabor360",
  "jobsFound": 45
}
```

#### 4. POST `/api/ilabor360/sync`
Manually trigger sync.

**Response:**
```json
{
  "success": true,
  "message": "Sync completed successfully",
  "stats": {
    "jobsFound": 45,
    "jobsAdded": 8,
    "jobsUpdated": 37,
    "jobsSkipped": 0,
    "errors": [],
    "durationMs": 12340
  }
}
```

#### 5. GET `/api/ilabor360/stats`
Get sync statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalJobsSynced": 125,
    "lastSyncDate": "2025-10-23T10:30:00Z",
    "lastSyncJobCount": 45,
    "recentSyncs": [
      {
        "date": "2025-10-23T10:30:00Z",
        "status": "success",
        "jobsAdded": 8,
        "duration": 12340
      }
    ],
    "errorRate": 2.5
  }
}
```

### Python Scraper Service

#### 1. GET `/health`
Health check.

**Response:**
```json
{
  "status": "ok",
  "service": "ilabor360-scraper",
  "version": "1.0.0"
}
```

#### 2. POST `/scrape/login`
Test login credentials.

**Request:**
```json
{
  "username": "user@company.com",
  "password": "securePassword123",
  "loginUrl": "https://app.ilabor360.com/login"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "sessionId": "abc123xyz",
  "dashboardUrl": "https://app.ilabor360.com/dashboard"
}
```

#### 3. POST `/scrape/jobs`
Scrape all jobs.

**Request:**
```json
{
  "sessionId": "abc123xyz",
  "jobListUrl": "https://app.ilabor360.com/jobs",
  "maxJobs": 50
}
```

**Response:**
```json
{
  "success": true,
  "jobCount": 45,
  "jobs": [
    {
      "id": "ILABOR360-12345",
      "title": "Senior Full Stack Developer",
      "company": "TechCorp Inc",
      "location": "San Francisco, CA",
      "locationType": "hybrid",
      "description": "Full job description...",
      "requiredSkills": ["React", "Node.js", "MongoDB"],
      "experienceYears": { "min": 5, "max": 8 },
      "salary": { "min": 120000, "max": 160000 },
      "status": "open",
      "postedDate": "2025-10-20",
      "url": "https://app.ilabor360.com/jobs/12345"
    }
  ]
}
```

---

## 📝 Implementation Phases

### Phase 1: Research & Setup (Week 1)
**Duration:** 3-5 days

**Tasks:**
- [ ] Get iLabor360 credentials from you
- [ ] Manually explore iLabor360 interface
- [ ] Document page structure (login, job list, job details)
- [ ] Identify HTML selectors (CSS/XPath)
- [ ] Test manual scraping with Python script
- [ ] Document API responses and data structure
- [ ] Create database schemas
- [ ] Setup Python microservice skeleton

**Deliverables:**
- iLabor360 structure documentation
- HTML selector map
- Python scraper POC (proof of concept)
- Database models

---

### Phase 2: Core Scraping Service (Week 2)
**Duration:** 5-7 days

**Tasks:**
- [ ] Create `ilabor360-scraper/` microservice
- [ ] Implement authentication (login flow)
- [ ] Implement job list scraping
- [ ] Implement job detail scraping
- [ ] Add pagination handling
- [ ] Add error handling & retries
- [ ] Add session management
- [ ] Create Flask API endpoints
- [ ] Test scraper thoroughly
- [ ] Handle edge cases (empty lists, timeouts, etc.)

**Deliverables:**
- Working Python scraper microservice
- Flask API with all endpoints
- Unit tests
- README with setup instructions

---

### Phase 3: Backend Integration (Week 3)
**Duration:** 4-6 days

**Tasks:**
- [ ] Create MongoDB models (Config, SyncLog)
- [ ] Create iLabor360Service.ts
- [ ] Create iLabor360Routes.ts
- [ ] Implement HTTP client to Python service
- [ ] Add data transformation logic
- [ ] Integrate with UnifiedJob model
- [ ] Add sync to existing job pipeline
- [ ] Implement cron job for auto-sync
- [ ] Add comprehensive error handling
- [ ] Test backend integration

**Deliverables:**
- Backend models and services
- API endpoints
- Integration with job pipeline
- Automated sync scheduler

---

### Phase 4: Frontend UI (Week 4)
**Duration:** 4-6 days

**Tasks:**
- [ ] Create ILabor360Settings.tsx page
- [ ] Add settings form (credentials, sync options)
- [ ] Add connection test button
- [ ] Add manual sync button
- [ ] Show sync status and history
- [ ] Update RecruiterDashboard with iLabor360 section
- [ ] Add "iLabor360" badge to job cards
- [ ] Add filter option in Job Pipeline
- [ ] Add loading states and error messages
- [ ] Test UI flows

**Deliverables:**
- Settings page
- Updated dashboard
- Job pipeline filters
- Sync status indicators

---

### Phase 5: Testing & Refinement (Week 5)
**Duration:** 3-5 days

**Tasks:**
- [ ] End-to-end testing
- [ ] Load testing (100+ jobs)
- [ ] Error scenario testing
- [ ] Performance optimization
- [ ] Add logging and monitoring
- [ ] Create user documentation
- [ ] Fix bugs
- [ ] Final polish

**Deliverables:**
- Fully tested system
- User documentation
- Bug-free deployment
- Performance benchmarks

---

## 🎨 Frontend UI Design

### iLabor360 Settings Page

```tsx
// Layout similar to CeipalSettings.tsx
<div className="container">
  <h1>iLabor360 Integration Settings</h1>
  
  {/* Connection Status Card */}
  <StatusCard 
    status={config.connectionStatus}
    lastSync={config.lastSyncDate}
    totalJobs={config.totalJobsSynced}
  />
  
  {/* Configuration Form */}
  <form onSubmit={handleSave}>
    <Input label="Username" value={username} />
    <Input label="Password" type="password" value={password} />
    <Input label="Login URL" value={loginUrl} />
    <Input label="Job List URL" value={jobListUrl} />
    
    <Toggle label="Enable Auto-Sync" checked={autoSync} />
    <Select label="Sync Interval" options={[15, 30, 60]} />
    
    <Button type="submit">Save Configuration</Button>
  </form>
  
  {/* Action Buttons */}
  <div className="actions">
    <Button onClick={testConnection}>Test Connection</Button>
    <Button onClick={syncNow}>Sync Jobs Now</Button>
  </div>
  
  {/* Sync History Table */}
  <SyncHistoryTable logs={recentSyncs} />
</div>
```

### Job Pipeline Updates

Add iLabor360 filter:
```tsx
<select value={sourceFilter}>
  <option value="all">All Sources</option>
  <option value="outlook">Outlook</option>
  <option value="ceipal">Ceipal</option>
  <option value="ilabor360">iLabor360</option> {/* NEW */}
</select>
```

Job card badge:
```tsx
{job.source === 'ilabor360' && (
  <span className="badge badge-orange">iLabor360</span>
)}
```

---

## 🚨 Error Handling Strategy

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Login Failed | Wrong credentials | Show error, ask to update config |
| Session Expired | Timeout | Auto re-login, retry operation |
| Element Not Found | Page structure changed | Log error, send alert, use fallback |
| Timeout | Slow site/network | Retry with exponential backoff |
| CAPTCHA Detected | Anti-bot measure | Manual intervention required |
| Rate Limited | Too many requests | Wait and retry after delay |
| No Jobs Found | Empty list or wrong URL | Log warning, continue |
| Parsing Error | Unexpected HTML format | Skip job, log error, continue |

### Error Handling Code Pattern

```typescript
// Backend service
async syncJobs(userId: string) {
  const errors: any[] = [];
  const startTime = Date.now();
  
  try {
    // Call Python scraper
    const response = await axios.post('http://localhost:5002/scrape/jobs', {
      sessionId: session.id,
      maxJobs: config.maxJobsPerSync
    }, { timeout: 120000 }); // 2 min timeout
    
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    
    // Process each job
    for (const job of response.data.jobs) {
      try {
        await this.saveJob(job);
      } catch (error) {
        errors.push({ jobId: job.id, error: error.message });
      }
    }
    
  } catch (error) {
    // Critical error
    await this.logSync({
      status: 'failed',
      error: error.message,
      durationMs: Date.now() - startTime
    });
    throw error;
  }
  
  // Log success with partial errors
  await this.logSync({
    status: errors.length > 0 ? 'partial' : 'success',
    errors,
    durationMs: Date.now() - startTime
  });
}
```

---

## ⚡ Performance Optimization

### 1. Parallel Job Detail Fetching
```python
# Instead of sequential
for job in jobs:
    details = scrape_job_details(job.id)

# Use concurrent requests
from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=5) as executor:
    futures = [executor.submit(scrape_job_details, job.id) for job in jobs]
    details = [f.result() for f in futures]
```

### 2. Browser Reuse
```python
# Keep browser instance alive between requests
class ScraperSession:
    def __init__(self):
        self.driver = None
    
    def get_driver(self):
        if self.driver is None:
            self.driver = webdriver.Chrome(options=chrome_options)
        return self.driver
    
    def close(self):
        if self.driver:
            self.driver.quit()
```

### 3. Incremental Sync
```typescript
// Only sync new/updated jobs
const lastSync = config.lastSyncDate;
const jobs = await scraper.scrapeJobs({
  postedAfter: lastSync  // Only get jobs posted after last sync
});
```

### 4. Caching
```typescript
// Cache job list for 15 minutes
const cache = new Map();

async getJobs() {
  const cacheKey = 'ilabor360_jobs';
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < 15 * 60 * 1000) {
      return data;
    }
  }
  
  const jobs = await this.scrapeJobs();
  cache.set(cacheKey, { data: jobs, timestamp: Date.now() });
  return jobs;
}
```

---

## 📈 Monitoring & Logging

### Metrics to Track

1. **Sync Success Rate**: % of successful syncs
2. **Average Sync Duration**: Time per sync
3. **Jobs Per Sync**: Average number of jobs found
4. **Error Rate**: Errors per 100 syncs
5. **Session Failures**: Login failures per day
6. **API Latency**: Python service response time

### Logging Strategy

```typescript
// Structured logging
logger.info('iLabor360 sync started', {
  userId,
  syncType: 'manual',
  timestamp: new Date()
});

logger.info('iLabor360 sync completed', {
  userId,
  jobsAdded: 10,
  jobsUpdated: 35,
  errors: 2,
  durationMs: 12340
});

logger.error('iLabor360 sync failed', {
  userId,
  error: error.message,
  stack: error.stack
});
```

---

## 🧪 Testing Strategy

### 1. Unit Tests
- Test data parser with sample HTML
- Test transformation logic
- Test encryption/decryption

### 2. Integration Tests
- Test Python scraper endpoints
- Test backend service methods
- Test database operations

### 3. E2E Tests
- Test full sync flow
- Test error scenarios
- Test UI interactions

### 4. Load Tests
- Test with 100+ jobs
- Test concurrent syncs
- Test memory leaks

---

## 🎯 Success Metrics

After implementation, measure:

1. **Sync Reliability**: >95% success rate
2. **Sync Speed**: <2 minutes for 50 jobs
3. **Data Accuracy**: >98% accurate job data
4. **Uptime**: >99% scraper availability
5. **User Satisfaction**: Ease of setup and use

---

## 🚀 Deployment

### Prerequisites
```bash
# Python 3.8+
python --version

# Install Chrome/Chromium (for Selenium)
# Windows: Download Chrome installer
# Linux: sudo apt install chromium-browser

# Install ChromeDriver
pip install webdriver-manager
```

### Environment Variables
```bash
# Backend .env
ILABOR360_SCRAPER_URL=http://localhost:5002
ENCRYPTION_KEY=<64-char-hex-string>

# Python scraper .env
FLASK_PORT=5002
CHROME_HEADLESS=true
LOG_LEVEL=INFO
```

### Running the Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - AI Service (Existing):**
```bash
cd ai-matching-service
python app.py
```

**Terminal 3 - iLabor360 Scraper (New):**
```bash
cd ilabor360-scraper
python app.py
```

**Terminal 4 - Frontend:**
```bash
cd frontend
npm start
```

---

## 📚 Next Steps

1. **Answer Research Questions**: Provide iLabor360 access and structure details
2. **Approve Architecture**: Review and approve this plan
3. **Start Phase 1**: Begin research and setup
4. **Iterate**: Adjust plan based on findings

---

## 💬 Questions for You

Before we start implementation, please provide:

1. **iLabor360 Login URL**: Where do you log in?
2. **Test Credentials**: Can you provide test credentials?
3. **Sample Screenshots**: Can you screenshot the job list and job detail pages?
4. **Priority**: When do you need this completed?
5. **Sync Frequency**: How often should we sync? (Every 15/30/60 minutes?)
6. **Job Volume**: Approximately how many jobs are typically in iLabor360?
7. **Restrictions**: Any known limitations or restrictions on their platform?
8. **API Availability**: Have you checked if iLabor360 has an API we can use instead of scraping?

---

**Document Version**: 1.0  
**Created**: October 23, 2025  
**Last Updated**: October 23, 2025  
**Author**: ATS Resume Optimizer Team
