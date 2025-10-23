# iLabor360 Scraper - Quick Test Guide

## ✅ Installation Complete!

Dependencies installed successfully (without lxml to avoid C++ build tools).

## 🚀 Quick Start

### Step 1: Start the Scraper Service

Open a **new PowerShell terminal** and run:

```powershell
cd e:\ATS-Resume-Optimizer-main\ATS-Resume-Optimizer-main\ilabor360-scraper
python app.py
```

You should see:
```
Starting iLabor360 Scraper Service on port 5002
* Running on http://127.0.0.1:5002
```

**Keep this terminal open** - the service needs to run in the background.

---

### Step 2: Test with PowerShell (In a NEW terminal)

Open a **second PowerShell terminal** and test:

#### Test 1: Health Check
```powershell
$response = Invoke-RestMethod -Uri "http://127.0.0.1:5002/health" -Method GET
$response | ConvertTo-Json
```

Expected output:
```json
{
  "status": "ok",
  "service": "ilabor360-scraper",
  "version": "1.0.0"
}
```

#### Test 2: Login
```powershell
$loginBody = @{
    username = "Matt.s@techgene.com"
    password = "King@1234"
    loginUrl = "https://vendor.ilabor360.com/logout"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://127.0.0.1:5002/scrape/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"

$loginResponse | ConvertTo-Json
```

If successful, you'll get a `sessionId`. **Save it!**

```json
{
  "success": true,
  "sessionId": "abc-123-xyz-456",
  "dashboardUrl": "https://vendor.ilabor360.com/dashboard"
}
```

#### Test 3: Scrape Requisitions
```powershell
# Replace SESSION_ID with the actual session ID from login
$sessionId = "PASTE_SESSION_ID_HERE"

$reqBody = @{
    sessionId = $sessionId
    maxRequisitions = 10
    status = "open"
} | ConvertTo-Json

$reqResponse = Invoke-RestMethod -Uri "http://127.0.0.1:5002/scrape/requisitions" `
    -Method POST `
    -Body $reqBody `
    -ContentType "application/json"

$reqResponse | ConvertTo-Json -Depth 5
```

Expected: List of job requisitions from iLabor360

#### Test 4: Scrape Submissions
```powershell
$subBody = @{
    sessionId = $sessionId
    maxSubmissions = 10
} | ConvertTo-Json

$subResponse = Invoke-RestMethod -Uri "http://127.0.0.1:5002/scrape/submissions" `
    -Method POST `
    -Body $subBody `
    -ContentType "application/json"

$subResponse | ConvertTo-Json -Depth 5
```

Expected: List of candidate submissions

#### Test 5: Close Session
```powershell
$closeBody = @{
    sessionId = $sessionId
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:5002/session/close" `
    -Method POST `
    -Body $closeBody `
    -ContentType "application/json"
```

---

## 🐛 Troubleshooting

### "Connection refused" error
- Make sure the Flask server is running in terminal 1
- Check if something is using port 5002: `netstat -ano | findstr :5002`

### "ChromeDriver not found"
The scraper will try to download it automatically. If it fails:
1. Download Chrome browser if not installed
2. Or manually download ChromeDriver from: https://chromedriver.chromium.org/

### Login fails
- Check if iLabor360 site is accessible
- Verify credentials are correct
- Check console logs in terminal 1 for detailed errors

### Page structure changed
If scraping fails due to changed HTML structure:
- Check the logs for specific element not found errors
- You may need to update CSS selectors in `scraper.py`

---

## ✅ What to Expect

**Login**: Takes 5-10 seconds (browser opens, navigates, logs in)
**Scraping Requisitions**: ~2-5 seconds per page
**Scraping Submissions**: ~2-5 seconds per page

All operations run in a **headless browser** so you won't see it.

---

## 📊 Next Steps After Testing

Once you verify the scraper works:

1. ✅ Scraper service working
2. ⏭️ Create backend API routes
3. ⏭️ Create frontend settings page
4. ⏭️ Integrate with job pipeline
5. ⏭️ Setup auto-sync

---

## 💡 Tips

- **First run** downloads ChromeDriver (~15MB) - may take a minute
- **Keep session IDs** - reuse them for multiple scrapes
- **Close sessions** when done to free browser resources
- **Check logs** in terminal 1 for detailed execution info

---

**Ready to test!** 🚀

Follow Step 1 and Step 2 above to verify everything works.
