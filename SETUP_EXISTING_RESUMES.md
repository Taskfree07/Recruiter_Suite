# 🚀 Setup Guide: Load Existing Resumes

This guide will help you load the 48 existing PDF resumes from the `Resume/` folder into your ATS system.

## What This Does

The script will:
1. ✅ Copy all 48 PDFs from `Resume/` folder to backend storage
2. ✅ Distribute them evenly among 10 candidates
3. ✅ Create a seed data file for the frontend
4. ✅ Make resumes persistent (survive page reloads)

## Step-by-Step Instructions

### Step 1: Run the Load Script

Open a terminal in the backend folder and run:

```bash
cd backend
npm run load-resumes
```

**Expected Output:**
```
🚀 Starting resume loading process...

📁 Found 48 resume files

✅ John Doe: 5 resumes loaded
✅ Jane Smith: 5 resumes loaded
✅ Mike Johnson: 5 resumes loaded
✅ Sarah Wilson: 5 resumes loaded
✅ David Brown: 5 resumes loaded
✅ Emily Davis: 5 resumes loaded
✅ James Miller: 5 resumes loaded
✅ Lisa Anderson: 5 resumes loaded
✅ Robert Taylor: 4 resumes loaded
✅ Jennifer Thomas: 4 resumes loaded

✨ Success! Loaded 48 resumes for 10 candidates
📝 Seed data saved to: frontend/src/data/seedManagedCandidates.json
```

### Step 2: Clear Old Data (Important!)

Open browser DevTools (F12) → Console tab, and run:

```javascript
localStorage.removeItem('managedCandidates');
location.reload();
```

### Step 3: Refresh Frontend

The frontend will automatically load the candidates with their resumes from the seed file.

### Step 4: Test the System

1. ✅ Upload a job description
2. ✅ Click "Add All" to select all candidates
3. ✅ Click "Check Fit" to analyze
4. ✅ View scores for all candidates!

## File Structure After Setup

```
backend/
  uploads/
    resumes/
      1/                    # John Doe's resumes
        1234567890_10089434.pdf
        1234567891_10247517.pdf
        ...
      2/                    # Jane Smith's resumes
        1234567892_10265057.pdf
        ...
      ...

frontend/
  src/
    data/
      seedManagedCandidates.json    # Auto-generated seed data
```

## How It Works

### Backend Storage
- Resumes are copied to `backend/uploads/resumes/{candidateId}/`
- Each file is prefixed with a timestamp
- Files are organized by candidate ID

### Frontend Seed Data
- JSON file with candidate data and file paths
- Loaded automatically on app startup
- Can be committed to git (just paths, not files)

### Distribution
- 48 resumes ÷ 10 candidates = ~5 resumes each
- First 8 candidates get 5 resumes
- Last 2 candidates get 4 resumes

## Adding More Resumes Later

### Option 1: Via UI (Recommended)
1. Click the **+** icon on any candidate card
2. Upload new resume files
3. They'll be added to that candidate's collection

### Option 2: Add to Resume Folder & Re-run
1. Add new PDFs to `Resume/` folder
2. Run `npm run load-resumes` again
3. Will redistribute all resumes

## Scoring with Multiple Resumes

When you click "Check Fit":
- Backend analyzes **all resumes** for each candidate
- Calculates individual scores for each resume
- **Averages all scores** to get final candidate score

**Example:**
- John Doe has 5 resumes
- Scores: 85%, 90%, 78%, 92%, 88%
- **Final Score: 86.6%** (average)

## Benefits

✅ **Persistent Storage** - Resumes survive page reloads
✅ **No File Loss** - Files stored on server, not browser
✅ **Easy Management** - Add/remove resumes anytime
✅ **Accurate Scoring** - Multiple resumes = better assessment
✅ **Scalable** - Add unlimited candidates and resumes

## Troubleshooting

### "No PDF files found"
- Check that `Resume/` folder exists at project root
- Verify it contains .pdf files

### "Source directory not found"
- Make sure you're running from the backend folder
- Check the path in the script matches your structure

### Resumes not showing in frontend
- Clear localStorage and refresh
- Check that `frontend/src/data/seedManagedCandidates.json` was created
- Verify file paths in the JSON are correct

## Next Steps

After setup:
1. Upload various job descriptions
2. Test scoring with different requirements
3. Add more candidates as needed
4. Upload additional resumes via UI

Your ATS system is now ready with 48 real resumes! 🎉
