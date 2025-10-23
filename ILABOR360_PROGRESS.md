# iLabor360 Integration - Quick Setup Guide

## ✅ Completed Components

### 1. Python Scraping Microservice ✓
**Location**: `ilabor360-scraper/`

**Files Created**:
- ✓ `app.py` - Flask API server with endpoints
- ✓ `scraper.py` - Selenium-based web scraper
- ✓ `parser.py` - Data parser and transformer
- ✓ `requirements.txt` - Python dependencies
- ✓ `start.bat` - Windows startup script
- ✓ `.env.example` - Environment configuration template
- ✓ `README.md` - Complete documentation

**Features**:
- Login authentication with Selenium
- Scrape requisitions (job openings)
- Scrape submissions (candidate submissions)
- Data parsing and transformation
- Session management
- Error handling

### 2. Backend Models & Services ✓
**Location**: `backend/src/`

**Files Created**:
- ✓ `models/iLabor360Config.ts` - Configuration model
- ✓ `models/iLabor360SyncLog.ts` - Sync logs model
- ✓ `services/iLabor360Service.ts` - Main service logic

**Features**:
- Credential encryption
- Configuration management
- Connection testing
- Sync orchestration
- Data transformation and storage
- Statistics tracking

## 🚧 In Progress

### 3. Backend API Routes (Next)
**File to Create**: `backend/src/routes/iLabor360Routes.ts`

### 4. Frontend Components (Next)
**Files to Create**:
- `frontend/src/pages/ILabor360Settings.tsx`
- `frontend/src/services/iLabor360Service.ts`

### 5. Integration Updates (Next)
**Files to Update**:
- `backend/src/models/unifiedJob.ts` - Add 'ilabor360' source
- `backend/src/server.ts` - Register routes
- `frontend/src/App.tsx` - Add settings route
- `frontend/src/pages/RecruiterDashboard.tsx` - Add sync button
- `frontend/src/pages/JobPipeline.tsx` - Add filter

---

## 🚀 How to Test Current Progress

### Step 1: Setup Python Scraper

```bash
cd ilabor360-scraper

# Create virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Start the Scraper Service

```bash
python app.py
```

Service will start on **http://localhost:5002**

### Step 3: Test with cURL

**Test health:**
```bash
curl http://localhost:5002/health
```

**Test login:**
```bash
curl -X POST http://localhost:5002/scrape/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"Matt.s@techgene.com\",\"password\":\"King@1234\",\"loginUrl\":\"https://vendor.ilabor360.com/logout\"}"
```

If login succeeds, you'll get a `sessionId`. Use it to test scraping:

**Test scrape requisitions:**
```bash
curl -X POST http://localhost:5002/scrape/requisitions \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"YOUR_SESSION_ID\",\"maxRequisitions\":10}"
```

**Test scrape submissions:**
```bash
curl -X POST http://localhost:5002/scrape/submissions \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"YOUR_SESSION_ID\",\"maxSubmissions\":10}"
```

---

## 📋 Next Steps

1. **Create Backend Routes** - API endpoints for frontend
2. **Create Frontend Settings Page** - UI for configuration
3. **Update UnifiedJob Model** - Add 'ilabor360' source
4. **Integrate with Job Pipeline** - Display scraped jobs
5. **Add Sync Button** - Manual trigger on dashboard
6. **Setup Auto-Sync** - Cron job for scheduled syncing
7. **End-to-End Testing** - Full workflow test

---

## 🔧 Current Credentials

**iLabor360 Login**:
- URL: https://vendor.ilabor360.com/logout
- Username: Matt.s@techgene.com
- Password: King@1234

**Services to Run**:
1. MongoDB (port 27017)
2. Backend (port 5000)
3. AI Matching Service (port 5001)
4. **iLabor360 Scraper (port 5002)** ← NEW
5. Frontend (port 3000)

---

**Status**: Phase 1 & 2 Complete ✓  
**Next**: Phase 3 - Backend Routes & Frontend UI  
**ETA**: 1-2 hours for complete integration
