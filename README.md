# 🎯 ATS Resume Optimizer Pro

> An intelligent Applicant Tracking System that analyzes candidate resumes against job descriptions and provides accurate match scores.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

## ✨ Features

- 📊 **Smart Scoring Algorithm** - Analyzes resumes based on skills, experience, education, and keywords
- 📁 **Multiple Resumes per Candidate** - Upload and analyze multiple versions of each candidate's resume
- 🔄 **Average Score Calculation** - Automatically averages scores across all resumes per candidate
- 💾 **Persistent Storage** - Resume files stored on server, survive page reloads
- 🎨 **Modern UI** - Clean, intuitive interface built with React and TailwindCSS
- 📈 **Real-time Analysis** - Instant scoring and ranking of candidates
- 🔍 **Detailed Breakdown** - View skill match, experience match, education match, and keyword match scores
- 📝 **Job Description Parsing** - Automatically extracts requirements from job descriptions

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Adiltechgene007/ATS-RESUME-FINAL.git
cd ATS-RESUME-FINAL
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

4. **Setup Environment Variables**

Create a `.env` file in the `backend` folder:
```bash
cd ../backend
cp .env.example .env
```

Edit `.env` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/ats_resume_optimizer
PORT=5000
NODE_ENV=development
```

5. **Start MongoDB**

Make sure MongoDB is running on your system:
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

6. **Load Existing Resumes (One-time Setup)**

The project comes with 48 sample resumes. Load them into the system:
```bash
cd backend
npm run load-resumes
```

Expected output:
```
🚀 Starting resume loading process...
📁 Found 48 resume files
✅ John Doe: 5 resumes loaded
✅ Jane Smith: 5 resumes loaded
...
✨ Success! Loaded 48 resumes for 10 candidates
```

7. **Start the Application**

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will open at `http://localhost:3000`

## 📖 How to Use

### Step 1: Upload Job Description

1. Click on **"Upload PDF"** or **"Write Text"** tab
2. Enter company name (optional)
3. Either:
   - Upload a PDF/DOC file with the job description, OR
   - Paste the job description text directly
4. Click **"Import Job Description"**

### Step 2: Select Candidates

You'll see a list of candidates on the right panel. Each candidate shows:
- Name with avatar
- Number of resumes uploaded
- Selection status (highlighted when selected)

**To select candidates:**
- Click **"Add All"** button to select all candidates with resumes, OR
- Click individual candidate cards to select/deselect them

Selected candidates will appear in the middle panel.

### Step 3: Analyze Candidates

1. Click the **"Check Fit"** button
2. The system will:
   - Parse all resumes for each selected candidate
   - Extract skills, experience, education, and keywords
   - Calculate individual scores for each resume
   - Average the scores for candidates with multiple resumes
   - Rank candidates by overall match percentage

### Step 4: View Results

The **Scoring Summary** section displays:
- Candidates ranked by match percentage
- Overall score (weighted average)
- Skill match percentage
- Experience match percentage
- "Top Match" badge for the highest scorer

Each candidate card also shows their score badge.

## 📁 Project Structure

```
ATS-RESUME-FINAL/
├── backend/
│   ├── src/
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic (parsing, scoring)
│   │   ├── scripts/          # Utility scripts (load resumes)
│   │   └── server.ts         # Express server
│   ├── uploads/
│   │   └── resumes/          # Stored resume files (by candidate ID)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # React context (state management)
│   │   ├── services/         # API calls
│   │   ├── types/            # TypeScript interfaces
│   │   └── data/             # Seed data (candidate info)
│   └── package.json
├── Resume/                   # Sample resume PDFs (48 files)
└── README.md
```

## 🔧 Configuration

### Scoring Algorithm Weights

The overall score is calculated using weighted components:

```
Overall Score = 
  (Skill Match × 40%) +
  (Experience Match × 30%) +
  (Education Match × 15%) +
  (Keyword Match × 15%)
```

You can adjust these weights in `backend/src/services/scoringService.ts`:

```typescript
const overall = Math.round(
  scores.skillMatch * 0.4 +      // 40% weight
  scores.experienceMatch * 0.3 +  // 30% weight
  scores.educationMatch * 0.15 +  // 15% weight
  scores.keywordMatch * 0.15      // 15% weight
);
```

### Adding More Candidates

**Via UI (Recommended):**
1. Click the **+** icon on any candidate card
2. Upload resume files (PDF, DOC, DOCX)
3. Files are automatically saved to the backend

**Via Script:**
1. Add PDF files to the `Resume/` folder
2. Run `npm run load-resumes` in the backend folder
3. Resumes will be redistributed among all candidates

## 🎨 Features in Detail

### Multi-Resume Support

Each candidate can have multiple resumes:
- Different versions (e.g., technical resume, managerial resume)
- Updated versions over time
- Tailored resumes for different roles

The system automatically:
- Analyzes each resume individually
- Calculates an average score across all resumes
- Provides a single, comprehensive match percentage

### Intelligent Skill Matching

- **Exact matches**: 100 points (e.g., "React" === "React")
- **Partial matches**: 70 points (e.g., "React.js" contains "React")
- **Weighted scoring**: Considers both quantity and quality of matches

### Keyword Analysis

- Extracts top 50 keywords from job description
- Exact word matches: 100 points
- Substring matches: 50 points
- Provides overall content relevance score

### Experience Matching

- Estimates years of experience from resume entries
- Compares against job requirements
- Caps at 100% when requirements are met

## 🛠️ API Endpoints

### Jobs
- `POST /api/jobs/upload` - Upload job description file
- `POST /api/jobs/import-text` - Import job description as text
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get specific job

### Candidates
- `POST /api/candidate-resumes/upload/:candidateId` - Upload resume for candidate
- `POST /api/candidate-scoring/check-candidate-fit-by-path` - Analyze candidates

## 📊 Sample Output

```
Candidate Rankings:
1. Jane Smith      - 92% match (12 skills, 5+ years exp)
2. John Doe        - 87% match (8 skills, 3 years exp)
3. Mike Johnson    - 75% match (7 skills, 4 years exp)
4. Sarah Wilson    - 68% match (5 skills, 2 years exp)
...
```

## 🐛 Troubleshooting

### "Failed to import job description"
- **Cause**: Backend not running or CORS issue
- **Fix**: Restart backend with `npm run dev`

### "No valid resume files found"
- **Cause**: Resume files lost from browser storage
- **Fix**: Run `npm run load-resumes` in backend folder

### All candidates show same score
- **Cause**: Parsing or scoring algorithm issue
- **Fix**: Check backend console for debug logs, verify PDFs are being read

### MongoDB connection error
- **Cause**: MongoDB not running
- **Fix**: Start MongoDB service

See `TROUBLESHOOTING.md` for more details.

## 🚀 Deployment

Ready to deploy and showcase your application? Check out the comprehensive deployment guide:

**[📖 Deployment Guide](DEPLOYMENT.md)** - Complete step-by-step instructions for deploying to:
- **Render** (Free, Recommended for showcasing)
- **Docker** (For VPS or self-hosting)
- Environment configuration
- Troubleshooting deployment issues

Quick deploy to Render in 15 minutes - perfect for portfolio projects!

## 📚 Documentation

- **[Setup Guide](SETUP_EXISTING_RESUMES.md)** - Detailed setup instructions
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions
- **[Scoring Algorithm](SCORING_IMPROVEMENTS.md)** - How scoring works
- **[Implementation Notes](IMPLEMENTATION_NOTES.md)** - Technical details
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and fixes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Adiltechgene007**
- GitHub: [@Adiltechgene007](https://github.com/Adiltechgene007)

## 🙏 Acknowledgments

- Built with React, Node.js, Express, and MongoDB
- PDF parsing powered by pdf-parse
- UI components styled with TailwindCSS
- Icons from Heroicons

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the documentation files
- Review the troubleshooting guide

---

**Made with ❤️ for better hiring decisions**
