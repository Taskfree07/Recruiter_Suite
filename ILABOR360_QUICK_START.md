# 🚀 iLabor360 Quick Start Guide

## Complete! Ready to Use

The iLabor360 integration is fully implemented. Follow these steps to start syncing jobs:

---

## Step 1: Start the Scraper Service

Open a new terminal:

```powershell
cd ilabor360-scraper
pip install -r requirements.txt
python app.py
```

✅ You should see: `Running on http://localhost:5002`

---

## Step 2: Set Environment Variable

Add to `backend/.env`:

```env
ILABOR360_ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

*(Generate your own key with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)*

---

## Step 3: Start Backend & Frontend

**Terminal 2 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```powershell
cd frontend
npm start
```

---

## Step 4: Configure iLabor360

1. Open browser: `http://localhost:3000/ilabor360-settings`

2. Enter credentials:
   - **Username**: `Matt.s@techgene.com`
   - **Password**: `King@1234`
   - **Login URL**: `https://vendor.ilabor360.com/logout`

3. Click **Save Configuration**

4. Click **Test Connection** ✅

5. Click **Sync Now** 🚀

---

## Step 5: View Jobs

Navigate to Job Pipeline: `http://localhost:3000/job-pipeline`

Filter by **iLabor360** to see synced jobs (orange badges)

---

## Access from Resume Dashboard

The Resume Dashboard now has an orange **Sync iLabor360** button.

If not configured, clicking it will redirect you to settings.

---

## Files Created

### Frontend
- ✅ `frontend/src/pages/ILabor360Settings.tsx` - Settings UI
- ✅ `frontend/src/services/iLabor360Service.ts` - API client
- ✅ `frontend/src/App.tsx` - Added `/ilabor360-settings` route
- ✅ `frontend/src/pages/ResumeDashboard.tsx` - Added sync button

### Backend
- ✅ `backend/src/models/iLabor360Config.ts` - Configuration model
- ✅ `backend/src/models/iLabor360SyncLog.ts` - Sync history model
- ✅ `backend/src/services/iLabor360Service.ts` - Business logic
- ✅ `backend/src/routes/iLabor360Routes.ts` - API routes
- ✅ `backend/src/models/unifiedJob.ts` - Added 'ilabor360' source
- ✅ `backend/src/server.ts` - Registered routes

### Scraper Service
- ✅ `ilabor360-scraper/app.py` - Flask API
- ✅ `ilabor360-scraper/scraper.py` - Selenium scraper
- ✅ `ilabor360-scraper/parser.py` - Data parser
- ✅ `ilabor360-scraper/requirements.txt` - Dependencies
- ✅ `ilabor360-scraper/start.bat` - Windows launcher
- ✅ `ilabor360-scraper/README.md` - Documentation

---

## Routes Added

**Frontend:**
- `/ilabor360-settings` - Settings page

**Backend API:**
- `GET /api/ilabor360/config` - Get configuration
- `POST /api/ilabor360/config` - Update configuration
- `POST /api/ilabor360/test-connection` - Test credentials
- `POST /api/ilabor360/sync` - Manual sync
- `GET /api/ilabor360/stats` - Sync statistics
- `GET /api/ilabor360/sync-logs` - Sync history

**Scraper Service:**
- `GET /health` - Health check
- `POST /scrape/login` - Login
- `POST /scrape/requisitions` - Scrape jobs
- `POST /scrape/submissions` - Scrape candidates
- `POST /scrape/all` - Combined scraping
- `POST /session/close` - Close session

---

## Features

✅ **Settings Page** - Configure credentials, test connection, manual sync  
✅ **Auto-Sync** - Optional automatic syncing at intervals  
✅ **Sync Statistics** - Track total syncs, errors, performance  
✅ **Sync History** - View recent sync logs with status  
✅ **Resume Dashboard Integration** - Orange "Sync iLabor360" button  
✅ **Job Pipeline Integration** - Orange badges for iLabor360 jobs  
✅ **Security** - AES-256-GCM encrypted credentials  
✅ **Error Handling** - Comprehensive error tracking and display  

---

## Troubleshooting

**Scraper not starting?**
- Check Python is installed: `python --version`
- Ensure Chrome browser is installed
- Check port 5002 is available

**Backend connection error?**
- Ensure scraper is running on port 5002
- Check `ILABOR360_ENCRYPTION_KEY` is set in `.env`

**No jobs appearing?**
- Check sync logs for errors
- Ensure credentials are correct
- Verify iLabor360 account has access to requisitions

---

## Next Steps

1. ✅ **Test the sync** - Run initial sync to verify setup
2. ⚙️ **Configure auto-sync** - Enable automatic syncing if desired
3. 📊 **Monitor stats** - Track sync performance and errors
4. 🎯 **Match candidates** - Use Job Pipeline to match candidates to jobs

---

**Need more details?** See `ILABOR360_INTEGRATION_COMPLETE.md` for comprehensive documentation.

🎉 **Enjoy your automated iLabor360 integration!**
