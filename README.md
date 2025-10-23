# 🎯 Recruiter Suite

> An intelligent, AI-powered recruiting platform that streamlines your entire hiring workflow with automated job scraping, smart candidate matching, and seamless ATS integrations.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.8%2B-blue.svg)
![MongoDB](https://img.shields.io/badge/mongodb-4.4%2B-green.svg)

## ✨ Core Features

### 🤖 AI-Powered Resume Matching
- **Smart Scoring Algorithm** - Multi-dimensional analysis based on skills, experience, education, and keywords
- **Semantic Matching** - Advanced AI embeddings using Sentence Transformers for contextual understanding
- **Batch Processing** - Match multiple candidates against job requirements simultaneously
- **Weighted Scoring** - Customizable weights (60% semantic similarity + 40% skills match)
- **Real-time Analysis** - Instant scoring and ranking of candidates

### 📊 Job Pipeline Management
- **Visual Pipeline** - Kanban-style board with drag-and-drop functionality
- **Stage Tracking** - Track candidates through: New, Screening, Interview, Offer, Hired, Rejected
- **AI Match Scores** - See candidate fit percentage for each job
- **Quick Actions** - Move candidates between stages with a single click
- **Job Analytics** - Monitor candidate distribution across pipeline stages

### 🔄 Multi-Source Job Integration

#### iLabor360 Integration
- **Automated Job Scraping** - Direct integration with iLabor360 vendor portal
- **Manual Login Support** - Secure browser automation with Selenium
- **Requisition Sync** - Automatic fetching of open requisitions
- **Submission Tracking** - Monitor candidate submissions and status
- **MongoDB Storage** - All jobs and submissions stored locally

#### CEIPAL Integration (Coming Soon)
- **Job Import** - Fetch jobs from CEIPAL ATS
- **Candidate Sync** - Two-way candidate synchronization
- **Status Updates** - Real-time status tracking

### 📧 Email Integration
- **Outlook Integration** - Parse job descriptions from emails automatically
- **Smart Detection** - Identify job-related emails
- **One-Click Import** - Extract and import job requirements

### 💼 Candidate Database
- **Resume Management** - Store and manage multiple resume versions per candidate
- **File Support** - PDF, DOC, DOCX formats
- **Persistent Storage** - Resumes stored on server, survive page reloads
- **Search & Filter** - Quick candidate lookup
- **Bulk Upload** - Upload multiple resumes at once

### 💰 Salary Prediction (ML-Powered)
- **Predictive Analytics** - Estimate salary ranges based on job requirements
- **Market Insights** - Data-driven compensation recommendations
- **Experience-Based** - Factors in years of experience, skills, location

### 🎨 Modern User Interface
- **Dual Workflow Options**:
  - **ATS Optimizer** - Traditional resume-job matching workflow
  - **Job Pipeline** - Modern Kanban-style candidate management
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark Mode Ready** - Eye-friendly interface
- **Real-time Updates** - Instant feedback and notifications
- **TailwindCSS** - Clean, modern styling

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18.2 with TypeScript
- React Router for navigation
- TailwindCSS for styling
- Axios for API calls
- React Hot Toast for notifications
- React Dropzone for file uploads
- Recharts for data visualization

**Backend:**
- Node.js with Express 5
- TypeScript for type safety
- MongoDB with Mongoose
- JWT authentication
- Multer for file uploads
- OpenAI GPT-4 for advanced parsing
- Google Gemini AI for analysis

**AI/ML Services:**
- **Python Flask Service** (Port 5001) - Sentence Transformers for semantic matching
- **AI Matching Service** - Cosine similarity, embeddings, batch processing
- Model: `all-MiniLM-L6-v2` (lightweight, fast)

**Web Scraping:**
- **Python Selenium Service** (Port 5002) - iLabor360 scraper
- Headless Chrome automation
- Session management
- Beautiful Soup for HTML parsing

## 🚀 Quick Start

### Prerequisites

- **Node.js** v16 or higher
- **MongoDB** v4.4 or higher
- **Python** 3.8 or higher
- **Google Chrome** (for web scraping)
- **npm** or **yarn**

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/YourUsername/Recruiter-Suite.git
cd Recruiter-Suite
```

#### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in `backend/` folder:
```env
MONGODB_URI=mongodb://localhost:27017/recruiter_suite
PORT=5000
NODE_ENV=development

# AI Services (Optional)
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here

# Email Integration (Optional)
OUTLOOK_CLIENT_ID=your_outlook_client_id
OUTLOOK_CLIENT_SECRET=your_outlook_secret

# CEIPAL Integration (Optional)
CEIPAL_API_KEY=your_ceipal_key
CEIPAL_BASE_URL=https://api.ceipal.com
```

#### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

#### 4. AI Matching Service Setup
```bash
cd ../ai-matching-service
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

#### 5. iLabor360 Scraper Setup
```bash
cd ../ilabor360-scraper
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

#### 6. Start MongoDB
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

#### 7. Load Sample Data (Optional)
```bash
cd backend
npm run load-resumes
```

### Running the Application

You'll need **4 terminal windows**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev:watch
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
# Runs on http://localhost:3000
```

**Terminal 3 - AI Matching Service:**
```bash
cd ai-matching-service
python app.py
# Runs on http://localhost:5001
```

**Terminal 4 - iLabor360 Scraper:**
```bash
cd ilabor360-scraper
python app.py
# Runs on http://localhost:5002
```

The application will open at `http://localhost:3000`

## 📖 User Guide

### Workflow 1: ATS Optimizer (Traditional Resume Matching)

1. **Upload Job Description**
   - Go to "ATS Optimizer" from home page
   - Upload PDF/DOC or paste text
   - Click "Import Job Description"

2. **Select Candidates**
   - Click "Add All" or select individual candidates
   - Each candidate shows number of resumes

3. **Analyze & Score**
   - Click "Check Fit" button
   - View ranked candidates with match percentages
   - See detailed score breakdowns

4. **Review Results**
   - Top candidates highlighted
   - Skill match, experience match, education scores
   - Overall weighted score

### Workflow 2: Job Pipeline (Modern Kanban)

1. **Import Jobs**
   - Configure iLabor360 settings
   - Fetch requisitions automatically
   - Or manually add job descriptions

2. **Add Candidates**
   - Upload resumes to candidate database
   - AI automatically calculates match scores

3. **Manage Pipeline**
   - Drag candidates between stages
   - View AI match percentages
   - Track progress visually

4. **Move to Hire**
   - Screen → Interview → Offer → Hired
   - All movements tracked and logged

### Workflow 3: iLabor360 Job Import

1. **Configure Settings**
   - Go to "iLabor360 Settings"
   - Enter login URL: `https://vendor.ilabor360.com/logout`
   - Enter credentials
   - Click "Save Settings"

2. **Test Connection**
   - Click "Test Connection"
   - Verify login successful

3. **Fetch Jobs**
   - Set max requisitions (default: 100)
   - Click "Fetch Requisitions"
   - Jobs imported to pipeline automatically

4. **View & Manage**
   - Go to "Job Pipeline"
   - See all imported jobs
   - Add candidates and track progress

## 🔧 Configuration

### Scoring Algorithm Weights

Default weights in `backend/src/services/scoringService.ts`:
```typescript
Overall Score =
  (Skill Match × 40%) +
  (Experience Match × 30%) +
  (Education Match × 15%) +
  (Keyword Match × 15%)
```

### AI Matching Weights

For semantic matching in `ai-matching-service/app.py`:
```python
weighted_score = (overall_similarity * 0.6) + (skills_score * 0.4)
# 60% semantic similarity
# 40% exact skills match
```

### Skill Match Threshold

Skills are considered matched if similarity > 0.7 (70%)

## 📁 Project Structure

```
Recruiter-Suite/
├── backend/                      # Node.js/Express API
│   ├── src/
│   │   ├── models/              # MongoDB schemas
│   │   │   ├── candidate.ts
│   │   │   ├── job.ts
│   │   │   ├── unifiedJob.ts
│   │   │   ├── iLabor360Config.ts
│   │   │   └── recruiterResume.ts
│   │   ├── routes/              # API endpoints
│   │   │   ├── jobRoutes.ts
│   │   │   ├── candidateRoutes.ts
│   │   │   ├── scoringRoutes.ts
│   │   │   ├── matchingRoutes.ts
│   │   │   ├── jobPipelineRoutes.ts
│   │   │   ├── iLabor360Routes.ts
│   │   │   ├── ceipalRoutes.ts
│   │   │   └── salaryRoutes.ts
│   │   ├── services/            # Business logic
│   │   │   ├── parserService.ts
│   │   │   ├── scoringService.ts
│   │   │   ├── matchingService.ts
│   │   │   ├── aiService.ts
│   │   │   ├── geminiService.ts
│   │   │   ├── iLabor360Service.ts
│   │   │   ├── salaryService.ts
│   │   │   └── emailService.ts
│   │   ├── scripts/
│   │   │   ├── loadExistingResumes.ts
│   │   │   ├── seedDemoCandidates.ts
│   │   │   └── seedDemoJobs.ts
│   │   └── server.ts            # Express server
│   └── uploads/
│       └── resumes/             # Stored resume files
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Header.tsx
│   │   │   ├── upload/
│   │   │   │   ├── ResumeUpload.tsx
│   │   │   │   ├── JobUpload.tsx
│   │   │   │   └── CheckFitButton.tsx
│   │   │   ├── scoring/
│   │   │   │   └── ScoringSummary.tsx
│   │   │   └── candidates/
│   │   │       ├── CandidateCard.tsx
│   │   │       ├── CandidateList.tsx
│   │   │       └── ResumeUploadModal.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── Dashboard.tsx          # ATS Optimizer
│   │   │   ├── ResumeDashboard.tsx
│   │   │   ├── JobPipeline.tsx        # Kanban board
│   │   │   ├── CandidateDatabase.tsx
│   │   │   ├── ILabor360Settings.tsx
│   │   │   ├── CeipalSettings.tsx
│   │   │   └── SalaryPredictor.tsx
│   │   ├── contexts/
│   │   │   └── AppContext.tsx
│   │   └── App.tsx
│   └── public/
│       └── index.html
├── ai-matching-service/          # Python Flask API
│   ├── app.py                   # Sentence Transformers service
│   └── requirements.txt
├── ilabor360-scraper/           # Python Selenium scraper
│   ├── app.py                   # Flask API
│   ├── scraper.py               # Selenium automation
│   ├── direct_scraper.py        # Direct scraping logic
│   ├── parser.py                # HTML parsing
│   └── requirements.txt
├── Resume/                       # Sample resumes (48 PDFs)
└── README.md
```

## 🛠️ API Documentation

### Backend API (Port 5000)

#### Jobs
- `POST /api/jobs/upload` - Upload job description file
- `POST /api/jobs/import-text` - Import job as text
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get specific job
- `DELETE /api/jobs/:id` - Delete job

#### Candidates
- `GET /api/candidates` - Get all candidates
- `POST /api/candidates` - Create candidate
- `POST /api/candidate-resumes/upload/:candidateId` - Upload resume
- `GET /api/candidate-resumes/:candidateId` - Get candidate resumes

#### Scoring & Matching
- `POST /api/candidate-scoring/check-candidate-fit-by-path` - Score candidates
- `POST /api/matching/match-candidate` - AI semantic matching
- `POST /api/matching/batch-match` - Batch candidate matching

#### Job Pipeline
- `GET /api/job-pipeline/jobs` - Get all pipeline jobs
- `POST /api/job-pipeline/jobs` - Create pipeline job
- `PATCH /api/job-pipeline/jobs/:jobId/candidates/:candidateId/stage` - Move candidate stage

#### iLabor360
- `POST /api/ilabor360/save-config` - Save iLabor360 credentials
- `GET /api/ilabor360/config` - Get saved config
- `POST /api/ilabor360/test-connection` - Test login
- `POST /api/ilabor360/fetch-requisitions` - Fetch jobs
- `POST /api/ilabor360/fetch-submissions` - Fetch submissions

#### Salary Prediction
- `POST /api/salary/predict` - Predict salary for job

### AI Matching Service (Port 5001)

- `GET /health` - Health check
- `POST /embed` - Generate embeddings
- `POST /similarity` - Calculate similarity between texts
- `POST /match-candidate` - Match single candidate
- `POST /batch-match` - Match multiple candidates

### iLabor360 Scraper (Port 5002)

- `GET /health` - Health check
- `POST /scrape/login` - Login and create session
- `POST /scrape/requisitions` - Scrape job requisitions
- `POST /scrape/submissions` - Scrape candidate submissions
- `POST /scrape/all` - Scrape both requisitions and submissions
- `POST /session/close` - Close browser session

## 🎯 Key Features Explained

### AI Semantic Matching

Uses Sentence Transformers (`all-MiniLM-L6-v2`) to:
1. Convert resumes and job descriptions to vector embeddings
2. Calculate cosine similarity for semantic understanding
3. Match skills with 70% threshold
4. Combine semantic (60%) and exact skill match (40%) scores

**Example:**
```json
{
  "overall_similarity_percentage": 85.5,
  "skills_match_percentage": 75.0,
  "weighted_score_percentage": 81.3,
  "matched_skills": [
    {
      "job_skill": "React",
      "candidate_skill": "React.js",
      "similarity": 0.92
    }
  ]
}
```

### iLabor360 Scraping Flow

1. **Login** - Selenium opens Chrome, logs in
2. **Navigate** - Goes to Requisitions page
3. **Extract** - Parses HTML table data
4. **Transform** - Converts to standardized JSON
5. **Store** - Saves to MongoDB
6. **Session** - Keeps browser session alive for 1 hour

### Multi-Resume Averaging

When a candidate has multiple resumes:
1. Each resume analyzed individually
2. Scores calculated per resume
3. Average across all resumes
4. Single overall score displayed

## 🚀 Deployment

### Quick Deploy to Render (Free)

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for step-by-step instructions.

**Services Required:**
1. Web Service (Backend) - Node.js
2. Web Service (Frontend) - Static site
3. Web Service (AI Service) - Python
4. Web Service (Scraper) - Python
5. MongoDB Atlas (Free tier)

### Docker Deployment

```bash
docker-compose up -d
```

See `docker-compose.yml` for configuration.

## 🐛 Troubleshooting

### Backend won't start
- **Check MongoDB** is running: `mongosh` or `mongo`
- **Check port 5000** is available: `netstat -ano | findstr :5000` (Windows)
- **Verify .env** file exists in backend folder

### AI Matching not working
- **Start AI service**: `python ai-matching-service/app.py`
- **Check port 5001**: Should see "Starting AI Matching Service on port 5001"
- **Model download**: First run downloads ~100MB model

### iLabor360 login fails
- **Check credentials** are correct
- **Try headless=false** in `ilabor360-scraper/scraper.py` line 23
- **Check Chrome** is installed
- **View screenshots** in `ilabor360-scraper/` for debug images

### Candidates show 0% match
- **Check AI service** is running on port 5001
- **Verify job description** was imported correctly
- **Check backend logs** for AI service connection errors

### File upload fails
- **Check disk space** in `backend/uploads/` folder
- **Verify file permissions** on uploads directory
- **File size limit**: Max 10MB per file

## 📊 Sample Workflow

```
1. Start all services (Backend, Frontend, AI, Scraper)
2. Configure iLabor360 credentials
3. Fetch 50 requisitions from iLabor360
4. Upload 10 candidate resumes
5. AI matches all candidates against all jobs
6. View job pipeline with match scores
7. Drag candidates through stages: Screen → Interview → Offer → Hired
8. Export hired candidates or send to CEIPAL
```

## 🔐 Security Notes

- Credentials stored encrypted in MongoDB
- Browser sessions auto-expire after 1 hour
- JWT tokens for API authentication
- CORS configured for localhost only
- No credentials logged to files
- File uploads sanitized and validated

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment
- **[iLabor360 Setup](ILABOR360_SETUP_COMPLETE.md)** - Integration guide
- **[Job Pipeline](JOB_PIPELINE_IMPLEMENTATION.md)** - Pipeline features
- **[Demo Guide](DEMO_QUICKSTART.md)** - Demo mode instructions
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Adiltechgene007**
- GitHub: [@Adiltechgene007](https://github.com/Adiltechgene007)

## 🙏 Acknowledgments

- **AI/ML**: OpenAI GPT-4, Google Gemini, Sentence Transformers
- **Frontend**: React, TailwindCSS, Heroicons
- **Backend**: Node.js, Express, MongoDB
- **Web Scraping**: Selenium, Beautiful Soup
- **PDF Parsing**: pdf-parse, mammoth
- **Charts**: Recharts

## 🌟 Roadmap

- [ ] CEIPAL full integration
- [ ] Email parsing automation
- [ ] Advanced analytics dashboard
- [ ] Chrome extension for LinkedIn
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Video interview integration
- [ ] Background check integration

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check documentation files
- Review troubleshooting guide

---

**Made with ❤️ for better hiring decisions**

**Recruiter Suite** - Your all-in-one intelligent recruiting platform
