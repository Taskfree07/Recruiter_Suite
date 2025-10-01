# ⚠️ Important: Resume File Handling

## Issue: Resume Files Lost After Page Reload

### Why This Happens:
- Resume files are stored in browser memory as `File` objects
- When candidates are saved to `localStorage`, File objects **cannot be serialized**
- After page reload, the file references are lost
- This causes the "No resumes provided" error when trying to analyze

### Solution:

**Option 1: Upload Resumes in Same Session (Recommended for Now)**
1. Upload job description
2. Upload resumes for candidates
3. Select candidates (Add All)
4. Click "Check Fit" **immediately in the same session**
5. ✅ Do NOT reload the page before analyzing

**Option 2: Re-upload Resumes After Page Reload**
If you've reloaded the page:
1. Click on each candidate in the right panel
2. Re-upload their resumes
3. Then select and analyze

### Future Enhancement Options:

#### A. Upload Resumes to Backend
Store resume files on the server instead of browser memory:
- Upload resumes to `/uploads/resumes/` folder
- Store file paths in database
- Retrieve files when needed for analysis

#### B. Use IndexedDB
Store File objects in IndexedDB (browser database that supports binary data):
- Larger storage capacity than localStorage
- Can store File objects
- Persists across page reloads

#### C. Hybrid Approach
- Store file metadata in localStorage
- Keep actual files in IndexedDB
- Best of both worlds

### Current Workaround Implemented:

1. **localStorage now excludes File objects** - prevents errors but files are lost on reload
2. **Validation added** - checks if files exist before sending to backend
3. **Clear error messages** - tells users to re-upload if files are missing

### For Production:
Implement **Option A** (backend storage) for the best user experience:
- Persistent storage
- No data loss on reload
- Can handle large files
- Enables resume history and versioning
