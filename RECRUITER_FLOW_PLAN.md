# Recruiter Flow - Feature Planning Document

## 🎯 Core Objective
Help HRs manage resumes from multiple sources by automatically organizing them based on skills and other criteria, making it easy to find the best candidates for specific job requirements.

## 📊 System Overview

### Phase 1: Resume Collection & Organization (MVP)
Automatically collect, parse, and organize resumes by skills and criteria.

### Phase 2: Smart Ranking & Recommendations
Identify the most powerful/relevant resumes based on multiple factors.

### Phase 3: Client Management Integration
Quick access to top candidates for client requirements.

---

## 🔧 Phase 1: Resume Collection & Organization (MVP)

### 1.1 Resume Import System
**Sources:**
- [ ] Email integration (Gmail, Outlook)
- [ ] Manual upload (drag & drop multiple PDFs)
- [ ] Bulk folder upload
- [ ] LinkedIn integration (future)
- [ ] Job portal integrations (Naukri, Indeed, etc.) (future)

**File Support:**
- PDF (primary)
- DOCX
- DOC
- TXT

### 1.2 Automatic Parsing & Extraction
**Extract from each resume:**
- [ ] Personal Information
  - Name
  - Email
  - Phone
  - Location/City
  - LinkedIn profile
  - Current company

- [ ] Professional Details
  - Years of experience (total)
  - Current job title
  - Current CTC (if mentioned)
  - Expected CTC (if mentioned)
  - Notice period (if mentioned)

- [ ] Skills (Primary categorization)
  - Programming languages (Java, Python, .NET, etc.)
  - Frameworks (React, Angular, Spring, Django, etc.)
  - Databases (MySQL, MongoDB, PostgreSQL, etc.)
  - Cloud platforms (AWS, Azure, GCP)
  - Tools & Technologies
  - Soft skills

- [ ] Experience Breakdown
  - Companies worked at
  - Duration at each company
  - Roles/positions held

- [ ] Education
  - Degree
  - University/College
  - Graduation year
  - CGPA/Percentage (if available)

- [ ] Certifications
  - Professional certifications
  - Online courses

- [ ] Projects (if mentioned)
  - Project titles
  - Technologies used

### 1.3 Skill-Based Categorization
**Primary Skills Categories:**
```
Backend Development
├── Java
├── Python
├── .NET/C#
├── Node.js
├── PHP
├── Ruby
├── Go
└── Rust

Frontend Development
├── React
├── Angular
├── Vue.js
├── HTML/CSS
└── JavaScript/TypeScript

Full Stack
├── MERN Stack
├── MEAN Stack
├── Java Full Stack
└── .NET Full Stack

Mobile Development
├── React Native
├── Flutter
├── iOS (Swift)
└── Android (Kotlin/Java)

Data & AI
├── Data Science
├── Machine Learning
├── Data Engineering
├── Python (Data Analysis)
└── Big Data

DevOps & Cloud
├── AWS
├── Azure
├── GCP
├── Docker/Kubernetes
└── CI/CD

QA & Testing
├── Manual Testing
├── Automation Testing
├── Selenium
└── Performance Testing

Database
├── SQL Databases
├── NoSQL Databases
└── Database Administration

Other
├── UI/UX Design
├── Product Management
├── Business Analysis
└── Uncategorized
```

### 1.4 Additional Filter Criteria
**Filters to implement:**
- [ ] Experience range (0-2, 2-5, 5-10, 10+ years)
- [ ] Location/City
- [ ] Current company type (MNC, Startup, Product, Service)
- [ ] Education qualification (B.Tech, M.Tech, MCA, etc.)
- [ ] Notice period (Immediate, 15 days, 30 days, etc.)
- [ ] CTC range (if available)
- [ ] Availability status (Actively looking, Open to offers)
- [ ] Date received (Last 7 days, Last 30 days, Last 3 months, etc.)
- [ ] Resume freshness score

### 1.5 Organization Structure
**Folder/Section View:**
```
Skills-Based Sections
├── Java Developers (45 resumes)
│   ├── Junior (0-2 years) - 12 resumes
│   ├── Mid-Level (2-5 years) - 20 resumes
│   └── Senior (5+ years) - 13 resumes
│
├── Python Developers (38 resumes)
│   ├── Data Science focused - 15 resumes
│   ├── Backend focused - 18 resumes
│   └── Full Stack - 5 resumes
│
├── React Developers (32 resumes)
└── ...

Recent Uploads (Last 7 days)
├── Today - 5 resumes
├── Yesterday - 8 resumes
└── This Week - 23 resumes

Unprocessed/Pending
└── Resumes pending categorization - 3 resumes
```

---

## 🌟 Phase 2: Smart Ranking & Recommendations

### 2.1 Resume Scoring System
**Scoring criteria (0-100):**
- [ ] Skill match relevance (40%)
  - Primary skills match
  - Secondary skills match
  - Technology stack alignment

- [ ] Experience quality (25%)
  - Total years of experience
  - Relevant experience
  - Company reputation (MNC > Product > Service)
  - Project complexity

- [ ] Education & Certifications (15%)
  - Degree relevance
  - College/University tier
  - Professional certifications

- [ ] Resume freshness (10%)
  - When resume was received
  - Last updated date (if mentioned)
  - Current employment status

- [ ] Communication quality (10%)
  - Resume formatting
  - Grammar and language
  - Completeness of information

### 2.2 "Most Powerful Resume" Feature
**Identify top candidates based on:**
- [ ] Highest overall score in category
- [ ] Latest resumes (received in last 7-30 days)
- [ ] Best company background (current/previous)
- [ ] Quick filters:
  - Top 10 in each skill category
  - Hidden gems (good candidates with less common skill combinations)
  - Ready to join (immediate joiners with high scores)

### 2.3 Smart Recommendations
- [ ] "Best Match for [Client Requirement]" - Auto-suggest top 5-10 candidates
- [ ] "Trending Skills" - Show skills that are appearing frequently in recent resumes
- [ ] "Quick Hire" - Candidates with immediate availability + high scores
- [ ] "Premium Profiles" - Candidates from top companies (FAANG, MNCs)

---

## 📧 Phase 3: Email/Source Integration Details

### 3.1 Email Integration
**Gmail Integration (Priority):**
- [ ] OAuth authentication
- [ ] Auto-fetch resumes from specific labels/folders
- [ ] Extract resume attachments (PDF, DOCX)
- [ ] Parse email metadata:
  - Sender email
  - Subject line (may contain job title/skills)
  - Email body (may contain candidate info)
  - Timestamp

**Outlook Integration:**
- [ ] Similar to Gmail integration
- [ ] Microsoft Graph API

### 3.2 Resume Metadata Storage
**Store for each resume:**
```json
{
  "resumeId": "unique_id",
  "fileName": "John_Doe_Resume.pdf",
  "source": "email", // email, manual_upload, portal
  "sourceDetails": {
    "email": "sender@example.com",
    "subject": "Application for Java Developer",
    "receivedDate": "2025-01-15T10:30:00Z",
    "emailBody": "Excerpt..."
  },
  "parsedData": {
    "personalInfo": {...},
    "skills": [...],
    "experience": [...],
    "education": [...]
  },
  "categorization": {
    "primarySkills": ["Java", "Spring Boot"],
    "experienceLevel": "mid-level",
    "location": "Bangalore"
  },
  "scores": {
    "overall": 85,
    "skillMatch": 90,
    "experienceQuality": 80,
    "freshness": 95
  },
  "status": "active", // active, archived, shortlisted
  "tags": ["java", "microservices", "aws"],
  "uploadedAt": "2025-01-15T10:35:00Z",
  "lastUpdated": "2025-01-15T10:35:00Z"
}
```

---

## 🎨 UI/UX Design

### Dashboard View
```
┌─────────────────────────────────────────────────────────────┐
│  📊 Recruiter Flow Dashboard                    [+ Upload]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📈 Quick Stats                                              │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │ Total    │ This     │ Pending  │ Top      │             │
│  │ Resumes  │ Week     │ Review   │ Rated    │             │
│  │  1,234   │   45     │    12    │   156    │             │
│  └──────────┴──────────┴──────────┴──────────┘             │
│                                                               │
│  🔍 Search & Filters                      [Advanced Filters] │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🔎 Search by name, skills, company...                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  Skills: [All] [Java] [Python] [React] [.NET] [+12 more]    │
│  Experience: [All] [0-2] [2-5] [5-10] [10+]                 │
│  Recency: [All Time] [Last 7 days] [Last 30 days]          │
│                                                               │
│  📂 Skill Categories                          Sort by: [⬇️Latest] │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ☕ Java Developers                              45 ➡️   ││
│  │    Latest: 2 hours ago  |  Avg Score: 78/100           ││
│  │    Top: Rahul Kumar (92) | Priya Singh (89)            ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 🐍 Python Developers                            38 ➡️   ││
│  │    Latest: 5 hours ago  |  Avg Score: 82/100           ││
│  │    Top: Amit Sharma (95) | Sneha Reddy (91)            ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ ⚛️ React Developers                             32 ➡️   ││
│  │    Latest: 1 day ago    |  Avg Score: 75/100           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  🌟 Recommended Actions                                      │
│  • Review 12 new resumes from this week                     │
│  • Top Java candidate available (immediate joiner)          │
│  • 5 premium profiles from top MNCs received                │
└─────────────────────────────────────────────────────────────┘
```

### Skill Category Detail View
```
┌─────────────────────────────────────────────────────────────┐
│  ⬅️ Back     ☕ Java Developers (45 resumes)                 │
├─────────────────────────────────────────────────────────────┤
│  Filters: Experience [All ▼] | Location [All ▼] | Sort [Score ▼] │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🟢 Rahul Kumar                               Score: 92   ││
│  │ 📧 rahul.k@email.com | 📞 +91-9876543210               ││
│  │ 📍 Bangalore | 💼 5 years exp | 🏢 TCS                  ││
│  │ Skills: Java, Spring Boot, Microservices, AWS, Docker   ││
│  │ Received: 2 hours ago | Source: recruiter@agency.com   ││
│  │ [View Resume] [Shortlist] [Email] [Schedule Interview]  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🟢 Priya Singh                               Score: 89   ││
│  │ 📧 priya.singh@email.com | 📞 +91-9876543211          ││
│  │ 📍 Pune | 💼 4 years exp | 🏢 Infosys                  ││
│  │ Skills: Java, Spring, Hibernate, MySQL, Kafka          ││
│  │ Received: 5 hours ago | Source: hr@company.com         ││
│  │ [View Resume] [Shortlist] [Email] [Schedule Interview]  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Resume Detail View (Modal/Side Panel)
```
┌─────────────────────────────────────────────────────────────┐
│  Rahul Kumar's Resume                              [✕ Close] │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┬──────────────────────────────────────────┐│
│  │              │  📊 Quick Info                           ││
│  │              │  Overall Score: 92/100                   ││
│  │              │  ━━━━━━━━━━━━━━━━━━━━ 92%              ││
│  │              │                                          ││
│  │  [PDF        │  Skill Match:      95/100 ████████████  ││
│  │   Preview]   │  Experience:       90/100 ████████████  ││
│  │              │  Education:        88/100 ████████████  ││
│  │              │  Freshness:        98/100 ████████████  ││
│  │              │                                          ││
│  │              │  📞 Contact Details                      ││
│  │              │  Email: rahul.k@email.com               ││
│  │              │  Phone: +91-9876543210                  ││
│  │              │  Location: Bangalore                    ││
│  │              │  LinkedIn: linkedin.com/in/rahulk       ││
│  │              │                                          ││
│  │              │  💼 Experience: 5 years                 ││
│  │              │  🏢 Current: Senior Developer @ TCS     ││
│  │              │  🎓 Education: B.Tech CSE               ││
│  │              │  📍 Preferred Locations: Bangalore, Pune││
│  │              │                                          ││
│  │              │  🔧 Top Skills                          ││
│  │              │  Java, Spring Boot, Microservices       ││
│  │              │  AWS, Docker, Kubernetes                ││
│  │              │                                          ││
│  │              │  📧 Received From                        ││
│  │              │  recruiter@agency.com                   ││
│  │              │  Subject: "Java Developer - 5 Yrs Exp"  ││
│  │              │  Date: Jan 15, 2025 10:30 AM           ││
│  │              │                                          ││
│  │              │  [Download PDF] [Shortlist] [Reject]    ││
│  └──────────────┴──────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Technical Architecture

### Database Schema

**Collections/Tables:**

1. **resumes**
   - resume_id (PK)
   - file_name
   - file_path
   - file_url
   - source_type (email, manual, portal)
   - source_metadata (JSON)
   - parsed_data (JSON)
   - created_at
   - updated_at

2. **candidates** (extracted from resumes)
   - candidate_id (PK)
   - name
   - email (unique)
   - phone
   - current_company
   - total_experience
   - current_location
   - linkedin_url
   - status (active, archived, hired)
   - created_at
   - updated_at

3. **skills**
   - skill_id (PK)
   - skill_name
   - category (backend, frontend, database, etc.)
   - created_at

4. **resume_skills** (many-to-many)
   - resume_id (FK)
   - skill_id (FK)
   - proficiency_level (beginner, intermediate, expert) - optional
   - years_of_experience - optional

5. **resume_scores**
   - score_id (PK)
   - resume_id (FK)
   - overall_score
   - skill_match_score
   - experience_score
   - education_score
   - freshness_score
   - calculated_at

6. **email_sources** (for email integration)
   - source_id (PK)
   - email_account
   - provider (gmail, outlook)
   - access_token (encrypted)
   - refresh_token (encrypted)
   - last_sync_at
   - sync_frequency
   - filters (JSON - labels, folders to monitor)

### API Endpoints

**Resume Management:**
```
POST   /api/recruiter/resumes/upload          - Upload single/multiple resumes
POST   /api/recruiter/resumes/bulk-upload     - Bulk folder upload
GET    /api/recruiter/resumes                 - Get all resumes (with filters)
GET    /api/recruiter/resumes/:id             - Get single resume details
DELETE /api/recruiter/resumes/:id             - Delete resume
PATCH  /api/recruiter/resumes/:id/status      - Update resume status

POST   /api/recruiter/resumes/parse           - Trigger parsing for uploaded resume
```

**Skill Categories:**
```
GET    /api/recruiter/skills                  - Get all skill categories
GET    /api/recruiter/skills/:skill/resumes   - Get resumes by skill
GET    /api/recruiter/skills/stats            - Get resume counts per skill
```

**Search & Filters:**
```
POST   /api/recruiter/search                  - Advanced search
GET    /api/recruiter/filter                  - Get filtered resumes
```

**Recommendations:**
```
GET    /api/recruiter/top-candidates          - Get top-ranked candidates
GET    /api/recruiter/recommendations         - Get smart recommendations
```

**Email Integration:**
```
POST   /api/recruiter/email/connect           - Connect email account
POST   /api/recruiter/email/sync              - Trigger email sync
GET    /api/recruiter/email/status            - Check sync status
```

**Analytics:**
```
GET    /api/recruiter/stats                   - Dashboard statistics
GET    /api/recruiter/trends                  - Skill trends over time
```

---

## 📅 Implementation Phases

### Phase 1: Core Functionality (Week 1-2)
- [ ] Manual resume upload (single + bulk)
- [ ] PDF parsing (using existing parserService)
- [ ] Skill extraction and categorization
- [ ] Basic skill-based folder view
- [ ] Resume list view with filters
- [ ] Resume detail view with PDF preview

### Phase 2: Enhanced Features (Week 3-4)
- [ ] Advanced filters (experience, location, etc.)
- [ ] Resume scoring system
- [ ] Search functionality
- [ ] Top candidates feature
- [ ] Export/download filtered resumes
- [ ] Bulk actions (archive, delete, shortlist)

### Phase 3: Email Integration (Week 5-6)
- [ ] Gmail OAuth integration
- [ ] Auto-fetch resumes from email
- [ ] Email metadata extraction
- [ ] Scheduled sync
- [ ] Notification system for new resumes

### Phase 4: Smart Recommendations (Week 7-8)
- [ ] ML-based scoring improvements
- [ ] Smart candidate recommendations
- [ ] Trending skills analytics
- [ ] Quick hire suggestions
- [ ] Client requirement matching

---

## 🎯 Success Metrics

**Quantitative:**
- Time saved in resume screening (target: 60% reduction)
- Accuracy of skill categorization (target: 90%+)
- Resume processing speed (target: < 10 seconds per resume)
- User adoption rate

**Qualitative:**
- HR satisfaction with organization system
- Ease of finding relevant candidates
- Quality of recommended candidates
- Overall system usability

---

## 🚀 Next Steps

1. ✅ Create this planning document
2. Review and finalize feature priorities
3. Set up database schema
4. Implement Phase 1 core features
5. Build UI components
6. Test with sample resumes
7. Iterate based on feedback

---

## 💡 Future Enhancements

- [ ] WhatsApp integration (receive resumes)
- [ ] LinkedIn profile scraping
- [ ] Video interview links integration
- [ ] Candidate communication history
- [ ] Team collaboration features (notes, tags, assignments)
- [ ] Client portal (let clients view shortlisted candidates)
- [ ] Mobile app for on-the-go access
- [ ] AI chatbot for candidate queries
- [ ] Automated email responses to candidates
- [ ] Integration with HRMS systems

---

**Document Version:** 1.0
**Created:** January 2025
**Last Updated:** January 2025
