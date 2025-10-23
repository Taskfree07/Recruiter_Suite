# ATS Resume Optimizer - Migration Plan

## Overview
Migrate from Outlook-based job/resume parsing to VMS, iLabor360, and Ceipal. Add AI-powered salary prediction.

---

## Architecture Changes

### Job Sources (Job Pipeline)
- **REMOVE:** Outlook integration
- **ADD:** VMS integration (job descriptions)
- **ADD:** iLabor360 integration (job descriptions)
- **KEEP:** Ceipal (jobs - optional)
- **ADD:** AI salary prediction for matched candidates

### Resume Sources (Resume Dashboard)
- **REMOVE:** Outlook integration
- **ADD:** Ceipal as PRIMARY resume source (candidates + scores)
- **KEEP:** Manual file upload
- **ADD:** AI parsing for all resumes

### New Feature: Salary Prediction
- **Input:** Job + Candidate + Location
- **Data Sources:** BLS API (free) + Numbeo/Teleport (cost of living)
- **Output:** Salary range (min/max/median) + justification
- **Display:** In Job Pipeline candidate cards

---

## Implementation Phases

### ✅ Phase 1: Remove Outlook & Cleanup (1-2 hours)
**Status:** ✅ COMPLETED

**Backend Tasks:**
- [x] Delete `backend/src/services/outlookService.ts`
- [x] Delete `backend/src/services/outlookDemoService.ts`
- [x] Delete `backend/src/models/outlookConfig.ts`
- [x] Delete `backend/src/routes/outlookRoutes.ts`
- [x] Remove outlook routes from `backend/src/server.ts` (line 20, 128)
- [x] Delete compiled files in `backend/dist/`

**Frontend Tasks:**
- [x] Delete `frontend/src/pages/OutlookJobs.tsx`
- [x] Remove OutlookJobs route from `frontend/src/App.tsx` (line 26)
- [x] Update `frontend/src/pages/ResumeDashboard.tsx`:
  - Remove Outlook state variables (lines 93-96)
  - Remove checkOutlookStatus() call (line 105)
  - Remove Outlook functions (lines 227-346)
  - Remove "Connect Outlook" and "Sync Outlook" buttons (lines 537-569)
  - Remove demo mode logic
- [x] Update `frontend/src/pages/JobPipeline.tsx`:
  - Remove "outlook" from source badge logic (line 211)
  - Update getSourceBadge() to only show ceipal/vms/ilabor/manual
- [x] Update `frontend/src/pages/HomePage.tsx`:
  - Update Job Pipeline description (remove Outlook mention, line 43)

**Documentation Tasks:**
- [x] Delete `OUTLOOK_INTEGRATION_SETUP.md`
- [x] Delete `OUTLOOK_DEMO_MODE.md`
- [x] Delete `OUTLOOK_JOBS_VIEW.md`
- [x] Delete `CEIPAL_OUTLOOK_INTEGRATION_PLAN.md`

**Verification:**
- [x] All Outlook code removed
- [x] UI updated to reflect new integrations (VMS, iLabor360)
- [x] Ready for Phase 2

---

### ✅ Phase 2: Extend Ceipal for Resumes (2-3 hours)
**Status:** NOT STARTED

**Backend Tasks:**
- [ ] Update `backend/src/services/ceipalService.ts`:
  - Add `generateMockCandidates()` method
  - Add `syncCandidates()` method
  - Add `fetchCandidatesFromCeipalAPI()` method
  - Parse candidate data: name, email, phone, skills, experience, education
- [ ] Update `backend/src/routes/ceipalRoutes.ts`:
  - Add POST `/sync-candidates` endpoint
  - Add GET `/candidates` endpoint
- [ ] Create mapping: Ceipal candidates → CandidateResume model
- [ ] Add AI parsing for Ceipal candidate data (extract skills, score)

**Frontend Tasks:**
- [ ] Update `frontend/src/pages/ResumeDashboard.tsx`:
  - Update "Sync Ceipal" button to sync both jobs + candidates
  - Update sync response to show candidates synced
  - Refresh resume list after Ceipal sync

**Mock Data:**
Generate 15-20 mock candidates with:
- Personal info (name, email, phone, location)
- Skills (5-10 technical skills)
- Experience (2-3 job positions with titles, companies, durations)
- Education (degree, institution)
- Years of experience (1-15 years)
- Ceipal ID

**Verification:**
- [ ] Test: Ceipal sync adds candidates to Resume Dashboard
- [ ] Test: Candidates display with correct scores and categories
- [ ] Test: Manual upload still works

---

### ✅ Phase 3: Add VMS Integration (3-4 hours)
**Status:** NOT STARTED

**Backend Tasks:**
- [ ] Create `backend/src/models/vmsConfig.ts`:
  - userId, apiKey, apiUrl, mockMode, connectionStatus, lastSyncDate
- [ ] Create `backend/src/services/vmsService.ts`:
  - authenticate()
  - testConnection()
  - syncJobs() - fetch jobs from VMS
  - generateMockJobs() - 10-15 mock jobs
  - fetchJobsFromVMSAPI() - real API integration
  - Save to UnifiedJob model with source: 'vms'
- [ ] Create `backend/src/routes/vmsRoutes.ts`:
  - POST `/connect` - save config
  - GET `/status` - check connection
  - POST `/sync-jobs` - sync jobs from VMS
  - GET `/config` - get current config
  - POST `/disconnect` - remove config
- [ ] Register routes in `backend/src/server.ts`
- [ ] Add AI parsing: extract title, company, location, skills, experience, salary from job text

**Frontend Tasks:**
- [ ] Create `frontend/src/pages/VMSSettings.tsx` (similar to CeipalSettings):
  - API URL input
  - API Key input
  - Mock Mode toggle
  - Test Connection button
  - Save Configuration button
- [ ] Update `frontend/src/App.tsx`:
  - Add route for `/vms-settings`
- [ ] Update `frontend/src/pages/JobPipeline.tsx`:
  - Add VMS source badge (purple/teal color)
  - Jobs auto-refresh after sync
- [ ] Update `frontend/src/pages/ResumeDashboard.tsx`:
  - Add "VMS Settings" link/button (optional)

**Mock Jobs:**
Generate 10-15 jobs with variety:
- Different titles: Developer, DevOps, QA, PM, Designer, Architect
- Different locations: Remote, NYC, SF, Austin, Seattle, Boston
- Different experience levels: Junior, Mid, Senior, Lead
- Different priorities: low, medium, high, urgent
- Skills: 4-6 required skills per job

**Verification:**
- [ ] Test: VMS config saves successfully
- [ ] Test: VMS sync adds jobs to Job Pipeline
- [ ] Test: VMS jobs show correct badge
- [ ] Test: AI matching works with VMS jobs

---

### ✅ Phase 4: Add iLabor360 Integration (3-4 hours)
**Status:** NOT STARTED

**Backend Tasks:**
- [ ] Create `backend/src/models/ilaborConfig.ts`
- [ ] Create `backend/src/services/ilaborService.ts`:
  - Same structure as vmsService
  - authenticate(), testConnection(), syncJobs()
  - generateMockJobs() - 10-15 mock jobs
  - fetchJobsFromILaborAPI()
  - Save to UnifiedJob with source: 'ilabor360'
- [ ] Create `backend/src/routes/ilaborRoutes.ts`
- [ ] Register routes in `backend/src/server.ts`
- [ ] Add AI parsing for iLabor360 job descriptions

**Frontend Tasks:**
- [ ] Create `frontend/src/pages/ILaborSettings.tsx`
- [ ] Update `frontend/src/App.tsx`: add `/ilabor-settings` route
- [ ] Update `frontend/src/pages/JobPipeline.tsx`:
  - Add iLabor360 source badge (orange/amber color)
- [ ] Update `frontend/src/pages/ResumeDashboard.tsx`:
  - Add "iLabor360 Settings" link (optional)

**Mock Jobs:**
Similar to VMS, generate diverse set of 10-15 jobs

**Verification:**
- [ ] Test: iLabor360 config saves
- [ ] Test: iLabor360 sync adds jobs
- [ ] Test: Jobs show correct badge
- [ ] Test: All job sources work together (Ceipal, VMS, iLabor360, manual)

---

### ✅ Phase 5: Salary Prediction Feature (4-5 hours)
**Status:** ✅ COMPLETED (Standalone Feature)

**Note:** Phase 5 was completed as a standalone feature separate from Job Pipeline matching.

**Completed Tasks:**
- [x] Created `frontend/src/pages/SalaryPredictor.tsx` - Full UI with form and results
- [x] Added Salary Predictor card to HomePage (4-card grid layout)
- [x] Added route to `frontend/src/App.tsx` - `/salary-predictor`
- [x] Created `ai-matching-service/salary_predictor.py` - Python scraper service
- [x] Created `backend/src/services/salaryService.ts` - TypeScript service wrapper
- [x] Created `backend/src/routes/salaryRoutes.ts` - API routes
- [x] Registered routes in `backend/src/server.ts` - `/api/salary/*`

**Features Implemented:**
- Multi-source salary data (Indeed, Glassdoor, ZipRecruiter)
- Mock data for MVP (ready for API keys)
- Cost of living adjustments
- Experience-based salary adjustments
- Percentile calculations (50th, 75th, 90th)
- AI-powered recommendations
- Beautiful UI with gradient cards and source breakdown

**API Endpoints:**
- `POST /api/salary/predict` - Get salary predictions
- `GET /api/salary/cost-of-living/:location` - Get COL index
- `GET /api/salary/health` - Health check

**How to Add Real APIs:**
Add API keys to `ai-matching-service/salary_predictor.py`:
```python
self.indeed_api_key = 'YOUR_INDEED_API_KEY'
self.glassdoor_api_key = 'YOUR_GLASSDOOR_API_KEY'
self.ziprecruiter_api_key = 'YOUR_ZIPRECRUITER_API_KEY'
```

**Setup:**
- [x] Python script created (no additional dependencies needed for MVP)
  ```
  requests==2.31.0
  python-dotenv==1.0.0
  geopy==2.4.0
  ```
- [ ] pip install new dependencies
- [ ] Register for BLS API key (optional, has rate limits without key)
- [ ] Test Numbeo API or Teleport API for cost of living data

**Backend Tasks:**
- [ ] Create `backend/src/services/salaryService.ts`:
  - getBLSSalaryData(jobTitle, location) - query BLS API
  - getCostOfLiving(location) - query Numbeo/Teleport
  - predictSalaryRange(job, candidate, location)
  - generateJustification(experience, matchScore, colIndex, baseRange)
- [ ] Create Python service: `ai-matching-service/salary_predictor.py`:
  - fetch_bls_salary(job_title, state_code)
  - fetch_cost_of_living(city, state)
  - calculate_adjusted_salary(base_salary, col_index, experience, match_score)
  - predict_salary_range(job_data, candidate_data)
- [ ] Update `backend/src/routes/matchingRoutes.ts`:
  - Modify GET `/job/:jobId/candidates` to include salary predictions
  - Call salary service for each matched candidate
- [ ] Add salary data to match response:
  ```json
  {
    "candidate": {...},
    "matchScore": {...},
    "salaryPrediction": {
      "min": 110000,
      "max": 140000,
      "median": 125000,
      "percentile": 75,
      "justification": [...],
      "dataSources": ["BLS", "Numbeo"]
    }
  }
  ```

**Frontend Tasks:**
- [ ] Update `frontend/src/pages/JobPipeline.tsx`:
  - Add salary section to candidate cards (lines 548-582)
  - Display: salary range, median, percentile
  - Add tooltip/expandable section for justification
  - Use currency formatting: `$125,000`
  - Add icon: 💰 or dollar icon
- [ ] Add styling:
  - Salary in green/teal accent color
  - Clean, professional display
  - Mobile responsive

**UI Design:**
```
┌────────────────────────────────────────────┐
│ Candidate: John Doe             Match: 87% │
│ Senior Python Developer · 6 years exp      │
├────────────────────────────────────────────┤
│ 💰 Recommended Salary                      │
│   $115,000 - $140,000                      │
│   Market Median: $127,500 (75th percentile)│
│                                            │
│ 📍 Austin, TX (COL: 0.95 vs national avg) │
│                                            │
│ 🎯 Justification:                          │
│   • Strong skill match (87%) → +$10K      │
│   • 6 years experience → +$15K above base │
│   • In-demand skills: Python, AWS, Docker │
└────────────────────────────────────────────┘
```

**Verification:**
- [ ] Test: BLS API returns salary data
- [ ] Test: Cost of living data is accurate
- [ ] Test: Salary predictions appear for all matched candidates
- [ ] Test: Salary ranges are reasonable
- [ ] Test: Justifications make sense
- [ ] Test: Works for different locations (NYC vs rural)
- [ ] Test: Mobile responsive

---

## Data Sources & APIs

### BLS (Bureau of Labor Statistics) API
- **URL:** https://api.bls.gov/publicAPI/v2/
- **Cost:** FREE
- **Coverage:** US only
- **Rate Limit:** 25 queries/day (no key), 500/day (with key)
- **Data:** Salary by occupation code (SOC) and location
- **Docs:** https://www.bls.gov/developers/

### Cost of Living
**Option A: Numbeo (Recommended)**
- **URL:** https://www.numbeo.com/api/
- **Cost:** $10-50/month (paid API)
- **Coverage:** Global
- **Data:** Cost of living index by city

**Option B: Teleport (Free)**
- **URL:** https://developers.teleport.org/api/
- **Cost:** FREE
- **Coverage:** 266+ cities
- **Data:** Cost of living, salaries, quality of life

### VMS & iLabor360 APIs
- **Status:** Awaiting API documentation/credentials
- **Approach:** Start with mock mode, integrate real API later

---

## File Checklist

### Files to DELETE:
```
backend/src/services/outlookService.ts
backend/src/services/outlookDemoService.ts
backend/src/models/outlookConfig.ts
backend/src/routes/outlookRoutes.ts
backend/dist/services/outlookService.js
backend/dist/services/outlookDemoService.js
backend/dist/models/outlookConfig.js
backend/dist/routes/outlookRoutes.js
frontend/src/pages/OutlookJobs.tsx
OUTLOOK_INTEGRATION_SETUP.md
OUTLOOK_DEMO_MODE.md
OUTLOOK_JOBS_VIEW.md
CEIPAL_OUTLOOK_INTEGRATION_PLAN.md
```

### Files to CREATE:
```
backend/src/models/vmsConfig.ts
backend/src/services/vmsService.ts
backend/src/routes/vmsRoutes.ts
backend/src/models/ilaborConfig.ts
backend/src/services/ilaborService.ts
backend/src/routes/ilaborRoutes.ts
backend/src/services/salaryService.ts
ai-matching-service/salary_predictor.py
frontend/src/pages/VMSSettings.tsx
frontend/src/pages/ILaborSettings.tsx
MIGRATION_PLAN.md (this file)
```

### Files to MODIFY:
```
backend/src/server.ts (remove outlook routes, add vms/ilabor routes)
backend/src/services/ceipalService.ts (add candidate sync)
backend/src/routes/ceipalRoutes.ts (add candidate endpoints)
backend/src/routes/matchingRoutes.ts (add salary predictions)
frontend/src/App.tsx (remove OutlookJobs, add VMS/iLabor settings routes)
frontend/src/pages/ResumeDashboard.tsx (remove Outlook, update Ceipal)
frontend/src/pages/JobPipeline.tsx (remove Outlook badge, add VMS/iLabor, add salary UI)
frontend/src/pages/HomePage.tsx (update Job Pipeline description)
ai-matching-service/requirements.txt (add salary dependencies)
```

---

## Progress Tracking

**Current Phase:** Phase 5 ✅ COMPLETED
**Last Completed:** Phase 5 - Salary Prediction Feature (Standalone)
**Next Phase:** Phase 2 - Extend Ceipal for Resumes (OR) Phase 3/4 - VMS/iLabor360

To resume work, tell me:
1. Which phase to start (Phase 1-5)
2. Show me this file: `MIGRATION_PLAN.md`

I'll continue from where you left off!

---

## Notes
- All integrations start with **mock mode** for testing
- Real API credentials can be added later without code changes
- Salary prediction uses **free APIs** (BLS + Teleport) for MVP
- Can upgrade to paid APIs (Salary.com) for better accuracy later
- Geographic scope: **US-only** initially, expandable to international

---

**Generated:** 2025-10-22
**Status:** Planning Complete, Ready for Implementation
