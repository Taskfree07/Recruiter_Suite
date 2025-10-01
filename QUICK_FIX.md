# Quick Fix: Clear Old Data

## The Problem
You have old candidate data in localStorage from before the file storage system was implemented. The old data doesn't have `filePath` properties, so scoring fails.

## Solution: Clear localStorage

### Option 1: Via Browser Console (Recommended)
1. Open DevTools (F12)
2. Go to **Console** tab
3. Run this command:
```javascript
localStorage.removeItem('managedCandidates');
location.reload();
```

### Option 2: Via Application Tab
1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **Local Storage** in the left sidebar
4. Click on `http://localhost:3002` (or your frontend URL)
5. Find `managedCandidates` key
6. Right-click → Delete
7. Refresh the page

### Option 3: Clear All Site Data
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **"Clear site data"** button at the top
4. Refresh the page

## After Clearing:

1. ✅ Upload job description
2. ✅ Click on each candidate's **+** icon to upload their resumes
3. ✅ Resumes will be saved to the backend server
4. ✅ Click "Add All" to select candidates
5. ✅ Click "Check Fit" to analyze

## Why This Happened:
- Old system stored File objects in memory (lost on reload)
- New system stores files on the server (persistent)
- Old data in localStorage doesn't have server file paths
- Need fresh start with new system

## Verify It's Working:
After uploading a resume, check the candidate object in localStorage:
- Should have `filePath: "uploads/resumes/1/1234567890_resume.pdf"`
- Should have `file: null`

If you see this, the new system is working! 🎉
