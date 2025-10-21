# Job Pipeline Implementation Guide

## Overview

This document describes the implementation of the **Job Pipeline** feature - a unified view for managing jobs from multiple sources (Outlook, Ceipal, and other job boards) with AI-powered semantic matching using Sentence Transformers.

## What Was Implemented

### 1. AI Matching Microservice (Python)
**Location**: `ai-matching-service/`

A Flask-based microservice that provides semantic similarity matching using Sentence Transformers.

**Features**:
- Semantic text similarity calculation
- Job description to resume matching
- Batch candidate matching
- Skills similarity using embeddings
- Weighted scoring (60% semantic + 40% skills)

**Model**: `all-MiniLM-L6-v2` (lightweight, fast, ~80MB)

**Endpoints**:
- `GET /health` - Health check
- `POST /embed` - Generate text embeddings
- `POST /similarity` - Calculate cosine similarity between two texts
- `POST /match-candidate` - Match candidate to job with detailed scoring
- `POST /batch-match` - Match multiple candidates in one request

### 2. Backend API Enhancements

#### New Routes (`backend/src/routes/jobPipelineRoutes.ts`)
- `GET /api/job-pipeline` - Get all jobs with filtering and search
- `GET /api/job-pipeline/:id` - Get single job with matched candidates
- `PATCH /api/job-pipeline/:id/status` - Update job status
- `PATCH /api/job-pipeline/:id/priority` - Update job priority
- `POST /api/job-pipeline/:id/notes` - Add notes to job
- `POST /api/job-pipeline/:jobId/submit-candidate/:candidateId` - Submit candidate for job
- `DELETE /api/job-pipeline/:id/archive` - Archive job
- `POST /api/job-pipeline/:id/restore` - Restore archived job
- `GET /api/job-pipeline/stats/overview` - Get pipeline statistics

#### Enhanced Matching Service (`backend/src/services/matchingService.ts`)
- New `calculateAIMatchScore()` method for AI-enhanced matching
- Integrates with AI microservice for semantic similarity
- Falls back to traditional keyword matching if AI service unavailable
- Scoring: 35pts skills + 30pts experience + 15pts location + 15pts salary + 20pts AI semantic

#### AI Client (`backend/src/services/aiMatchingClient.ts`)
- HTTP client for communicating with Python AI service
- Auto-detects service availability
- Graceful degradation if service is down

#### Database Model Updates (`backend/src/models/unifiedJob.ts`)
Added fields:
- `notes` - Array of timestamped notes
- `submissions` - Track candidate submissions with status
- `archived` - Soft delete support
- `source` - Primary source identifier (outlook/ceipal/manual)

### 3. Frontend Implementation

#### Job Pipeline Page (`frontend/src/pages/JobPipeline.tsx`)
**Features**:
- Unified view of all jobs from all sources
- Real-time search and filtering
- Source filter (Outlook, Ceipal, Manual, All)
- Status filter (Open, Interviewing, Filled, On Hold, Closed)
- Job cards with:
  - Title, Company, Location
  - Source badge
  - Status badge
  - Priority indicator
  - Salary range
  - Required skills preview
  - Submission count
- Statistics dashboard:
  - Total jobs
  - Open jobs
  - Filled jobs
  - Recent jobs (last 7 days)

**Route**: `/job-pipeline`

#### Integration Points
- Added "Job Pipeline" button to Recruiter Dashboard (replaces "View Jobs")
- Gradient button design to highlight importance
- Tooltip explains AI matching capability

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  (React + TypeScript + Tailwind)                            │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Job Pipeline Page (/job-pipeline)                  │   │
│  │  - Search & Filter UI                               │   │
│  │  - Job Cards Grid                                   │   │
│  │  - Stats Dashboard                                  │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTP (axios)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Node.js Backend                          │
│  (Express + TypeScript + MongoDB)                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Job Pipeline Routes                                │   │
│  │  /api/job-pipeline/*                                │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │  Matching Service                                   │   │
│  │  - Traditional keyword matching                     │   │
│  │  - AI-enhanced matching (optional)                  │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │  AI Matching Client                                 │   │
│  │  - HTTP client to Python service                    │   │
│  │  - Health check & failover                          │   │
│  └────────────────────┬────────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────┘
                         │ HTTP (localhost:5001)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Python AI Microservice                         │
│  (Flask + Sentence Transformers)                            │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Sentence Transformer Model                         │   │
│  │  (all-MiniLM-L6-v2)                                 │   │
│  │  - Generate embeddings                              │   │
│  │  - Calculate cosine similarity                      │   │
│  │  - Semantic matching logic                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- MongoDB

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Setup AI Matching Service
```bash
cd ai-matching-service

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Or macOS/Linux:
# source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

On first run, the Sentence Transformer model (~80MB) will download automatically.

### 3. Environment Variables
Add to your `.env` file:
```bash
# AI Service URL (optional - defaults to http://localhost:5001)
AI_SERVICE_URL=http://localhost:5001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ats_resume_optimizer

# Frontend
REACT_APP_API_URL=http://localhost:5000
```

## Running the Application

### Start All Services

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - AI Service**:
```bash
cd ai-matching-service
# Windows:
start.bat
# macOS/Linux:
python app.py
```

**Terminal 3 - Frontend**:
```bash
cd frontend
npm start
```

### Service URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- AI Service: http://localhost:5001

## Usage Flow

### 1. Sync Jobs from Sources
- **Outlook**: Use "Sync Outlook" button on Recruiter Dashboard
- **Ceipal**: Configure in Ceipal Settings, then sync
- **Manual**: Jobs parsed from email paste

### 2. View Job Pipeline
1. Go to Recruiter Dashboard
2. Click "Job Pipeline" button (gradient blue/indigo button)
3. View unified list of all jobs

### 3. Filter & Search
- **Search**: Type keywords in search box (searches title, company, description)
- **Source Filter**: Select Outlook, Ceipal, Manual, or All
- **Status Filter**: Filter by Open, Interviewing, Filled, etc.

### 4. View Job Details
- Click any job card to view detailed information
- See matched candidates (AI-powered)
- View match scores and semantic similarity

### 5. Manage Jobs
- Update job status (Open → Interviewing → Filled)
- Set priority (Low, Medium, High, Urgent)
- Add notes
- Submit candidates
- Archive old jobs

## AI Matching Scoring

The matching service uses a hybrid approach:

### Traditional Keyword Matching (80 points)
- **Skills Match** (35pts): Exact keyword matching of required skills
- **Experience Match** (30pts): Years of experience comparison
- **Location Match** (15pts): Location compatibility
- **Salary Match** (15pts): Salary expectation alignment

### AI Semantic Matching (20 points)
- **Semantic Similarity**: Uses Sentence Transformers to understand contextual meaning
- **Weighted Score**: Combines overall text similarity (60%) + skills semantic match (40%)
- **Benefit**: Catches candidates with equivalent skills expressed differently

### Total Score: 100 points
A candidate scoring 80+ is "Excellent", 65-79 is "Good", 50-64 is "Fair", <50 is "Poor".

## Features Breakdown

### ✅ Implemented Features
1. **Unified Job View**: All jobs from all sources in one place
2. **AI-Powered Matching**: Semantic similarity using Sentence Transformers
3. **Search & Filtering**: Real-time search and multi-dimensional filtering
4. **Job Statistics**: Dashboard with key metrics
5. **Status Management**: Update job status through the pipeline
6. **Priority System**: Mark urgent/high priority jobs
7. **Notes System**: Add timestamped notes to jobs
8. **Candidate Submission Tracking**: Track which candidates submitted for which jobs
9. **Archive System**: Soft delete old jobs
10. **Fallback Mechanism**: Works without AI service (keyword matching only)

### 🚧 Pending Features (For Next Phase)
1. **Job Selection from Outlook/Ceipal views**: "Add to Pipeline" button
2. **Kanban Board View**: Drag-and-drop status changes
3. **Bulk Actions**: Archive/update multiple jobs at once
4. **Email Integration**: Send candidates directly from pipeline
5. **Advanced Analytics**: Conversion rates, time-to-fill metrics
6. **Manual Job Creation**: Add jobs manually via form

## API Examples

### Get All Jobs
```javascript
GET /api/job-pipeline?source=outlook&status=open&search=developer

Response:
{
  "success": true,
  "jobs": [...],
  "totalCount": 15,
  "stats": {
    "byStatus": { "open": 10, "filled": 5 },
    "bySource": { "outlook": 12, "ceipal": 3 }
  }
}
```

### Get Job with Matches
```javascript
GET /api/job-pipeline/:jobId?includeMatches=true&minScore=60

Response:
{
  "success": true,
  "job": {...},
  "matches": [
    {
      "candidate": {...},
      "matchScore": {
        "overall": 85,
        "breakdown": {
          "skillMatch": 30,
          "experienceMatch": 28,
          "locationMatch": 15,
          "salaryMatch": 12,
          "semanticMatch": 18  // AI-powered
        },
        "details": {
          "aiEnhanced": true,
          "semanticSimilarity": 87.5
        }
      }
    }
  ]
}
```

### Submit Candidate
```javascript
POST /api/job-pipeline/:jobId/submit-candidate/:candidateId
Body: { "notes": "Great fit for the role" }

Response:
{
  "success": true,
  "job": {...},
  "message": "John Doe submitted successfully"
}
```

## Troubleshooting

### AI Service Not Available
- **Symptom**: Matching works but no semantic scores
- **Check**: Is Python service running on port 5001?
- **Fix**: Run `python app.py` in `ai-matching-service/`
- **Fallback**: System automatically uses keyword matching only

### Model Download Issues
- **Symptom**: First startup takes long time
- **Reason**: Downloading Sentence Transformer model (~80MB)
- **Fix**: Wait for download to complete, will be cached for future use

### Port Conflicts
- **Backend**: Change `PORT` in `.env`
- **AI Service**: Change port in `ai-matching-service/app.py` (line 280)
- **Frontend**: Change in `package.json` start script

## Performance Considerations

### AI Matching Performance
- **Single Match**: ~50-100ms per candidate
- **Batch Match (10 candidates)**: ~200-400ms total
- **Recommended**: Use batch endpoint for multiple candidates

### Optimizations
- AI service health check cached (2 second timeout)
- Graceful fallback to keyword matching
- Resume text extracted once and reused
- Skills normalized for faster matching

## Future Enhancements

### Phase 2 Features
1. **Job Selection UI**: Add "Add to Pipeline" button on Outlook/Ceipal job views
2. **Caching**: Cache AI embeddings for faster repeat matches
3. **Better Model**: Option to use `all-mpnet-base-v2` for higher accuracy
4. **GPU Support**: Leverage GPU for faster embeddings
5. **Vector Database**: Store embeddings in Pinecone/Weaviate for fast similarity search

### Phase 3 Features
1. **ML Model Training**: Train custom model on your job descriptions
2. **Candidate Ranking**: ML-based ranking considering historical placements
3. **Automated Matching**: Auto-suggest top 5 candidates for new jobs
4. **Interview Scheduling**: Integrated calendar scheduling
5. **Reporting**: Detailed analytics and placement tracking

## Technical Decisions

### Why Python Microservice?
- Sentence Transformers is Python-only
- Separates ML concerns from business logic
- Can scale independently
- Easy to swap models

### Why Sentence Transformers?
- Pre-trained on semantic similarity
- Works well for job matching use case
- Open source, no API costs
- Offline inference (no internet required)

### Why Hybrid Scoring?
- Keyword matching is fast and precise for exact skills
- AI matching catches semantic nuances
- Combining both gives best results
- Degrades gracefully if AI unavailable

## Contributing

When extending this feature:
1. Update this documentation
2. Add tests for new endpoints
3. Handle AI service unavailability
4. Follow existing TypeScript patterns
5. Update Postman collection

## Support

For issues:
1. Check logs: Backend console + AI service console
2. Verify all services running
3. Test AI service health endpoint: `GET http://localhost:5001/health`
4. Check MongoDB connection

---

**Last Updated**: 2025-10-21
**Version**: 1.0.0
**Author**: ATS Resume Optimizer Team
