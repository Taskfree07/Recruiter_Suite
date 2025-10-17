# Ceipal + Outlook Integration Plan

**Project:** ATS Resume Optimizer - Recruiter Flow Enhancement
**Version:** 1.0
**Date:** October 14, 2025
**Status:** Planning Phase

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Flow Scenarios](#data-flow-scenarios)
4. [Database Schema](#database-schema)
5. [API Integration Plans](#api-integration-plans)
6. [Sync Strategy](#sync-strategy)
7. [UI/UX Design](#uiux-design)
8. [Security Plan](#security-plan)
9. [Implementation Phases](#implementation-phases)
10. [Questions to Answer](#questions-to-answer)

---

## 🎯 Overview

### Goal
Integrate personal Ceipal ATS account and Outlook email to:
1. Sync user information from Ceipal
2. Fetch all job requisitions/postings from Ceipal
3. Extract job descriptions from Outlook emails
4. Get candidate resumes and applications from Ceipal
5. Extract resumes from Outlook email attachments
6. Automatically match candidates to jobs using AI

### Benefits
- **Unified Dashboard**: All recruitment data in one place
- **Auto-Matching**: AI-powered candidate-to-job matching
- **Time Savings**: Eliminate manual data entry and searching
- **Better Insights**: Analytics across all recruitment sources
- **Improved Organization**: Track candidates and jobs from multiple sources

---

## 🏗️ Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │   Jobs     │  │  Candidates │  │  Matching  │       │
│  │ Dashboard  │  │   Pool     │  │   Engine   │       │
│  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND API SERVER (Express)                │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Ceipal     │  │   Outlook    │  │   Matching   │ │
│  │   Service    │  │   Service    │  │   Service    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │         │
│         └──────────────────┼──────────────────┘         │
│                           │                             │
└───────────────────────────┼─────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   MongoDB DATABASE                       │
│                                                          │
│  • ceipal_config     • outlook_config                   │
│  • unified_jobs      • unified_candidates               │
│  • applications      • match_scores                     │
│  • sync_logs         • recruiterResume (existing)       │
└─────────────────────────────────────────────────────────┘
         ▲                              ▲
         │                              │
┌────────┴────────┐          ┌─────────┴──────────┐
│  Ceipal API     │          │ Microsoft Graph    │
│  (External)     │          │ API (External)     │
└─────────────────┘          └────────────────────┘
```

### Technology Stack

**Backend:**
- Node.js + Express + TypeScript (existing)
- MongoDB + Mongoose (existing)
- axios (HTTP client for Ceipal API)
- @microsoft/microsoft-graph-client (Outlook integration)
- node-cron (scheduled sync jobs)
- crypto (encryption for API keys/tokens)

**Frontend:**
- React + TypeScript (existing)
- TailwindCSS (existing)
- @microsoft/mgt-react (Microsoft Graph Toolkit)
- react-dnd (drag-and-drop for matching UI)
- socket.io-client (real-time updates)

**New Dependencies to Install:**
```json
{
  "backend": [
    "@microsoft/microsoft-graph-client",
    "@azure/msal-node",
    "node-cron",
    "socket.io"
  ],
  "frontend": [
    "@microsoft/mgt-react",
    "react-dnd",
    "socket.io-client"
  ]
}
```

---

## 🔄 Data Flow Scenarios

### Scenario 1: New Job Posted in Ceipal
```
1. Ceipal ATS → New job created by user
2. Our Backend → Polls Ceipal API every 30 mins
3. Backend → Detects new job, fetches details
4. Backend → Parses required skills, experience, location
5. Backend → Stores in MongoDB (ceipal_jobs + unified_jobs)
6. Backend → Triggers matching algorithm
7. Matching Service → Scans candidate pool for matches
8. Matching Service → Calculates match scores (0-100)
9. Backend → Stores match results
10. Frontend → Updates dashboard with new job
11. Frontend → Shows matched candidates for the job
```

### Scenario 2: Job Description Received via Outlook Email
```
1. Client → Sends job description to recruiter's Outlook
2. Our Backend → Polls Outlook inbox every 30 mins
3. Backend → Detects email with job description
4. Backend → Uses AI (Gemini) to parse email content
5. Backend → Extracts:
   - Job title
   - Required skills
   - Experience level
   - Location, salary
   - Company name
6. Backend → Creates job record in MongoDB
7. Backend → Triggers matching algorithm
8. Frontend → Shows new job with auto-matched candidates
9. Frontend → Allows manual editing of parsed details
```

### Scenario 3: Resume Received via Outlook Attachment
```
1. Candidate → Emails resume to recruiter's Outlook
2. Our Backend → Polls Outlook inbox
3. Backend → Detects email with PDF/DOCX attachment
4. Backend → Downloads resume file
5. Backend → Uses existing parser (recruiterParserService)
6. Backend → Extracts:
   - Personal info (name, email, phone)
   - Skills
   - Experience
   - Education
7. Backend → Stores in MongoDB (recruiterResume collection)
8. Backend → Auto-matches to all open jobs
9. Frontend → Shows new candidate with job matches
10. Frontend → Highlights high-scoring matches (80+)
```

### Scenario 4: Application Submitted in Ceipal
```
1. Candidate → Applies to job via Ceipal portal
2. Ceipal → Stores application and updates status
3. Our Backend → Syncs applications from Ceipal
4. Backend → Links Ceipal application to our candidate record
5. Backend → Updates application status
6. Backend → Creates application record with:
   - Job ID
   - Candidate ID
   - Applied date
   - Current status
7. Frontend → Shows application in candidate profile
8. Frontend → Shows candidate in job's applicants list
```

### Scenario 5: Status Update in Ceipal
```
1. Recruiter → Updates candidate status in Ceipal
   (e.g., "Screening" → "Interview Scheduled")
2. Our Backend → Detects change during sync
3. Backend → Updates status in our database
4. Frontend → Reflects new status in real-time
5. Frontend → Shows status history timeline
```

---

## 🗄️ Database Schema

### Collection 1: `ceipal_config`
**Purpose:** Store Ceipal API connection settings

```javascript
{
  _id: ObjectId(),
  userId: String,                    // User who owns this config

  // API Configuration
  apiKey: String,                    // Encrypted API key
  apiUrl: String,                    // Base URL (e.g., https://api.ceipal.com/v1)
  apiVersion: String,                // API version

  // Sync Settings
  syncEnabled: Boolean,              // Enable/disable auto-sync
  syncInterval: Number,              // Minutes between syncs (default: 30)
  lastSyncDate: Date,                // Last successful sync

  // Sync Scope
  syncJobs: Boolean,                 // Sync job postings
  syncCandidates: Boolean,           // Sync candidate profiles
  syncApplications: Boolean,         // Sync applications

  // Status
  connectionStatus: String,          // "connected", "disconnected", "error"
  lastError: String,                 // Last error message

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` (unique)

---

### Collection 2: `outlook_config`
**Purpose:** Store Outlook OAuth connection settings

```javascript
{
  _id: ObjectId(),
  userId: String,                    // User who owns this config

  // OAuth Tokens
  accessToken: String,               // Encrypted access token
  refreshToken: String,              // Encrypted refresh token
  tokenExpiry: Date,                 // When access token expires

  // Email Settings
  emailAddress: String,              // Connected email address
  emailFolders: [String],            // Folders to monitor (e.g., ["Jobs", "Resumes"])

  // Sync Settings
  syncEnabled: Boolean,
  syncInterval: Number,              // Minutes between syncs
  lastSyncDate: Date,

  // Filters
  filterSenders: [String],           // Only process emails from these senders
  filterSubjectKeywords: [String],   // Keywords to identify job/resume emails

  // Status
  connectionStatus: String,          // "connected", "disconnected", "error"
  lastError: String,

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` (unique)
- `emailAddress`

---

### Collection 3: `unified_jobs`
**Purpose:** Centralized job postings from all sources

```javascript
{
  _id: ObjectId(),

  // Basic Info
  title: String,                     // "Senior Java Developer"
  description: String,               // Full job description
  company: String,                   // Hiring company name

  // Requirements
  requiredSkills: [String],          // ["Java", "Spring Boot", "AWS"]
  niceToHaveSkills: [String],        // ["Kubernetes", "Docker"]
  experienceYears: {
    min: Number,                     // Minimum years
    max: Number                      // Maximum years
  },
  experienceLevel: String,           // "Junior", "Mid", "Senior", "Lead"
  educationRequired: String,         // "Bachelor's", "Master's", etc.

  // Location & Compensation
  location: String,                  // "New York, NY" or "Remote"
  locationType: String,              // "onsite", "remote", "hybrid"
  salaryRange: {
    min: Number,
    max: Number,
    currency: String                 // "USD"
  },

  // Source Tracking (IMPORTANT - can have multiple sources)
  sources: [{
    type: String,                    // "ceipal", "outlook", "manual"
    id: String,                      // External ID (ceipal_job_789)
    url: String,                     // Link to original posting
    emailId: String,                 // Outlook message ID (if from email)
    emailSubject: String,            // Original email subject
    senderEmail: String,             // Who sent the job (client email)
    syncDate: Date,                  // When this source was synced
    metadata: Object                 // Source-specific data
  }],

  // Status
  status: String,                    // "open", "closed", "on_hold", "filled"
  postedDate: Date,                  // When job was posted
  closingDate: Date,                 // Application deadline
  positions: Number,                 // Number of openings (default: 1)

  // Organizational
  department: String,                // "Engineering", "Sales"
  hiringManager: String,             // Name or email
  recruiterAssigned: String,         // Assigned recruiter
  priority: String,                  // "low", "medium", "high", "urgent"

  // Matching Results
  matchedCandidates: [{
    candidateId: ObjectId,           // Reference to unified_candidates
    score: Number,                   // Match score (0-100)
    matchedSkills: [String],         // Skills that matched
    missingSkills: [String],         // Skills candidate doesn't have
    matchDate: Date,                 // When match was calculated
    status: String                   // "matched", "applied", "rejected", "interview"
  }],

  // Stats
  applicationsCount: Number,         // Total applications received
  viewsCount: Number,                // Times viewed in dashboard

  // Additional
  tags: [String],                    // Custom tags for organization
  notes: String,                     // Internal notes

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `status`
- `postedDate` (descending)
- `sources.type`
- `sources.id`
- `requiredSkills`
- `matchedCandidates.candidateId`

---

### Collection 4: `unified_candidates`
**Purpose:** Centralized candidate profiles from all sources

```javascript
{
  _id: ObjectId(),

  // Personal Info
  name: String,
  email: String,
  phone: String,
  location: String,
  linkedIn: String,
  portfolio: String,

  // Professional Summary
  professionalSummary: String,
  currentRole: String,
  currentCompany: String,
  totalExperience: Number,           // Years

  // Skills (from resume parsing)
  skills: {
    primary: [String],               // Main programming languages
    frameworks: [String],            // Frameworks/libraries
    databases: [String],             // Database technologies
    cloudPlatforms: [String],        // AWS, Azure, GCP
    tools: [String],                 // Git, Docker, etc.
    softSkills: [String]             // Leadership, Communication
  },

  // Experience
  experience: [{
    company: String,
    role: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String,
    skillsUsed: [String]
  }],

  // Education
  education: [{
    institution: String,
    degree: String,
    field: String,
    graduationYear: Number,
    gpa: Number
  }],

  // Certifications
  certifications: [{
    name: String,
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String
  }],

  // Source Tracking (can have multiple sources)
  sources: [{
    type: String,                    // "ceipal", "outlook", "manual"
    candidateId: String,             // External ID (ceipal_cand_123)
    emailId: String,                 // Outlook message ID
    resumeUrl: String,               // Link to original resume
    syncDate: Date,
    metadata: Object
  }],

  // Resume Files
  resumes: [{
    fileName: String,
    filePath: String,
    fileUrl: String,
    fileType: String,                // "pdf", "docx"
    uploadDate: Date,
    source: String,                  // "ceipal", "outlook", "manual"
    isPrimary: Boolean               // Main resume to use
  }],

  // Applications (jobs this candidate applied to)
  applications: [{
    jobId: ObjectId,                 // Reference to unified_jobs
    appliedDate: Date,
    applicationSource: String,       // "ceipal", "outlook", "manual"
    ceipalApplicationId: String,     // If from Ceipal
    status: String,                  // "applied", "screening", "interview", "offered", "rejected", "hired", "withdrawn"
    statusHistory: [{
      status: String,
      date: Date,
      notes: String,
      updatedBy: String
    }],
    interviewScheduled: Date,
    offerDate: Date,
    rejectionReason: String,
    notes: [String]
  }],

  // Matching Scores (jobs that match this candidate)
  jobMatches: [{
    jobId: ObjectId,                 // Reference to unified_jobs
    score: Number,                   // Match score (0-100)
    matchedSkills: [String],         // Skills that matched
    missingSkills: [String],         // Skills not matching
    matchDate: Date,
    recommended: Boolean             // High-scoring match
  }],

  // Candidate Preferences
  preferences: {
    desiredRoles: [String],
    desiredLocations: [String],
    locationType: String,            // "onsite", "remote", "hybrid"
    salaryExpectation: {
      min: Number,
      max: Number,
      currency: String
    },
    noticePeriod: Number,            // Days
    willingToRelocate: Boolean,
    availableFrom: Date
  },

  // Scoring
  scores: {
    overall: Number,                 // 0-100 (from existing parser)
    skillRelevance: Number,
    experienceQuality: Number,
    educationScore: Number,
    resumeQuality: Number
  },

  // Status
  status: String,                    // "active", "placed", "not_interested", "blacklisted"
  tags: [String],                    // Custom tags
  notes: String,                     // Internal recruiter notes

  // Privacy
  consentGiven: Boolean,             // GDPR consent
  consentDate: Date,
  dataRetentionDate: Date,           // When to delete data

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` (unique)
- `sources.type`
- `sources.candidateId`
- `applications.jobId`
- `jobMatches.jobId`
- `status`
- `skills.primary`
- `createdAt` (descending)

---

### Collection 5: `applications`
**Purpose:** Track job applications separately (for reporting)

```javascript
{
  _id: ObjectId(),

  jobId: ObjectId,                   // Reference to unified_jobs
  candidateId: ObjectId,             // Reference to unified_candidates

  // Application Details
  appliedDate: Date,
  source: String,                    // "ceipal", "outlook", "manual"
  ceipalApplicationId: String,       // If from Ceipal

  // Status Tracking
  currentStatus: String,             // "applied", "screening", "interview", "offered", "rejected", "hired", "withdrawn"
  statusHistory: [{
    status: String,
    date: Date,
    notes: String,
    updatedBy: String
  }],

  // Interview Details
  interviews: [{
    type: String,                    // "phone", "technical", "hr", "final"
    scheduledDate: Date,
    duration: Number,                // Minutes
    interviewers: [String],
    location: String,                // "Zoom", "Office", etc.
    feedback: String,
    rating: Number,                  // 1-5
    outcome: String                  // "pass", "fail", "maybe"
  }],

  // Offer Details
  offer: {
    extended: Boolean,
    extendedDate: Date,
    salary: Number,
    startDate: Date,
    acceptedDate: Date,
    rejectedDate: Date,
    rejectionReason: String
  },

  // Notes
  recruiterNotes: [String],
  hiringManagerNotes: [String],

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `jobId`
- `candidateId`
- `currentStatus`
- `appliedDate` (descending)

---

### Collection 6: `sync_logs`
**Purpose:** Track synchronization history and errors

```javascript
{
  _id: ObjectId(),

  userId: String,                    // Who initiated sync
  source: String,                    // "ceipal", "outlook"
  syncType: String,                  // "jobs", "candidates", "applications", "full"

  // Timing
  startTime: Date,
  endTime: Date,
  duration: Number,                  // Milliseconds

  // Results
  status: String,                    // "success", "partial", "failed"
  recordsProcessed: Number,
  recordsAdded: Number,
  recordsUpdated: Number,
  recordsSkipped: Number,
  recordsFailed: Number,

  // Details
  errors: [{
    recordId: String,
    errorMessage: String,
    errorStack: String,
    timestamp: Date
  }],

  warnings: [String],

  // Metadata
  apiCallsUsed: Number,              // API rate limit tracking
  dataTransferred: Number,           // Bytes

  createdAt: Date
}
```

**Indexes:**
- `source`
- `syncType`
- `startTime` (descending)
- `status`

---

### Collection 7: `match_scores`
**Purpose:** Cache match scores for performance

```javascript
{
  _id: ObjectId(),

  jobId: ObjectId,
  candidateId: ObjectId,

  // Match Score Details
  overallScore: Number,              // 0-100

  breakdown: {
    skillMatch: Number,              // 0-100
    experienceMatch: Number,         // 0-100
    locationMatch: Number,           // 0-100
    salaryMatch: Number,             // 0-100
    educationMatch: Number           // 0-100
  },

  // Skill Analysis
  matchedSkills: [String],
  missingSkills: [String],
  extraSkills: [String],             // Candidate has but not required

  // Explanation
  matchReason: String,               // AI-generated explanation
  recommendations: [String],         // What would improve the match

  // Metadata
  calculatedAt: Date,
  algorithm: String,                 // "v1.0", "v2.0", etc.

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `jobId`, `candidateId` (compound, unique)
- `overallScore` (descending)

---

## 🔌 API Integration Plans

### Ceipal API Integration

**Service File:** `backend/src/services/ceipalService.ts`

**Required API Endpoints (to be documented by user):**

```typescript
class CeipalService {
  private apiKey: string;
  private baseUrl: string;

  // ===== AUTHENTICATION =====
  async authenticate(apiKey: string): Promise<boolean> {
    // Test if API key is valid
    // Make a simple API call to verify credentials
  }

  // ===== USER OPERATIONS =====
  async getUserProfile(): Promise<UserProfile> {
    // GET /api/user/profile
    // Fetch recruiter's profile information
  }

  // ===== JOB OPERATIONS =====
  async fetchJobs(filters?: {
    status?: string;          // "open", "closed"
    postedAfter?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Job[]> {
    // GET /api/jobs
    // Fetch all job postings
  }

  async fetchJobById(jobId: string): Promise<Job> {
    // GET /api/jobs/:id
    // Fetch specific job details
  }

  async getJobApplications(jobId: string): Promise<Application[]> {
    // GET /api/jobs/:id/applications
    // Fetch all applications for a job
  }

  // ===== CANDIDATE OPERATIONS =====
  async fetchCandidates(filters?: {
    addedAfter?: Date;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Candidate[]> {
    // GET /api/candidates
    // Fetch all candidates
  }

  async fetchCandidateById(candidateId: string): Promise<Candidate> {
    // GET /api/candidates/:id
    // Fetch specific candidate details
  }

  async getCandidateResumes(candidateId: string): Promise<Resume[]> {
    // GET /api/candidates/:id/resumes
    // Get list of resume files for candidate
  }

  async downloadResume(resumeId: string): Promise<Buffer> {
    // GET /api/resumes/:id/download
    // Download resume file as buffer
  }

  // ===== APPLICATION OPERATIONS =====
  async fetchApplications(filters?: {
    jobId?: string;
    candidateId?: string;
    status?: string;
    appliedAfter?: Date;
  }): Promise<Application[]> {
    // GET /api/applications
    // Fetch applications with filters
  }

  async updateApplicationStatus(
    applicationId: string,
    status: string,
    notes?: string
  ): Promise<Application> {
    // PUT /api/applications/:id/status
    // Update application status (if API allows write operations)
  }

  // ===== SYNC OPERATIONS =====
  async syncAllData(): Promise<SyncResult> {
    // Orchestrate full sync: jobs + candidates + applications
    const jobs = await this.fetchJobs({ postedAfter: lastSyncDate });
    const candidates = await this.fetchCandidates({ addedAfter: lastSyncDate });
    const applications = await this.fetchApplications({ appliedAfter: lastSyncDate });

    // Process and store in MongoDB
    // Return summary of what was synced
  }

  // ===== HELPER METHODS =====
  private async makeRequest(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<any> {
    // Generic HTTP request handler with error handling
    // Add retry logic, rate limiting, logging
  }

  private handleApiError(error: any): never {
    // Parse Ceipal API errors and throw custom errors
  }
}

export default new CeipalService();
```

---

### Outlook Integration (Microsoft Graph API)

**Service File:** `backend/src/services/outlookService.ts`

**Microsoft Graph API Documentation:** https://docs.microsoft.com/en-us/graph/api/overview

**Required Scopes:**
- `Mail.Read` - Read user's emails
- `Mail.ReadWrite` - Mark emails as read/processed
- `User.Read` - Get user profile

**OAuth 2.0 Flow:**
1. User clicks "Connect Outlook"
2. Redirect to Microsoft login
3. User authorizes app
4. Microsoft redirects back with authorization code
5. Backend exchanges code for access token
6. Store encrypted tokens in database

```typescript
class OutlookService {
  private clientId: string;          // Azure AD app client ID
  private clientSecret: string;      // Azure AD app secret
  private redirectUri: string;       // OAuth callback URL
  private graphClient: Client;

  // ===== AUTHENTICATION =====
  getAuthUrl(): string {
    // Generate Microsoft OAuth URL
    // User will be redirected here to log in
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?
      client_id=${this.clientId}&
      response_type=code&
      redirect_uri=${this.redirectUri}&
      scope=offline_access%20Mail.Read%20Mail.ReadWrite%20User.Read`;
    return authUrl;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    // Exchange authorization code for access token
    // POST https://login.microsoftonline.com/common/oauth2/v2.0/token
    // Returns: accessToken, refreshToken, expiresIn
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    // Get new access token using refresh token
    // Called when access token expires
  }

  // ===== EMAIL OPERATIONS =====
  async fetchEmails(
    accessToken: string,
    filters?: {
      folder?: string;           // "Inbox", "Jobs", "Resumes"
      from?: string;             // Filter by sender
      hasAttachments?: boolean;
      receivedAfter?: Date;
      subject?: string;          // Keyword in subject
      maxResults?: number;
    }
  ): Promise<Email[]> {
    // GET /me/messages
    // Fetch emails matching filters
  }

  async getEmailById(emailId: string): Promise<Email> {
    // GET /me/messages/:id
    // Fetch specific email details
  }

  async getEmailAttachments(emailId: string): Promise<Attachment[]> {
    // GET /me/messages/:id/attachments
    // Get all attachments for an email
  }

  async downloadAttachment(
    emailId: string,
    attachmentId: string
  ): Promise<Buffer> {
    // GET /me/messages/:id/attachments/:attachmentId
    // Download attachment as buffer
  }

  async markEmailAsRead(emailId: string): Promise<void> {
    // PATCH /me/messages/:id
    // Mark email as read after processing
  }

  // ===== FOLDER OPERATIONS =====
  async getMailFolders(): Promise<Folder[]> {
    // GET /me/mailFolders
    // List all email folders
  }

  async getEmailsInFolder(
    folderId: string,
    filters?: any
  ): Promise<Email[]> {
    // GET /me/mailFolders/:id/messages
    // Fetch emails from specific folder
  }

  // ===== JOB DESCRIPTION EXTRACTION =====
  async extractJobDescriptions(emails: Email[]): Promise<Job[]> {
    // Analyze email content to extract job details
    const jobs: Job[] = [];

    for (const email of emails) {
      // Use AI (Gemini) to parse email body
      const jobData = await this.parseJobFromEmail(email);
      if (jobData) {
        jobs.push(jobData);
      }
    }

    return jobs;
  }

  private async parseJobFromEmail(email: Email): Promise<Job | null> {
    // Use Gemini AI to extract:
    // - Job title
    // - Required skills
    // - Experience level
    // - Location
    // - Salary (if mentioned)
    // - Company name

    const prompt = `
      Extract job details from this email:

      From: ${email.from}
      Subject: ${email.subject}
      Body: ${email.body}

      Return JSON with: title, skills, experience, location, salary, company
    `;

    // Call Gemini API (existing in project)
    const result = await geminiService.parse(prompt);
    return result;
  }

  // ===== RESUME EXTRACTION =====
  async extractResumes(emails: Email[]): Promise<Resume[]> {
    // Process emails with PDF/DOCX attachments
    const resumes: Resume[] = [];

    for (const email of emails) {
      const attachments = await this.getEmailAttachments(email.id);

      for (const attachment of attachments) {
        if (this.isResumeFile(attachment.name)) {
          const buffer = await this.downloadAttachment(email.id, attachment.id);
          const resume = await this.parseResumeFile(buffer, attachment.name, email);
          resumes.push(resume);
        }
      }
    }

    return resumes;
  }

  private isResumeFile(filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    return ['pdf', 'doc', 'docx'].includes(ext || '');
  }

  private async parseResumeFile(
    buffer: Buffer,
    filename: string,
    email: Email
  ): Promise<Resume> {
    // Save file temporarily
    const tempPath = `/tmp/${Date.now()}_${filename}`;
    fs.writeFileSync(tempPath, buffer);

    // Use existing resume parser
    const parsedData = await recruiterParserService.parseResumeForRecruiter(tempPath);

    // Add source metadata
    parsedData.source = {
      type: 'outlook',
      emailId: email.id,
      emailFrom: email.from,
      emailSubject: email.subject,
      receivedDate: email.receivedDateTime
    };

    // Clean up temp file
    fs.unlinkSync(tempPath);

    return parsedData;
  }

  // ===== SYNC OPERATIONS =====
  async syncEmails(): Promise<SyncResult> {
    // Main sync function called by cron job

    // 1. Get last sync date
    const config = await OutlookConfig.findOne({ userId });
    const lastSync = config?.lastSyncDate || new Date(0);

    // 2. Fetch new emails
    const emails = await this.fetchEmails(config.accessToken, {
      receivedAfter: lastSync,
      hasAttachments: true
    });

    // 3. Classify emails
    const jobEmails = emails.filter(e => this.looksLikeJobEmail(e));
    const resumeEmails = emails.filter(e => this.hasResumeAttachment(e));

    // 4. Process job emails
    const jobs = await this.extractJobDescriptions(jobEmails);
    await this.saveJobs(jobs);

    // 5. Process resume emails
    const resumes = await this.extractResumes(resumeEmails);
    await this.saveResumes(resumes);

    // 6. Update last sync date
    config.lastSyncDate = new Date();
    await config.save();

    return {
      jobsProcessed: jobs.length,
      resumesProcessed: resumes.length,
      errors: []
    };
  }

  private looksLikeJobEmail(email: Email): boolean {
    // Check if email contains job description
    const jobKeywords = ['job opening', 'hiring', 'position', 'vacancy', 'job description', 'jd'];
    const subject = email.subject.toLowerCase();
    return jobKeywords.some(keyword => subject.includes(keyword));
  }

  private hasResumeAttachment(email: Email): boolean {
    // Check if email has resume attachment
    return email.hasAttachments &&
           email.attachments.some(a => this.isResumeFile(a.name));
  }
}

export default new OutlookService();
```

---

### Job Matching Service

**Service File:** `backend/src/services/jobMatchingService.ts`

```typescript
class JobMatchingService {

  // ===== MAIN MATCHING FUNCTIONS =====

  async matchResumeToJob(
    candidateId: string,
    jobId: string
  ): Promise<MatchResult> {
    // Match specific candidate to specific job

    const candidate = await UnifiedCandidate.findById(candidateId);
    const job = await UnifiedJob.findById(jobId);

    if (!candidate || !job) {
      throw new Error('Candidate or Job not found');
    }

    const score = this.calculateMatchScore(candidate, job);

    // Save match result
    const match = new MatchScore({
      candidateId,
      jobId,
      overallScore: score.overall,
      breakdown: score.breakdown,
      matchedSkills: score.matchedSkills,
      missingSkills: score.missingSkills,
      extraSkills: score.extraSkills,
      matchReason: score.reason,
      recommendations: score.recommendations,
      calculatedAt: new Date(),
      algorithm: 'v1.0'
    });

    await match.save();
    return match;
  }

  async findBestCandidates(
    jobId: string,
    options?: {
      limit?: number;
      minScore?: number;
      includeApplied?: boolean;
    }
  ): Promise<MatchResult[]> {
    // Find top candidates for a job

    const limit = options?.limit || 20;
    const minScore = options?.minScore || 60;

    // Get all active candidates
    const candidates = await UnifiedCandidate.find({ status: 'active' });
    const job = await UnifiedJob.findById(jobId);

    if (!job) throw new Error('Job not found');

    // Calculate match scores
    const matches: MatchResult[] = [];

    for (const candidate of candidates) {
      // Skip if already applied (unless includeApplied is true)
      if (!options?.includeApplied) {
        const hasApplied = candidate.applications.some(
          app => app.jobId.toString() === jobId
        );
        if (hasApplied) continue;
      }

      const score = this.calculateMatchScore(candidate, job);

      if (score.overall >= minScore) {
        matches.push({
          candidateId: candidate._id,
          candidate,
          score: score.overall,
          breakdown: score.breakdown,
          matchedSkills: score.matchedSkills,
          missingSkills: score.missingSkills
        });
      }
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    // Return top N
    return matches.slice(0, limit);
  }

  async findBestJobs(
    candidateId: string,
    options?: {
      limit?: number;
      minScore?: number;
    }
  ): Promise<MatchResult[]> {
    // Find best jobs for a candidate

    const limit = options?.limit || 10;
    const minScore = options?.minScore || 60;

    const candidate = await UnifiedCandidate.findById(candidateId);
    const jobs = await UnifiedJob.find({ status: 'open' });

    if (!candidate) throw new Error('Candidate not found');

    const matches: MatchResult[] = [];

    for (const job of jobs) {
      const score = this.calculateMatchScore(candidate, job);

      if (score.overall >= minScore) {
        matches.push({
          jobId: job._id,
          job,
          score: score.overall,
          breakdown: score.breakdown,
          matchedSkills: score.matchedSkills,
          missingSkills: score.missingSkills
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, limit);
  }

  // ===== SCORING ALGORITHM =====

  calculateMatchScore(
    candidate: any,
    job: any
  ): MatchScore {
    // Multi-factor matching algorithm

    // 1. SKILL MATCH (40% weight)
    const skillMatch = this.calculateSkillMatch(
      candidate.skills,
      job.requiredSkills,
      job.niceToHaveSkills
    );

    // 2. EXPERIENCE MATCH (25% weight)
    const experienceMatch = this.calculateExperienceMatch(
      candidate.totalExperience,
      job.experienceYears
    );

    // 3. LOCATION MATCH (15% weight)
    const locationMatch = this.calculateLocationMatch(
      candidate.location,
      candidate.preferences?.locationType,
      job.location,
      job.locationType
    );

    // 4. SALARY MATCH (10% weight)
    const salaryMatch = this.calculateSalaryMatch(
      candidate.preferences?.salaryExpectation,
      job.salaryRange
    );

    // 5. EDUCATION MATCH (10% weight)
    const educationMatch = this.calculateEducationMatch(
      candidate.education,
      job.educationRequired
    );

    // Weighted overall score
    const overall = Math.round(
      skillMatch.score * 0.40 +
      experienceMatch.score * 0.25 +
      locationMatch.score * 0.15 +
      salaryMatch.score * 0.10 +
      educationMatch.score * 0.10
    );

    // Generate explanation
    const reason = this.generateMatchReason(overall, skillMatch, experienceMatch);
    const recommendations = this.generateRecommendations(skillMatch, experienceMatch);

    return {
      overall,
      breakdown: {
        skillMatch: skillMatch.score,
        experienceMatch: experienceMatch.score,
        locationMatch: locationMatch.score,
        salaryMatch: salaryMatch.score,
        educationMatch: educationMatch.score
      },
      matchedSkills: skillMatch.matched,
      missingSkills: skillMatch.missing,
      extraSkills: skillMatch.extra,
      reason,
      recommendations
    };
  }

  private calculateSkillMatch(
    candidateSkills: any,
    requiredSkills: string[],
    niceToHaveSkills: string[]
  ): SkillMatchResult {
    // Combine all candidate skills
    const allCandidateSkills = [
      ...candidateSkills.primary,
      ...candidateSkills.frameworks,
      ...candidateSkills.databases,
      ...candidateSkills.cloudPlatforms,
      ...candidateSkills.tools
    ].map(s => s.toLowerCase());

    // Check required skills
    const matched: string[] = [];
    const missing: string[] = [];

    for (const skill of requiredSkills) {
      if (allCandidateSkills.includes(skill.toLowerCase())) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    }

    // Check nice-to-have skills
    const niceToHaveMatched: string[] = [];
    for (const skill of niceToHaveSkills || []) {
      if (allCandidateSkills.includes(skill.toLowerCase())) {
        niceToHaveMatched.push(skill);
      }
    }

    // Extra skills candidate has
    const extra = allCandidateSkills.filter(skill =>
      ![...requiredSkills, ...niceToHaveSkills].some(s =>
        s.toLowerCase() === skill
      )
    );

    // Calculate score
    const requiredMatchPercent = requiredSkills.length > 0
      ? (matched.length / requiredSkills.length) * 100
      : 100;

    const niceToHaveMatchPercent = niceToHaveSkills?.length > 0
      ? (niceToHaveMatched.length / niceToHaveSkills.length) * 100
      : 0;

    // Required skills are worth 85%, nice-to-have 15%
    const score = Math.round(
      requiredMatchPercent * 0.85 +
      niceToHaveMatchPercent * 0.15
    );

    return {
      score,
      matched: [...matched, ...niceToHaveMatched],
      missing,
      extra: extra.slice(0, 5) // Top 5 extra skills
    };
  }

  private calculateExperienceMatch(
    candidateExperience: number,
    jobExperience: { min: number; max: number }
  ): ExperienceMatchResult {
    if (!jobExperience || !candidateExperience) {
      return { score: 50, reason: 'No experience requirement specified' };
    }

    const { min, max } = jobExperience;

    if (candidateExperience >= min && candidateExperience <= max) {
      // Perfect match
      return { score: 100, reason: `${candidateExperience} years matches requirement (${min}-${max} years)` };
    } else if (candidateExperience < min) {
      // Under-qualified
      const diff = min - candidateExperience;
      const score = Math.max(0, 100 - (diff * 20)); // -20 points per year under
      return { score, reason: `${diff} years below minimum requirement` };
    } else {
      // Over-qualified
      const diff = candidateExperience - max;
      const score = Math.max(60, 100 - (diff * 10)); // -10 points per year over (min 60)
      return { score, reason: `${diff} years above maximum requirement` };
    }
  }

  private calculateLocationMatch(
    candidateLocation: string,
    candidateLocationType: string,
    jobLocation: string,
    jobLocationType: string
  ): LocationMatchResult {
    // Remote jobs match everyone
    if (jobLocationType === 'remote') {
      return { score: 100, reason: 'Job is remote' };
    }

    // Candidate prefers remote
    if (candidateLocationType === 'remote' && jobLocationType !== 'remote') {
      return { score: 50, reason: 'Candidate prefers remote, job is onsite' };
    }

    // Simple location match (can be enhanced with geocoding)
    const candidateCity = candidateLocation?.split(',')[0]?.trim().toLowerCase();
    const jobCity = jobLocation?.split(',')[0]?.trim().toLowerCase();

    if (candidateCity === jobCity) {
      return { score: 100, reason: 'Same location' };
    } else {
      return { score: 70, reason: 'Different location' };
    }
  }

  private calculateSalaryMatch(
    candidateSalary: any,
    jobSalary: any
  ): SalaryMatchResult {
    if (!candidateSalary || !jobSalary) {
      return { score: 75, reason: 'No salary information available' };
    }

    const candidateMin = candidateSalary.min;
    const jobMax = jobSalary.max;

    if (candidateMin <= jobMax) {
      return { score: 100, reason: 'Salary expectations align' };
    } else {
      const diff = ((candidateMin - jobMax) / jobMax) * 100;
      const score = Math.max(0, 100 - diff);
      return { score, reason: `Candidate expects ${diff}% more than budget` };
    }
  }

  private calculateEducationMatch(
    candidateEducation: any[],
    jobEducation: string
  ): EducationMatchResult {
    if (!jobEducation) {
      return { score: 100, reason: 'No education requirement' };
    }

    const educationLevels = ['High School', 'Associate', 'Bachelor', 'Master', 'PhD'];
    const requiredLevel = educationLevels.indexOf(jobEducation);

    for (const edu of candidateEducation) {
      const candidateLevel = educationLevels.indexOf(edu.degree);
      if (candidateLevel >= requiredLevel) {
        return { score: 100, reason: `Has ${edu.degree} degree` };
      }
    }

    return { score: 50, reason: 'Does not meet education requirement' };
  }

  private generateMatchReason(
    overall: number,
    skillMatch: SkillMatchResult,
    experienceMatch: ExperienceMatchResult
  ): string {
    if (overall >= 90) {
      return `Excellent match! Has ${skillMatch.matched.length}/${skillMatch.matched.length + skillMatch.missing.length} required skills and ${experienceMatch.reason}`;
    } else if (overall >= 75) {
      return `Good match. ${skillMatch.matched.length} skills matched. ${experienceMatch.reason}`;
    } else if (overall >= 60) {
      return `Moderate match. Missing ${skillMatch.missing.length} required skills.`;
    } else {
      return `Low match. Significant skill gaps exist.`;
    }
  }

  private generateRecommendations(
    skillMatch: SkillMatchResult,
    experienceMatch: ExperienceMatchResult
  ): string[] {
    const recommendations: string[] = [];

    if (skillMatch.missing.length > 0) {
      recommendations.push(`Consider training in: ${skillMatch.missing.join(', ')}`);
    }

    if (experienceMatch.score < 75) {
      recommendations.push('May need additional mentoring due to experience gap');
    }

    if (skillMatch.score >= 90) {
      recommendations.push('Strong technical fit - prioritize for interview');
    }

    return recommendations;
  }

  // ===== BATCH OPERATIONS =====

  async matchAllCandidatesToJob(jobId: string): Promise<void> {
    // Match all active candidates to a specific job
    const candidates = await UnifiedCandidate.find({ status: 'active' });

    for (const candidate of candidates) {
      await this.matchResumeToJob(candidate._id.toString(), jobId);
    }
  }

  async matchCandidateToAllJobs(candidateId: string): Promise<void> {
    // Match a candidate to all open jobs
    const jobs = await UnifiedJob.find({ status: 'open' });

    for (const job of jobs) {
      await this.matchResumeToJob(candidateId, job._id.toString());
    }
  }

  async recalculateAllMatches(): Promise<void> {
    // Recalculate all match scores (run after algorithm update)
    const jobs = await UnifiedJob.find({ status: 'open' });

    for (const job of jobs) {
      await this.matchAllCandidatesToJob(job._id.toString());
    }
  }
}

export default new JobMatchingService();
```

---

## 🔄 Sync Strategy

### Option 1: Polling (Recommended for MVP)

**How it works:**
- Background job runs every 30 minutes
- Calls Ceipal and Outlook APIs to check for new data
- Processes and stores new/updated records
- Updates last sync timestamp

**Implementation:**
```typescript
// backend/src/jobs/syncJob.ts
import cron from 'node-cron';
import ceipalService from '../services/ceipalService';
import outlookService from '../services/outlookService';

// Run every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('Starting scheduled sync...');

  try {
    // Sync Ceipal data
    await ceipalService.syncAllData();

    // Sync Outlook emails
    await outlookService.syncEmails();

    console.log('Sync completed successfully');
  } catch (error) {
    console.error('Sync failed:', error);
    // Send alert email/notification
  }
});

// Also expose manual sync endpoint
router.post('/api/sync/trigger', async (req, res) => {
  try {
    await ceipalService.syncAllData();
    await outlookService.syncEmails();
    res.json({ success: true, message: 'Sync completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Pros:**
- Simple to implement
- Reliable
- No webhook setup required
- Easy to debug

**Cons:**
- Not real-time (up to 30-minute delay)
- Uses API quota even if no changes
- May miss rapid changes

---

### Option 2: Webhooks (Future Enhancement)

**How it works:**
- Ceipal/Outlook sends HTTP POST to our server when data changes
- Our server processes the change immediately
- Real-time updates

**Requirements:**
- Ceipal API must support webhooks
- Microsoft Graph supports webhooks (subscriptions)
- Need publicly accessible HTTPS endpoint

**Implementation (if APIs support it):**
```typescript
// Outlook webhook subscription
router.post('/api/outlook/webhook/subscribe', async (req, res) => {
  // Create subscription for new emails
  const subscription = await graphClient
    .api('/subscriptions')
    .post({
      changeType: 'created',
      notificationUrl: 'https://yourdomain.com/api/outlook/webhook',
      resource: 'me/messages',
      expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      clientState: 'secretClientValue'
    });

  res.json(subscription);
});

// Webhook receiver
router.post('/api/outlook/webhook', async (req, res) => {
  // Validate webhook
  if (req.query.validationToken) {
    return res.send(req.query.validationToken);
  }

  // Process notification
  const notifications = req.body.value;
  for (const notification of notifications) {
    const messageId = notification.resourceData.id;
    // Fetch and process the new email
    await outlookService.processNewEmail(messageId);
  }

  res.status(202).send();
});
```

---

### Option 3: Hybrid (Best of Both)

**How it works:**
- Use webhooks when available (Outlook)
- Use polling for APIs without webhooks (Ceipal)
- Manual sync button for on-demand refresh

**Sync Schedule:**
```
Outlook: Webhook-based (real-time) + hourly backup poll
Ceipal: Poll every 30 minutes
Manual: On-demand sync button in UI
```

---

## 🎨 UI/UX Design

### Main Dashboard Layout

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo]  ATS Recruiter Dashboard        [@User ▼] [⚙️]      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │ 🔄 Sync Status                                     │     │
│  │ ┌──────────────┐  ┌──────────────┐                │     │
│  │ │ 🟢 Ceipal    │  │ 🟢 Outlook   │  [Sync Now]    │     │
│  │ │ 5 mins ago   │  │ 2 mins ago   │                │     │
│  │ └──────────────┘  └──────────────┘                │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │   📊    │ │   💼    │ │   👥    │ │   🎯    │          │
│  │Overview │ │  Jobs   │ │Candidates│ │Matching │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│  ─────────────────────────────────────────────────────      │
│                                                               │
│  [Content Area - Changes based on active tab]               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

### Tab 1: Overview

```
┌──────────────────────────────────────────────────────────────┐
│ 📊 Quick Stats                                               │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ 25 Open Jobs│  │150 Candidates│  │ 45 Matches  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                               │
│ 📈 Recent Activity                                           │
│  • New job: "Senior Java Developer" from Ceipal (2h ago)    │
│  • New resume: John Doe via Outlook (3h ago)                │
│  • High match (95%): Jane Smith → Python Developer          │
│                                                               │
│ ⚡ Top Matches Today (5)                                     │
│  [View All →]                                                │
│                                                               │
│ 🎯 Action Items                                              │
│  • 3 candidates pending review                               │
│  • 2 jobs closing this week                                  │
│  • 5 interviews scheduled                                    │
└──────────────────────────────────────────────────────────────┘
```

---

### Tab 2: Jobs

```
┌──────────────────────────────────────────────────────────────┐
│ 💼 Jobs (25 Open)                    [+ Add Job]  [Filters] │
├──────────────────────────────────────────────────────────────┤
│ [All 25] [Ceipal 18] [Outlook 7] [Closed 12]               │
│ Sort: [Most Recent ▼]  Search: [____________] 🔍           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 🔵 Senior Java Developer                  [⋮ Menu]   │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│ │ 📍 New York, NY (Hybrid)                             │   │
│ │ 💰 $120,000 - $150,000                               │   │
│ │ 📦 Source: Ceipal (ID: J-12345)                      │   │
│ │ 📅 Posted: 2 days ago | Closes: in 12 days          │   │
│ │                                                       │   │
│ │ 🏢 Acme Corp | 5 positions                           │   │
│ │                                                       │   │
│ │ Required: Java (5y), Spring Boot, AWS, Microservices│   │
│ │ Nice-to-have: Kubernetes, Docker                     │   │
│ │                                                       │   │
│ │ 🎯 12 Matched Candidates (3 excellent, 9 good)       │   │
│ │ 📝 8 Applications received                           │   │
│ │                                                       │   │
│ │ [View Matches] [View Applications] [Edit] [Close]   │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 🟢 Python Data Scientist              [⋮ Menu]      │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│ │ 📍 Remote                                            │   │
│ │ 💰 $100,000 - $130,000                               │   │
│ │ 📧 Source: Outlook (client@techco.com)              │   │
│ │ 📅 Received: 5 hours ago                             │   │
│ │                                                       │   │
│ │ 🏢 TechCo Inc | 2 positions                          │   │
│ │                                                       │   │
│ │ Required: Python, Machine Learning, TensorFlow (3y) │   │
│ │ Nice-to-have: AWS, PyTorch, NLP                      │   │
│ │                                                       │   │
│ │ 🎯 7 Matched Candidates (1 excellent, 6 good)        │   │
│ │ 📝 No applications yet                               │   │
│ │                                                       │   │
│ │ [View Matches] [Edit Job Details] [Close]           │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                               │
│ [Load More]                                                  │
└──────────────────────────────────────────────────────────────┘
```

---

### Tab 3: Candidates

```
┌──────────────────────────────────────────────────────────────┐
│ 👥 Candidates (150)            [+ Add Resume]  [Filters]    │
├──────────────────────────────────────────────────────────────┤
│ [All 150] [Ceipal 95] [Outlook 48] [Manual 7]              │
│ Sort: [Newest First ▼]  Search: [____________] 🔍          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 👤 John Doe                           [⋮ Menu]       │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│ │ 📧 john.doe@email.com | 📞 +1-234-567-8900          │   │
│ │ 📍 San Francisco, CA                                 │   │
│ │                                                       │   │
│ │ 💼 Senior Software Engineer @ Google (8 years exp)   │   │
│ │                                                       │   │
│ │ Skills:                                              │   │
│ │ [Java] [Python] [Spring Boot] [AWS] [React]         │   │
│ │ [Docker] [Kubernetes] [PostgreSQL]                   │   │
│ │                                                       │   │
│ │ 📄 Resume: john_doe_resume.pdf (Ceipal)             │   │
│ │ 📅 Added: 3 days ago                                 │   │
│ │                                                       │   │
│ │ ⭐ Overall Score: 92/100                             │   │
│ │                                                       │   │
│ │ 🎯 Top Matches:                                      │   │
│ │   • 95% - Senior Java Developer (Acme Corp)          │   │
│ │   • 88% - Full Stack Engineer (StartupXYZ)           │   │
│ │   • 85% - Backend Lead (TechCorp)                    │   │
│ │                                                       │   │
│ │ 📝 Applications: 2 active                            │   │
│ │                                                       │   │
│ │ [View Full Profile] [Apply to Job] [Download]       │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 👤 Jane Smith                         [⋮ Menu]       │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│ │ 📧 jane.smith@email.com | 📞 +1-555-123-4567        │   │
│ │ 📍 New York, NY (Remote preferred)                   │   │
│ │                                                       │   │
│ │ 💼 Data Scientist @ Facebook (5 years exp)           │   │
│ │                                                       │   │
│ │ Skills:                                              │   │
│ │ [Python] [Machine Learning] [TensorFlow] [PyTorch]  │   │
│ │ [NLP] [AWS] [SQL]                                    │   │
│ │                                                       │   │
│ │ 📧 Resume: via Outlook (talent@agency.com)          │   │
│ │ 📅 Received: 5 hours ago                             │   │
│ │                                                       │   │
│ │ ⭐ Overall Score: 89/100                             │   │
│ │                                                       │   │
│ │ 🎯 Top Matches:                                      │   │
│ │   • 96% - Python Data Scientist (TechCo)             │   │
│ │   • 82% - ML Engineer (AI Startup)                   │   │
│ │                                                       │   │
│ │ 📝 No applications yet                               │   │
│ │                                                       │   │
│ │ [View Full Profile] [Apply to Job] [Download]       │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                               │
│ [Load More]                                                  │
└──────────────────────────────────────────────────────────────┘
```

---

### Tab 4: Matching

```
┌──────────────────────────────────────────────────────────────┐
│ 🎯 Smart Matching                                            │
├──────────────────────────────────────────────────────────────┤
│ Select Job: [Senior Java Developer ▼]        [Switch Mode]  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ 🏆 Top Matches (12 found)                   [Recalculate]   │
│                                                               │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ⭐ 95% Match                              [Apply]    │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│ │ 👤 John Doe                                          │   │
│ │ 📧 john.doe@email.com | 📞 +1-234-567-8900          │   │
│ │ 📍 San Francisco, CA | 💼 8 years exp                │   │
│ │                                                       │   │
│ │ Match Breakdown:                                     │   │
│ │ ▓▓▓▓▓▓▓▓▓░ Skills: 95%                              │   │
│ │ ▓▓▓▓▓▓▓▓▓▓ Experience: 100%                         │   │
│ │ ▓▓▓▓▓▓▓░░░ Location: 70%                            │   │
│ │                                                       │   │
│ │ ✅ Matched Skills (8):                               │   │
│ │ Java (8y) | Spring Boot (6y) | AWS (5y) |           │   │
│ │ Microservices (4y) | REST APIs | Docker |           │   │
│ │ PostgreSQL | Git                                     │   │
│ │                                                       │   │
│ │ ⚠️ Missing Skills (1):                               │   │
│ │ Kubernetes (nice-to-have)                            │   │
│ │                                                       │   │
│ │ 💡 Extra Skills:                                     │   │
│ │ Python, React, MongoDB, Redis                        │   │
│ │                                                       │   │
│ │ 📄 Resume: john_doe_resume.pdf                      │   │
│ │                                                       │   │
│ │ 💬 AI Recommendation:                                │   │
│ │ "Excellent match! Strong Java background with        │   │
│ │  extensive AWS experience. Meets all critical        │   │
│ │  requirements. Recommend fast-track interview."      │   │
│ │                                                       │   │
│ │ [View Full Profile] [Apply to Job] [Reject]         │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ⭐ 88% Match                              [Apply]    │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│ │ 👤 Sarah Johnson                                     │   │
│ │ ...                                                  │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                               │
│ [Load More]                                                  │
└──────────────────────────────────────────────────────────────┘
```

---

### Settings Page

```
┌──────────────────────────────────────────────────────────────┐
│ ⚙️ Settings                                                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 🔵 Ceipal Integration                                  │  │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│ │                                                         │  │
│ │ Status: 🟢 Connected                                   │  │
│ │ Last Sync: 5 minutes ago                               │  │
│ │                                                         │  │
│ │ API Configuration:                                     │  │
│ │ API Key: [••••••••••••••••] [Update]                  │  │
│ │ API URL: [https://api.ceipal.com/v1_____]             │  │
│ │                                                         │  │
│ │ Sync Settings:                                         │  │
│ │ ☑ Auto-sync enabled                                    │  │
│ │ Sync interval: [30] minutes                            │  │
│ │ ☑ Sync jobs                                            │  │
│ │ ☑ Sync candidates                                      │  │
│ │ ☑ Sync applications                                    │  │
│ │                                                         │  │
│ │ [Test Connection] [Save Changes] [Disconnect]         │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 📧 Outlook Integration                                 │  │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│ │                                                         │  │
│ │ Status: 🟢 Connected                                   │  │
│ │ Account: recruiter@company.com                         │  │
│ │ Last Sync: 2 minutes ago                               │  │
│ │                                                         │  │
│ │ Email Folders to Monitor:                              │  │
│ │ [+] Inbox (default)                                    │  │
│ │ [+] Jobs                                               │  │
│ │ [+] Resumes                                            │  │
│ │                                                         │  │
│ │ Filters:                                               │  │
│ │ Only process emails with attachments: ☑                │  │
│ │ Keywords: [job, hiring, resume, cv___________]        │  │
│ │                                                         │  │
│ │ Sync Settings:                                         │  │
│ │ ☑ Auto-sync enabled                                    │  │
│ │ Sync interval: [30] minutes                            │  │
│ │                                                         │  │
│ │ [Test Connection] [Save Changes] [Disconnect]         │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 🎯 Matching Settings                                   │  │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│ │                                                         │  │
│ │ Minimum match score to show: [60__] %                  │  │
│ │ Max candidates per job: [20__]                         │  │
│ │ ☑ Auto-match new candidates to open jobs              │  │
│ │ ☑ Auto-match new jobs to candidate pool               │  │
│ │                                                         │  │
│ │ [Save Changes]                                         │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Plan

### 1. API Credentials Encryption

**Encrypt sensitive data before storing:**

```typescript
// backend/src/utils/encryption.ts
import crypto from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    // Get encryption key from environment variable
    const secretKey = process.env.ENCRYPTION_KEY;
    if (!secretKey) {
      throw new Error('ENCRYPTION_KEY not set in environment');
    }
    this.key = Buffer.from(secretKey, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return IV:AuthTag:EncryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

export default new EncryptionService();
```

**Usage:**
```typescript
// Encrypt before saving
const config = new CeipalConfig({
  apiKey: encryptionService.encrypt(apiKey),
  ...
});
await config.save();

// Decrypt when using
const decryptedKey = encryptionService.decrypt(config.apiKey);
await ceipalService.authenticate(decryptedKey);
```

---

### 2. Environment Variables

**Required `.env` variables:**
```bash
# Existing
MONGODB_URI=mongodb://localhost:27017/ats_resume_optimizer
GEMINI_API_KEY=your_gemini_key
PORT=5000

# NEW - Ceipal
CEIPAL_API_URL=https://api.ceipal.com/v1
CEIPAL_API_VERSION=v1

# NEW - Outlook (Azure AD App)
OUTLOOK_CLIENT_ID=your_azure_app_client_id
OUTLOOK_CLIENT_SECRET=your_azure_app_secret
OUTLOOK_TENANT_ID=common
OUTLOOK_REDIRECT_URI=http://localhost:3000/auth/outlook/callback

# NEW - Encryption
ENCRYPTION_KEY=generate_32_byte_hex_key

# NEW - JWT (for user sessions)
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=7d
```

**Generate encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 3. User Authentication

**Add user login system:**

```typescript
// backend/src/models/user.ts
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  name: String,
  role: { type: String, enum: ['admin', 'recruiter'], default: 'recruiter' },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(password: string) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);
```

**JWT authentication middleware:**
```typescript
// backend/src/middleware/auth.ts
import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Login endpoint:**
```typescript
router.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY }
  );

  res.json({ token, user: { email: user.email, name: user.name } });
});
```

---

### 4. HTTPS & CORS

**Ensure HTTPS in production:**
```typescript
// backend/src/server.ts
if (process.env.NODE_ENV === 'production') {
  // Force HTTPS
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}
```

**CORS configuration:**
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

---

### 5. Data Privacy (GDPR)

**Add data retention and export features:**

```typescript
// Delete user data after retention period
router.delete('/api/candidates/:id/gdpr-delete', authenticate, async (req, res) => {
  const candidate = await UnifiedCandidate.findById(req.params.id);

  // Delete resume files
  for (const resume of candidate.resumes) {
    fs.unlinkSync(resume.filePath);
  }

  // Delete database record
  await candidate.deleteOne();

  res.json({ message: 'Data deleted successfully' });
});

// Export user data
router.get('/api/candidates/:id/export', authenticate, async (req, res) => {
  const candidate = await UnifiedCandidate.findById(req.params.id);
  res.json(candidate);
});
```

---

## 📅 Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goals:**
- Set up database schema
- Create base service architecture
- Implement authentication & encryption

**Tasks:**
- [ ] Create new MongoDB collections
- [ ] Set up encryption service
- [ ] Add user authentication (login/register)
- [ ] Set up environment variables
- [ ] Create Ceipal service skeleton
- [ ] Create Outlook service skeleton
- [ ] Create matching service skeleton

**Deliverables:**
- Database ready
- Authentication working
- Service files created (empty implementations)

---

### Phase 2: Ceipal Integration (Week 2-3)

**Goals:**
- Connect to Ceipal API
- Sync jobs, candidates, applications
- Display Ceipal data in UI

**Tasks:**
- [ ] Document Ceipal API endpoints (provided by user)
- [ ] Implement Ceipal authentication
- [ ] Implement job fetching
- [ ] Implement candidate fetching
- [ ] Implement application fetching
- [ ] Create Ceipal config page in UI
- [ ] Add Ceipal data display in dashboard
- [ ] Add sync button and status indicator
- [ ] Test with real Ceipal account

**Deliverables:**
- Ceipal data syncing successfully
- UI showing jobs and candidates from Ceipal

---

### Phase 3: Outlook Integration (Week 3-4)

**Goals:**
- Set up Microsoft OAuth
- Fetch emails with job descriptions and resumes
- Parse and store email data

**Tasks:**
- [ ] Create Azure AD app registration
- [ ] Implement OAuth 2.0 flow
- [ ] Implement email fetching
- [ ] Implement attachment download
- [ ] Parse job descriptions from emails (AI)
- [ ] Parse resumes from email attachments
- [ ] Create Outlook config page in UI
- [ ] Add Outlook data display in dashboard
- [ ] Test with real Outlook account

**Deliverables:**
- Outlook OAuth working
- Emails being processed and stored
- Jobs and resumes extracted from emails

---

### Phase 4: Data Unification (Week 4)

**Goals:**
- Merge Ceipal and Outlook data
- Handle duplicates
- Create unified views

**Tasks:**
- [ ] Implement duplicate detection
  - Same candidate from Ceipal and Outlook
  - Same job from both sources
- [ ] Create unified_jobs collection logic
- [ ] Create unified_candidates collection logic
- [ ] Link applications across sources
- [ ] Update UI to show unified data
- [ ] Add source badges (Ceipal/Outlook/Manual)

**Deliverables:**
- Single unified view of all data
- No duplicate candidates/jobs
- Clear source tracking

---

### Phase 5: Matching Engine (Week 5)

**Goals:**
- Implement AI matching algorithm
- Calculate match scores
- Display matches in UI

**Tasks:**
- [ ] Implement skill matching logic
- [ ] Implement experience matching
- [ ] Implement location matching
- [ ] Implement salary matching
- [ ] Implement education matching
- [ ] Calculate weighted overall score
- [ ] Generate match explanations (AI)
- [ ] Create Matching tab in UI
- [ ] Add match cards for candidates/jobs
- [ ] Test accuracy with real data

**Deliverables:**
- Match scores calculated for all candidate-job pairs
- Matching UI showing top candidates per job
- High match accuracy (>85%)

---

### Phase 6: Automation & Polish (Week 6)

**Goals:**
- Set up auto-sync
- Add notifications
- Polish UI/UX
- Bug fixes

**Tasks:**
- [ ] Implement cron jobs for auto-sync
- [ ] Add WebSocket for real-time updates
- [ ] Add email notifications (optional)
- [ ] Add error handling and logging
- [ ] Create sync logs page
- [ ] Add analytics/charts (optional)
- [ ] Performance optimization
- [ ] User testing and feedback
- [ ] Bug fixes

**Deliverables:**
- Auto-sync running every 30 minutes
- Real-time UI updates
- Stable, production-ready system

---

### Phase 7: Advanced Features (Week 7+)

**Optional enhancements:**
- [ ] Interview scheduling
- [ ] Email templates and responses
- [ ] Calendar integration
- [ ] Mobile responsive design
- [ ] Export reports (PDF, Excel)
- [ ] Multi-user support
- [ ] Audit logs
- [ ] Advanced analytics

---

## ❓ Questions to Answer

### Before Starting Implementation:

1. **Ceipal API Access:**
   - Do you have API access in your Ceipal subscription?
   - Can you provide the API documentation URL?
   - What is the authentication method? (API Key, OAuth, etc.)
   - Are there rate limits?

2. **Outlook Account:**
   - Is it a personal Outlook.com account or Office 365 work account?
   - Do you have permissions to create Azure AD applications?
   - Can you access Azure Portal?

3. **Data Volume:**
   - How many job postings do you handle per month?
   - How many resumes/candidates in Ceipal currently?
   - How many emails with resumes do you receive per day?

4. **Priority:**
   - Which integration is more important: Ceipal or Outlook?
   - Should we start with one and add the other later?
   - Or implement both in parallel?

5. **Use Case:**
   - Is this for personal use (single user) or team use (multi-user)?
   - Will multiple recruiters need access?
   - Do you need different permission levels?

6. **Existing Workflow:**
   - How do you currently manage jobs and candidates?
   - What pain points are you trying to solve?
   - What features are must-haves vs nice-to-haves?

---

## 📝 Next Steps

1. **Review this plan** and provide feedback
2. **Answer the questions** above
3. **Provide Ceipal API documentation** (endpoints, auth method, examples)
4. **Create Azure AD app** for Outlook OAuth (I can guide you)
5. **Prioritize features** (which phases are most important)
6. **Set timeline** (how quickly do you need this?)

Once you provide this information, I'll update the plan and we can start implementation!

---

**End of Document**
