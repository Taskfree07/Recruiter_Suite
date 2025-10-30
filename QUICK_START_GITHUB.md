# Quick Start: Push to GitHub

**Fast track guide to get your code on GitHub in 5 minutes!**

---

## 📋 Prerequisites

- [ ] Git installed (`git --version`)
- [ ] GitHub account created
- [ ] All sensitive files backed up

---

## 🚀 Quick Steps

### 1. Check Git Status

```bash
cd E:\ATS-Resume-Optimizer-main\ATS-Resume-Optimizer-main
git status
```

If it says "not a git repository", run:
```bash
git init
```

---

### 2. Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `recruiter-suite`
3. **DON'T** check "Initialize with README"
4. Click **"Create repository"**

**Copy the repository URL** (looks like: `https://github.com/YOUR_USERNAME/recruiter-suite.git`)

---

### 3. Stage Your Files

```bash
# Add all files (respecting .gitignore)
git add .

# Check what will be committed
git status
```

---

### 4. Create First Commit

```bash
git commit -m "Initial commit: Recruiter Suite with Outlook integration and logout feature"
```

---

### 5. Link to GitHub

**Replace YOUR_USERNAME with your actual GitHub username:**

```bash
git remote add origin https://github.com/YOUR_USERNAME/recruiter-suite.git
```

Example:
```bash
git remote add origin https://github.com/john-doe/recruiter-suite.git
```

---

### 6. Push to GitHub

```bash
# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

**When prompted for credentials:**
- Username: `your-github-username`
- Password: Use a **Personal Access Token** (not your password!)

---

## 🔐 Creating GitHub Personal Access Token

If you don't have a token:

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name: `Recruiter Suite`
4. Select scope: **`repo`** (check all sub-boxes)
5. Click **"Generate token"**
6. **COPY THE TOKEN** (you won't see it again!)
7. Use this token as your password when pushing

---

## ✅ Verify Upload

1. Go to: `https://github.com/YOUR_USERNAME/recruiter-suite`
2. Refresh the page
3. You should see all your files! 🎉

---

## 🔄 Future Updates

After making changes:

```bash
# Stage changes
git add .

# Commit with a message
git commit -m "Your commit message here"

# Push to GitHub
git push
```

---

## 📁 What's Being Uploaded?

✅ **Included:**
- All source code (frontend, backend, scraper)
- Configuration files
- Documentation (README, guides)
- `.env.example` files (safe templates)
- Package files

❌ **Excluded** (via .gitignore):
- `node_modules/` folders
- `.env` files (with your secrets)
- Build outputs
- Uploads folder
- Log files
- Python cache
- Screenshots from scraper

---

## 🆘 Troubleshooting

### "Authentication failed"
→ Use Personal Access Token, not your password

### "Large files detected"
→ Check if you accidentally included `node_modules/` or large PDFs

### "Updates were rejected"
```bash
git pull origin main --rebase
git push
```

### Accidentally committed `.env` file
```bash
# Remove from tracking
git rm --cached backend/.env
git rm --cached frontend/.env

# Commit the removal
git commit -m "Remove .env files"
git push

# ⚠️ IMPORTANT: Change all your secrets/passwords immediately!
```

---

## 📞 Need Help?

- **Full Guide**: See `GITHUB_DEPLOYMENT_GUIDE.md`
- **Git Documentation**: https://docs.github.com
- **Git Basics**: https://git-scm.com/book/en/v2

---

**You're all set! 🚀 Your code is now on GitHub!**
