# 🎭 Outlook Integration - Demo Mode

## Quick Start (No Azure AD Required!)

Test the **full Outlook email integration** immediately without any Azure AD setup. Perfect for demos, testing, and understanding the feature before going live.

---

## What is Demo Mode?

Demo Mode simulates the complete Outlook email fetching and AI parsing workflow using **realistic pre-generated email data**. No Azure AD app registration needed!

### Features in Demo Mode:
- ✅ **4 Realistic Job Description Emails** (various roles and companies)
- ✅ **2 Resume Application Emails** (simulated candidates)
- ✅ **Full AI Parsing** (Hugging Face Mistral-7B extracts job details)
- ✅ **All UI Features** (Connect, Sync, Disconnect buttons)
- ✅ **Visual Demo Indicator** (Amber/orange buttons and badges)
- ✅ **No External APIs** (works offline except for AI model)

---

## How to Use Demo Mode

### Step 1: Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Step 2: Navigate to Recruiter Dashboard

Open browser: `http://localhost:3000/recruiter-dashboard`

### Step 3: Connect in Demo Mode

1. Click the **"Connect Outlook"** button (indigo color)
2. You'll see a popup: **"🎭 Demo Mode Available"**
3. Click **OK** to use Demo Mode
4. Success message appears: **"🎭 Demo Mode Connected!"**
5. Button changes to **"Sync Demo"** (amber color)

### Step 4: Sync Demo Emails

1. Click **"Sync Demo"** button (amber/orange color)
2. Watch the spinner animation
3. Success alert shows:
   ```
   ✅ Email Sync Complete!
   🎭 Demo Mode - Simulated Data

   Jobs Found: 4
   Resumes Found: 2

   No errors!
   ```

### Step 5: View Results

- **Dashboard stats** updated with new counts
- **Candidates list** shows processed resumes
- **AI extracted jobs** ready for matching

---

## Demo Emails Included

### 📧 Job Description Emails (4)

#### 1. **Senior Full Stack Developer**
- **Company:** TechCorp Inc
- **Location:** San Francisco, CA (Hybrid)
- **Salary:** $140,000 - $170,000
- **Skills:** JavaScript, TypeScript, React, Node.js, AWS, PostgreSQL
- **Experience:** 5+ years
- **Received:** 2 hours ago (simulated)

#### 2. **Python Data Scientist**
- **Company:** DataAI Solutions
- **Location:** Remote
- **Salary:** $120,000 - $150,000
- **Skills:** Python, TensorFlow, PyTorch, scikit-learn, SQL, Pandas
- **Experience:** 3-5 years
- **Received:** 5 hours ago

#### 3. **DevOps Engineer**
- **Company:** StartupX
- **Location:** Austin, TX (Hybrid)
- **Salary:** $100,000 - $130,000 + Equity
- **Skills:** AWS, Docker, Kubernetes, Terraform, CI/CD, Linux
- **Experience:** 3+ years
- **Received:** Yesterday

#### 4. **Frontend Developer (React)**
- **Company:** WebDesign Co
- **Location:** New York, NY / Remote
- **Salary:** $90,000 - $120,000
- **Skills:** React, JavaScript, HTML5, CSS3, Redux, Git
- **Experience:** 2-4 years
- **Received:** 2 days ago

---

### 📎 Resume Application Emails (2)

#### 1. **John Doe - Full Stack Developer**
- **Email:** john.doe@email.com
- **Subject:** Application for Full Stack Developer Position
- **Attachment:** John_Doe_Resume.pdf (simulated)
- **Experience:** 6 years
- **Skills:** React, Node.js, AWS
- **Received:** 3 hours ago

#### 2. **Jane Smith - Data Scientist**
- **Email:** jane.smith@email.com
- **Subject:** Resume - Python Data Scientist
- **Attachment:** Jane_Smith_CV.pdf (simulated)
- **Education:** Master's in Computer Science
- **Experience:** 4 years
- **Skills:** ML/AI, Python
- **Received:** 6 hours ago

---

## UI Visual Indicators

### Before Connection
```
┌──────────────────────────────────────────────────┐
│ [Ceipal] [Connect Outlook 🏷️Demo] [Refresh]    │
│           ↑ Indigo button with Demo badge        │
└──────────────────────────────────────────────────┘
```

### After Demo Connection
```
┌──────────────────────────────────────────────────┐
│ [Ceipal] [Sync Demo] [🎭 Demo] [Refresh]        │
│           ↑ Amber      ↑ Demo badge              │
└──────────────────────────────────────────────────┘
```

### During Sync
```
┌──────────────────────────────────────────────────┐
│ [Ceipal] [⟳ Syncing...] [🎭 Demo] [Refresh]    │
│           ↑ Spinner animation                     │
└──────────────────────────────────────────────────┘
```

**Color Coding:**
- 🟣 **Indigo** = Regular Outlook (needs Azure AD)
- 🟠 **Amber/Orange** = Demo Mode (no setup needed)
- 🟢 **Green Badge** = Connected status

---

## How Demo Mode Works

### Backend Flow:
1. User clicks "Connect Outlook"
2. Frontend checks if `OUTLOOK_CLIENT_ID` is empty
3. If empty, offers Demo Mode
4. User accepts → Backend creates demo config in MongoDB
5. Config has `accessToken: 'demo-access-token'` (special marker)

### Sync Flow:
1. User clicks "Sync Demo"
2. Backend checks for `'demo-access-token'`
3. If found → Routes to `outlookDemoService`
4. Service generates 4 job emails + 2 resume emails
5. AI parses job descriptions using Hugging Face
6. Jobs are extracted and saved (when unified_jobs implemented)
7. Resume count returned (actual parsing uses existing demo folder)
8. Stats updated in dashboard

---

## Demo vs Real Outlook

| Feature | Demo Mode | Real Outlook |
|---------|-----------|--------------|
| **Setup Required** | None | Azure AD app registration |
| **API Credentials** | Not needed | CLIENT_ID + CLIENT_SECRET required |
| **OAuth Flow** | Skipped | Full Microsoft OAuth 2.0 |
| **Email Source** | Pre-generated data | Real Outlook account |
| **AI Parsing** | ✅ Full AI parsing | ✅ Full AI parsing |
| **Job Extraction** | ✅ 4 demo jobs | ✅ All job emails |
| **Resume Processing** | ✅ 2 demo resumes | ✅ All resume attachments |
| **Real-time Sync** | Manual click | Manual or scheduled |
| **Production Ready** | ❌ For testing only | ✅ Production use |

---

## Switching from Demo to Real Outlook

### Option 1: Keep Demo for Testing
Just continue using Demo Mode. It won't interfere with real setup later.

### Option 2: Set Up Real Outlook
1. Follow `OUTLOOK_INTEGRATION_SETUP.md`
2. Add Azure AD credentials to `.env`
3. Restart backend
4. Disconnect Demo Mode
5. Click "Connect Outlook" → Will use real OAuth now

---

## Disconnecting Demo Mode

1. Click **"🎭 Demo"** badge button
2. Confirm disconnection
3. Demo config removed from database
4. Button returns to **"Connect Outlook"**

---

## Technical Details

### Files Created:
- **`backend/src/services/outlookDemoService.ts`** - Demo service (300+ lines)
- **`backend/src/routes/outlookRoutes.ts`** - Updated with demo support
- **`frontend/src/pages/RecruiterDashboard.tsx`** - Demo UI handling

### Database:
Demo creates an `OutlookConfig` document with:
```javascript
{
  userId: "default-user",
  accessToken: "demo-access-token",  // Special marker
  emailAddress: "demo@outlook.com",
  connectionStatus: "connected",
  // ... other fields
}
```

### Detection Logic:
```typescript
// Backend detects demo mode
const isDemoMode = config.accessToken === 'demo-access-token';

// Frontend gets demo flag
const response = await axios.get('/api/outlook/status');
if (response.data.isDemo) {
  // Show demo UI
}
```

---

## Common Questions

### Q: Does Demo Mode use real AI?
**A:** Yes! It uses the same Hugging Face Mistral-7B model to parse job descriptions. The only simulation is the email data itself.

### Q: Can I customize demo emails?
**A:** Yes! Edit `backend/src/services/outlookDemoService.ts` → `generateDemoJobEmails()` method.

### Q: Does Demo Mode require internet?
**A:** Mostly yes, because AI parsing uses Hugging Face API. But you can add a `HUGGINGFACE_API_TOKEN` to `.env` for better reliability.

### Q: Will Demo Mode affect my real data?
**A:** No! Demo is completely isolated. Jobs and resumes are marked with demo source metadata.

### Q: Can multiple users use Demo Mode?
**A:** Currently it's single-user (default-user). For multi-user, you'd need to add user authentication.

---

## Troubleshooting

### Issue: "Demo mode not available"
**Solution:** Demo is auto-enabled when `OUTLOOK_CLIENT_ID` is empty. If you added credentials, remove them to re-enable demo.

### Issue: Jobs not extracted
**Solution:** Check console logs for AI parsing errors. May need Hugging Face API token.

### Issue: "Failed to connect in demo mode"
**Solution:** Check backend logs, ensure MongoDB is running.

---

## Next Steps After Demo

1. ✅ **Understand the feature** - You now know how it works!
2. 📚 **Read full docs** - `OUTLOOK_INTEGRATION_SETUP.md`
3. 🔑 **Set up Azure AD** - When ready for production
4. 🚀 **Go live** - Connect real Outlook account

---

## Demo Mode Quick Reference

```bash
# Start demo immediately
1. cd backend && npm run dev
2. cd frontend && npm start
3. Go to Recruiter Dashboard
4. Click "Connect Outlook"
5. Choose "Demo Mode"
6. Click "Sync Demo"
7. View 4 jobs + 2 resumes!
```

**Total time:** ~2 minutes from start to viewing AI-parsed jobs! 🎉

---

Enjoy testing the Outlook integration without any setup hassle!
