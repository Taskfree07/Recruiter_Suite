# Ceipal Integration - Phase 1: Core Candidate-Job Matching

**Version**: 1.0
**Last Updated**: October 15, 2025
**Status**: Ready for Development
**Timeline**: Week 1-4 (Sprint 1-2)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Business Objectives](#business-objectives)
3. [User Stories](#user-stories)
4. [Technical Architecture](#technical-architecture)
5. [Epic 1.1: Resume-to-Job Matching Engine](#epic-11-resume-to-job-matching-engine)
6. [Epic 1.2: Quick Apply/Submit Candidates](#epic-12-quick-applysubmit-candidates)
7. [Database Schema](#database-schema)
8. [API Specifications](#api-specifications)
9. [Frontend Components](#frontend-components)
10. [Testing Strategy](#testing-strategy)
11. [Success Metrics](#success-metrics)
12. [Deployment Plan](#deployment-plan)

---

## Overview

### Purpose
Phase 1 transforms Ceipal from a read-only job listing system into an actionable recruitment tool by enabling recruiters to:
1. **Match** existing resume database candidates to Ceipal jobs using intelligent algorithms
2. **Submit** matched candidates to jobs with full application tracking

### Current State (Phase 0)
- ✅ Ceipal jobs sync to database (mock mode)
- ✅ Job listing page with filters
- ✅ Basic stats dashboard
- ❌ No connection between jobs and candidates
- ❌ No way to act on jobs

### Target State (Phase 1 Complete)
- ✅ Smart matching algorithm finds top candidates for each job
- ✅ Match scores with detailed skill breakdowns
- ✅ One-click candidate submission to jobs
- ✅ Application tracking dashboard
- ✅ Full audit trail of submissions

---

## Business Objectives

### Primary Goals
1. **Reduce Time-to-Shortlist**: From 2+ hours to < 30 minutes per job
2. **Increase Match Quality**: 80%+ accuracy based on recruiter feedback
3. **Enable Action**: 90% of recruiters submit at least 1 candidate per week

### Key Results (KRs)
- **KR1**: Recruiters find top 10 candidates for any job in < 60 seconds
- **KR2**: Average match score accuracy > 75% (validated by recruiter feedback)
- **KR3**: 100 applications submitted through the system in first month
- **KR4**: Net Promoter Score (NPS) > 40 from recruiters

### Success Criteria
- ✅ Matching algorithm implemented with configurable weights
- ✅ Submission workflow tested end-to-end
- ✅ Application tracking dashboard live
- ✅ 5 recruiters successfully submit candidates in beta test

---

## User Stories

### Epic 1.1: Matching Engine

#### Story 1.1.1: View Matching Candidates for a Job
**As a** recruiter
**I want to** see which candidates from my resume database best match a Ceipal job
**So that** I can quickly identify qualified candidates without manual searching

**Acceptance Criteria**:
- [ ] "View Matching Candidates" button visible on each job card
- [ ] Clicking button shows top 10 matched candidates sorted by score
- [ ] Match score (0-100%) displayed prominently
- [ ] Page loads in < 2 seconds
- [ ] Works for jobs with 1-50 required skills

**Priority**: P0 (Must Have)
**Estimate**: 8 story points

---

#### Story 1.1.2: View Detailed Match Breakdown
**As a** recruiter
**I want to** understand why a candidate got a specific match score
**So that** I can make informed decisions about submitting them

**Acceptance Criteria**:
- [ ] Match breakdown shows: matched skills, missing skills, experience gap
- [ ] Visual indicators (green checkmarks for matches, red X for gaps)
- [ ] Side-by-side comparison: job requirements vs. candidate qualifications
- [ ] Salary alignment indicator (if data available)
- [ ] Location compatibility indicator

**Priority**: P0 (Must Have)
**Estimate**: 5 story points

---

#### Story 1.1.3: Filter and Sort Matching Candidates
**As a** recruiter
**I want to** filter matched candidates by experience level, location, or availability
**So that** I can narrow down to immediately actionable candidates

**Acceptance Criteria**:
- [ ] Filter by: experience level, location type (remote/onsite), notice period
- [ ] Sort by: match score, experience years, recency of resume
- [ ] Filters persist when navigating between jobs
- [ ] "Clear all filters" option available

**Priority**: P1 (Should Have)
**Estimate**: 3 story points

---

### Epic 1.2: Application Submission

#### Story 1.2.1: Submit Candidate to Job
**As a** recruiter
**I want to** submit a matched candidate to a Ceipal job
**So that** I can track their application progress

**Acceptance Criteria**:
- [ ] "Submit to Job" button on each candidate card
- [ ] Confirmation modal shows job details and candidate summary
- [ ] Optional notes field for recruiter comments
- [ ] Success notification after submission
- [ ] Application appears in tracking dashboard immediately

**Priority**: P0 (Must Have)
**Estimate**: 5 story points

---

#### Story 1.2.2: Track Application Status
**As a** recruiter
**I want to** see all applications I've submitted with their current status
**So that** I can follow up appropriately and avoid duplicate submissions

**Acceptance Criteria**:
- [ ] Applications dashboard shows: job title, candidate name, status, date submitted
- [ ] Filter by status: submitted, screening, interview, rejected, hired
- [ ] Search by candidate name or job title
- [ ] Export to Excel functionality
- [ ] Prevent duplicate submissions with warning

**Priority**: P0 (Must Have)
**Estimate**: 8 story points

---

#### Story 1.2.3: Update Application Status
**As a** recruiter
**I want to** manually update application status
**So that** I can keep records current until automated sync is implemented (Phase 2)

**Acceptance Criteria**:
- [ ] Dropdown to change status on each application row
- [ ] Status change saves immediately with loading indicator
- [ ] Timestamp of last status update shown
- [ ] Add notes when changing status
- [ ] Audit log of all status changes

**Priority**: P1 (Should Have)
**Estimate**: 3 story points

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│                                                          │
│  ┌────────────────┐  ┌──────────────────────────────┐  │
│  │  CeipalJobs    │  │  JobCandidateMatch           │  │
│  │  Page          │──▶  Page (NEW)                   │  │
│  │                │  │  - Match results               │  │
│  │  [View         │  │  - Skill breakdown             │  │
│  │   Candidates]  │  │  - Submit button               │  │
│  └────────────────┘  └──────────────────────────────┘  │
│                              │                           │
│                              ▼                           │
│                    ┌─────────────────────┐              │
│                    │  ApplicationTracker │              │
│                    │  Page (NEW)         │              │
│                    │  - All applications │              │
│                    │  - Status updates   │              │
│                    └─────────────────────┘              │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js/Express)               │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐ │
│  │ matchingRoutes  │  │  applicationRoutes (NEW)     │ │
│  │ (NEW)           │  │                               │ │
│  │                 │  │  POST /applications          │ │
│  │ GET /match      │  │  GET  /applications          │ │
│  │     /:jobId     │  │  PUT  /applications/:id      │ │
│  └────────┬────────┘  └────────┬─────────────────────┘ │
│           │                    │                        │
│           ▼                    ▼                        │
│  ┌─────────────────┐  ┌──────────────────────────────┐ │
│  │ matchingService │  │  applicationService (NEW)    │ │
│  │ (NEW)           │  │                               │ │
│  │ - Score calc    │  │  - Create applications       │ │
│  │ - Skill match   │  │  - Validate no duplicates    │ │
│  │ - Experience    │  │  - Update status             │ │
│  └────────┬────────┘  └────────┬─────────────────────┘ │
│           │                    │                        │
│           ▼                    ▼                        │
└───────────┴────────────────────┴────────────────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE                      │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ unified_    │  │ recruiter_   │  │ applications  │  │
│  │ jobs        │  │ resumes      │  │ (NEW)         │  │
│  │             │  │              │  │               │  │
│  │ - Ceipal    │  │ - Candidate  │  │ - Job ref     │  │
│  │   jobs      │  │   data       │  │ - Candidate   │  │
│  │             │  │ - Skills     │  │ - Status      │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Axios
- **Backend**: Node.js 18+, Express, TypeScript
- **Database**: MongoDB 6.0+
- **State Management**: React Context API (existing)
- **Routing**: React Router v6 (existing)

---

## Epic 1.1: Resume-to-Job Matching Engine

### Matching Algorithm Specification

#### Algorithm Overview
The matching algorithm uses a weighted scoring system across multiple dimensions:

```typescript
interface MatchScore {
  overall: number;           // 0-100
  breakdown: {
    skillMatch: number;      // 0-40 points
    experienceMatch: number; // 0-30 points
    locationMatch: number;   // 0-15 points
    salaryMatch: number;     // 0-10 points
    educationMatch: number;  // 0-5 points
  };
  matchedSkills: string[];
  missingSkills: string[];
  experienceGap: number;     // years (can be negative if overqualified)
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
}
```

#### Scoring Logic (Detailed)

##### 1. Skill Matching (40 points max)
```typescript
// Pseudo-code
function calculateSkillScore(job, candidate) {
  const requiredSkills = job.requiredSkills;
  const candidateSkills = [
    ...candidate.skills.primary,
    ...candidate.skills.frameworks,
    ...candidate.skills.databases,
    ...candidate.skills.cloudPlatforms
  ];

  // Normalize skills (lowercase, remove spaces)
  const normalizedCandidateSkills = normalizeSkills(candidateSkills);

  // Calculate matches
  let matchedCount = 0;
  let matchedSkills = [];
  let missingSkills = [];

  for (const skill of requiredSkills) {
    const normalizedSkill = normalizeSkill(skill);
    if (normalizedCandidateSkills.includes(normalizedSkill)) {
      matchedCount++;
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  // Base score: percentage of matched skills
  const matchPercentage = matchedCount / requiredSkills.length;
  let score = matchPercentage * 35; // Max 35 points

  // Bonus: Nice-to-have skills (+5 points max)
  const niceToHaveMatched = job.niceToHaveSkills.filter(skill =>
    normalizedCandidateSkills.includes(normalizeSkill(skill))
  ).length;
  const bonusScore = Math.min(5, niceToHaveMatched);

  return {
    score: score + bonusScore,
    matchedSkills,
    missingSkills,
    matchRate: matchPercentage
  };
}
```

**Example**:
- Job requires: [React, Node.js, TypeScript, AWS, Docker] (5 skills)
- Candidate has: [React, Node.js, TypeScript, MongoDB, Python]
- Matched: 3/5 = 60% → 21 points
- Nice-to-have: [Python, MongoDB] both matched → +2 points
- **Total: 23/40 points**

---

##### 2. Experience Matching (30 points max)
```typescript
function calculateExperienceScore(job, candidate) {
  const jobMinExp = job.experienceYears.min;
  const jobMaxExp = job.experienceYears.max;
  const candidateExp = candidate.professionalDetails.totalExperience;

  // Perfect match: within range
  if (candidateExp >= jobMinExp && candidateExp <= jobMaxExp) {
    return { score: 30, gap: 0, status: 'perfect' };
  }

  // Underqualified
  if (candidateExp < jobMinExp) {
    const gap = jobMinExp - candidateExp;
    const penalty = Math.min(gap * 3, 30); // Max 30 point penalty
    return {
      score: Math.max(0, 30 - penalty),
      gap: -gap,
      status: 'underqualified'
    };
  }

  // Overqualified (small penalty - they might be bored or expensive)
  if (candidateExp > jobMaxExp) {
    const gap = candidateExp - jobMaxExp;
    const penalty = Math.min(gap * 2, 10); // Max 10 point penalty
    return {
      score: Math.max(20, 30 - penalty),
      gap: gap,
      status: 'overqualified'
    };
  }
}
```

**Example**:
- Job requires: 3-5 years
- Candidate has: 4 years → **30/30 points** (perfect match)
- Candidate has: 2 years → Gap: -1 year → Penalty: 3 → **27/30 points**
- Candidate has: 7 years → Gap: +2 years → Penalty: 4 → **26/30 points**

---

##### 3. Location Matching (15 points max)
```typescript
function calculateLocationScore(job, candidate) {
  const jobLocationType = job.locationType; // 'remote', 'onsite', 'hybrid'
  const jobLocation = job.location;
  const candidateLocation = candidate.personalInfo.location;

  // Remote jobs: full points if candidate open to remote
  if (jobLocationType === 'remote') {
    return { score: 15, compatible: true };
  }

  // Onsite/Hybrid: check location proximity
  const sameCity = compareCities(jobLocation, candidateLocation);

  if (jobLocationType === 'onsite') {
    return sameCity
      ? { score: 15, compatible: true }
      : { score: 5, compatible: false }; // Partial credit for relocation possibility
  }

  if (jobLocationType === 'hybrid') {
    return sameCity
      ? { score: 15, compatible: true }
      : { score: 10, compatible: 'maybe' };
  }
}
```

---

##### 4. Salary Matching (10 points max)
```typescript
function calculateSalaryScore(job, candidate) {
  // If either salary data is missing, give neutral score
  if (!job.salaryRange || !candidate.professionalDetails.expectedSalary) {
    return { score: 5, alignment: 'unknown' };
  }

  const jobMax = job.salaryRange.max;
  const candidateExpected = candidate.professionalDetails.expectedSalary;

  // Candidate expectations within range
  if (candidateExpected <= jobMax) {
    return { score: 10, alignment: 'perfect' };
  }

  // Candidate expects more (but close)
  const difference = candidateExpected - jobMax;
  const percentageOver = (difference / jobMax) * 100;

  if (percentageOver < 10) {
    return { score: 7, alignment: 'negotiable' }; // Within 10% - negotiable
  } else if (percentageOver < 20) {
    return { score: 3, alignment: 'challenging' }; // 10-20% - challenging
  } else {
    return { score: 0, alignment: 'misaligned' }; // >20% - likely dealbreaker
  }
}
```

---

##### 5. Education Matching (5 points max)
```typescript
function calculateEducationScore(job, candidate) {
  if (!job.educationRequired) {
    return { score: 5, status: 'not_specified' }; // Neutral if not required
  }

  const requiredLevel = parseEducationLevel(job.educationRequired);
  const candidateLevel = parseEducationLevel(candidate.education.highestDegree);

  if (candidateLevel >= requiredLevel) {
    return { score: 5, status: 'met' };
  } else {
    return { score: 2, status: 'not_met' }; // Partial credit - experience might compensate
  }
}
```

---

#### Match Recommendation Thresholds
```typescript
function getRecommendation(overallScore: number): string {
  if (overallScore >= 80) return 'excellent'; // Green badge - submit immediately
  if (overallScore >= 65) return 'good';      // Blue badge - strong candidate
  if (overallScore >= 50) return 'fair';      // Yellow badge - consider with context
  return 'poor';                               // Gray badge - likely not suitable
}
```

---

### Backend Implementation

#### File: `backend/src/services/matchingService.ts`

```typescript
import UnifiedJob from '../models/unifiedJob';
import RecruiterResume from '../models/recruiterResume';

interface MatchResult {
  candidate: any;
  matchScore: MatchScore;
}

class MatchingService {
  /**
   * Find top matching candidates for a specific job
   */
  async findMatchingCandidates(
    jobId: string,
    options: { limit?: number; minScore?: number } = {}
  ): Promise<MatchResult[]> {
    const { limit = 10, minScore = 40 } = options;

    // Fetch job
    const job = await UnifiedJob.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Fetch all candidates (TODO: add pagination for scale)
    const candidates = await RecruiterResume.find({ status: { $ne: 'archived' } });

    // Calculate match score for each candidate
    const matchedCandidates: MatchResult[] = [];

    for (const candidate of candidates) {
      const matchScore = this.calculateMatchScore(job, candidate);

      // Only include if meets minimum score
      if (matchScore.overall >= minScore) {
        matchedCandidates.push({
          candidate: candidate.toObject(),
          matchScore
        });
      }
    }

    // Sort by overall score (descending)
    matchedCandidates.sort((a, b) => b.matchScore.overall - a.matchScore.overall);

    // Return top N
    return matchedCandidates.slice(0, limit);
  }

  /**
   * Calculate match score between a job and candidate
   */
  calculateMatchScore(job: any, candidate: any): MatchScore {
    // Skill matching
    const skillScore = this.calculateSkillScore(job, candidate);

    // Experience matching
    const experienceScore = this.calculateExperienceScore(job, candidate);

    // Location matching
    const locationScore = this.calculateLocationScore(job, candidate);

    // Salary matching
    const salaryScore = this.calculateSalaryScore(job, candidate);

    // Education matching
    const educationScore = this.calculateEducationScore(job, candidate);

    // Calculate overall score
    const overall =
      skillScore.score +
      experienceScore.score +
      locationScore.score +
      salaryScore.score +
      educationScore.score;

    return {
      overall: Math.round(overall),
      breakdown: {
        skillMatch: skillScore.score,
        experienceMatch: experienceScore.score,
        locationMatch: locationScore.score,
        salaryMatch: salaryScore.score,
        educationMatch: educationScore.score
      },
      matchedSkills: skillScore.matchedSkills,
      missingSkills: skillScore.missingSkills,
      experienceGap: experienceScore.gap,
      recommendation: this.getRecommendation(overall)
    };
  }

  private calculateSkillScore(job: any, candidate: any) {
    // Implementation as detailed in algorithm section above
    // ... (see Skill Matching section)
    return { score: 0, matchedSkills: [], missingSkills: [] };
  }

  private calculateExperienceScore(job: any, candidate: any) {
    // Implementation as detailed above
    return { score: 0, gap: 0 };
  }

  private calculateLocationScore(job: any, candidate: any) {
    // Implementation as detailed above
    return { score: 0 };
  }

  private calculateSalaryScore(job: any, candidate: any) {
    // Implementation as detailed above
    return { score: 0 };
  }

  private calculateEducationScore(job: any, candidate: any) {
    // Implementation as detailed above
    return { score: 0 };
  }

  private getRecommendation(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Normalize skill name for matching (lowercase, trim, remove special chars)
   */
  private normalizeSkill(skill: string): string {
    return skill
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9+#]/g, ''); // Keep + and # for C++, C#, etc.
  }

  /**
   * Compare cities for location matching
   */
  private compareCities(location1: string, location2: string): boolean {
    // Simple implementation: check if same city mentioned
    const city1 = location1.split(',')[0].toLowerCase().trim();
    const city2 = location2.split(',')[0].toLowerCase().trim();
    return city1 === city2;
  }
}

export default new MatchingService();
```

---

#### File: `backend/src/routes/matchingRoutes.ts`

```typescript
import express, { Request, Response } from 'express';
import matchingService from '../services/matchingService';

const router = express.Router();

/**
 * GET /api/matching/job/:jobId/candidates
 * Get matching candidates for a specific job
 */
router.get('/job/:jobId/candidates', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { limit = '10', minScore = '40' } = req.query;

    const matches = await matchingService.findMatchingCandidates(jobId, {
      limit: parseInt(limit as string),
      minScore: parseInt(minScore as string)
    });

    res.json({
      success: true,
      jobId,
      totalMatches: matches.length,
      matches
    });
  } catch (error: any) {
    console.error('Error finding matches:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/matching/calculate
 * Calculate match score for a specific job-candidate pair
 */
router.post('/calculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, candidateId } = req.body;

    // Fetch job and candidate (implementation omitted for brevity)
    // const job = await UnifiedJob.findById(jobId);
    // const candidate = await RecruiterResume.findById(candidateId);

    // const matchScore = matchingService.calculateMatchScore(job, candidate);

    res.json({
      success: true,
      matchScore: {} // matchScore
    });
  } catch (error: any) {
    console.error('Error calculating match:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
```

---

### Frontend Implementation

#### File: `frontend/src/pages/JobCandidateMatch.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  ArrowPathIcon,
  UserIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

const API_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

interface MatchResult {
  candidate: any;
  matchScore: {
    overall: number;
    breakdown: {
      skillMatch: number;
      experienceMatch: number;
      locationMatch: number;
      salaryMatch: number;
      educationMatch: number;
    };
    matchedSkills: string[];
    missingSkills: string[];
    experienceGap: number;
    recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

const JobCandidateMatch: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<any>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<MatchResult | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchJobAndMatches();
    }
  }, [jobId]);

  const fetchJobAndMatches = async () => {
    try {
      setLoading(true);

      // Fetch job details
      const jobResponse = await axios.get(`${API_URL}/ceipal/jobs/${jobId}`);
      setJob(jobResponse.data.job);

      // Fetch matching candidates
      const matchResponse = await axios.get(`${API_URL}/matching/job/${jobId}/candidates`);
      setMatches(matchResponse.data.matches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 65) return 'text-blue-600 bg-blue-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getRecommendationBadge = (recommendation: string) => {
    const badges = {
      excellent: { color: 'bg-green-100 text-green-800', text: 'Excellent Match' },
      good: { color: 'bg-blue-100 text-blue-800', text: 'Good Match' },
      fair: { color: 'bg-yellow-100 text-yellow-800', text: 'Fair Match' },
      poor: { color: 'bg-gray-100 text-gray-800', text: 'Poor Match' }
    };
    const badge = badges[recommendation as keyof typeof badges];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Finding matching candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/ceipal-jobs')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Matching Candidates
                </h1>
                <p className="text-sm text-gray-600">
                  {job?.title} at {job?.company}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {matches.length} candidates found
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Job Requirements</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Experience</p>
              <p className="font-medium">
                {job?.experienceYears?.min}-{job?.experienceYears?.max} years • {job?.experienceLevel}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium">{job?.location} ({job?.locationType})</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Required Skills</p>
            <div className="flex flex-wrap gap-2">
              {job?.requiredSkills?.map((skill: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Matching Candidates */}
        {matches.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Matching Candidates</h3>
            <p className="text-gray-600">
              No candidates in your database match this job's requirements.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, index) => (
              <div
                key={match.candidate._id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {match.candidate.personalInfo.name}
                      </h3>
                      <span className={`px-4 py-1 rounded-full text-lg font-bold ${getScoreColor(match.matchScore.overall)}`}>
                        {match.matchScore.overall}%
                      </span>
                      {getRecommendationBadge(match.matchScore.recommendation)}
                    </div>

                    {/* Contact Info */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span>{match.candidate.personalInfo.email}</span>
                      <span>•</span>
                      <span>{match.candidate.professionalDetails.totalExperience} years exp</span>
                      <span>•</span>
                      <span>{match.candidate.personalInfo.location}</span>
                    </div>

                    {/* Match Breakdown */}
                    <div className="grid grid-cols-5 gap-3 mb-3">
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Skills</p>
                        <p className="text-sm font-semibold">
                          {match.matchScore.breakdown.skillMatch}/40
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Experience</p>
                        <p className="text-sm font-semibold">
                          {match.matchScore.breakdown.experienceMatch}/30
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Location</p>
                        <p className="text-sm font-semibold">
                          {match.matchScore.breakdown.locationMatch}/15
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Salary</p>
                        <p className="text-sm font-semibold">
                          {match.matchScore.breakdown.salaryMatch}/10
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Education</p>
                        <p className="text-sm font-semibold">
                          {match.matchScore.breakdown.educationMatch}/5
                        </p>
                      </div>
                    </div>

                    {/* Matched Skills */}
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Matched Skills ({match.matchScore.matchedSkills.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {match.matchScore.matchedSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center space-x-1"
                          >
                            <CheckCircleIcon className="h-3 w-3" />
                            <span>{skill}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    {match.matchScore.missingSkills.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Missing Skills ({match.matchScore.missingSkills.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {match.matchScore.missingSkills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs flex items-center space-x-1"
                            >
                              <XCircleIcon className="h-3 w-3" />
                              <span>{skill}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-4 flex flex-col space-y-2">
                    <button
                      onClick={() => setSelectedCandidate(match)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {/* Handle submit - Epic 1.2 */}}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Submit to Job
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobCandidateMatch;
```

---

## Epic 1.2: Quick Apply/Submit Candidates

### Database Schema

#### File: `backend/src/models/application.ts`

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  // References
  jobId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;

  // Job snapshot (in case job gets deleted)
  jobSnapshot: {
    title: string;
    company: string;
    ceipalJobId?: string;
  };

  // Candidate snapshot
  candidateSnapshot: {
    name: string;
    email: string;
  };

  // Application details
  status: 'submitted' | 'screening' | 'interview' | 'offered' | 'rejected' | 'hired' | 'withdrawn';
  submittedDate: Date;
  lastUpdated: Date;

  // Match details at time of submission
  matchScore: number;
  matchBreakdown: any;

  // External system tracking
  ceipalApplicationId?: string;
  syncedToCeipal: boolean;
  lastSyncDate?: Date;

  // Recruiter notes
  notes: string;
  recruiterNotes: Array<{
    note: string;
    createdBy: string;
    createdAt: Date;
  }>;

  // Audit trail
  statusHistory: Array<{
    status: string;
    changedAt: Date;
    changedBy: string;
    note?: string;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'UnifiedJob',
      required: true
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'RecruiterResume',
      required: true
    },

    jobSnapshot: {
      title: { type: String, required: true },
      company: { type: String, required: true },
      ceipalJobId: String
    },

    candidateSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true }
    },

    status: {
      type: String,
      enum: ['submitted', 'screening', 'interview', 'offered', 'rejected', 'hired', 'withdrawn'],
      default: 'submitted'
    },

    submittedDate: {
      type: Date,
      default: Date.now
    },

    lastUpdated: {
      type: Date,
      default: Date.now
    },

    matchScore: Number,
    matchBreakdown: Schema.Types.Mixed,

    ceipalApplicationId: String,
    syncedToCeipal: {
      type: Boolean,
      default: false
    },
    lastSyncDate: Date,

    notes: String,
    recruiterNotes: [
      {
        note: String,
        createdBy: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],

    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: String,
        note: String
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes for performance
applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true }); // Prevent duplicates
applicationSchema.index({ status: 1 });
applicationSchema.index({ submittedDate: -1 });
applicationSchema.index({ candidateId: 1 });

export default mongoose.model<IApplication>('Application', applicationSchema);
```

---

### Backend Service

#### File: `backend/src/services/applicationService.ts`

```typescript
import Application from '../models/application';
import UnifiedJob from '../models/unifiedJob';
import RecruiterResume from '../models/recruiterResume';
import matchingService from './matchingService';

class ApplicationService {
  /**
   * Submit a candidate to a job
   */
  async submitApplication(data: {
    jobId: string;
    candidateId: string;
    notes?: string;
    createdBy?: string;
  }) {
    const { jobId, candidateId, notes, createdBy = 'system' } = data;

    // Check for duplicate
    const existing = await Application.findOne({ jobId, candidateId });
    if (existing) {
      throw new Error('Candidate has already been submitted to this job');
    }

    // Fetch job and candidate
    const job = await UnifiedJob.findById(jobId);
    if (!job) throw new Error('Job not found');

    const candidate = await RecruiterResume.findById(candidateId);
    if (!candidate) throw new Error('Candidate not found');

    // Calculate match score at time of submission
    const matchScore = matchingService.calculateMatchScore(job, candidate);

    // Create application
    const application = new Application({
      jobId,
      candidateId,
      jobSnapshot: {
        title: job.title,
        company: job.company,
        ceipalJobId: job.sources.find(s => s.type === 'ceipal')?.id
      },
      candidateSnapshot: {
        name: candidate.personalInfo.name,
        email: candidate.personalInfo.email
      },
      matchScore: matchScore.overall,
      matchBreakdown: matchScore,
      notes,
      statusHistory: [
        {
          status: 'submitted',
          changedAt: new Date(),
          changedBy: createdBy,
          note: 'Application submitted'
        }
      ]
    });

    await application.save();

    // Increment application count on job
    job.applicationsCount += 1;
    await job.save();

    return application;
  }

  /**
   * Get all applications with filters
   */
  async getApplications(filters: {
    status?: string;
    jobId?: string;
    candidateId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }) {
    const {
      status,
      jobId,
      candidateId,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0
    } = filters;

    const query: any = {};

    if (status) query.status = status;
    if (jobId) query.jobId = jobId;
    if (candidateId) query.candidateId = candidateId;
    if (dateFrom || dateTo) {
      query.submittedDate = {};
      if (dateFrom) query.submittedDate.$gte = dateFrom;
      if (dateTo) query.submittedDate.$lte = dateTo;
    }

    const applications = await Application.find(query)
      .sort({ submittedDate: -1 })
      .limit(limit)
      .skip(offset)
      .populate('jobId', 'title company status')
      .populate('candidateId', 'personalInfo professionalDetails');

    const total = await Application.countDocuments(query);

    return { applications, total };
  }

  /**
   * Update application status
   */
  async updateStatus(
    applicationId: string,
    newStatus: string,
    updatedBy: string,
    note?: string
  ) {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    // Add to history
    application.statusHistory.push({
      status: newStatus,
      changedAt: new Date(),
      changedBy: updatedBy,
      note
    } as any);

    application.status = newStatus as any;
    application.lastUpdated = new Date();

    await application.save();

    return application;
  }

  /**
   * Add note to application
   */
  async addNote(applicationId: string, note: string, createdBy: string) {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    application.recruiterNotes.push({
      note,
      createdBy,
      createdAt: new Date()
    } as any);

    await application.save();

    return application;
  }

  /**
   * Get application statistics
   */
  async getStats() {
    const total = await Application.countDocuments();
    const byStatus = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentSubmissions = await Application.countDocuments({
      submittedDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    return {
      total,
      byStatus,
      recentSubmissions
    };
  }
}

export default new ApplicationService();
```

---

### API Routes

#### File: `backend/src/routes/applicationRoutes.ts`

```typescript
import express, { Request, Response } from 'express';
import applicationService from '../services/applicationService';

const router = express.Router();

/**
 * POST /api/applications
 * Submit a candidate to a job
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, candidateId, notes } = req.body;

    if (!jobId || !candidateId) {
      res.status(400).json({
        success: false,
        error: 'jobId and candidateId are required'
      });
      return;
    }

    const application = await applicationService.submitApplication({
      jobId,
      candidateId,
      notes,
      createdBy: 'recruiter' // TODO: Get from auth session
    });

    res.json({
      success: true,
      message: 'Application submitted successfully',
      application
    });
  } catch (error: any) {
    console.error('Submit application error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/applications
 * Get all applications with filters
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      jobId,
      candidateId,
      dateFrom,
      dateTo,
      limit,
      offset
    } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (jobId) filters.jobId = jobId;
    if (candidateId) filters.candidateId = candidateId;
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);

    const result = await applicationService.getApplications(filters);

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/applications/:id/status
 * Update application status
 */
router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        error: 'status is required'
      });
      return;
    }

    const application = await applicationService.updateStatus(
      id,
      status,
      'recruiter', // TODO: Get from auth
      note
    );

    res.json({
      success: true,
      message: 'Status updated successfully',
      application
    });
  } catch (error: any) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/applications/:id/notes
 * Add note to application
 */
router.post('/:id/notes', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      res.status(400).json({
        success: false,
        error: 'note is required'
      });
      return;
    }

    const application = await applicationService.addNote(
      id,
      note,
      'recruiter' // TODO: Get from auth
    );

    res.json({
      success: true,
      message: 'Note added successfully',
      application
    });
  } catch (error: any) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/applications/stats
 * Get application statistics
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await applicationService.getStats();

    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
```

---

### Register Routes

#### Update: `backend/src/server.ts`

```typescript
// Add this import at the top
import matchingRoutes from './routes/matchingRoutes';
import applicationRoutes from './routes/applicationRoutes';

// Add these routes after existing routes
app.use('/api/matching', matchingRoutes);
app.use('/api/applications', applicationRoutes);
```

---

## Testing Strategy

### Unit Tests

#### Test: Matching Algorithm
```typescript
// backend/tests/matchingService.test.ts
import matchingService from '../src/services/matchingService';

describe('MatchingService', () => {
  describe('calculateSkillScore', () => {
    it('should give full points for perfect skill match', () => {
      const job = {
        requiredSkills: ['React', 'Node.js', 'TypeScript'],
        niceToHaveSkills: []
      };

      const candidate = {
        skills: {
          primary: ['React', 'Node.js', 'TypeScript'],
          frameworks: [],
          databases: [],
          cloudPlatforms: []
        }
      };

      const result = matchingService.calculateSkillScore(job, candidate);
      expect(result.score).toBe(35); // 100% match = 35 points
      expect(result.matchedSkills).toHaveLength(3);
      expect(result.missingSkills).toHaveLength(0);
    });

    it('should penalize missing skills', () => {
      const job = {
        requiredSkills: ['React', 'Node.js', 'TypeScript', 'AWS'],
        niceToHaveSkills: []
      };

      const candidate = {
        skills: {
          primary: ['React', 'Node.js'],
          frameworks: [],
          databases: [],
          cloudPlatforms: []
        }
      };

      const result = matchingService.calculateSkillScore(job, candidate);
      expect(result.score).toBeLessThan(35);
      expect(result.matchedSkills).toHaveLength(2);
      expect(result.missingSkills).toContain('TypeScript');
      expect(result.missingSkills).toContain('AWS');
    });
  });

  // Add more tests for experience, location, etc.
});
```

---

### Integration Tests

```typescript
// backend/tests/matching.integration.test.ts
import request from 'supertest';
import app from '../src/server';
import mongoose from 'mongoose';

describe('Matching API Integration', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect('mongodb://localhost:27017/ats_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should return matching candidates for a job', async () => {
    const response = await request(app)
      .get('/api/matching/job/someJobId/candidates')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.matches).toBeInstanceOf(Array);
    expect(response.body.matches[0]).toHaveProperty('matchScore');
  });
});
```

---

### Manual Test Scenarios

#### Scenario 1: End-to-End Matching Flow
1. **Setup**: Have 5+ candidates in database with varying skills
2. **Action**: Create a Ceipal job with specific skill requirements
3. **Test**: Navigate to job → Click "View Matching Candidates"
4. **Verify**:
   - Top candidate has 80%+ match score
   - Skills are correctly color-coded (green/red)
   - Experience gap is accurately calculated

#### Scenario 2: Application Submission
1. **Setup**: Navigate to matching candidates page
2. **Action**: Click "Submit to Job" on top candidate
3. **Verify**:
   - Confirmation modal appears with correct details
   - Success message shows after submission
   - Application appears in tracker dashboard
   - Cannot submit same candidate again (duplicate prevention)

---

## Success Metrics

### Phase 1 KPIs (Measure After 2 Weeks)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Adoption Rate** | 80% of recruiters use matching feature | Log "View Matching Candidates" clicks |
| **Time to Shortlist** | < 2 minutes average | Track time from job view to first submission |
| **Match Accuracy** | 75% recruiter satisfaction | Weekly survey: "Were matched candidates relevant?" |
| **Submissions per Week** | 50+ applications | Count Application documents created |
| **Feature Usage** | 5+ job matches viewed per recruiter/day | Analytics dashboard |

### User Feedback Questions (Weekly Survey)
1. "On a scale of 1-10, how relevant were the matched candidates?"
2. "Did the matching feature save you time? (Yes/No)"
3. "What would make the matching better?"
4. "Any candidates you submitted that were poor matches? Why?"

---

## Deployment Plan

### Phase 1.1 Deployment (Week 2)

#### Pre-Deployment Checklist
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing complete
- [ ] Code reviewed by senior developer
- [ ] Database indexes added
- [ ] API documentation updated

#### Deployment Steps
1. **Database Migration** (5 minutes)
   ```bash
   # No schema changes needed - UnifiedJob and RecruiterResume already exist
   # Just verify indexes
   mongo ats_resume_optimizer
   db.unified_jobs.getIndexes()
   db.recruiter_resumes.getIndexes()
   ```

2. **Backend Deployment** (10 minutes)
   ```bash
   cd backend
   npm install
   npm run build
   pm2 restart ats-backend
   ```

3. **Frontend Deployment** (5 minutes)
   ```bash
   cd frontend
   npm install
   npm run build
   # Deploy build folder to hosting
   ```

4. **Smoke Tests** (5 minutes)
   - Load CeipalJobs page → Click "View Matching Candidates"
   - Verify results load
   - Check console for errors

---

### Phase 1.2 Deployment (Week 4)

#### Pre-Deployment Checklist
- [ ] Application model created
- [ ] Application routes tested
- [ ] Duplicate prevention working
- [ ] UI tested on mobile
- [ ] Export feature tested

#### Deployment Steps
1. **Database Migration**
   ```bash
   # Application collection will be created automatically
   # Verify indexes after first application
   ```

2. **Deploy Backend** (same as above)

3. **Deploy Frontend** (same as above)

4. **Monitor for 24 Hours**
   - Watch error logs
   - Check database performance
   - Gather initial user feedback

---

## Rollback Plan

If critical issues occur:

1. **Frontend Rollback** (2 minutes)
   ```bash
   # Redeploy previous version
   git checkout previous-release-tag
   npm run build
   # Deploy
   ```

2. **Backend Rollback** (3 minutes)
   ```bash
   pm2 stop ats-backend
   git checkout previous-release-tag
   npm run build
   pm2 start ats-backend
   ```

3. **Database Rollback**
   - No data loss: new collections don't affect existing data
   - If needed: drop applications collection
   - Restore from backup if corruption occurs

---

## Post-Launch Monitoring

### Week 1 After Launch
- **Daily**: Check error logs, user feedback
- **Metrics**: Track KPIs in spreadsheet
- **Hotfixes**: Be ready to deploy fixes within 4 hours

### Week 2-4
- **Weekly**: Review KPIs with team
- **User Interviews**: Talk to 3-5 recruiters
- **Adjustments**: Tune matching algorithm weights based on feedback

---

## Next Steps (After Phase 1)

Once Phase 1 is stable:
1. **Plan Phase 2**: Real Ceipal API integration
2. **Gather Feedback**: What features do recruiters want most?
3. **Optimize**: Improve algorithm based on recruiter satisfaction data
4. **Scale**: Add pagination if candidate pool grows > 1000

---

## Appendix

### A. Sample Test Data

#### Sample Job
```json
{
  "title": "Senior Full Stack Developer",
  "company": "TechCorp",
  "requiredSkills": ["React", "Node.js", "TypeScript", "AWS"],
  "experienceYears": { "min": 5, "max": 8 },
  "experienceLevel": "Senior",
  "location": "San Francisco, CA",
  "locationType": "hybrid",
  "salaryRange": { "min": 130000, "max": 160000, "currency": "USD" }
}
```

#### Sample Candidate (High Match)
```json
{
  "personalInfo": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "location": "San Francisco, CA"
  },
  "skills": {
    "primary": ["React", "Node.js", "TypeScript"],
    "cloudPlatforms": ["AWS", "Docker"]
  },
  "professionalDetails": {
    "totalExperience": 6
  }
}
```
Expected Match Score: ~88%

---

### B. Glossary

- **Match Score**: Numerical value (0-100) indicating candidate-job fit
- **Recruiter Resume**: Candidate resume in the recruiter's database
- **Unified Job**: Job from any source (Ceipal, manual, email) in standardized format
- **Application**: Record of submitting a candidate to a job
- **Status History**: Audit trail of application status changes

---

### C. FAQ

**Q: What if a candidate has skills not listed in our database?**
A: The matching algorithm only considers skills present in both job and candidate records. Recruiters should ensure candidate skills are well-captured during resume parsing.

**Q: Can recruiters adjust match score weights?**
A: Phase 1 uses fixed weights. Phase 3 will add configurable weights in settings.

**Q: What happens if a job is deleted after submission?**
A: Application retains job snapshot (title, company) so data isn't lost.

**Q: How are salary expectations handled if not provided?**
A: Algorithm gives neutral score (5/10 points) if either party doesn't provide salary data.

---

**Document Version**: 1.0
**Last Updated**: October 15, 2025
**Owner**: Product Team
**Reviewers**: Engineering Lead, Recruiter Team Lead

---

*End of Phase 1 Documentation*
