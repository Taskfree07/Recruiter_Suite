# Demo Setup Guide - ATS Resume Optimizer

This guide will help you set up and use the demo features, including demo candidates and the Ceipal integration.

## 📋 Table of Contents

1. [Demo Candidates Setup](#demo-candidates-setup)
2. [Ceipal Integration (Mock vs Real API)](#ceipal-integration)
3. [Matching Candidates with Jobs](#matching-candidates-with-jobs)
4. [Switching to Production](#switching-to-production)

---

## 🎭 Demo Candidates Setup

The system comes with 6 pre-configured demo candidate resumes covering various roles:

### Demo Candidates

1. **Sarah Chen** - Senior Full Stack Developer (7 years)
   - Skills: React, Node.js, Python, AWS, MongoDB, TypeScript
   - Location: San Francisco, CA

2. **Michael Johnson** - Senior Java Backend Developer (8 years)
   - Skills: Java, Spring Boot, Microservices, PostgreSQL, Kafka, AWS
   - Location: Austin, TX

3. **Priya Patel** - Frontend Developer (5 years)
   - Skills: React, Next.js, TypeScript, Tailwind CSS, React Native
   - Location: Seattle, WA

4. **David Martinez** - Machine Learning Engineer (6 years)
   - Skills: Python, TensorFlow, PyTorch, NLP, Computer Vision, AWS
   - Location: Boston, MA

5. **Emily Wong** - DevOps Engineer (7 years)
   - Skills: AWS, Kubernetes, Docker, Terraform, CI/CD, Prometheus
   - Location: Denver, CO

6. **Alex Kumar** - Junior Full Stack Developer (2 years)
   - Skills: JavaScript, React, Node.js, MongoDB, HTML, CSS
   - Location: Chicago, IL

7. **Jennifer Lee** - QA Automation Engineer (5 years)
   - Skills: Selenium, Java, TestNG, Cypress, Jenkins, API Testing
   - Location: New York, NY

### Loading Demo Candidates

**Method 1: Simulate Email Fetch (Recommended)**

1. Navigate to **Candidate Database** page (`/candidate-database`)
2. Click **"Simulate Email Fetch"** button
3. System will automatically:
   - Read all resume files from `backend/demo-resumes/` folder
   - Parse each resume and extract information
   - Assign realistic received dates (distributed across last 30 days)
   - Calculate quality scores
   - Store in database

**Method 2: Manual Upload**

1. Navigate to **Candidate Database** page
2. Click **"Upload Resumes"** button
3. Select source type (Email, Portal, or Manual)
4. Choose resume files from `backend/demo-resumes/` folder
5. Click **"Upload Resumes"**

### Viewing Candidates

- Go to **Candidate Database** page
- Use filters to search by:
  - Source (Email, Portal, Manual)
  - Status (Active, Shortlisted, Pending Review, Rejected)
  - Experience Level
- Search by name, email, or skills
- Click on any candidate to view full details

---

## 🔌 Ceipal Integration

The system supports both **Mock Mode** (demo) and **Real API Mode** (production).

### Mock Mode (Demo/Testing)

Mock mode is enabled by default and generates realistic demo jobs.

**Features:**
- 10 diverse job postings across different roles
- Realistic job descriptions, requirements, and metadata
- No API credentials required
- Perfect for testing and demos

**Using Mock Mode:**

1. Navigate to **Ceipal Settings** (`/ceipal-settings`)
2. Ensure **"Mock Mode"** toggle is ON (enabled by default)
3. Click **"Test Connection"** - Should show "Connected to Mock Ceipal API"
4. Click **"Sync Jobs Now"** - Fetches 10 demo jobs
5. Go to **Ceipal Jobs** page to view synced jobs

### Real API Mode (Production)

When you have actual Ceipal API credentials, you can switch to real mode.

**Prerequisites:**
- Ceipal API Key
- Ceipal API Base URL
- Active Ceipal ATS account

**Switching to Real API:**

1. Navigate to **Ceipal Settings** (`/ceipal-settings`)
2. Toggle **"Mock Mode"** to OFF
3. Enter your **API URL** (e.g., `https://api.ceipal.com`)
4. Enter your **API Key**
5. Click **"Save Configuration"**
6. Click **"Test Connection"** to verify
7. Click **"Sync Jobs Now"** to fetch real jobs

**Important Notes:**
- The system automatically detects mock vs real mode
- API endpoint: `GET /api/v1/jobs` (adjust if different)
- Authorization: `Bearer {apiKey}` header
- Timeout: 30 seconds
- Error handling included with detailed messages

**Customizing API Integration:**

If Ceipal's API structure differs, update the mapping in:
```
backend/src/services/ceipalService.ts
→ fetchJobsFromCeipalAPI() method
```

Adjust the field mappings based on Ceipal's actual response:
```typescript
{
  title: job.title || job.jobTitle,
  description: job.description || job.jobDescription,
  // ... adjust as needed
}
```

---

## 🎯 Matching Candidates with Jobs

Once you have both candidates and jobs in the system:

### View Matching Candidates

1. Go to **Ceipal Jobs** page
2. Find a job that interests you
3. Click **"View Matching Candidates"** button
4. System automatically:
   - Searches candidate database
   - Calculates match scores based on:
     - Skills match (40 points)
     - Experience match (30 points)
     - Location compatibility (15 points)
     - Salary alignment (15 points)
   - Displays ranked results (minimum 40% match score)

### Match Score Breakdown

Each candidate shows:
- **Overall Match Score**: 0-100%
- **Recommendation**: Excellent / Good / Fair / Poor
- **Matched Skills**: Green badges
- **Missing Skills**: Red badges
- **Experience Gap**: Under/Over qualified indicator
- **Notice Period**: Availability information
- **Source**: Where the resume came from

### Example Workflow

1. Load demo candidates using "Simulate Email Fetch"
2. Sync demo jobs from Ceipal (Mock Mode)
3. Open a "Senior Full Stack Developer" job
4. Click "View Matching Candidates"
5. See Sarah Chen with 85% match (she has React, Node.js, Python, AWS)
6. Review matched/missing skills
7. Click "Submit to Job" (future feature)

---

## 🚀 Switching to Production

### When Ready for Production:

**Step 1: Candidate Database**
- Integrate with real email (Gmail/Outlook) using OAuth
- Connect to actual job portals APIs
- Enable automated resume ingestion

**Step 2: Ceipal Integration**
- Obtain Ceipal API credentials
- Switch Mock Mode OFF in Ceipal Settings
- Configure real API URL and Key
- Test connection and sync

**Step 3: Testing**
- Test connection to Ceipal API
- Sync a few jobs to verify
- Upload/fetch real resumes
- Test matching functionality
- Verify all workflows end-to-end

**Step 4: Monitoring**
- Check logs for errors
- Monitor API rate limits
- Track sync success rates
- Review match quality

---

## 📊 Database Statistics

After loading demo data, you should see:

**Candidate Database:**
- Total Resumes: 6-7
- Distribution across experience levels
- Multiple tech stacks represented
- Various locations

**Ceipal Jobs:**
- Total Jobs: 10
- 8 Open positions
- 2 Filled positions
- Mix of Junior, Mid, Senior, Lead levels

---

## 🐛 Troubleshooting

### Demo Candidates Not Loading

**Issue:** "Simulate Email Fetch" fails
**Solution:**
- Check that `backend/demo-resumes/` folder exists
- Verify resume files are present
- Check backend console logs for parsing errors

### No Matching Candidates Found

**Issue:** "View Matching Candidates" shows zero results
**Solution:**
- Ensure candidates are loaded in database
- Check minimum match threshold (default 40%)
- Verify job has required skills defined
- Try different jobs with varied skill requirements

### Ceipal Sync Fails in Real Mode

**Issue:** "Sync Jobs Now" fails with API error
**Solution:**
- Verify API URL is correct
- Check API Key is valid and not expired
- Ensure network connectivity
- Review Ceipal API documentation for endpoint changes
- Check backend logs for detailed error messages

---

## 📝 Notes

1. **Demo Data Persistence**: Demo data is stored in MongoDB and persists across restarts
2. **Clearing Data**: Use "Clear Database" buttons to reset demo data
3. **Multiple Sources**: You can mix demo and real data seamlessly
4. **Real-time Sync**: Changes in Ceipal reflect after next sync
5. **Match Algorithm**: Continuously improving based on feedback

---

## 🎓 Best Practices

1. **Start with Demo**: Always test with demo data before using real credentials
2. **Regular Syncs**: Sync jobs daily to keep data fresh
3. **Quality Resumes**: Better parsed resumes = better match scores
4. **Skill Standardization**: Use consistent skill names across resumes
5. **Experience Accuracy**: Ensure experience fields are accurate for better matching

---

## 📞 Need Help?

- Check backend console logs for detailed errors
- Review API documentation for Ceipal
- Test with demo mode first
- Verify MongoDB connection
- Check network/firewall settings

---

**Happy Recruiting! 🎉**
