# GitHub Deployment Guide

Complete step-by-step guide to push your Recruiter Suite project to GitHub.

---

## Prerequisites

- Git installed on your computer
- GitHub account created
- Your project is in a working state

---

## Step 1: Initialize Git Repository (if not already done)

```bash
# Navigate to your project directory
cd E:\ATS-Resume-Optimizer-main\ATS-Resume-Optimizer-main

# Check if git is already initialized
git status

# If not initialized, run:
git init
```

---

## Step 2: Create .gitignore File

Create or update `.gitignore` to exclude sensitive files:

```
# Dependencies
node_modules/
*/node_modules/
backend/node_modules/
frontend/node_modules/
ilabor360-scraper/venv/
ilabor360-scraper/__pycache__/

# Environment variables
.env
.env.local
backend/.env
frontend/.env
ilabor360-scraper/.env

# Build outputs
dist/
build/
backend/dist/
frontend/build/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Python
*.pyc
__pycache__/
*.py[cod]
*$py.class

# MongoDB dumps
*.dump

# Uploads & temp files
backend/uploads/
*.tmp

# Screenshots (from scraper)
*.png
!frontend/public/*.png

# Local settings
.claude/settings.local.json

# Test files
test-*.js
test-*.py
```

---

## Step 3: Create GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click the **"+"** icon in top-right corner → **"New repository"**
3. Fill in the details:
   - **Repository name**: `recruiter-suite` (or your preferred name)
   - **Description**: "AI-powered Recruiter Suite with resume parsing, job pipeline management, and integrations with Outlook, Ceipal, and iLabor360"
   - **Visibility**: Choose Public or Private
   - **❌ DO NOT** check "Initialize this repository with a README"
4. Click **"Create repository"**

---

## Step 4: Prepare Your Code

### Review and Clean Up

```bash
# Check what files will be committed
git status

# Review untracked files
git ls-files --others --exclude-standard
```

### Stage Your Files

```bash
# Add all files (respecting .gitignore)
git add .

# Or add specific files/folders
git add backend/
git add frontend/
git add ilabor360-scraper/
git add README.md
git add package.json
```

---

## Step 5: Create Initial Commit

```bash
# Create your first commit
git commit -m "Initial commit: Recruiter Suite with Outlook, Ceipal, and iLabor360 integrations

Features:
- Resume Dashboard with AI-powered parsing
- Job Pipeline with candidate matching
- Outlook OAuth integration with sync & logout
- Ceipal ATS integration
- iLabor360 job board scraper
- MongoDB database for resume storage
- React frontend with Tailwind CSS
- Express.js backend with TypeScript"
```

---

## Step 6: Link to GitHub Remote

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name:

```bash
# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Verify remote was added
git remote -v
```

Example:
```bash
git remote add origin https://github.com/john-doe/recruiter-suite.git
```

---

## Step 7: Push to GitHub

```bash
# Rename branch to main (if needed)
git branch -M main

# Push code to GitHub
git push -u origin main
```

### If you encounter authentication issues:

**Option A: Using Personal Access Token (Recommended)**

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "Recruiter Suite Deployment"
4. Select scopes: `repo` (all sub-options)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)
7. When pushing, use the token as your password:
   ```bash
   Username: your-github-username
   Password: paste-your-token-here
   ```

**Option B: Using GitHub CLI**

```bash
# Install GitHub CLI (if not installed)
# Windows: winget install --id GitHub.cli

# Authenticate
gh auth login

# Push
git push -u origin main
```

---

## Step 8: Verify Upload

1. Go to your GitHub repository URL
2. Refresh the page
3. You should see all your files uploaded!

---

## Step 9: Add README with Setup Instructions

Create a comprehensive README.md:

```bash
# Edit README.md with setup instructions
# Include:
# - Project description
# - Features
# - Installation steps
# - Environment variables needed
# - How to run the project
# - Screenshots (optional)
```

Commit and push:

```bash
git add README.md
git commit -m "docs: Add comprehensive README with setup instructions"
git push
```

---

## Step 10: Protect Sensitive Information

### Create .env.example files

```bash
# Backend
cp backend/.env backend/.env.example

# Frontend
cp frontend/.env frontend/.env.example

# Python scraper
cp ilabor360-scraper/.env ilabor360-scraper/.env.example
```

**Edit .env.example files** to remove actual values:

```env
# Example backend/.env.example
MONGODB_URI=mongodb://localhost:27017/your-db-name
PORT=5000
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
OUTLOOK_TENANT_ID=your-tenant-id
OUTLOOK_REDIRECT_URI=http://localhost:5000/api/outlook/auth/callback
```

Commit the example files:

```bash
git add backend/.env.example frontend/.env.example ilabor360-scraper/.env.example
git commit -m "docs: Add environment variable example files"
git push
```

---

## Common Git Commands for Future Updates

### Making Changes

```bash
# Check status
git status

# Stage changes
git add .

# Commit changes
git commit -m "feat: Add new feature description"

# Push to GitHub
git push
```

### Commit Message Conventions

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```bash
git commit -m "feat: Add Outlook logout functionality"
git commit -m "fix: Resolve authentication token expiry issue"
git commit -m "docs: Update installation guide"
```

---

## Troubleshooting

### Issue: Large files rejected

```bash
# If files are too large (>100MB)
# Use Git LFS or remove them:
git rm --cached path/to/large/file
echo "path/to/large/file" >> .gitignore
git commit -m "Remove large file"
```

### Issue: Accidentally committed .env file

```bash
# Remove from git but keep locally
git rm --cached backend/.env
git rm --cached frontend/.env

# Commit the removal
git commit -m "Remove sensitive .env files from tracking"
git push

# Then immediately change your secrets!
```

### Issue: Push rejected

```bash
# Pull latest changes first
git pull origin main --rebase

# Then push
git push
```

---

## Creating a Professional Repository

### Add these files for completeness:

1. **LICENSE** - Choose a license (MIT, Apache, GPL)
2. **CONTRIBUTING.md** - Contribution guidelines
3. **CHANGELOG.md** - Version history
4. **.github/workflows/** - CI/CD workflows (optional)

### Add GitHub Repository Topics

1. Go to your repo on GitHub
2. Click the gear icon next to "About"
3. Add topics: `react`, `typescript`, `nodejs`, `mongodb`, `outlook-api`, `ats`, `resume-parser`, `recruiter-tools`

---

## Security Best Practices

✅ **DO:**
- Keep `.env` files in `.gitignore`
- Use environment variables for all secrets
- Provide `.env.example` files
- Document required environment variables
- Use GitHub secrets for deployment

❌ **DON'T:**
- Commit API keys, passwords, or tokens
- Push `node_modules/` directory
- Commit database dumps with real data
- Push credentials in README

---

## Next Steps After GitHub Upload

1. ✅ Set up GitHub Actions for CI/CD
2. ✅ Deploy to cloud platform (Vercel, Heroku, AWS, etc.)
3. ✅ Add GitHub Pages for documentation
4. ✅ Set up issue templates
5. ✅ Create a project board for task tracking
6. ✅ Add branch protection rules

---

## Quick Reference Card

```bash
# First time setup
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main

# Regular workflow
git add .
git commit -m "Your message"
git push

# Check status
git status
git log --oneline

# Undo changes (careful!)
git checkout -- filename    # Discard local changes
git reset HEAD filename     # Unstage file
git revert HEAD            # Undo last commit
```

---

## Support

If you encounter issues:
1. Check GitHub's [Git Guides](https://github.com/git-guides)
2. Review [GitHub Docs](https://docs.github.com)
3. Ask on [Stack Overflow](https://stackoverflow.com/questions/tagged/git)

---

**Good luck with your deployment! 🚀**
