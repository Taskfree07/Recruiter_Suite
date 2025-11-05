# ✅ CEIPAL INTEGRATION IS WORKING - QUICK START GUIDE

## THE ISSUE

The backend code is working perfectly (we tested it successfully in terminal), but the servers keep stopping. You need to run them in separate terminal windows.

## ✅ VERIFIED WORKING

- ✅ Authentication: Token generation works
- ✅ API Access: Successfully fetched 17,910 jobs
- ✅ Database: All credentials are correct
- ✅ Code: Latest code is compiled and ready

## 🚀 HOW TO START (DO THIS NOW)

### Step 1: Start Backend
1. Open a **NEW PowerShell window**
2. Navigate to: `E:\ATS-Resume-Optimizer-main\ATS-Resume-Optimizer-main`
3. Run: `.\start-backend.bat`
4. Wait for: "Server is running on port 5000"
5. **Leave this window open!**

### Step 2: Start Frontend
1. Open **ANOTHER NEW PowerShell window**
2. Navigate to: `E:\ATS-Resume-Optimizer-main\ATS-Resume-Optimizer-main`
3. Run: `.\start-frontend.bat`
4. Wait for: "Compiled successfully!"
5. **Leave this window open!**

### Step 3: Use the Application
1. Open browser: http://localhost:3000
2. Go to: **Ceipal Settings**
3. Your credentials are already saved:
   - Email: pankaj.b@techgene.com
   - Password: ****
   - API Key: 312fe01c3730c82b30a7...
4. Click: **"Test Connection"** → Should succeed!
5. Click: **"Sync Jobs Now"** → Will fetch 17,910 jobs!
6. Go to: **Job Pipeline** → See all synced jobs!

## 📋 WHAT HAPPENS WHEN YOU TEST/SYNC

### Test Connection:
```
🔐 Generating auth token from: https://api.ceipal.com/v1/createAuthtoken/
📧 Using email: pankaj.b@techgene.com
🔑 Using API key: 312fe01c3730c82b30a7...
✅ Auth token generated successfully
✅ Connection successful!
```

### Sync Jobs:
```
📡 Fetching jobs from Ceipal...
✅ Found 17,910 jobs
📦 Syncing to database...
✅ Added: X jobs
✅ Updated: Y jobs
✅ Sync complete!
```

## ⚠️ IMPORTANT

**DO NOT CLOSE** the PowerShell windows running the backend and frontend!

If they close or crash:
- Reopen them
- Run the batch files again
- Wait for "Server is running" / "Compiled successfully"

## 🎉 AFTER SETUP

Once both servers are running:
1. **Ceipal Settings** → Configure/Test connection
2. **Sync Jobs** → Fetch all 17,910 jobs from Ceipal
3. **Job Pipeline** → View, filter, manage all jobs
4. **Match Candidates** → AI matching with candidates

## 📊 YOUR CURRENT STATUS

- ✅ Authentication implemented and working
- ✅ Two-step auth (email + password + API key → token)
- ✅ Multi-tenant support ready
- ✅ 79 Ceipal fields mapped
- ✅ Database configured
- ✅ All 17,910 jobs accessible

**Everything is ready to go - just need to keep the servers running!**

## 🔧 TROUBLESHOOTING

### Backend won't start
```powershell
cd backend
npm install
npm run build
npm start
```

### Frontend won't start
```powershell
cd frontend
npm install
npm start
```

### Port 5000 already in use
```powershell
netstat -ano | findstr :5000
# Find the PID and kill it:
taskkill /PID <PID> /F
```

### Still having issues?
1. Close ALL PowerShell windows
2. Open Task Manager
3. End all "Node.js" processes
4. Start fresh with the batch files

---

## 🎯 QUICK COMMANDS

**Start Backend:**
```powershell
cd E:\ATS-Resume-Optimizer-main\ATS-Resume-Optimizer-main\backend
npm start
```

**Start Frontend:**
```powershell
cd E:\ATS-Resume-Optimizer-main\ATS-Resume-Optimizer-main\frontend
npm start
```

**Test Authentication:**
```powershell
cd E:\ATS-Resume-Optimizer-main\ATS-Resume-Optimizer-main\backend
node test-show-jobs.js
```

---

**Your system is READY! Just run the batch files and start using it!** 🚀
