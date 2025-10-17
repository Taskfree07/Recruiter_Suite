# Phase 1 Quick Start Guide

**Get matching and applications working in 4 days**

---

## Day 1: Setup & Matching Backend (Epic 1.1 - Backend)

### Morning (3 hours): Create Matching Service

**Step 1**: Create the matching service file
```bash
cd backend/src/services
touch matchingService.ts
```

**Step 2**: Implement basic matching algorithm
- Copy the `MatchingService` class from the full documentation
- Start with **skill matching only** (simplest version)
- Test with console.log to verify it works

**Step 3**: Test manually
```typescript
// In a test file or node REPL
const job = { requiredSkills: ['React', 'Node.js'] };
const candidate = { skills: { primary: ['React', 'Vue'] } };
const score = matchingService.calculateMatchScore(job, candidate);
console.log(score); // Should show ~50% match
```

### Afternoon (3 hours): Create Matching Routes

**Step 4**: Create routes file
```bash
cd backend/src/routes
touch matchingRoutes.ts
```

**Step 5**: Add one endpoint
```typescript
// matchingRoutes.ts
router.get('/job/:jobId/candidates', async (req, res) => {
  const { jobId } = req.params;
  const matches = await matchingService.findMatchingCandidates(jobId);
  res.json({ success: true, matches });
});
```

**Step 6**: Register routes in server.ts
```typescript
import matchingRoutes from './routes/matchingRoutes';
app.use('/api/matching', matchingRoutes);
```

**Step 7**: Test with curl
```bash
curl http://localhost:5000/api/matching/job/YOUR_JOB_ID/candidates
```

**✅ Day 1 Done**: Backend can find matching candidates!

---

## Day 2: Matching Frontend (Epic 1.1 - Frontend)

### Morning (3 hours): Create Match Results Page

**Step 1**: Create new page
```bash
cd frontend/src/pages
touch JobCandidateMatch.tsx
```

**Step 2**: Copy the boilerplate from documentation
- Just the basic structure
- Display candidate name and match score only
- Don't worry about fancy UI yet

**Step 3**: Add route
```typescript
// App.tsx
import JobCandidateMatch from './pages/JobCandidateMatch';
<Route path="/job/:jobId/candidates" element={<JobCandidateMatch />} />
```

### Afternoon (3 hours): Connect Button on Jobs Page

**Step 4**: Add button to CeipalJobs.tsx
```typescript
// On each job card, add:
<button onClick={() => navigate(`/job/${job._id}/candidates`)}>
  View Matching Candidates
</button>
```

**Step 5**: Test the flow
1. Go to /ceipal-jobs
2. Click "View Matching Candidates"
3. See list of candidates with scores

**Step 6**: Polish UI
- Add match score badges (green for 80+, yellow for 60+)
- Show matched skills
- Add loading spinner

**✅ Day 2 Done**: Recruiters can see matching candidates!

---

## Day 3: Application Backend (Epic 1.2 - Backend)

### Morning (2 hours): Create Application Model

**Step 1**: Create model file
```bash
cd backend/src/models
touch application.ts
```

**Step 2**: Copy the Application schema from documentation

**Step 3**: Create indexes
```typescript
// In MongoDB shell or Compass
db.applications.createIndex({ jobId: 1, candidateId: 1 }, { unique: true })
```

### Afternoon (4 hours): Create Application Service & Routes

**Step 4**: Create service
```bash
cd backend/src/services
touch applicationService.ts
```

**Step 5**: Implement 3 key methods
1. `submitApplication()` - Create new application
2. `getApplications()` - List all applications
3. `updateStatus()` - Change application status

**Step 6**: Create routes
```bash
cd backend/src/routes
touch applicationRoutes.ts
```

**Step 7**: Add 3 endpoints
- POST /api/applications
- GET /api/applications
- PUT /api/applications/:id/status

**Step 8**: Register routes
```typescript
// server.ts
import applicationRoutes from './routes/applicationRoutes';
app.use('/api/applications', applicationRoutes);
```

**Step 9**: Test with curl
```bash
# Submit application
curl -X POST http://localhost:5000/api/applications \
  -H "Content-Type: application/json" \
  -d '{"jobId":"XXX","candidateId":"YYY","notes":"Great match!"}'

# Get applications
curl http://localhost:5000/api/applications
```

**✅ Day 3 Done**: Backend can track applications!

---

## Day 4: Application Frontend (Epic 1.2 - Frontend)

### Morning (3 hours): Add Submit Button

**Step 1**: Update JobCandidateMatch.tsx
```typescript
const handleSubmit = async (candidateId: string) => {
  try {
    await axios.post(`${API_URL}/applications`, {
      jobId,
      candidateId,
      notes: 'Submitted via matching'
    });
    alert('Candidate submitted successfully!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

// Add button to each candidate card
<button onClick={() => handleSubmit(candidate._id)}>
  Submit to Job
</button>
```

**Step 2**: Add duplicate prevention
```typescript
// Check if already submitted
const [submittedIds, setSubmittedIds] = useState<string[]>([]);

useEffect(() => {
  // Fetch existing applications for this job
  axios.get(`${API_URL}/applications?jobId=${jobId}`)
    .then(res => {
      const ids = res.data.applications.map(app => app.candidateId);
      setSubmittedIds(ids);
    });
}, [jobId]);

// In button
<button
  disabled={submittedIds.includes(candidate._id)}
  onClick={() => handleSubmit(candidate._id)}
>
  {submittedIds.includes(candidate._id) ? 'Already Submitted' : 'Submit to Job'}
</button>
```

### Afternoon (3 hours): Create Application Tracker Page

**Step 3**: Create tracker page
```bash
cd frontend/src/pages
touch ApplicationTracker.tsx
```

**Step 4**: Basic implementation
```typescript
const ApplicationTracker = () => {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/applications`)
      .then(res => setApplications(res.data.applications));
  }, []);

  return (
    <div>
      <h1>Application Tracker</h1>
      <table>
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Job</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {applications.map(app => (
            <tr key={app._id}>
              <td>{app.candidateSnapshot.name}</td>
              <td>{app.jobSnapshot.title}</td>
              <td>{app.status}</td>
              <td>{new Date(app.submittedDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

**Step 5**: Add route
```typescript
// App.tsx
import ApplicationTracker from './pages/ApplicationTracker';
<Route path="/applications" element={<ApplicationTracker />} />
```

**Step 6**: Add navigation link
- Add "Applications" button to header/nav
- Link to /applications

**✅ Day 4 Done**: Full Phase 1 is working!

---

## Testing Checklist

After Day 4, test this flow end-to-end:

1. **[ ]** Go to Ceipal Jobs page
2. **[ ]** Click "View Matching Candidates" on any job
3. **[ ]** See list of candidates with match scores
4. **[ ]** Verify top candidate has highest score
5. **[ ]** Check that matched skills are shown in green
6. **[ ]** Click "Submit to Job" on top candidate
7. **[ ]** See success message
8. **[ ]** Go to Applications page
9. **[ ]** See your submission in the list
10. **[ ]** Try to submit same candidate again → should show "Already Submitted"

---

## Common Issues & Fixes

### Issue 1: "No candidates returned"
**Fix**: Check that you have candidates in recruiter_resumes collection
```bash
mongo ats_resume_optimizer
db.recruiter_resumes.count()
```

### Issue 2: "Match score is always 0"
**Fix**: Verify candidate has skills in correct format
```javascript
// Correct format:
candidate.skills = {
  primary: ['React', 'Node.js'],
  frameworks: ['Express'],
  databases: ['MongoDB'],
  cloudPlatforms: ['AWS']
}
```

### Issue 3: "Cannot submit application - duplicate error"
**Fix**: This is correct behavior! Check Applications page - it's already submitted.

### Issue 4: "Route not found"
**Fix**: Verify you registered routes in server.ts
```typescript
app.use('/api/matching', matchingRoutes);
app.use('/api/applications', applicationRoutes);
```

---

## Performance Tips

1. **Add indexes** (do this on Day 3)
```javascript
db.applications.createIndex({ jobId: 1 });
db.applications.createIndex({ candidateId: 1 });
db.applications.createIndex({ status: 1 });
```

2. **Limit candidate query** (if you have 500+ candidates)
```typescript
// In matchingService.ts
const candidates = await RecruiterResume.find()
  .limit(100)  // Only check first 100
  .select('personalInfo skills professionalDetails'); // Only fetch needed fields
```

3. **Cache job data** (if same job checked multiple times)
```typescript
// Add simple in-memory cache
const jobCache = new Map();
```

---

## What to Demo to Stakeholders

After Day 4, show this:

1. **Problem**: "Before, we had jobs but no way to find candidates"
2. **Solution**: Click through the matching flow
3. **Impact**: "Now we can shortlist 10 candidates in 30 seconds vs. 1 hour manually"
4. **Metrics**: Show applications dashboard with 5+ submissions

---

## Next Steps (After Phase 1 Works)

### Week 2 (Polish)
- [ ] Add filters to matching page (experience level, location)
- [ ] Add status dropdown to applications page
- [ ] Export applications to Excel

### Week 3 (Optimization)
- [ ] Tune matching algorithm based on recruiter feedback
- [ ] Add "Why this score?" explanation
- [ ] Improve matching speed (caching, indexes)

### Week 4 (Prepare Phase 2)
- [ ] Research Ceipal API documentation
- [ ] Get API credentials from Ceipal admin
- [ ] Plan bidirectional sync

---

## Emergency Contacts

If you get stuck:
1. Check full documentation: `docs/CEIPAL_PHASE_1_DOCUMENTATION.md`
2. Review API specs in documentation
3. Check example code in documentation

---

## Success Criteria

Phase 1 is **DONE** when:
- ✅ Matching endpoint returns candidates sorted by score
- ✅ Match scores are logical (high skill match = high score)
- ✅ Submit button creates application in database
- ✅ Applications page shows all submissions
- ✅ Duplicate prevention works
- ✅ 3 recruiters successfully submit candidates using the system

---

**Good luck! Remember: Start simple, test often, iterate based on feedback.**

**Questions?** Review the full Phase 1 documentation for detailed specs.
