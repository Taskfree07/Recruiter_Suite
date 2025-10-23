# iLabor360 Implementation Guide

## 📋 Overview

Based on the provided screenshots and credentials, this document outlines the implementation for scraping **Requisitions** (job openings) and **Submissions** (candidate submissions) from iLabor360.

## 🔍 Analysis from Screenshots

### Login Details
- **URL**: https://vendor.ilabor360.com/logout (redirects to login)
- **Username**: Matt.s@techgene.com
- **Password**: King@1234

### Requisitions Page (Job Openings)
**URL Pattern**: Likely `/requisitions` or similar

**Visible Data Fields**:
- Status (Open, Filled, Not Filled, Closed)
- Req ID (e.g., 153005, 152981)
- ATS... (ATS ID: 113835, 113746)
- Client (e.g., RANDSTAD)
- Title (e.g., "Senior Mobile & Cloud Full-Stack Engineer", "Sr Analyst")
- Customer (e.g., "Amtrak 1 US - Local", "Airbnb, Inc. US - Local")
- Location (e.g., "Washington, DC", "San Francisco, CA")
- Start Date (e.g., 11/10/20...)
- End Date (e.g., 10/5...)

**Statistics Bar**:
- Pending Release: 0
- Open: 167
- Filled: 165
- Not Filled: 1,303
- Closed: 88

### Submissions Page (Candidate Submissions)
**URL Pattern**: Likely `/submissions` or similar

**Visible Data Fields**:
- ID (Submission ID: 1065820, 1065819, etc.)
- Re... (Requisition link: 151703, 151472, etc.)
- Ref# (Reference numbers like CO-4755530)
- Client (e.g., RANDSTAD)
- Customer (e.g., "Grant Thornton LLP", "Florida Department of High...")
- Status (e.g., "Position Cl...", "Rejected B...")
- Candidate (e.g., "KALYAN MALLAREDDY", "Joshua Fashipe")
- Job Title (e.g., "Senior SAP Security Ad...", "Security Analyst")
- Location (e.g., "ADDISON TX, 75001", "TALLAHASSEE FL, 32301")
- Provider (e.g., "Techgene Solutions LLC")
- Provider User (e.g., "Matt Smith")

**Statistics Bar**:
- Total Subs: 173
- Submitted: 179
- ATS Submitted: 7
- End Client Submit: 0
- Interview: 0
- Placement: 0
- Rejected: 20

## 🏗️ Implementation Strategy

### Approach: Browser Automation with Selenium
Since iLabor360 appears to be a dynamic web application (likely React/Angular), we'll use Selenium for:
1. Login authentication
2. Navigation to Requisitions and Submissions pages
3. Data extraction from tables
4. Pagination handling

## 📁 File Structure

```
ilabor360-scraper/
├── app.py                    # Flask API server
├── scraper.py                # Selenium scraper
├── parser.py                 # Data parser & transformer
├── requirements.txt          # Python dependencies
├── start.bat                 # Windows startup
├── start.sh                  # Unix startup
└── README.md                 # Setup instructions

backend/src/
├── models/
│   ├── iLabor360Config.ts
│   └── iLabor360SyncLog.ts
├── routes/
│   └── iLabor360Routes.ts
└── services/
    └── iLabor360Service.ts

frontend/src/
├── pages/
│   └── ILabor360Settings.tsx
└── services/
    └── iLabor360Service.ts
```

## 🔧 Implementation Details

### Data Mapping

#### Requisitions → UnifiedJob
```typescript
{
  title: "Senior Mobile & Cloud Full-Stack Engineer",
  company: "Amtrak 1 US - Local" (Customer),
  description: [Fetched from detail page or use title],
  requiredSkills: [Extracted from title/description],
  experienceLevel: [Parsed from title - "Senior", "Sr", "Junior"],
  location: "Washington, DC",
  locationType: [Parse "Local" → "onsite", or default "hybrid"],
  status: "open" | "filled" | "closed",
  postedDate: Start Date,
  closingDate: End Date,
  sources: [{
    type: 'ilabor360',
    id: Req ID (153005),
    metadata: {
      atsId: "113835",
      client: "RANDSTAD",
      customer: "Amtrak 1 US - Local",
      reqId: "153005"
    }
  }]
}
```

#### Submissions → Track in UnifiedJob.submissions[]
```typescript
submissions: [{
  candidateId: [Match by name or create new],
  candidateName: "KALYAN MALLAREDDY",
  submittedAt: [Parse from submission date],
  status: [Map "Position Cl..." to standard status],
  matchScore: [Use existing AI matching],
  notes: `Submitted via iLabor360 - Ref#: CO-4755530`
}]
```

## 🚀 Implementation Plan

### Phase 1: Python Scraper (Day 1-2)
Create scraping microservice with three main endpoints.

### Phase 2: Backend Integration (Day 3-4)
Create models, services, and API routes.

### Phase 3: Frontend UI (Day 5-6)
Build settings page and integrate with dashboard.

### Phase 4: Testing & Polish (Day 7)
End-to-end testing and bug fixes.

## 📊 Scraping Flow

### 1. Login Flow
```
1. Navigate to https://vendor.ilabor360.com/logout
2. Wait for login page to load
3. Find username field (likely id="username" or name="username")
4. Find password field (likely id="password" or name="password")
5. Enter credentials
6. Click login button
7. Wait for dashboard/redirect
8. Store cookies/session
```

### 2. Scrape Requisitions
```
1. Navigate to requisitions page
2. Wait for table to load
3. Extract data from each row
4. Handle pagination (check for "Next" button or page numbers)
5. Return array of requisitions
```

### 3. Scrape Submissions
```
1. Navigate to submissions page
2. Wait for table to load
3. Extract data from each row
4. Link submissions to requisitions by Req ID
5. Handle pagination
6. Return array of submissions
```

## 🎯 Success Criteria

- ✅ Successfully login to iLabor360
- ✅ Scrape all open requisitions
- ✅ Scrape all submissions
- ✅ Map to UnifiedJob format
- ✅ Display in Job Pipeline
- ✅ Auto-sync every 30 minutes
- ✅ Handle errors gracefully

---

**Ready to implement!** Starting with Python scraper microservice.
