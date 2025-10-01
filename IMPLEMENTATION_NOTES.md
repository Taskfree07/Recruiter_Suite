# ATS Resume Optimizer - Candidate Selection Implementation

## Overview
This document describes the implementation of the candidate selection and scoring workflow.

## User Workflow

### Step 1: Upload Job Description
- User uploads a job description in the left sidebar
- This is **required** before scoring can begin

### Step 2: Upload Candidate Resumes
- Candidates are displayed in the right panel
- Click the "+" icon on any candidate card to upload their resume(s)
- Each candidate can have multiple resumes

### Step 3: Select Candidates for Scoring
- **Click individual candidate cards** to select/deselect them
- **Click "Add All" button** to select all candidates with resumes at once
- Selected candidates are highlighted with:
  - Blue background (`bg-indigo-50`)
  - Blue border (`border-indigo-300`)
  - Checkmark icon on their avatar
- A counter shows how many candidates are selected
- **"Clear selection" link** to deselect all candidates

### Step 4: View Selected Candidates
- The middle panel shows **selected candidates** (not individual resumes)
- Each candidate card displays:
  - Candidate name (with initials avatar)
  - Number of resumes uploaded
  - Match score (after analysis)
  - Remove button to deselect

### Step 5: Check Fit
- Click the **"Check Fit"** button in the middle panel
- Button is only enabled when:
  - Job description is uploaded
  - At least one candidate is selected
- The system analyzes all resumes for each selected candidate
- Multiple resumes per candidate are averaged into a single score

### Step 6: View Results
- **Scoring Summary** appears below the Check Fit button
- Shows all scored candidates sorted by overall match percentage
- Displays:
  - Overall score
  - Skills match
  - Experience match
  - "Top Match" badge for the highest scorer
- Scores also appear on candidate cards in the right panel

## Technical Implementation

### State Management (`AppContext.tsx`)
- `selectedCandidateIds: string[]` - Tracks which candidates are selected
- `toggleCandidateSelection(id)` - Toggle individual candidate
- `selectAllCandidates()` - Select all candidates with resumes
- `clearSelectedCandidates()` - Clear all selections

### Components Modified

#### 1. CandidatesWidget
- Displays all candidates with visual selection state
- "Add All" button to select all candidates with resumes
- Shows selection counter and "Clear selection" link
- Click candidate card to toggle selection
- Checkmark icon on selected candidates

#### 2. ResumesWidget (Selected Candidates Panel)
- Shows selected candidates as a list (not individual resumes)
- Displays candidate avatar, name, resume count, and score
- Remove button to deselect candidates

#### 3. CheckFitButton
- Validates job description exists
- Validates candidates are selected
- Processes only selected candidates
- Shows appropriate help text based on state

#### 4. ScoringSummary
- Displays scored candidates from `managedCandidates`
- Sorts by overall score descending
- Shows "Top Match" badge for highest scorer

### Backend API
- Endpoint: `POST /api/scoring/check-candidate-fit`
- Accepts multiple resumes per candidate
- Groups resumes by candidate ID (from filename prefix)
- Returns aggregated scores per candidate

## Key Features

✅ **Selection-based workflow** - Only selected candidates are scored
✅ **Visual feedback** - Clear indication of selected candidates
✅ **Validation** - Ensures job description exists before scoring
✅ **Multi-resume support** - Candidates can have multiple resumes
✅ **Score aggregation** - Multiple resumes averaged per candidate
✅ **Sorted results** - Candidates ranked by match percentage
✅ **Persistent state** - Selections and scores maintained in React state

## Future Enhancements (Optional)
- Persist selections to localStorage
- Bulk resume upload per candidate
- Export scoring results
- Detailed score breakdown modal
- Resume preview functionality
